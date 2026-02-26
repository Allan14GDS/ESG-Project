/**
 * Script de Migração em Massa: Enriquecer metadata de TODOS os cadernos
 *
 * Lê todos os .xlsx de uma pasta e enriquece os metadados das questões
 * correspondentes no banco Supabase.
 *
 * SEGURANÇA:
 * - NÃO toca em book_answers (respostas dos usuários)
 * - NÃO altera label, type ou unique_identifier em book_questions
 * - NÃO altera book_question_junction (vínculos)
 * - Apenas atualiza metadata e metadata_v2 em book_questions
 * - Backup automático do metadata anterior em _migration_backup
 *
 * Uso:
 *   node scripts/bulk-migrate-cadernos.js                              # dry-run (default folder)
 *   node scripts/bulk-migrate-cadernos.js --execute                    # modo real (default folder)
 *   node scripts/bulk-migrate-cadernos.js --folder "C:\path\to\dir"   # custom folder
 *   node scripts/bulk-migrate-cadernos.js --folder "C:\path" --execute # custom + real
 *
 * Notas:
 * - Suporta subpastas recursivas (ex: CONTEUDO ESPECIFICO/Grande Sertao/*.xlsx)
 * - Auto-detecta colunas mesmo com headers variantes (ex: "ramework / Aneel", "sub GRI")
 */

const XLSX = require("xlsx");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

// ============================================================================
// Config
// ============================================================================

const DRY_RUN = !process.argv.includes("--execute");

// Parse --folder argument
function getFolder() {
  const idx = process.argv.indexOf("--folder");
  if (idx !== -1 && process.argv[idx + 1]) {
    return path.resolve(process.argv[idx + 1]);
  }
  return path.resolve(
    "C:\\Users\\Caio Moreno\\Desktop\\Claude Projects\\cadernos\\drive-download-20260226T043833Z-1-001"
  );
}
const EXCEL_FOLDER = getFolder();

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 200;
const PAGE_SIZE = 1000;
const FUZZY_THRESHOLD = 0.85;
const TEMPLATE_FUZZY_THRESHOLD = 0.70;

// ============================================================================
// Load .env.local
// ============================================================================

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
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================================
// Inline functions (from lib/migration/ — converted to plain JS)
// ============================================================================

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

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function computeSimilarity(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (normA === normB) return 1;
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(normA, normB) / maxLen;
}

function matchQuestion(excelLabel, dbQuestions, threshold = FUZZY_THRESHOLD) {
  if (!excelLabel || !excelLabel.trim()) return null;
  const normalizedExcel = normalizeText(excelLabel);

  // 1. Exact match
  for (const q of dbQuestions) {
    if (q.label === excelLabel) {
      return { dbQuestion: q, matchType: "exact", similarity: 1 };
    }
  }

  // 2. Normalized match
  for (const q of dbQuestions) {
    if (normalizeText(q.label) === normalizedExcel) {
      return { dbQuestion: q, matchType: "normalized", similarity: 1 };
    }
  }

  // 3. Fuzzy match
  let bestMatch = null;
  let bestSim = 0;
  for (const q of dbQuestions) {
    const sim = computeSimilarity(excelLabel, q.label);
    if (sim > bestSim && sim >= threshold) {
      bestSim = sim;
      bestMatch = { dbQuestion: q, matchType: "fuzzy", similarity: sim };
    }
  }
  return bestMatch;
}

