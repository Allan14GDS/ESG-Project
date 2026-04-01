-- ============================================================================
-- MIGRACAO: Script complementar de RPC Functions + RLS Policies
-- ============================================================================
-- Rodar no SQL Editor do NOVO Supabase apos o pg_dump/pg_restore.
-- pg_dump pode nao exportar corretamente funcoes RPC e policies do Supabase,
-- entao este script garante que tudo esteja configurado.
-- ============================================================================

-- ============================================================================
-- PARTE 1: FUNCOES UTILITARIAS
-- ============================================================================

-- Funcao trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 2: TRIGGERS
-- ============================================================================

-- Trigger para gri_disclosures
DROP TRIGGER IF EXISTS update_gri_disclosures_updated_at ON public.gri_disclosures;
CREATE TRIGGER update_gri_disclosures_updated_at
  BEFORE UPDATE ON public.gri_disclosures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para gri_responses
DROP TRIGGER IF EXISTS update_gri_responses_updated_at ON public.gri_responses;
CREATE TRIGGER update_gri_responses_updated_at
  BEFORE UPDATE ON public.gri_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PARTE 3: FUNCOES RPC (versoes finais com null-handling)
-- ============================================================================

-- Contagem de respostas para gestores (por template + company)
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

-- Contagem de correcoes pendentes para gestores
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

-- Contagem de respostas do usuario
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

-- Contagem de correcoes pendentes do usuario
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

-- Buscar todas as questoes com templates (bypass do limite de 1000 linhas do PostgREST)
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

-- Contagem de questoes por template
CREATE OR REPLACE FUNCTION get_template_question_counts(p_template_ids uuid[])
RETURNS TABLE(template_id uuid, question_count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT book_template_id as template_id, COUNT(*) as question_count
  FROM book_question_junction
  WHERE book_template_id = ANY(p_template_ids)
  GROUP BY book_template_id;
$$;

-- ============================================================================
-- PARTE 4: HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.book_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.book_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.book_question_junction ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.company_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gri_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gri_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gri_response_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_system_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.migration_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 5: POLICIES RLS (versoes finais de seguranca)
-- ============================================================================

-- Limpar policies antigas (dev "allow_all") para evitar conflitos
DROP POLICY IF EXISTS "allow_all_book_questions" ON public.book_questions;
DROP POLICY IF EXISTS "allow_all_book_templates" ON public.book_templates;
DROP POLICY IF EXISTS "allow_all_company_templates" ON public.company_templates;
DROP POLICY IF EXISTS "allow_all_master_questions" ON public.master_questions;

-- ---- book_questions ----
DROP POLICY IF EXISTS "book_questions_admin_manage" ON public.book_questions;
CREATE POLICY "book_questions_admin_manage" ON public.book_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin_main', 'holding_admin')
    )
  );

DROP POLICY IF EXISTS "book_questions_authenticated_read" ON public.book_questions;
CREATE POLICY "book_questions_authenticated_read" ON public.book_questions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ---- book_templates ----
DROP POLICY IF EXISTS "book_templates_admin_manage" ON public.book_templates;
CREATE POLICY "book_templates_admin_manage" ON public.book_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin_main', 'holding_admin')
    )
  );

DROP POLICY IF EXISTS "book_templates_authenticated_read" ON public.book_templates;
CREATE POLICY "book_templates_authenticated_read" ON public.book_templates
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ---- company_templates ----
DROP POLICY IF EXISTS "company_templates_admin_manage" ON public.company_templates;
CREATE POLICY "company_templates_admin_manage" ON public.company_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin_main', 'holding_admin')
    )
  );

DROP POLICY IF EXISTS "company_templates_members_read" ON public.company_templates;
CREATE POLICY "company_templates_members_read" ON public.company_templates
  FOR SELECT
  USING (
    company_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ---- comment_history ----
DROP POLICY IF EXISTS "comment_history_select" ON public.comment_history;
CREATE POLICY "comment_history_select" ON public.comment_history
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "comment_history_insert" ON public.comment_history;
CREATE POLICY "comment_history_insert" ON public.comment_history
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "comment_history_admin" ON public.comment_history;
CREATE POLICY "comment_history_admin" ON public.comment_history
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin_main', 'holding_admin') OR profiles.is_super_admin = true)
    )
  );

-- ---- profiles_backup ----
DROP POLICY IF EXISTS "profiles_backup_super_admin_only" ON public.profiles_backup;
CREATE POLICY "profiles_backup_super_admin_only" ON public.profiles_backup
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin_main'
    )
  );

-- ---- system_permissions ----
DROP POLICY IF EXISTS "system_permissions_admin_read" ON public.system_permissions;
CREATE POLICY "system_permissions_admin_read" ON public.system_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin_main', 'holding_admin')
    )
  );

DROP POLICY IF EXISTS "system_permissions_admin_manage" ON public.system_permissions;
CREATE POLICY "system_permissions_admin_manage" ON public.system_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin_main'
    )
  );

-- ---- system_users ----
DROP POLICY IF EXISTS "system_users_admin_only" ON public.system_users;
CREATE POLICY "system_users_admin_only" ON public.system_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin_main'
    )
  );

-- ---- user_system_permissions ----
DROP POLICY IF EXISTS "user_system_permissions_admin_manage" ON public.user_system_permissions;
CREATE POLICY "user_system_permissions_admin_manage" ON public.user_system_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin_main'
    )
  );

DROP POLICY IF EXISTS "user_system_permissions_user_read_own" ON public.user_system_permissions;
CREATE POLICY "user_system_permissions_user_read_own" ON public.user_system_permissions
  FOR SELECT
  USING (user_id = auth.uid());

-- ---- GRI tables (acesso publico por enquanto - desenvolvimento) ----
DROP POLICY IF EXISTS "Allow public read access to disclosures" ON public.gri_disclosures;
CREATE POLICY "Allow public read access to disclosures" ON public.gri_disclosures
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to disclosures" ON public.gri_disclosures;
CREATE POLICY "Allow public insert to disclosures" ON public.gri_disclosures
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to disclosures" ON public.gri_disclosures;
CREATE POLICY "Allow public update to disclosures" ON public.gri_disclosures
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete from disclosures" ON public.gri_disclosures;
CREATE POLICY "Allow public delete from disclosures" ON public.gri_disclosures
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access to responses" ON public.gri_responses;
CREATE POLICY "Allow public read access to responses" ON public.gri_responses
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to responses" ON public.gri_responses;
CREATE POLICY "Allow public insert to responses" ON public.gri_responses
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to responses" ON public.gri_responses;
CREATE POLICY "Allow public update to responses" ON public.gri_responses
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete from responses" ON public.gri_responses;
CREATE POLICY "Allow public delete from responses" ON public.gri_responses
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access to history" ON public.gri_response_history;
CREATE POLICY "Allow public read access to history" ON public.gri_response_history
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to history" ON public.gri_response_history;
CREATE POLICY "Allow public insert to history" ON public.gri_response_history
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- PARTE 6: VERIFICACAO
-- ============================================================================

-- Rode estas queries para verificar que tudo foi criado corretamente:

-- Verificar tabelas com RLS:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Verificar policies:
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- Verificar funcoes RPC:
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- Verificar triggers:
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';

-- ============================================================================
-- FIM DO SCRIPT DE MIGRACAO
-- ============================================================================
