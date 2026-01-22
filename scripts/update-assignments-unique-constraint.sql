-- Drop the old constraint that doesn't consider company_id
ALTER TABLE book_assignments 
DROP CONSTRAINT IF EXISTS assignments_organization_id_caderno_id_user_id_role_key;

-- Add new constraint that includes company_id
-- This allows the same template to be assigned to the same user in different companies
ALTER TABLE book_assignments 
ADD CONSTRAINT assignments_company_caderno_user_role_key 
UNIQUE (company_id, caderno_id, user_id, role);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_assignments_company_caderno_user 
ON book_assignments(company_id, caderno_id, user_id);
