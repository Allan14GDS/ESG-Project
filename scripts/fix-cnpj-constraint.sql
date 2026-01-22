-- Remove the existing CNPJ format check constraint
ALTER TABLE holdings DROP CONSTRAINT IF EXISTS holdings_cnpj_format_check;

-- Add a new simpler constraint that only checks for 14 digits
ALTER TABLE holdings ADD CONSTRAINT holdings_cnpj_format_check 
  CHECK (cnpj ~ '^\d{14}$');
