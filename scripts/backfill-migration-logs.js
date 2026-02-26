/**
 * Backfill migration_logs entries for previously executed bulk migrations.
 *
 * This script:
 * 1. Creates the migration_logs table if it doesn't exist
 * 2. Reads all templates with their enrichment status
 * 3. Inserts a log entry for each template that has enriched questions
 *
 * Usage:
 *   node scripts/backfill-migration-logs.js             # dry-run
 *   node scripts/backfill-migration-logs.js --execute    # insert logs
 */

const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

const DRY_RUN = !process.argv.includes("--execute");

// Load .env.local manually (same pattern as bulk-migrate)
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// Inlined: isQuestionEnriched (from lib/migration/metadata-builder.ts)
// ============================================================================

function isQuestionEnriched(mergedMeta) {
  if (!mergedMeta || typeof mergedMeta !== "object") return false;
  const fields = [
    "disclosure",
    "framework_gri",
    "framework_aneel",
    "framework_ifrs",
    "framework_1",
    "framework_2",
  ];
  return fields.some(
    (f) => mergedMeta[f] && String(mergedMeta[f]).trim() !== ""
  );
}

// ============================================================================

const PAGE_SIZE = 1000;

async function main() {
  console.log("=".repeat(60));
  console.log(
    DRY_RUN
      ? "  MODO: DRY-RUN (nenhuma alteracao sera feita)"
      : "  MODO: EXECUCAO (logs serao inseridos!)"
  );
  console.log("=".repeat(60));
  console.log("");

  // Step 1: Ensure migration_logs table exists
  console.log("[1/5] Verificando/criando tabela migration_logs...");
  try {
    const { error: createError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS migration_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          template_id UUID NOT NULL,
          template_name TEXT NOT NULL,
          executed_by UUID NOT NULL,
          executed_at TIMESTAMPTZ DEFAULT NOW(),
          total_excel_rows INT NOT NULL DEFAULT 0,
          total_matched INT NOT NULL DEFAULT 0,
          total_updated INT NOT NULL DEFAULT 0,
          total_errors INT NOT NULL DEFAULT 0,
          total_unmatched INT NOT NULL DEFAULT 0,
          column_mapping JSONB NOT NULL DEFAULT '{}',
          match_details JSONB NOT NULL DEFAULT '{}',
          error_details JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    });
    if (createError) {
      // rpc might not exist, try direct insert test instead
      console.log("  rpc nao disponivel, testando acesso direto...");
      const { error: testError } = await supabase
        .from("migration_logs")
        .select("id")
        .limit(1);

      if (testError) {
        if (testError.message?.includes("relation") || testError.code === "42P01") {
          console.error("  ❌ Tabela migration_logs NAO existe!");
          console.error("  Execute o SQL em scripts/003_create_migration_logs.sql primeiro.");
          console.error("  Depois rode este script novamente.");
          process.exit(1);
        }
      }
    }
    console.log("  ✓ Tabela migration_logs OK\n");
  } catch {
    // Try direct access
    const { error: testError } = await supabase
      .from("migration_logs")
      .select("id")
      .limit(1);

    if (testError && (testError.message?.includes("relation") || testError.code === "42P01")) {
      console.error("  ❌ Tabela migration_logs NAO existe!");
      console.error("  Execute o SQL em scripts/003_create_migration_logs.sql primeiro.");
      process.exit(1);
    }
    console.log("  ✓ Tabela migration_logs acessivel\n");
  }

  // Step 2: Check existing logs
  console.log("[2/5] Verificando logs existentes...");
  const { data: existingLogs, error: logsError } = await supabase
    .from("migration_logs")
    .select("template_id");

  if (logsError) {
    console.error("  ERRO:", logsError.message);
    process.exit(1);
  }

  const templatesWithLogs = new Set((existingLogs || []).map((l) => l.template_id));
  console.log(`  -> ${templatesWithLogs.size} templates ja tem logs\n`);

  // Step 3: Fetch all templates
  console.log("[3/5] Buscando templates...");
  const { data: allTemplates, error: tError } = await supabase
    .from("book_templates")
    .select("id, name, description")
    .order("name");

  if (tError) {
    console.error("  ERRO:", tError.message);
    process.exit(1);
  }
  console.log(`  -> ${allTemplates.length} templates\n`);

  // Step 4: Fetch all junctions and questions to compute enrichment
  console.log("[4/5] Computando enriquecimento por template...");

  // Fetch junctions (paginated)
  const allJunctions = [];
  let jPage = 0;
  while (true) {
    const from = jPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data: jBatch, error: jError } = await supabase
      .from("book_question_junction")
      .select("question_template_id, book_template_id")
      .range(from, to);
    if (jError) break;
    if (!jBatch || jBatch.length === 0) break;
    allJunctions.push(...jBatch);
    if (jBatch.length < PAGE_SIZE) break;
    jPage++;
  }
  console.log(`  Junctions: ${allJunctions.length}`);

  // Build template→questions map
  const templateToQuestions = new Map();
  for (const j of allJunctions) {
    if (!templateToQuestions.has(j.book_template_id)) {
      templateToQuestions.set(j.book_template_id, []);
    }
    templateToQuestions.get(j.book_template_id).push(j.question_template_id);
  }

  // Fetch all questions (paginated)
  const questionById = new Map();
  let qPage = 0;
  while (true) {
    const from = qPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data: qBatch, error: qError } = await supabase
      .from("book_questions")
      .select("id, metadata, metadata_v2")
      .range(from, to);
    if (qError) break;
    if (!qBatch || qBatch.length === 0) break;
    for (const q of qBatch) {
      questionById.set(q.id, q);
    }
    if (qBatch.length < PAGE_SIZE) break;
    qPage++;
  }
  console.log(`  Questoes: ${questionById.size}`);

  // Compute per-template enrichment
  const templateStats = [];
  for (const template of allTemplates) {
    const questionIds = templateToQuestions.get(template.id) || [];
    if (questionIds.length === 0) continue;

    let enrichedCount = 0;
    for (const qId of questionIds) {
      const q = questionById.get(qId);
      if (!q) continue;
      const merged = { ...(q.metadata || {}), ...(q.metadata_v2 || {}) };
      if (isQuestionEnriched(merged)) {
        enrichedCount++;
      }
    }

    if (enrichedCount > 0 && !templatesWithLogs.has(template.id)) {
      templateStats.push({
        templateId: template.id,
        templateName: template.name,
        totalQuestions: questionIds.length,
        enrichedCount,
        unenrichedCount: questionIds.length - enrichedCount,
      });
    }
  }

  console.log(`\n  Templates com enriquecimento e SEM logs: ${templateStats.length}\n`);

  if (templateStats.length === 0) {
    console.log("  Nada para fazer. Todos os templates enriquecidos ja tem logs.");
    return;
  }

  // Print summary
  for (const t of templateStats) {
    console.log(
      `  ${t.templateName}: ${t.enrichedCount}/${t.totalQuestions} enriquecidas`
    );
  }

  // Step 5: Insert logs
  console.log("");
  if (DRY_RUN) {
    console.log(`  DRY-RUN: ${templateStats.length} logs seriam inseridos.`);
    console.log("  Para executar: node scripts/backfill-migration-logs.js --execute");
    return;
  }

  console.log(`[5/5] Inserindo ${templateStats.length} logs...`);

  let inserted = 0;
  let errors = 0;

  for (const t of templateStats) {
    const { error: insertError } = await supabase.from("migration_logs").insert({
      template_id: t.templateId,
      template_name: t.templateName,
      executed_by: "00000000-0000-0000-0000-000000000000",
      executed_at: new Date().toISOString(),
      total_excel_rows: t.enrichedCount,
      total_matched: t.enrichedCount,
      total_updated: t.enrichedCount,
      total_errors: 0,
      total_unmatched: t.unenrichedCount,
      column_mapping: {},
      match_details: {
        source: "backfill-migration-logs.js",
        note: "Backfill entry for bulk migration executed on 2026-02-26",
      },
    });

    if (insertError) {
      console.log(`  ❌ ${t.templateName}: ${insertError.message}`);
      errors++;
    } else {
      console.log(`  ✓ ${t.templateName}`);
      inserted++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Inseridos: ${inserted}`);
  console.log(`  Erros: ${errors}`);
  console.log(`${"=".repeat(60)}`);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
