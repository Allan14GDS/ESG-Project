-- Fix RPC functions to match the frontend function names
-- These aggregate answer counts in SQL to avoid Supabase's 1000-row limit

-- Drop old functions that have wrong names
DROP FUNCTION IF EXISTS get_answer_counts_by_company(uuid[]);
DROP FUNCTION IF EXISTS get_answer_counts_by_company_and_user(uuid[]);
DROP FUNCTION IF EXISTS get_answer_counts_by_holding(uuid[]);

-- Function for gestor: counts unique answered questions per template+company
-- Considers answers from ALL users (gestores see overall progress)
-- Matches both company_id and holding_id (org_id) filters
CREATE OR REPLACE FUNCTION get_gestor_answer_counts(p_company_ids uuid[], p_org_ids uuid[])
RETURNS TABLE (
  template_id uuid,
  company_id uuid,
  answered_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ba.template_id,
    ba.company_id,
    COUNT(DISTINCT ba.question_id) as answered_count
  FROM book_answers ba
  WHERE ba.company_id = ANY(p_company_ids)
     OR ba.holding_id = ANY(p_org_ids)
  GROUP BY ba.template_id, ba.company_id;
$$;

-- Function for gestor: counts questions needing correction per template+company
CREATE OR REPLACE FUNCTION get_gestor_correction_counts(p_company_ids uuid[], p_org_ids uuid[])
RETURNS TABLE (
  template_id uuid,
  company_id uuid,
  needs_correction_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ba.template_id,
    ba.company_id,
    COUNT(*) as needs_correction_count
  FROM book_answers ba
  WHERE (ba.company_id = ANY(p_company_ids) OR ba.holding_id = ANY(p_org_ids))
    AND ba.status IN ('rejeitado', 'pendente_revisao')
  GROUP BY ba.template_id, ba.company_id;
$$;

-- Function for regular user: counts their own answered questions per template+company
-- (get_user_answer_counts already exists with correct name and signature, recreating for safety)
CREATE OR REPLACE FUNCTION get_user_answer_counts(p_user_id uuid)
RETURNS TABLE (
  template_id uuid,
  company_id uuid,
  answered_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ba.template_id,
    ba.company_id,
    COUNT(DISTINCT ba.question_id) as answered_count
  FROM book_answers ba
  WHERE ba.user_id = p_user_id
  GROUP BY ba.template_id, ba.company_id;
$$;

-- Function for regular user: counts questions needing correction per template+company
CREATE OR REPLACE FUNCTION get_user_correction_counts(p_user_id uuid)
RETURNS TABLE (
  template_id uuid,
  company_id uuid,
  needs_correction_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ba.template_id,
    ba.company_id,
    COUNT(*) as needs_correction_count
  FROM book_answers ba
  WHERE ba.user_id = p_user_id
    AND ba.status IN ('rejeitado', 'pendente_revisao')
  GROUP BY ba.template_id, ba.company_id;
$$;
