-- =============================================================================
-- MIGRAÇÃO 004: Suporte a múltiplos anos de respostas (ano_referencia)
-- =============================================================================
-- Execute este script no painel SQL do Supabase antes de fazer deploy do código.
-- É seguro rodar múltiplas vezes (usa IF NOT EXISTS / IF EXISTS).
-- =============================================================================

-- 1. Adiciona a coluna com DEFAULT 2025 para preservar todos os registros
--    existentes como pertencentes ao ciclo de 2025.
ALTER TABLE public.book_answers
  ADD COLUMN IF NOT EXISTS ano_referencia INTEGER NOT NULL DEFAULT 2025;

-- 2. Remove o constraint único antigo (4 campos)
ALTER TABLE public.book_answers
  DROP CONSTRAINT IF EXISTS unique_answer_per_user_and_company;

-- 3. Novo constraint único inclui o ano — respostas de 2025 e 2026
--    para a mesma questão/empresa/usuário podem coexistir sem conflito.
ALTER TABLE public.book_answers
  ADD CONSTRAINT unique_answer_per_user_company_year
  UNIQUE (template_id, question_id, user_id, company_id, ano_referencia);

-- 4. Índice composto para acelerar as queries de carregamento do formulário
--    (ano atual) e de histórico (ano anterior) — executadas em paralelo.
CREATE INDEX IF NOT EXISTS idx_book_answers_year
  ON public.book_answers(ano_referencia, template_id, company_id);

-- =============================================================================
-- 5. RPCs de contagem — recriadas com parâmetro p_year (DEFAULT = ano corrente)
--    para manter backward-compatibility: código antigo que não passe p_year
--    continuará funcionando e filtrará automaticamente pelo ano atual.
-- =============================================================================

-- 5a. Contagem para gestores: questões respondidas por template+empresa no ano
CREATE OR REPLACE FUNCTION get_gestor_answer_counts(
  p_company_ids uuid[],
  p_org_ids     uuid[],
  p_year        integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer
)
RETURNS TABLE (
  template_id    uuid,
  company_id     uuid,
  answered_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ba.template_id,
    ba.company_id,
    COUNT(DISTINCT ba.question_id) AS answered_count
  FROM public.book_answers ba
  WHERE (ba.company_id = ANY(p_company_ids) OR ba.holding_id = ANY(p_org_ids))
    AND ba.ano_referencia = p_year
  GROUP BY ba.template_id, ba.company_id;
$$;

-- 5b. Contagem para usuário comum: suas próprias respostas no ano
CREATE OR REPLACE FUNCTION get_user_answer_counts(
  p_user_id uuid,
  p_year    integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer
)
RETURNS TABLE (
  template_id    uuid,
  company_id     uuid,
  answered_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ba.template_id,
    ba.company_id,
    COUNT(DISTINCT ba.question_id) AS answered_count
  FROM public.book_answers ba
  WHERE ba.user_id = p_user_id
    AND ba.ano_referencia = p_year
  GROUP BY ba.template_id, ba.company_id;
$$;

-- 5c. Contagem de questões pendentes de correção para gestores no ano
CREATE OR REPLACE FUNCTION get_gestor_correction_counts(
  p_company_ids          uuid[],
  p_org_ids              uuid[],
  p_year                 integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer
)
RETURNS TABLE (
  template_id             uuid,
  company_id              uuid,
  needs_correction_count  bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ba.template_id,
    ba.company_id,
    COUNT(*) AS needs_correction_count
  FROM public.book_answers ba
  WHERE (ba.company_id = ANY(p_company_ids) OR ba.holding_id = ANY(p_org_ids))
    AND ba.status IN ('rejeitado', 'pendente_revisao')
    AND ba.ano_referencia = p_year
  GROUP BY ba.template_id, ba.company_id;
$$;

-- 5d. Contagem de questões pendentes de correção para usuário comum no ano
CREATE OR REPLACE FUNCTION get_user_correction_counts(
  p_user_id uuid,
  p_year    integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer
)
RETURNS TABLE (
  template_id             uuid,
  company_id              uuid,
  needs_correction_count  bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ba.template_id,
    ba.company_id,
    COUNT(*) AS needs_correction_count
  FROM public.book_answers ba
  WHERE ba.user_id = p_user_id
    AND ba.status IN ('rejeitado', 'pendente_revisao')
    AND ba.ano_referencia = p_year
  GROUP BY ba.template_id, ba.company_id;
$$;

-- =============================================================================
-- Verificação final (opcional — rode para confirmar o resultado)
-- =============================================================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'book_answers' AND column_name = 'ano_referencia';
--
-- SELECT conname FROM pg_constraint
-- WHERE conrelid = 'public.book_answers'::regclass AND contype = 'u';
