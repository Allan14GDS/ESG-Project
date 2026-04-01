/**
 * MIGRACAO COMPLETA via Supabase JS API (sem conexao PG direta)
 *
 * Migra todas as tabelas do schema public.
 * Para auth.users (com hashes de senha): use o SQL gerado no console.
 *
 * npx tsx scripts/migration_full.ts
 */

import { createClient } from "@supabase/supabase-js";

// Supabase ANTIGO
const OLD_URL = "https://lhwwqykueiwywutwrlnj.supabase.co";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxod3dxeWt1ZWl3eXd1dHdybG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDMwNzgxMCwiZXhwIjoyMDc1ODgzODEwfQ.yDsvPrv5fbatNxugT2MWPNZh7PfcKly-MvaWJTwe5YA";

// Supabase NOVO
const NEW_URL = "https://wajqqahhcneshjvrugyk.supabase.co";
const NEW_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhanFxYWhoY25lc2hqdnJ1Z3lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwMzYzNSwiZXhwIjoyMDkwNTc5NjM1fQ.iVQjr_rcbGiFqTL2DAarsNfHKtw2TtgF_oMD42-GP5U";

// Tabelas em ordem de FK
const TABLES = [
  "organizations",
  "holdings",
  "companies",
  "book_templates",
  "master_questions",
  "book_questions",
  "book_question_junction",
  "company_templates",
  "gri_disclosures",
  "gri_responses",
  "gri_response_history",
  "questions",
  "answers",
  "books",
  "question_notebooks",
  "system_permissions",
  "system_users",
];

// Tabelas que dependem de auth.users (migrar DEPOIS dos usuarios)
const TABLES_AFTER_AUTH = [
  "profiles",
  "organization_members",
  "book_assignments",
  "book_answers",
  "comment_history",
  "migration_logs",
  "profiles_backup",
  "user_system_permissions",
  "organization_books",
  "memberships",
  "user_template_assignments",
  "audit_logs",
];

const opts = { auth: { autoRefreshToken: false, persistSession: false } };

async function fetchAll(
  supabase: ReturnType<typeof createClient>,
  table: string
): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

async function migrateTable(
  oldSb: ReturnType<typeof createClient>,
  newSb: ReturnType<typeof createClient>,
  table: string
): Promise<string> {
  let rows: Record<string, unknown>[];
  try {
    rows = await fetchAll(oldSb, table);
  } catch (err: unknown) {
    return `SKIP (${(err as Error).message.substring(0, 50)})`;
  }

  if (rows.length === 0) return "SKIP (vazia)";

  // Insert in batches of 100
  let inserted = 0;
  let errors = 0;
  const batchSize = 100;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await newSb.from(table).upsert(batch, { onConflict: "id", ignoreDuplicates: true });
    if (error) {
      // Try one by one for this batch
      for (const row of batch) {
        const { error: singleErr } = await newSb.from(table).upsert(row, { onConflict: "id", ignoreDuplicates: true });
        if (singleErr) errors++;
        else inserted++;
      }
    } else {
      inserted += batch.length;
    }
  }

  return `OK (${inserted}/${rows.length}${errors > 0 ? `, ${errors} erros` : ""})`;
}

async function migrateAuthUsers(
  oldSb: ReturnType<typeof createClient>,
  newSb: ReturnType<typeof createClient>
): Promise<void> {
  console.log("\n[3/5] Migrando auth.users (via Admin API)...\n");
  console.log("   NOTA: Senhas NAO sao preservadas via API.");
  console.log("   Para preservar senhas, siga o PASSO MANUAL no final.\n");

  const { data: { users }, error } = await oldSb.auth.admin.listUsers({ perPage: 1000 });
  if (error) { console.log(`   ERRO: ${error.message}`); return; }
  if (!users?.length) { console.log("   Nenhum usuario encontrado."); return; }

  console.log(`   ${users.length} usuario(s) encontrado(s)\n`);

  let created = 0, skipped = 0;
  const TEMP_PASS = "BkickESG2026!Temp";

  for (const user of users) {
    const email = user.email || "(sem email)";
    const { error } = await newSb.auth.admin.createUser({
      email: user.email!,
      password: TEMP_PASS,
      email_confirm: true,
      user_metadata: user.user_metadata || {},
      app_metadata: user.app_metadata || {},
      id: user.id,
    });

    if (error) {
      if (error.message.includes("already") || error.message.includes("registered")) {
        console.log(`   SKIP: ${email}`);
        skipped++;
      } else {
        console.log(`   ERRO: ${email} → ${error.message.substring(0, 60)}`);
      }
    } else {
      console.log(`   OK:   ${email}`);
      created++;
    }
  }

  console.log(`\n   Criados: ${created}, Ja existiam: ${skipped}`);
}

