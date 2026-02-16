-- RPC to count questions per template (bypasses PostgREST 1000-row limit)
-- Counts how many questions are linked to each template in book_question_junction
CREATE OR REPLACE FUNCTION get_template_question_counts(p_template_ids uuid[])
RETURNS TABLE(template_id uuid, question_count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT book_template_id as template_id, COUNT(*) as question_count
  FROM book_question_junction
  WHERE book_template_id = ANY(p_template_ids)
  GROUP BY book_template_id;
$$;
