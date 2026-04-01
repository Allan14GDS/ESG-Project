-- ============================================================================
-- CRIAR TODAS AS TABELAS NO NOVO SUPABASE
-- Cole e execute no SQL Editor: https://supabase.com/dashboard/project/wajqqahhcneshjvrugyk/sql/new
-- ============================================================================

-- 1. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  holding_id UUID,
  cnpj TEXT,
  industry TEXT,
  size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT DEFAULT 'company'
);

-- 2. COMPANIES
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holding_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  cnpj TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_super_admin BOOLEAN DEFAULT false
);

-- 4. ORGANIZATION_MEMBERS
CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  role_in_org TEXT DEFAULT 'member',
  PRIMARY KEY (organization_id, user_id)
);

-- 5. BOOK_TEMPLATES
CREATE TABLE IF NOT EXISTS public.book_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT
);

-- 6. BOOK_QUESTIONS
CREATE TABLE IF NOT EXISTS public.book_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  label TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  unique_identifier TEXT UNIQUE,
  metadata_v2 JSONB
);

-- 7. BOOK_QUESTION_JUNCTION
CREATE TABLE IF NOT EXISTS public.book_question_junction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_template_id UUID NOT NULL REFERENCES public.book_templates(id) ON DELETE CASCADE,
  question_template_id UUID NOT NULL REFERENCES public.book_questions(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  position INTEGER DEFAULT 0,
  comment TEXT
);

-- 8. COMPANY_TEMPLATES
CREATE TABLE IF NOT EXISTS public.company_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.book_templates(id) ON DELETE CASCADE,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- 9. BOOK_ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.book_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  caderno_id TEXT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL
);

ALTER TABLE public.book_assignments
  DROP CONSTRAINT IF EXISTS assignments_company_caderno_user_role_key;
ALTER TABLE public.book_assignments
  ADD CONSTRAINT assignments_company_caderno_user_role_key
  UNIQUE (company_id, caderno_id, user_id, role);

-- 10. BOOK_ANSWERS
CREATE TABLE IF NOT EXISTS public.book_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.book_templates(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.book_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  holding_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  evidence_url TEXT,
  status TEXT DEFAULT 'rascunho',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  value_jsonb JSONB
);

ALTER TABLE public.book_answers
  DROP CONSTRAINT IF EXISTS unique_answer_per_user_and_company;
ALTER TABLE public.book_answers
  ADD CONSTRAINT unique_answer_per_user_and_company
  UNIQUE (template_id, question_id, user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_book_answers_company_lookup
  ON public.book_answers(user_id, template_id, company_id);

-- 11. COMMENT_HISTORY
CREATE TABLE IF NOT EXISTS public.comment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_template_id UUID REFERENCES public.book_templates(id) ON DELETE CASCADE,
  question_template_id UUID REFERENCES public.book_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_id UUID,
  comment TEXT NOT NULL,
  question_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comment_history_question ON public.comment_history(question_template_id);
CREATE INDEX IF NOT EXISTS idx_comment_history_template ON public.comment_history(book_template_id);
CREATE INDEX IF NOT EXISTS idx_comment_history_user ON public.comment_history(user_id);

-- 12. SYSTEM_PERMISSIONS
CREATE TABLE IF NOT EXISTS public.system_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SYSTEM_USERS
CREATE TABLE IF NOT EXISTS public.system_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  password_hash TEXT
);

-- 14. USER_SYSTEM_PERMISSIONS
CREATE TABLE IF NOT EXISTS public.user_system_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_id UUID REFERENCES public.system_permissions(id) ON DELETE CASCADE,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. PROFILES_BACKUP
CREATE TABLE IF NOT EXISTS public.profiles_backup (
  id UUID PRIMARY KEY,
  organization_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_super_admin BOOLEAN
);

-- 16. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  user_id UUID,
  action TEXT,
  entity_type TEXT,
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  holding_id UUID,
  company_id UUID,
  book_template_id UUID,
  question_id UUID,
  answer_text TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. INDEXES
CREATE INDEX IF NOT EXISTS idx_book_questions_template_id ON public.book_question_junction(book_template_id);
CREATE INDEX IF NOT EXISTS idx_book_questions_question_id ON public.book_question_junction(question_template_id);
CREATE INDEX IF NOT EXISTS idx_company_templates_company_id ON public.company_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_book_assignments_company_id ON public.book_assignments(company_id);

-- ============================================================================
-- PRONTO! Agora rode o script de migracao de dados novamente.
-- ============================================================================
