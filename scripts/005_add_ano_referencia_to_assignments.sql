-- =============================================================================
-- Migration 005: Adiciona ano_referencia em company_templates e book_assignments
-- Objetivo: Habilitar o Histórico de Ciclos — permitir que o mesmo caderno
--           seja atribuído a uma empresa/usuário em anos diferentes, mantendo
--           o rastreio histórico completo por ano de referência.
-- Autor: b.kick Platform
-- Data: 2026-07-15
-- =============================================================================

-- ─── 1. COMPANY_TEMPLATES ─────────────────────────────────────────────────────
-- Representa a atribuição de um template (caderno) a uma empresa.
-- A coluna ano_referencia permite que a mesma empresa tenha o caderno GRI
-- atribuído tanto em 2025 quanto em 2026, como ciclos distintos.

ALTER TABLE public.company_templates
  ADD COLUMN IF NOT EXISTS ano_referencia INTEGER NOT NULL DEFAULT 2026;

-- Índice composto: consultas filtrarão sempre por empresa + ano,
-- especialmente no painel de histórico de cadernos.
CREATE INDEX IF NOT EXISTS idx_company_templates_company_year
  ON public.company_templates(company_id, ano_referencia);

-- Índice simples para buscas globais por ano (admin dashboard).
CREATE INDEX IF NOT EXISTS idx_company_templates_year
  ON public.company_templates(ano_referencia);


-- ─── 2. BOOK_ASSIGNMENTS ──────────────────────────────────────────────────────
-- Representa a atribuição de um caderno a um usuário específico dentro de
-- uma empresa. Sem ano_referencia, o mesmo usuário não poderia ser atribuído
-- ao mesmo caderno em ciclos diferentes sem violar a constraint de unicidade.

ALTER TABLE public.book_assignments
  ADD COLUMN IF NOT EXISTS ano_referencia INTEGER NOT NULL DEFAULT 2026;

-- ─── 3. CONSTRAINT DE UNICIDADE — book_assignments ────────────────────────────
-- A constraint antiga bloqueia duplicatas de (company_id, caderno_id, user_id, role).
-- Isso impede que o mesmo usuário receba o caderno GRI em 2025 e em 2026.
-- A nova constraint adiciona ano_referencia como parte da chave de unicidade,
-- resolvendo o bug de bloqueio de ciclos históricos.

ALTER TABLE public.book_assignments
  DROP CONSTRAINT IF EXISTS assignments_company_caderno_user_role_key;

ALTER TABLE public.book_assignments
  ADD CONSTRAINT assignments_company_caderno_user_role_year_key
  UNIQUE (company_id, caderno_id, user_id, role, ano_referencia);

-- Índice composto para as queries principais do painel de cadernos:
-- "Quais usuários estão atribuídos ao caderno X da empresa Y no ano Z?"
CREATE INDEX IF NOT EXISTS idx_assignments_company_caderno_year
  ON public.book_assignments(company_id, caderno_id, ano_referencia);

-- Índice simples por ano para relatórios de histórico e RPCs de contagem.
CREATE INDEX IF NOT EXISTS idx_assignments_year
  ON public.book_assignments(ano_referencia);


-- ─── 4. ATUALIZAR LINHAS EXISTENTES (backfill) ────────────────────────────────
-- As linhas já existentes receberão DEFAULT 2026 automaticamente pelo ADD COLUMN.
-- Se o sistema estiver em produção com dados históricos reais de 2025, execute
-- o bloco abaixo para ajustar o ano das atribuições mais antigas.
-- ATENÇÃO: ajuste o critério de data conforme a data de início do ciclo 2025.
--
-- UPDATE public.book_assignments
--   SET ano_referencia = 2025
--   WHERE created_at < '2026-01-01 00:00:00+00'
--     AND ano_referencia = 2026;
--
-- UPDATE public.company_templates
--   SET ano_referencia = 2025
--   WHERE assigned_at < '2026-01-01 00:00:00+00'
--     AND ano_referencia = 2026;


-- ─── 5. VERIFICAÇÃO PÓS-MIGRATION ─────────────────────────────────────────────
-- Execute este SELECT no SQL Editor do Supabase para confirmar as colunas:
--
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN ('company_templates', 'book_assignments')
--   AND column_name = 'ano_referencia';
--
-- Resultado esperado: 2 linhas, data_type = integer, is_nullable = NO.
-- =============================================================================
