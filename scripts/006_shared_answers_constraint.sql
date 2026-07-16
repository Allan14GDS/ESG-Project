-- =============================================================================
-- Migration 006: Respostas Compartilhadas por Empresa
-- Objetivo: Remover o user_id da chave de unicidade de book_answers para que
--           todos os usuários de uma empresa colaborem na mesma resposta,
--           em vez de cada um ter sua própria linha independente.
--
-- CONCEITO DO MODELO COMPARTILHADO:
--   Antes: 1 linha por (empresa + pergunta + usuário + ano)
--   Depois: 1 linha por (empresa + pergunta + ano)
--           O campo user_id permanece como AUDITORIA — registra quem foi a
--           última pessoa a editar ou preencher aquela métrica.
--
-- Autor: b.kick Platform
-- Data: 2026-07-15
-- =============================================================================


-- ─── 1. REMOVER CONSTRAINT ANTIGA (baseada em user_id) ────────────────────────
-- A constraint unique_answer_per_user_company_year foi criada em migration 004.
-- Ela bloqueia a colaboração: se o usuário A preencheu a pergunta Q, o usuário B
-- não consegue salvar porque geraria um registro duplicado para a empresa.

ALTER TABLE public.book_answers
  DROP CONSTRAINT IF EXISTS unique_answer_per_user_company_year;


-- ─── 2. NOVA CONSTRAINT — RESPOSTAS EM NÍVEL DE EMPRESA ───────────────────────
-- Garante 1 resposta por (template + pergunta + empresa + ano).
-- O user_id é OMITIDO intencionalmente — qualquer colaborador da empresa pode
-- editar, e o user_id existente na coluna serve apenas como log de quem editou.
--
-- NOTA TÉCNICA — comportamento de NULLs no PostgreSQL:
--   Uma constraint UNIQUE padrão trata cada NULL como distinto.
--   Se company_id for NULL (respostas em nível de holding), múltiplos usuários
--   poderiam criar linhas duplicadas sem violar esta constraint.
--   Por isso, usamos ÍNDICES ÚNICOS PARCIAIS (blocos 3 e 4) ao invés de uma
--   ADD CONSTRAINT simples, cobrindo os dois casos separadamente.

-- Caso 1: company_id preenchido (respostas em nível de empresa — caso principal)
CREATE UNIQUE INDEX IF NOT EXISTS unique_answer_per_company_year
  ON public.book_answers(template_id, question_id, company_id, ano_referencia)
  WHERE company_id IS NOT NULL;

-- Caso 2: company_id nulo (respostas em nível de holding — caso secundário)
-- Garante 1 resposta por (template + pergunta + holding + ano) quando não há
-- empresa associada (holdings sem subdivisão em empresas).
CREATE UNIQUE INDEX IF NOT EXISTS unique_answer_per_holding_year
  ON public.book_answers(template_id, question_id, holding_id, ano_referencia)
  WHERE company_id IS NULL AND holding_id IS NOT NULL;


-- ─── 3. ÍNDICE DE PERFORMANCE PARA LEITURA COMPARTILHADA ─────────────────────
-- A query de leitura no Server Component agora filtra por company_id + ano.
-- Este índice composto acelera esse path crítico de renderização do questionário.
CREATE INDEX IF NOT EXISTS idx_book_answers_company_template_year
  ON public.book_answers(company_id, template_id, ano_referencia)
  WHERE company_id IS NOT NULL;


-- ─── 4. LIMPEZA DE DADOS DUPLICADOS (backfill pré-constraint) ─────────────────
-- Se o banco já possui múltiplas linhas para o mesmo (company_id, question_id,
-- template_id, ano_referencia), os índices acima irão FALHAR ao criar.
-- Execute o bloco abaixo para manter apenas a linha mais recente por empresa
-- antes de aplicar os índices únicos:
--
-- DELETE FROM public.book_answers
-- WHERE id NOT IN (
--   SELECT DISTINCT ON (template_id, question_id, company_id, ano_referencia)
--     id
--   FROM public.book_answers
--   WHERE company_id IS NOT NULL
--   ORDER BY template_id, question_id, company_id, ano_referencia, updated_at DESC
-- )
-- AND company_id IS NOT NULL;


-- ─── 5. VERIFICAÇÃO PÓS-MIGRATION ─────────────────────────────────────────────
-- Execute no SQL Editor do Supabase para confirmar os índices:
--
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'book_answers'
--   AND indexname IN (
--     'unique_answer_per_company_year',
--     'unique_answer_per_holding_year',
--     'idx_book_answers_company_template_year'
--   );
--
-- Resultado esperado: 3 linhas. Se o índice unique_answer_per_company_year
-- falhar na criação, execute o bloco de limpeza (item 4) acima primeiro.
-- =============================================================================
