-- RPC to get all questions with their templates (bypasses PostgREST 1000-row limit)
CREATE OR REPLACE FUNCTION get_all_questions_with_templates()
RETURNS TABLE (
  id uuid,
  label text,
  type text,
  unique_identifier text,
  metadata jsonb,
  created_at timestamptz,
  book_question_junction jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bq.id,
    bq.label,
    bq.type,
    bq.unique_identifier,
    bq.metadata,
    bq.created_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'book_template_id', bqj.book_template_id,
          'book_templates', jsonb_build_object(
            'id', bt.id,
            'name', bt.name
          )
        )
      ) FILTER (WHERE bqj.question_template_id IS NOT NULL),
      '[]'::jsonb
    ) as book_question_junction
  FROM book_questions bq
  LEFT JOIN book_question_junction bqj ON bq.id = bqj.question_template_id
  LEFT JOIN book_templates bt ON bqj.book_template_id = bt.id
  GROUP BY bq.id, bq.label, bq.type, bq.unique_identifier, bq.metadata, bq.created_at
  ORDER BY bq.created_at DESC;
END;
$$;
