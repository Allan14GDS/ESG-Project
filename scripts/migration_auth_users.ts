/**
 * MIGRACAO DE USUARIOS: Supabase Antigo → Supabase Novo
 *
 * Este script:
 * 1. Lista todos os usuarios do Supabase ANTIGO (via Admin API)
 * 2. Cria cada usuario no Supabase NOVO com o MESMO UUID
 * 3. Preserva os UUIDs para nao quebrar as FK na tabela profiles
 *
 * COMO RODAR:
 *   npx tsx scripts/migration_auth_users.ts
 *
 * IMPORTANTE:
 *   - Os usuarios migrados recebem uma senha temporaria
 *   - Apos a migracao, eles devem usar "Esqueci minha senha" para redefinir
 *   - Ou voce pode enviar um email de reset via dashboard
 *
 * PRE-REQUISITOS:
 *   - npm install @supabase/supabase-js (ja instalado no projeto)
 */

import { createClient } from "@supabase/supabase-js";

// ============================================================================
// CONFIGURACAO - Credenciais dos dois projetos
// ============================================================================

// Supabase ANTIGO
const OLD_URL = "https://lhwwqykueiwywutwrlnj.supabase.co";
const OLD_SERVICE_ROLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxod3dxeWt1ZWl3eXd1dHdybG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDMwNzgxMCwiZXhwIjoyMDc1ODgzODEwfQ.yDsvPrv5fbatNxugT2MWPNZh7PfcKly-MvaWJTwe5YA";

// Supabase NOVO
const NEW_URL = "https://wajqqahhcneshjvrugyk.supabase.co";
const NEW_SERVICE_ROLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhanFxYWhoY25lc2hqdnJ1Z3lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwMzYzNSwiZXhwIjoyMDkwNTc5NjM1fQ.iVQjr_rcbGiFqTL2DAarsNfHKtw2TtgF_oMD42-GP5U";

// Senha temporaria para usuarios migrados
// Eles deverao usar "Esqueci minha senha" para redefinir
const TEMP_PASSWORD = "MigracaoESG2026!Temp";

// ============================================================================
// SCRIPT
// ============================================================================

async function migrateUsers() {
  console.log("============================================");
  console.log("  MIGRACAO DE USUARIOS - ESG B.kick");
  console.log("============================================\n");

  // Criar clients admin (service_role) para ambos os projetos
  const oldSupabase = createClient(OLD_URL, OLD_SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const newSupabase = createClient(NEW_URL, NEW_SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Listar todos os usuarios do Supabase antigo
  console.log("[1/3] Listando usuarios do Supabase antigo...\n");

  const {
    data: { users },
    error: listError,
  } = await oldSupabase.auth.admin.listUsers({ perPage: 1000 });

  if (listError) {
    console.error("ERRO ao listar usuarios:", listError.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log("Nenhum usuario encontrado no Supabase antigo.");
    process.exit(0);
  }

  console.log(`   Encontrados ${users.length} usuario(s):\n`);
  for (const user of users) {
    console.log(`   - ${user.email} (ID: ${user.id})`);
  }
  console.log("");

  // 2. Criar cada usuario no Supabase novo
  console.log("[2/3] Criando usuarios no Supabase novo...\n");

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of users) {
    const email = user.email;
    if (!email) {
      console.log(`   SKIP: Usuario ${user.id} sem email`);
      skipped++;
      continue;
    }

    // Criar usuario com o MESMO UUID
    const { data, error } = await newSupabase.auth.admin.createUser({
      email,
      password: TEMP_PASSWORD,
      email_confirm: true, // Confirma email automaticamente
      user_metadata: user.user_metadata || {},
      app_metadata: user.app_metadata || {},
      // Manter o mesmo UUID para nao quebrar FK em profiles
      id: user.id,
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        console.log(`   SKIP: ${email} ja existe no novo Supabase`);
        skipped++;
      } else {
        console.error(`   ERRO: ${email} → ${error.message}`);
        errors++;
      }
    } else {
      console.log(`   OK: ${email} (ID: ${data.user.id})`);
      created++;
    }
  }

  // 3. Resumo
  console.log("\n[3/3] Resumo da migracao:\n");
  console.log(`   Total de usuarios: ${users.length}`);
  console.log(`   Criados com sucesso: ${created}`);
  console.log(`   Ja existiam (skip): ${skipped}`);
  console.log(`   Erros: ${errors}`);
  console.log("");

  if (created > 0) {
    console.log("   IMPORTANTE:");
    console.log(`   - Todos os usuarios migrados receberam a senha: ${TEMP_PASSWORD}`);
    console.log("   - Eles devem usar 'Esqueci minha senha' para redefinir");
    console.log("   - Ou envie um email de reset pelo dashboard do Supabase:");
    console.log("     Authentication → Users → clicar no usuario → Send password reset");
    console.log("");
  }

  console.log("============================================");
  console.log("  MIGRACAO DE USUARIOS CONCLUIDA");
  console.log("============================================");
}

migrateUsers().catch(console.error);
