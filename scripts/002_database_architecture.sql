-- =====================================================
-- DATABASE ARCHITECTURE - CLEAR DOCUMENTATION
-- =====================================================
-- 
-- TABLES:
--   book_templates     = Cadernos (books) - ALREADY EXISTS
--   master_questions   = Banco master de questões - ALREADY EXISTS
--   book_questions     = Junção questões ↔ cadernos (template_id, question_id) - ALREADY EXISTS
--   company_templates  = Atribuição de cadernos a empresas - ALREADY EXISTS
--
-- This script adds missing indexes and RLS policies only.
-- It does NOT recreate existing tables.
-- =====================================================

-- 1. Add missing columns to master_questions if needed
DO $$
BEGIN
    -- Add frameworks column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_questions' AND column_name = 'frameworks') THEN
        ALTER TABLE master_questions ADD COLUMN frameworks JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add tipo_resposta column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_questions' AND column_name = 'tipo_resposta') THEN
        ALTER TABLE master_questions ADD COLUMN tipo_resposta TEXT DEFAULT 'Texto';
    END IF;
    
    -- Add evidencias column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_questions' AND column_name = 'evidencias') THEN
        ALTER TABLE master_questions ADD COLUMN evidencias TEXT;
    END IF;
    
    -- Add obs_nao_aplicavel column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_questions' AND column_name = 'obs_nao_aplicavel') THEN
        ALTER TABLE master_questions ADD COLUMN obs_nao_aplicavel TEXT;
    END IF;
END $$;

-- 2. Add sort_order to book_questions if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'book_questions' AND column_name = 'sort_order') THEN
        ALTER TABLE book_questions ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Fixed column name from book_template_id to template_id (matches actual table)
-- 3. Create indexes for performance (if not exist)
CREATE INDEX IF NOT EXISTS idx_book_questions_template_id ON book_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_book_questions_question_id ON book_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_company_templates_company_id ON company_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_master_questions_disclosure ON master_questions(disclosure);
CREATE INDEX IF NOT EXISTS idx_master_questions_frameworks ON master_questions USING GIN (frameworks);

-- 4. Enable RLS on all tables
ALTER TABLE book_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_templates ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for full access (development)
DO $$
BEGIN
    -- book_templates policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_book_templates' AND tablename = 'book_templates') THEN
        CREATE POLICY allow_all_book_templates ON book_templates FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    -- master_questions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_master_questions' AND tablename = 'master_questions') THEN
        CREATE POLICY allow_all_master_questions ON master_questions FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    -- book_questions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_book_questions' AND tablename = 'book_questions') THEN
        CREATE POLICY allow_all_book_questions ON book_questions FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    -- company_templates policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_company_templates' AND tablename = 'company_templates') THEN
        CREATE POLICY allow_all_company_templates ON company_templates FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- =====================================================
-- CLEAR DOCUMENTATION
-- =====================================================
-- 
-- book_templates (cadernos):
--   id, name, description, type, responsable_name, responsable_id, created_by, created_at
--   Frontend: /admin/templates
--
-- master_questions (banco master):
--   id, frameworks (JSONB), disclosure, linha_coleta, tipo_resposta, evidencias, obs_nao_aplicavel, created_by, created_at
--   Frontend: Used when adding questions to books
--
-- book_questions (junção questões ↔ cadernos):
--   id, template_id (FK -> book_templates.id), question_id (FK -> master_questions.id), sort_order, created_at
--   Links master_questions to book_templates
--   IMPORTANTE: A coluna é "template_id" (não "book_template_id")
--
-- company_templates (junção cadernos ↔ empresas):
--   id, company_id (FK -> companies.id), template_id (FK -> book_templates.id), assigned_by, assigned_at, active
--   Assigns books to companies
--
-- =====================================================
-- 
-- COMMON QUERIES:
--
-- Get book with questions:
--   SELECT b.*, q.* 
--   FROM book_templates b
--   JOIN book_questions bq ON bq.template_id = b.id
--   JOIN master_questions q ON q.id = bq.question_id
--   WHERE b.id = :book_id
--   ORDER BY bq.sort_order;
--
-- Link question to book:
--   INSERT INTO book_questions (template_id, question_id, sort_order)
--   VALUES (:book_id, :question_id, :sort_order);
--
-- Unlink question from book:
--   DELETE FROM book_questions 
--   WHERE template_id = :book_id AND question_id = :question_id;
--
-- =====================================================
