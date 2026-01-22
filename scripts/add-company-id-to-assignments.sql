-- Add company_id column to book_assignments table
-- This allows us to track both the holding (organization_id) and the specific company

ALTER TABLE book_assignments 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_book_assignments_company_id ON book_assignments(company_id);

-- Add comment
COMMENT ON COLUMN book_assignments.company_id IS 'References the specific company within a holding that this assignment is for';
