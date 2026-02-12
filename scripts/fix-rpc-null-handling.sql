-- Fix RPCs to handle NULL arrays from Supabase JS client
-- When JS passes [] it may arrive as NULL in PostgreSQL

CREATE OR REPLACE FUNCTION get_gestor_answer_counts(
  p_company_ids uuid[],
  p_org_ids uuid[]
)
RETURNS TABLE(template_id uuid, company_id uuid, answered_count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT 
    ba.template_id,
    ba.company_id,
    COUNT(DISTINCT ba.question_id) as answered_count
  FROM book_answers ba
  WHERE (
    (p_company_ids IS NOT NULL AND array_length(p_company_ids, 1) > 0 AND ba.company_id = ANY(p_company_ids))
    OR 
    (p_org_ids IS NOT NULL AND array_length(p_org_ids, 1) > 0 AND ba.holding_id = ANY(p_org_ids))
  )
  GROUP BY ba.template_id, ba.company_id;
$$;

CREATE OR REPLACE FUNCTION get_gestor_correction_counts(
  p_company_ids uuid[],
  p_org_ids uuid[]
)
RETURNS TABLE(template_id uuid, company_id uuid, needs_correction_count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT 
    ba.template_id,
    ba.company_id,
    COUNT(DISTINCT ba.question_id) as needs_correction_count
  FROM book_answers ba
  WHERE (
    (p_company_ids IS NOT NULL AND array_length(p_company_ids, 1) > 0 AND ba.company_id = ANY(p_company_ids))
    OR 
    (p_org_ids IS NOT NULL AND array_length(p_org_ids, 1) > 0 AND ba.holding_id = ANY(p_org_ids))
  )
  AND ba.status IN ('rejeitado', 'pendente_revisao')
  GROUP BY ba.template_id, ba.company_id;
$$;

CREATE OR REPLACE FUNCTION get_user_answer_counts(
  p_user_id uuid
)
RETURNS TABLE(template_id uuid, company_id uuid, answered_count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT 
    ba.template_id,
    ba.company_id,
    COUNT(DISTINCT ba.question_id) as answered_count
  FROM book_answers ba
  WHERE ba.user_id = p_user_id
  GROUP BY ba.template_id, ba.company_id;
$$;

CREATE OR REPLACE FUNCTION get_user_correction_counts(
  p_user_id uuid
)
RETURNS TABLE(template_id uuid, company_id uuid, needs_correction_count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT 
    ba.template_id,
    ba.company_id,
    COUNT(DISTINCT ba.question_id) as needs_correction_count
  FROM book_answers ba
  WHERE ba.user_id = p_user_id
  AND ba.status IN ('rejeitado', 'pendente_revisao')
  GROUP BY ba.template_id, ba.company_id;
$$;
