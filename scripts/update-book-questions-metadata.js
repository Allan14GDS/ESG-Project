/**
 * Script de Migração: Atualizar metadata das questões do caderno [ENERGIA] GRI 202
 *
 * SEGURANÇA:
 * - NÃO toca em book_answers (respostas dos usuários)
 * - NÃO altera label, type ou unique_identifier em book_questions
 * - NÃO altera book_question_junction (vínculos)
 * - Apenas atualiza metadata e metadata_v2 em book_questions
 *
 * Uso:
 *   node scripts/update-book-questions-metadata.js                 # dry-run (default)
 *   node scripts/update-book-questions-metadata.js --execute       # modo real
 */

const XLSX = require("xlsx");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

// Load .env.local manually (no dotenv dependency needed)
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

const DRY_RUN = !process.argv.includes("--execute");

const EXCEL_PATH = path.resolve(
  process.env.USERPROFILE || process.env.HOME,
  "Downloads/B.[ENERGIA] GRI 202.xlsx"
);

// Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Normalize text for comparison (remove accents, lowercase, trim)
 */
function normalizeText(text) {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

async function main() {
  console.log("=".repeat(70));
  console.log(DRY_RUN ? "  MODO: DRY-RUN (nenhuma alteração será feita)" : "  MODO: EXECUÇÃO REAL (alterações serão aplicadas!)");
  console.log("=".repeat(70));
  console.log("");

  // 1. Read Excel
  console.log(`[1/4] Lendo Excel: ${EXCEL_PATH}`);
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  console.log(`  -> ${rows.length} linhas encontradas no Excel`);

  // Parse Excel rows
  const excelQuestions = rows.map((row, index) => ({
    ordem: index + 1,
    framework_aneel: (row["Framework / ANEEL"] || "").toString().trim(),
    sub_framework_aneel: (row["Sub-framework ANEEL"] || "").toString().trim(),
    framework_ifrs: (row["Framework / IFRS"] || "").toString().trim(),
    sub_framework_ifrs: (row["Sub-framework / IFRS"] || "").toString().trim(),
    framework_gri: (row["Framework / GRI"] || "").toString().trim(),
    sub_framework_gri: (row["Sub-framework / GRI"] || "").toString().trim(),
    disclosure: (row["Disclosure"] || "").toString().trim(),
    linha_coleta: (row["Linha de coleta (atomizada)"] || "").toString().trim(),
    tipo_resposta: (row["Resposta"] || "").toString().trim(),
    evidencias: (row["Evidências (POR DISCLOSURE)"] || "").toString().trim(),
    obs_nao_aplicavel: (row["OBS DE NÃO APLiCÄVEL"] || row["OBS DE NÃO APLiCÁVEL"] || "").toString().trim(),
  }));

  // Filter out empty rows
  const validQuestions = excelQuestions.filter((q) => q.linha_coleta.length > 0);
  console.log(`  -> ${validQuestions.length} questões válidas (com linha de coleta)`);

  // 2. Fetch existing questions from Supabase (with pagination to get ALL)
  console.log("\n[2/4] Buscando questões existentes no Supabase (book_questions)...");

  let dbQuestions = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error: fetchError } = await supabase
      .from("book_questions")
      .select("id, label, type, metadata, metadata_v2, unique_identifier")
      .range(from, to)
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("  ERRO ao buscar questões:", fetchError.message);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    dbQuestions = dbQuestions.concat(data);
    console.log(`  -> Página ${page + 1}: ${data.length} questões (total até agora: ${dbQuestions.length})`);
    if (data.length < PAGE_SIZE) break;
    page++;
  }

  console.log(`  -> ${dbQuestions.length} questões encontradas no banco (total)`);

  // Build lookup maps - by normalized label AND by exact label (trimmed)
  const dbLookupNormalized = new Map();
  const dbLookupExact = new Map();
  for (const q of dbQuestions) {
    const keyNorm = normalizeText(q.label);
    const keyExact = q.label.trim();
    if (!dbLookupNormalized.has(keyNorm)) {
      dbLookupNormalized.set(keyNorm, q);
    }
    if (!dbLookupExact.has(keyExact)) {
      dbLookupExact.set(keyExact, q);
    }
  }

  // 2b. Fetch template linkages (book_question_junction) to build per-template sub_frameworks
  console.log("\n[2b/4] Buscando vínculos questão-caderno (book_question_junction)...");
  const questionTemplateMap = new Map(); // questionId -> [templateId, ...]
  let jPage = 0;
  while (true) {
    const from = jPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data: jData, error: jError } = await supabase
      .from("book_question_junction")
      .select("question_template_id, book_template_id")
      .range(from, to);
    if (jError) { console.error("  ERRO:", jError.message); break; }
    if (!jData || jData.length === 0) break;
    for (const j of jData) {
      if (!questionTemplateMap.has(j.question_template_id)) {
        questionTemplateMap.set(j.question_template_id, []);
      }
      questionTemplateMap.get(j.question_template_id).push(j.book_template_id);
    }
    if (jData.length < PAGE_SIZE) break;
    jPage++;
  }
  console.log(`  -> ${questionTemplateMap.size} questões com vínculos a cadernos`);

  // 3. Match and prepare updates
  console.log("\n[3/4] Fazendo matching entre Excel e banco...");

  let matched = 0;
  let notFound = 0;
  let skipped = 0;
  const updates = [];
  const notFoundList = [];

  for (const excelQ of validQuestions) {
    const normalizedLabel = normalizeText(excelQ.linha_coleta);
    // Try exact match first, then normalized
    const dbQuestion = dbLookupExact.get(excelQ.linha_coleta) || dbLookupNormalized.get(normalizedLabel);

    if (!dbQuestion) {
      notFound++;
      if (notFoundList.length < 20) {
        notFoundList.push(excelQ.linha_coleta.substring(0, 80));
      }
      continue;
    }

    // Build sub_frameworks in BOTH formats:
    // 1. Array format (for edit dialog): [{ framework: "GRI", subFramework: "202" }]
    // 2. Template-keyed format (for admin badges): { "template-uuid": ["202"] }
    const subFrameworksArray = [];
    const subValues = []; // collect sub-framework values for template-keyed format
    if (excelQ.framework_gri) {
      subFrameworksArray.push({ framework: excelQ.framework_gri, subFramework: excelQ.sub_framework_gri });
      if (excelQ.sub_framework_gri) subValues.push(excelQ.sub_framework_gri);
    }
    if (excelQ.framework_aneel) {
      subFrameworksArray.push({ framework: excelQ.framework_aneel, subFramework: excelQ.sub_framework_aneel });
      if (excelQ.sub_framework_aneel) subValues.push(excelQ.sub_framework_aneel);
    }
    if (excelQ.framework_ifrs) {
      subFrameworksArray.push({ framework: excelQ.framework_ifrs, subFramework: excelQ.sub_framework_ifrs });
      if (excelQ.sub_framework_ifrs) subValues.push(excelQ.sub_framework_ifrs);
    }

    // Build template-keyed sub_frameworks (for frontend admin badges)
    const templateIds = questionTemplateMap.get(dbQuestion.id) || [];
    const subFrameworksByTemplate = {};
    for (const tid of templateIds) {
      if (subValues.length > 0) {
        subFrameworksByTemplate[tid] = subValues;
      }
    }

    // Preserve existing metadata fields and add new ones
    const existingMetadata = dbQuestion.metadata || {};
    const existingMetadataV2 = dbQuestion.metadata_v2 || {};

    const newMetadata = {
      ...existingMetadata,
      disclosure: excelQ.disclosure || existingMetadata.disclosure || "",
      evidencias: excelQ.evidencias || existingMetadata.evidencias || "",
      obs: excelQ.obs_nao_aplicavel || existingMetadata.obs || "",
      framework_1: subFrameworksArray[0]?.framework || existingMetadata.framework_1 || "",
      sub_framework_1: subFrameworksArray[0]?.subFramework || existingMetadata.sub_framework_1 || "",
      framework_2: subFrameworksArray[1]?.framework || existingMetadata.framework_2 || "",
      sub_framework_2: subFrameworksArray[1]?.subFramework || existingMetadata.sub_framework_2 || "",
      sub_frameworks: subFrameworksByTemplate,
      // Named framework fields for direct export mapping
      framework_aneel: excelQ.framework_aneel,
      sub_framework_aneel: excelQ.sub_framework_aneel,
      framework_ifrs: excelQ.framework_ifrs,
      sub_framework_ifrs: excelQ.sub_framework_ifrs,
      framework_gri: excelQ.framework_gri,
      sub_framework_gri: excelQ.sub_framework_gri,
    };

    const newMetadataV2 = {
      ...existingMetadataV2,
      disclosure: excelQ.disclosure || existingMetadataV2.disclosure || "",
      evidencias: excelQ.evidencias || existingMetadataV2.evidencias || "",
      obs: excelQ.obs_nao_aplicavel || existingMetadataV2.obs || "",
      framework_1: subFrameworksArray[0]?.framework || existingMetadataV2.framework_1 || "",
      sub_framework_1: subFrameworksArray[0]?.subFramework || existingMetadataV2.sub_framework_1 || "",
      framework_2: subFrameworksArray[1]?.framework || existingMetadataV2.framework_2 || "",
      sub_framework_2: subFrameworksArray[1]?.subFramework || existingMetadataV2.sub_framework_2 || "",
      sub_frameworks: subFrameworksByTemplate,
      legacy_sub_frameworks: subFrameworksArray,
      framework_aneel: excelQ.framework_aneel,
      sub_framework_aneel: excelQ.sub_framework_aneel,
      framework_ifrs: excelQ.framework_ifrs,
      sub_framework_ifrs: excelQ.sub_framework_ifrs,
      framework_gri: excelQ.framework_gri,
      sub_framework_gri: excelQ.sub_framework_gri,
    };

    matched++;
    updates.push({
      id: dbQuestion.id,
      label: dbQuestion.label,
      metadata: newMetadata,
      metadata_v2: newMetadataV2,
    });
  }

  console.log(`\n  Resultado do matching:`);
  console.log(`    Matched:    ${matched}`);
  console.log(`    Não encontradas: ${notFound}`);
  console.log(`    Total Excel:     ${validQuestions.length}`);

  if (notFoundList.length > 0) {
    console.log(`\n  Primeiras questões NÃO encontradas no banco:`);
    notFoundList.forEach((q, i) => console.log(`    ${i + 1}. "${q}..."`));
    if (notFound > 20) console.log(`    ... e mais ${notFound - 20}`);
  }

  // Show sample of what will be updated
  if (updates.length > 0) {
    console.log(`\n  Exemplo de update (primeira questão):`);
    const sample = updates[0];
    console.log(`    ID:    ${sample.id}`);
    console.log(`    Label: ${sample.label.substring(0, 60)}...`);
    console.log(`    Metadata (novos campos):`);
    console.log(`      disclosure:          "${sample.metadata.disclosure}"`);
    console.log(`      framework_gri:       "${sample.metadata.framework_gri}"`);
    console.log(`      sub_framework_gri:   "${sample.metadata.sub_framework_gri}"`);
    console.log(`      evidencias:          "${(sample.metadata.evidencias || "").substring(0, 60)}..."`);
    console.log(`      obs:                 "${(sample.metadata.obs || "").substring(0, 60)}..."`);
  }

  // 4. Apply updates
  if (DRY_RUN) {
    console.log(`\n[4/4] DRY-RUN: ${updates.length} questões seriam atualizadas.`);
    console.log("  Para executar de verdade, rode:");
    console.log("  node scripts/update-book-questions-metadata.js --execute");
    return;
  }

  console.log(`\n[4/4] Aplicando ${updates.length} updates no Supabase...`);

  let successCount = 0;
  let errorCount = 0;

  // Process in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(updates.length / BATCH_SIZE);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} questões)... `);

    // Update each question in the batch
    const promises = batch.map(async (update) => {
      const { error } = await supabase
        .from("book_questions")
        .update({
          metadata: update.metadata,
          metadata_v2: update.metadata_v2,
        })
        .eq("id", update.id);

      if (error) {
        errorCount++;
        console.error(`\n    ERRO ao atualizar ${update.id}: ${error.message}`);
        return false;
      }
      successCount++;
      return true;
    });

    await Promise.all(promises);
    console.log("OK");
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`  RESULTADO FINAL`);
  console.log(`  Sucesso:  ${successCount}`);
  console.log(`  Erros:    ${errorCount}`);
  console.log(`  Total:    ${updates.length}`);
  console.log(`${"=".repeat(70)}`);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
