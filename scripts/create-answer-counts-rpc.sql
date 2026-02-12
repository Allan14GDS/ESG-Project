-- Create an RPC function to get aggregated answer counts per (template_id, company_id, user_id)
-- This avoids the Supabase default 1000-row limit that truncates raw answer fetches

-- Function for gestor: counts answers per template+company (all users combined)
CREATE OR REPLACE FUNCTION get_answer_counts_by_company(p_company_ids uuid[])
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
  GROUP BY ba.template_id, ba.company_id;
$$;

-- Function for gestor: counts answers per template+company+user
CREATE OR REPLACE FUNCTION get_answer_counts_by_company_and_user(p_company_ids uuid[])
RETURNS TABLE (
  template_id uuid,
  company_id uuid,
  user_id uuid,
  answered_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ba.template_id,
    ba.company_id,
    ba.user_id,
    COUNT(DISTINCT ba.question_id) as answered_count
  FROM book_answers ba
  WHERE ba.company_id = ANY(p_company_ids)
  GROUP BY ba.template_id, ba.company_id, ba.user_id;
$$;

-- Function for regular user: counts their own answers per template+company
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

-- Function for holding-based queries: counts answers per template+holding (all users)
CREATE OR REPLACE FUNCTION get_answer_counts_by_holding(p_holding_ids uuid[])
RETURNS TABLE (
  template_id uuid,
  holding_id uuid,
  answered_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ba.template_id,
    ba.holding_id,
    COUNT(DISTINCT ba.question_id) as answered_count
  FROM book_answers ba
  WHERE ba.holding_id = ANY(p_holding_ids)
  GROUP BY ba.template_id, ba.holding_id;
$$;
