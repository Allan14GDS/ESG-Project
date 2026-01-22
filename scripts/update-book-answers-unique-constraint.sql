-- Remove the old unique constraint that doesn't include company_id
ALTER TABLE book_answers DROP CONSTRAINT IF EXISTS unique_answer_per_user;

-- Add new unique constraint that includes company_id
-- This allows the same user to answer the same question for different companies
ALTER TABLE book_answers ADD CONSTRAINT unique_answer_per_user_and_company 
  UNIQUE (template_id, question_id, user_id, company_id);

-- Create an index to improve query performance
CREATE INDEX IF NOT EXISTS idx_book_answers_company_lookup 
  ON book_answers(user_id, template_id, company_id);