// Column detection patterns (from column-detector.ts + extra patterns for variant headers)
const KNOWN_COLUMN_PATTERNS = [
  { field: "linha_coleta", patterns: [/^linha\s*de\s*coleta/i, /atomizada/i, /^pergunta$/i, /^metrica$/i, /^questao$/i, /^quest[aã]o$/i, /^indicador$/i, /^label$/i] },
  { field: "disclosure", patterns: [/^disclosure$/i, /^disclo/i, /^codigo.*disclosure/i, /^cod.*disclosure/i] },
  { field: "evidencias", patterns: [/evid[eê]ncia/i, /^evidencias/i, /evidencias.*disclosure/i, /^evid/i] },
  { field: "obs_nao_aplicavel", patterns: [/obs.*n[aã]o.*aplic[aá]vel/i, /justificativa/i, /^obs$/i, /^observa[cç][aã]o/i, /n[aã]o.*aplic/i] },
  { field: "tipo_resposta", patterns: [/^tipo.*resposta/i, /^resposta$/i, /^tipo$/i, /^type$/i] },
  { field: "framework_gri", patterns: [/framework.*gri/i, /^gri$/i, /^framework\s*\/?\s*gri/i] },
  { field: "sub_framework_gri", patterns: [/sub.*framework.*gri/i, /^sub.*gri$/i, /sub-framework.*gri/i, /^sub\s+gri$/i] },
  { field: "framework_aneel", patterns: [/framework.*aneel/i, /^aneel$/i, /^framework\s*\/?\s*aneel/i, /^r?amework\s*\/?\s*aneel/i] },
  { field: "sub_framework_aneel", patterns: [/sub.*framework.*aneel/i, /^sub.*aneel/i, /sub-framework.*aneel/i] },
  { field: "framework_ifrs", patterns: [/framework.*ifrs/i, /^ifrs$/i, /^framework\s*\/?\s*ifrs/i] },
  { field: "sub_framework_ifrs", patterns: [/sub.*framework.*ifrs/i, /^sub.*ifrs$/i, /sub-framework.*ifrs/i, /^sub\s+ifrs$/i] },
  { field: "position", patterns: [/^posi[cç][aã]o$/i, /^position$/i, /^ordem$/i, /^order$/i, /^#$/] },
];

function detectColumns(headers) {
  const mapping = { unmapped: [] };
  const usedHeaders = new Set();

  for (const pattern of KNOWN_COLUMN_PATTERNS) {
    for (const header of headers) {
      if (usedHeaders.has(header)) continue;
      for (const regex of pattern.patterns) {
        if (regex.test(header.trim())) {
          mapping[pattern.field] = header;
          usedHeaders.add(header);
          break;
        }
      }
      if (mapping[pattern.field]) break;
    }
  }
  mapping.unmapped = headers.filter((h) => !usedHeaders.has(h));
  return mapping;
}

function getExcelValue(row, mapping, field) {
  const columnName = mapping[field];
  if (!columnName) return "";
  const val = row[columnName];
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function buildMetadataUpdate(row, mapping, existingMetadata, existingMetadataV2, templateIds, logId) {
  const meta = existingMetadata || {};
  const metaV2 = existingMetadataV2 || {};

  const disclosure = getExcelValue(row, mapping, "disclosure");
  const evidencias = getExcelValue(row, mapping, "evidencias");
  const obs = getExcelValue(row, mapping, "obs_nao_aplicavel");
  const fwGri = getExcelValue(row, mapping, "framework_gri");
  const subFwGri = getExcelValue(row, mapping, "sub_framework_gri");
  const fwAneel = getExcelValue(row, mapping, "framework_aneel");
  const subFwAneel = getExcelValue(row, mapping, "sub_framework_aneel");
  const fwIfrs = getExcelValue(row, mapping, "framework_ifrs");
  const subFwIfrs = getExcelValue(row, mapping, "sub_framework_ifrs");

  // Build framework pairs array
  const subFrameworksArray = [];
  if (fwGri) subFrameworksArray.push({ framework: fwGri, subFramework: subFwGri });
  if (fwAneel) subFrameworksArray.push({ framework: fwAneel, subFramework: subFwAneel });
  if (fwIfrs) subFrameworksArray.push({ framework: fwIfrs, subFramework: subFwIfrs });

  // Template-keyed sub_frameworks
  const existingSfMap =
    typeof meta.sub_frameworks === "object" && !Array.isArray(meta.sub_frameworks)
      ? meta.sub_frameworks
      : {};
  const subFrameworksByTemplate = { ...existingSfMap };
  if (subFrameworksArray.length > 0) {
    const subValues = subFrameworksArray.map((sf) => sf.subFramework).filter(Boolean);
    for (const tid of templateIds) {
      subFrameworksByTemplate[tid] = subValues;
    }
  }

  // Generic fields (framework_1, framework_2)
  const genericFields = { framework_1: "", sub_framework_1: "", framework_2: "", sub_framework_2: "" };
  subFrameworksArray.forEach((pair, index) => {
    if (index < 2) {
      genericFields[`framework_${index + 1}`] = pair.framework;
      genericFields[`sub_framework_${index + 1}`] = pair.subFramework;
    }
  });

  // Named fields
  const namedFields = {
    framework_gri: fwGri || meta.framework_gri || "",
    sub_framework_gri: subFwGri || meta.sub_framework_gri || "",
    framework_aneel: fwAneel || meta.framework_aneel || "",
    sub_framework_aneel: subFwAneel || meta.sub_framework_aneel || "",
    framework_ifrs: fwIfrs || meta.framework_ifrs || "",
    sub_framework_ifrs: subFwIfrs || meta.sub_framework_ifrs || "",
  };

  const applyIfNonEmpty = (existing, newVal) => newVal || existing || "";

  // Backup
  const backup = {
    timestamp: new Date().toISOString(),
    log_id: logId || "bulk-migration",
    previous_metadata: { ...meta },
  };

  const newMetadata = {
    ...meta,
    disclosure: applyIfNonEmpty(meta.disclosure, disclosure),
    evidencias: applyIfNonEmpty(meta.evidencias, evidencias),
    obs: applyIfNonEmpty(meta.obs, obs),
    obs_nao_aplicavel: applyIfNonEmpty(meta.obs_nao_aplicavel, obs),
    sub_frameworks: subFrameworksByTemplate,
    ...genericFields,
    ...namedFields,
    _migration_backup: backup,
  };

  const newMetadataV2 = {
    ...metaV2,
    disclosure: applyIfNonEmpty(metaV2.disclosure, disclosure),
    evidencias: applyIfNonEmpty(metaV2.evidencias, evidencias),
    obs: applyIfNonEmpty(metaV2.obs, obs),
    obs_nao_aplicavel: applyIfNonEmpty(metaV2.obs_nao_aplicavel, obs),
    sub_frameworks: subFrameworksByTemplate,
    legacy_sub_frameworks: subFrameworksArray.length > 0 ? subFrameworksArray : metaV2.legacy_sub_frameworks || [],
    ...genericFields,
    ...namedFields,
    _migration_backup: backup,
  };

  return { metadata: newMetadata, metadata_v2: newMetadataV2, backup };
}

// ============================================================================
// Filename → Template Matching
// ============================================================================

/**
 * Strip prefix from Excel filename to get caderno name.
 * "B.[ENERGIA] GRI 202.xlsx" → "[ENERGIA] GRI 202"
 * "D1. [ENERGIA - TRANSMISSORAS] GRI 416.xlsx" → "[ENERGIA - TRANSMISSORAS] GRI 416"
 * "A.[ENERGIA] GRI 2.7 E 401 - ANEEL_.xlsx" → "[ENERGIA] GRI 2.7 E 401 - ANEEL_"
 * "[GS - ENERGIA] GRI 2.7 E 401 - CAMPO.xlsx" → "[GS - ENERGIA] GRI 2.7 E 401 - CAMPO" (no prefix)
 */
function extractCadernoName(filename) {
  // Remove .xlsx extension
  let name = filename.replace(/\.xlsx$/i, "");
  // Strip prefix ONLY if it matches pattern: letter(s) + optional digit(s) + dot
  // Don't strip if the name starts with "[" (company-specific cadernos)
  if (/^[A-Z]\d*\.\s*/i.test(name) && !name.startsWith("[")) {
    name = name.replace(/^[A-Z]\d*\.\s*/i, "");
  } else if (/^[A-Z]\d*\.\s*\[/i.test(name)) {
    // Has prefix before bracket: "B.[ENERGIA]..." → "[ENERGIA]..."
    name = name.replace(/^[A-Z]\d*\.\s*/i, "");
  }
  return name.trim();
}

/**
 * Extract GRI number from a string.
 * "[ENERGIA] GRI 202" → "202"
 * "[ENERGIA] GRI 2.7 E 401 - ANEEL_" → "2.7"
 * "[ENERGIA] GRI 207-1 -2-3" → "207"
 */
function extractGriNumber(name) {
  const match = name.match(/GRI\s+([\d]+(?:\.\d+)?)/i);
  return match ? match[1] : null;
}

/**
 * Match an Excel filename to a database template using multi-tier strategy.
 */
function matchTemplate(cadernoName, templates) {
  const normalizedName = normalizeText(cadernoName);

  // Tier 1: Exact normalized match
  for (const t of templates) {
    if (normalizeText(t.name) === normalizedName) {
      return { template: t, matchType: "exact", similarity: 1 };
    }
  }

  // Tier 1b: Template name is contained in caderno name (or vice versa)
  // Handles: "[TROP - ENERGIA] GRI EU - Qualidade da Transmissão" → "[TROP - ENERGIA] GRI EU"
  // Sort by name length descending to prefer longer (more specific) matches
  const sortedByLen = [...templates].sort((a, b) => b.name.length - a.name.length);
  for (const t of sortedByLen) {
    const normT = normalizeText(t.name);
    if (normT.length >= 10 && normalizedName.startsWith(normT)) {
      return { template: t, matchType: "prefix", similarity: 0.95 };
    }
  }

  // Tier 2: Contains GRI number + category match
  const griNumber = extractGriNumber(cadernoName);
  if (griNumber) {
    // Try to find template whose name contains the same GRI number
    const candidates = templates.filter((t) => {
      const tGri = extractGriNumber(t.name);
      return tGri === griNumber;
    });

    if (candidates.length === 1) {
      return { template: candidates[0], matchType: "gri-number", similarity: 0.9 };
    }

    // If multiple candidates, try to pick the best one by overall similarity
    if (candidates.length > 1) {
      let best = null;
      let bestSim = 0;
      for (const c of candidates) {
        const sim = computeSimilarity(cadernoName, c.name);
        if (sim > bestSim) {
          bestSim = sim;
          best = c;
        }
      }
      if (best) {
        return { template: best, matchType: "gri-number-fuzzy", similarity: bestSim };
      }
    }
  }

  // Tier 3: Fuzzy match (but require GRI number match if both have GRI numbers)
  let bestTemplate = null;
  let bestSim = 0;
  for (const t of templates) {
    // If both have GRI numbers, they must match
    const tGri = extractGriNumber(t.name);
    if (griNumber && tGri && griNumber !== tGri) continue;

    const sim = computeSimilarity(cadernoName, t.name);
    if (sim > bestSim) {
      bestSim = sim;
      bestTemplate = t;
    }
  }

  if (bestTemplate && bestSim >= TEMPLATE_FUZZY_THRESHOLD) {
    return { template: bestTemplate, matchType: "fuzzy", similarity: bestSim };
  }

  return null;
}

// ============================================================================
// Utility: sleep
// ============================================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("=".repeat(70));
  console.log(DRY_RUN
    ? "  MODO: DRY-RUN (nenhuma alteracao sera feita)"
    : "  MODO: EXECUCAO REAL (alteracoes serao aplicadas!)");
  console.log("=".repeat(70));
  console.log("");

  // ── Step 1: Read all Excel files ──────────────────────────────────────
  console.log("[1/6] Lendo arquivos Excel da pasta...");
  console.log(`  Pasta: ${EXCEL_FOLDER}`);

  if (!fs.existsSync(EXCEL_FOLDER)) {
    console.error(`  ERRO: Pasta nao encontrada: ${EXCEL_FOLDER}`);
    process.exit(1);
  }

  // Recursive scan for .xlsx files
  function findXlsxFiles(dir) {
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(findXlsxFiles(fullPath));
      } else if (entry.name.endsWith(".xlsx") && !entry.name.startsWith("~")) {
        results.push({ fullPath, filename: entry.name, relativePath: path.relative(EXCEL_FOLDER, fullPath) });
      }
    }
    return results;
  }

  const excelFileEntries = findXlsxFiles(EXCEL_FOLDER).sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  // Backward compat: excelFiles is just filenames for display
  const excelFiles = excelFileEntries.map(e => e.filename);

  console.log(`  -> ${excelFiles.length} arquivos .xlsx encontrados (recursivo)\n`);

  // ── Step 2: Fetch all templates from Supabase ─────────────────────────
  console.log("[2/6] Buscando todos os templates (book_templates)...");
  const { data: allTemplates, error: tError } = await supabase
    .from("book_templates")
    .select("id, name, description")
    .order("name");

  if (tError) {
    console.error("  ERRO ao buscar templates:", tError.message);
    process.exit(1);
  }
  console.log(`  -> ${allTemplates.length} templates no banco\n`);

  // ── Step 3: Fetch all junctions (paginated) ───────────────────────────
  console.log("[3/6] Buscando vinculos questao-caderno (book_question_junction)...");
  const allJunctions = [];
  let jPage = 0;
  while (true) {
    const from = jPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data: jBatch, error: jError } = await supabase
      .from("book_question_junction")
      .select("question_template_id, book_template_id, sort_order")
      .range(from, to);
    if (jError) { console.error("  ERRO:", jError.message); break; }
    if (!jBatch || jBatch.length === 0) break;
    allJunctions.push(...jBatch);
    if (jBatch.length < PAGE_SIZE) break;
    jPage++;
  }
  console.log(`  -> ${allJunctions.length} vinculos carregados\n`);

  // Build junction maps
  // templateId → [questionId, ...]
  const templateToQuestions = new Map();
  // questionId → [templateId, ...]
  const questionToTemplates = new Map();
  for (const j of allJunctions) {
    if (!templateToQuestions.has(j.book_template_id)) {
      templateToQuestions.set(j.book_template_id, []);
    }
    templateToQuestions.get(j.book_template_id).push(j.question_template_id);

    if (!questionToTemplates.has(j.question_template_id)) {
      questionToTemplates.set(j.question_template_id, []);
    }
    questionToTemplates.get(j.question_template_id).push(j.book_template_id);
  }

  // ── Step 4: Fetch all questions (paginated) ───────────────────────────
  console.log("[4/6] Buscando todas as questoes (book_questions)...");
  const allQuestions = [];
  let qPage = 0;
  while (true) {
    const from = qPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data: qBatch, error: qError } = await supabase
      .from("book_questions")
      .select("id, label, type, metadata, metadata_v2, unique_identifier")
      .range(from, to)
      .order("created_at", { ascending: true });
    if (qError) { console.error("  ERRO:", qError.message); break; }
    if (!qBatch || qBatch.length === 0) break;
    allQuestions.push(...qBatch);
    if (qBatch.length < PAGE_SIZE) break;
    qPage++;
  }
  console.log(`  -> ${allQuestions.length} questoes carregadas\n`);

  // Build question lookup by ID
  const questionById = new Map();
  for (const q of allQuestions) {
    questionById.set(q.id, q);
  }

  // ── Step 5: Process each Excel file ───────────────────────────────────
  console.log("[5/6] Processando cada arquivo Excel...\n");

  const globalStats = {
    totalFiles: excelFileEntries.length,
    matchedFiles: 0,
    unmatchedFiles: 0,
    totalExcelRows: 0,
    totalMatched: 0,
    totalUnmatched: 0,
    totalUpdated: 0,
    totalErrors: 0,
    totalSkipped: 0,
  };

  const unmatchedFilesList = [];
  const allUpdates = []; // Collect all updates for execution

  for (let fileIdx = 0; fileIdx < excelFileEntries.length; fileIdx++) {
    const { fullPath: filePath, filename, relativePath } = excelFileEntries[fileIdx];
    const cadernoName = extractCadernoName(filename);

    console.log(`  [${ fileIdx + 1}/${excelFileEntries.length}] ${relativePath}`);
    console.log(`    Nome extraido: "${cadernoName}"`);

    // Match to template
    const templateMatch = matchTemplate(cadernoName, allTemplates);

    if (!templateMatch) {
      console.log(`    ❌ Template NAO encontrado no banco!`);
      globalStats.unmatchedFiles++;
      unmatchedFilesList.push({ filename, cadernoName });
      console.log("");
      continue;
    }

    const template = templateMatch.template;
    console.log(`    ✓ Template: "${template.name}" (${templateMatch.matchType}, sim=${templateMatch.similarity.toFixed(2)})`);
    globalStats.matchedFiles++;

    // Read Excel
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    console.log(`    Linhas no Excel: ${rows.length}`);

    if (rows.length === 0) {
      console.log(`    ⚠ Nenhuma linha no Excel, pulando\n`);
      continue;
    }

    // Detect columns
    const headers = Object.keys(rows[0]);
    const mapping = detectColumns(headers);
    const mappedFields = Object.keys(mapping).filter(
      (k) => k !== "unmapped" && mapping[k]
    );
    console.log(`    Colunas mapeadas: ${mappedFields.join(", ")}`);

    if (!mapping.linha_coleta) {
      console.log(`    ⚠ Coluna "Linha de Coleta" NAO encontrada! Pulando arquivo.\n`);
      globalStats.unmatchedFiles++;
      continue;
    }

    // Get template's questions from junctions
    const templateQuestionIds = templateToQuestions.get(template.id) || [];
    const templateQuestions = templateQuestionIds
      .map((qId) => questionById.get(qId))
      .filter(Boolean);

    console.log(`    Questoes no template (banco): ${templateQuestions.length}`);

    // Match each Excel row to a DB question
    let matched = 0;
    let unmatched = 0;
    let skipped = 0;
    const fileUpdates = [];

    for (const row of rows) {
      const excelLabel = getExcelValue(row, mapping, "linha_coleta");
      if (!excelLabel) {
        skipped++;
        continue;
      }

      globalStats.totalExcelRows++;

      // Match against template questions first, then all questions
      let result = matchQuestion(excelLabel, templateQuestions);
      if (!result) {
        // Fallback: try matching against ALL questions
        result = matchQuestion(excelLabel, allQuestions);
      }

      if (!result) {
        unmatched++;
        globalStats.totalUnmatched++;
        continue;
      }

      matched++;
      globalStats.totalMatched++;

      const dbQ = result.dbQuestion;
      const tids = questionToTemplates.get(dbQ.id) || [template.id];
      const update = buildMetadataUpdate(
        row,
        mapping,
        dbQ.metadata,
        dbQ.metadata_v2,
        tids,
        "bulk-migration"
      );

      fileUpdates.push({
        id: dbQ.id,
        metadata: update.metadata,
        metadata_v2: update.metadata_v2,
        templateName: template.name,
      });
    }

    console.log(`    Matched: ${matched} | Unmatched: ${unmatched} | Skipped (empty): ${skipped}`);

    if (fileUpdates.length > 0) {
      allUpdates.push(...fileUpdates);
    }
    console.log("");
  }

  // ── Step 6: Apply updates ─────────────────────────────────────────────
  console.log("=".repeat(70));
  console.log("[6/6] Resumo antes de aplicar");
  console.log("=".repeat(70));
  console.log(`  Arquivos processados:    ${globalStats.totalFiles}`);
  console.log(`  Arquivos matched:        ${globalStats.matchedFiles}`);
  console.log(`  Arquivos NAO matched:    ${globalStats.unmatchedFiles}`);
  console.log(`  Total linhas Excel:      ${globalStats.totalExcelRows}`);
  console.log(`  Total questoes matched:  ${globalStats.totalMatched}`);
  console.log(`  Total questoes unmatched:${globalStats.totalUnmatched}`);
  console.log(`  Updates a aplicar:       ${allUpdates.length}`);
  console.log("");

  if (unmatchedFilesList.length > 0) {
    console.log("  Arquivos NAO matchados:");
    for (const f of unmatchedFilesList) {
      console.log(`    - ${f.filename} (nome extraido: "${f.cadernoName}")`);
    }
    console.log("");
  }

  // Deduplicate updates (same question may appear in multiple Excels — keep last)
  const deduped = new Map();
  for (const u of allUpdates) {
    deduped.set(u.id, u);
  }
  const uniqueUpdates = Array.from(deduped.values());
  console.log(`  Updates unicos (dedup):  ${uniqueUpdates.length}`);

  if (DRY_RUN) {
    console.log(`\n  DRY-RUN: Nenhuma alteracao foi feita.`);
    console.log(`  Para executar de verdade, rode:`);
    console.log(`  node scripts/bulk-migrate-cadernos.js --execute`);

    // Show sample
    if (uniqueUpdates.length > 0) {
      console.log(`\n  Exemplo de update (primeira questao):`);
      const sample = uniqueUpdates[0];
      console.log(`    ID:              ${sample.id}`);
      console.log(`    Template:        ${sample.templateName}`);
      console.log(`    framework_gri:   "${sample.metadata.framework_gri || ""}"`);
      console.log(`    sub_framework:   "${sample.metadata.sub_framework_gri || ""}"`);
      console.log(`    disclosure:      "${sample.metadata.disclosure || ""}"`);
      console.log(`    evidencias:      "${(sample.metadata.evidencias || "").substring(0, 60)}..."`);
    }
    return;
  }

  // Apply updates
  console.log(`\n  Aplicando ${uniqueUpdates.length} updates no Supabase...\n`);

  let successCount = 0;
  let errorCount = 0;
  const totalBatches = Math.ceil(uniqueUpdates.length / BATCH_SIZE);

  for (let i = 0; i < uniqueUpdates.length; i += BATCH_SIZE) {
    const batch = uniqueUpdates.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} questoes)... `);

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

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < uniqueUpdates.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  globalStats.totalUpdated = successCount;
  globalStats.totalErrors = errorCount;

  console.log(`\n${"=".repeat(70)}`);
  console.log("  RESULTADO FINAL");
  console.log(`  Sucesso:  ${successCount}`);
  console.log(`  Erros:    ${errorCount}`);
  console.log(`  Total:    ${uniqueUpdates.length}`);
  console.log(`${"=".repeat(70)}`);

  // ── Write migration_logs entries per template ──────────────────────────
  console.log("\n  Gravando historico de migracao (migration_logs)...");

  // Group updates by template
  const updatesByTemplate = new Map();
  for (const u of uniqueUpdates) {
    if (!updatesByTemplate.has(u.templateName)) {
      updatesByTemplate.set(u.templateName, { count: 0, templateId: null });
    }
    updatesByTemplate.get(u.templateName).count++;
  }

  // Find template IDs
  for (const t of allTemplates) {
    if (updatesByTemplate.has(t.name)) {
      updatesByTemplate.get(t.name).templateId = t.id;
    }
  }

  let logsInserted = 0;
  for (const [templateName, info] of updatesByTemplate) {
    if (!info.templateId) continue;
    try {
      const { error: logError } = await supabase
        .from("migration_logs")
        .insert({
          template_id: info.templateId,
          template_name: templateName,
          executed_by: "00000000-0000-0000-0000-000000000000",
          total_excel_rows: info.count,
          total_matched: info.count,
          total_updated: info.count,
          total_errors: 0,
          total_unmatched: 0,
          column_mapping: {},
          match_details: { source: "bulk-migrate-cadernos.js", folder: EXCEL_FOLDER },
        });
      if (logError) {
        // Table might not exist — that's fine
        if (logError.message?.includes("relation") || logError.code === "42P01") {
          console.log("  ⚠ Tabela migration_logs nao existe. Pulando logs.");
          break;
        }
        console.log(`  ⚠ Erro ao gravar log para ${templateName}: ${logError.message}`);
      } else {
        logsInserted++;
      }
    } catch {
      // silently continue
    }
  }
  if (logsInserted > 0) {
    console.log(`  ✓ ${logsInserted} entradas de log gravadas`);
  }
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