async function generateAuthSQL(oldSb: ReturnType<typeof createClient>): Promise<void> {
  console.log("\n[5/5] PASSO MANUAL — Copiar hashes de senha\n");
  console.log("   Os usuarios foram criados com senha temporaria.");
  console.log("   Para PRESERVAR as senhas originais:\n");
  console.log("   1. Abra o SQL Editor do Supabase ANTIGO:");
  console.log("      https://supabase.com/dashboard/project/lhwwqykueiwywutwrlnj/sql/new\n");
  console.log("   2. Rode esta query:\n");
  console.log("   ┌─────────────────────────────────────────────────────────────┐");
  console.log("   │ SELECT                                                      │");
  console.log("   │   'UPDATE auth.users SET encrypted_password = '''           │");
  console.log("   │   || encrypted_password                                     │");
  console.log("   │   || ''' WHERE id = '''                                     │");
  console.log("   │   || id::text                                               │");
  console.log("   │   || ''';'                                                  │");
  console.log("   │   AS sql_command                                            │");
  console.log("   │ FROM auth.users;                                            │");
  console.log("   └─────────────────────────────────────────────────────────────┘\n");
  console.log("   3. Copie TODOS os resultados (cada linha e um UPDATE)");
  console.log("   4. Abra o SQL Editor do Supabase NOVO:");
  console.log("      https://supabase.com/dashboard/project/wajqqahhcneshjvrugyk/sql/new");
  console.log("   5. Cole e execute os UPDATEs\n");
  console.log("   Pronto! As senhas originais serao restauradas.\n");
}

async function main() {
  console.log("============================================");
  console.log("  MIGRACAO COMPLETA - ESG B.kick");
  console.log("============================================\n");

  const oldSb = createClient(OLD_URL, OLD_KEY, opts);
  const newSb = createClient(NEW_URL, NEW_KEY, opts);

  console.log("[1/5] Conectado via API (HTTPS)\n");

  // Migrate tables without auth dependency first
  console.log("[2/5] Migrando tabelas (sem dependencia de auth)...\n");
  for (const table of TABLES) {
    process.stdout.write(`   ${table.padEnd(30)} `);
    const status = await migrateTable(oldSb, newSb, table);
    console.log(status);
  }

  // Migrate auth users
  await migrateAuthUsers(oldSb, newSb);

  // Migrate tables that depend on auth.users
  console.log("\n[4/5] Migrando tabelas (dependem de auth.users)...\n");
  for (const table of TABLES_AFTER_AUTH) {
    process.stdout.write(`   ${table.padEnd(30)} `);
    const status = await migrateTable(oldSb, newSb, table);
    console.log(status);
  }

  // Generate SQL for password hash migration
  await generateAuthSQL(oldSb);

  console.log("============================================");
  console.log("  MIGRACAO DE DADOS CONCLUIDA!");
  console.log("============================================\n");
  console.log("  PROXIMOS PASSOS:");
  console.log("  1. Copie os hashes de senha (passo manual acima)");
  console.log("  2. SQL Editor NOVO → cole scripts/migration_rpc_rls.sql");
  console.log("  3. Authentication → URL Configuration → Site URL");
  console.log("  4. Atualize env vars no Vercel");
  console.log("  5. pnpm dev para testar\n");
}

main().catch(err => { console.error("ERRO FATAL:", err); process.exit(1); });
