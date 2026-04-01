-- ============================================================================
-- SCRIPT DEFINITIVO: Replicar RLS do banco ANTIGO no NOVO (identico)
--
-- IMPORTANTE: Rode PRIMEIRO o migration_rpc_rls_complete.sql (funcoes)
--             DEPOIS rode este script (RLS policies)
--
-- Cole no SQL Editor do NOVO Supabase:
-- https://supabase.com/dashboard/project/wajqqahhcneshjvrugyk/sql/new
-- ============================================================================

-- ============================================================================
-- PASSO 1: Habilitar RLS em TODAS as tabelas (igual ao antigo)
-- ============================================================================

ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.book_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.book_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.book_question_junction ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.book_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.book_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.company_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_system_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASSO 2: Limpar TODAS as policies do novo (para recriar identicas)
-- ============================================================================

-- audit_logs
DROP POLICY IF EXISTS "All authenticated users can insert logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Company admins can view org logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Holding admins can view all logs" ON public.audit_logs;

-- book_answers
DROP POLICY IF EXISTS "book_answers_superadmin_admin" ON public.book_answers;
DROP POLICY IF EXISTS "gestores_ver_respostas_por_organization_members" ON public.book_answers;
DROP POLICY IF EXISTS "users_delete_on_approval" ON public.book_answers;
DROP POLICY IF EXISTS "users_insert_if_assigned" ON public.book_answers;
DROP POLICY IF EXISTS "users_select_own_or_manager" ON public.book_answers;
DROP POLICY IF EXISTS "users_update" ON public.book_answers;

-- book_assignments
DROP POLICY IF EXISTS "Company admins can manage org assignments" ON public.book_assignments;
DROP POLICY IF EXISTS "Holding admins can manage all assignments" ON public.book_assignments;
DROP POLICY IF EXISTS "Users can view own assignments" ON public.book_assignments;
DROP POLICY IF EXISTS "assignments_admin_super" ON public.book_assignments;
DROP POLICY IF EXISTS "assignments_manager_select" ON public.book_assignments;

-- book_question_junction
DROP POLICY IF EXISTS "book_question_junction_admin" ON public.book_question_junction;
DROP POLICY IF EXISTS "book_question_junction_select" ON public.book_question_junction;

-- book_questions (limpar as do novo que sao diferentes)
DROP POLICY IF EXISTS "book_questions_admin_manage" ON public.book_questions;
DROP POLICY IF EXISTS "book_questions_authenticated_read" ON public.book_questions;
DROP POLICY IF EXISTS "allow_all_book_questions" ON public.book_questions;
DROP POLICY IF EXISTS "question_templates_admin" ON public.book_questions;
DROP POLICY IF EXISTS "question_templates_select" ON public.book_questions;

-- book_templates
DROP POLICY IF EXISTS "book_templates_admin_manage" ON public.book_templates;
DROP POLICY IF EXISTS "book_templates_authenticated_read" ON public.book_templates;
DROP POLICY IF EXISTS "allow_all_book_templates" ON public.book_templates;
DROP POLICY IF EXISTS "templates_admin" ON public.book_templates;
DROP POLICY IF EXISTS "templates_select" ON public.book_templates;

-- comment_history
DROP POLICY IF EXISTS "comment_history_admin" ON public.comment_history;
DROP POLICY IF EXISTS "comment_history_insert" ON public.comment_history;
DROP POLICY IF EXISTS "comment_history_select" ON public.comment_history;

-- companies
DROP POLICY IF EXISTS "companies_admin_super" ON public.companies;
DROP POLICY IF EXISTS "companies_manager" ON public.companies;
DROP POLICY IF EXISTS "companies_member_select" ON public.companies;

-- company_templates
DROP POLICY IF EXISTS "allow_all_company_templates" ON public.company_templates;
DROP POLICY IF EXISTS "company_templates_admin_manage" ON public.company_templates;
DROP POLICY IF EXISTS "company_templates_members_read" ON public.company_templates;
DROP POLICY IF EXISTS "company_templates_members_select" ON public.company_templates;

-- organization_members
DROP POLICY IF EXISTS "manager_can_insert_members" ON public.organization_members;
DROP POLICY IF EXISTS "view_company_members" ON public.organization_members;

-- organizations
DROP POLICY IF EXISTS "Holding admins can manage organizations" ON public.organizations;
DROP POLICY IF EXISTS "Holding admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
DROP POLICY IF EXISTS "admins_and_members_can_view_orgs" ON public.organizations;
DROP POLICY IF EXISTS "allow authenticated insert organizations" ON public.organizations;
DROP POLICY IF EXISTS "organizations_admin_super" ON public.organizations;
DROP POLICY IF EXISTS "organizations_manager" ON public.organizations;
DROP POLICY IF EXISTS "organizations_member_select" ON public.organizations;

-- profiles
DROP POLICY IF EXISTS "profiles_company_admin_org" ON public.profiles;
DROP POLICY IF EXISTS "profiles_holding_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_org_member_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin" ON public.profiles;

-- profiles_backup
DROP POLICY IF EXISTS "profiles_backup_super_admin_only" ON public.profiles_backup;

-- system_permissions
DROP POLICY IF EXISTS "system_permissions_admin_manage" ON public.system_permissions;
DROP POLICY IF EXISTS "system_permissions_admin_read" ON public.system_permissions;

-- system_users
DROP POLICY IF EXISTS "system_users_admin_only" ON public.system_users;

-- user_system_permissions
DROP POLICY IF EXISTS "user_system_permissions_admin_manage" ON public.user_system_permissions;
DROP POLICY IF EXISTS "user_system_permissions_user_read_own" ON public.user_system_permissions;

-- ============================================================================
-- PASSO 3: Recriar TODAS as policies (identicas ao antigo)
-- ============================================================================

-- ---- AUDIT_LOGS (3 policies) ----

CREATE POLICY "All authenticated users can insert logs" ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Company admins can view org logs" ON public.audit_logs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT profiles.organization_id
      FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'company_admin'
    )
  );

CREATE POLICY "Holding admins can view all logs" ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'holding_admin'
    )
  );

-- ---- BOOK_ANSWERS (6 policies - hierarquia completa!) ----

CREATE POLICY "book_answers_superadmin_admin" ON public.book_answers
  FOR ALL TO authenticated
  USING (
    is_super_admin((SELECT auth.uid())) OR is_admin((SELECT auth.uid()))
  );

CREATE POLICY "gestores_ver_respostas_por_organization_members" ON public.book_answers
  FOR SELECT TO authenticated
  USING (
    ((auth.jwt() ->> 'role') = 'admin')
    OR
    (EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
        AND (
          om.organization_id = book_answers.holding_id
          OR om.organization_id IN (
            SELECT o.id FROM organizations o WHERE o.holding_id = book_answers.holding_id
          )
          OR om.organization_id IN (
            SELECT o2.id FROM companies c
            JOIN organizations o2 ON o2.holding_id = c.holding_id
            WHERE c.id = book_answers.company_id
          )
        )
    ))
  );

CREATE POLICY "users_delete_on_approval" ON public.book_answers
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM book_assignments ba
      WHERE ba.user_id = auth.uid()
        AND ba.caderno_id = (book_answers.template_id)::text
        AND ba.role = 'approver'
    )
  );

CREATE POLICY "users_insert_if_assigned" ON public.book_answers
  FOR INSERT TO authenticated
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM book_assignments ba
      WHERE ba.user_id = auth.uid()
        AND ba.caderno_id = (book_answers.template_id)::text
    ))
    OR
    (EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = book_answers.holding_id
    ))
  );

CREATE POLICY "users_select_own_or_manager" ON public.book_answers
  FOR SELECT TO authenticated
  USING (
    (user_id = auth.uid())
    OR
    (EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.organization_id = book_answers.holding_id
    ))
    OR
    (EXISTS (
      SELECT 1 FROM book_assignments ba
      WHERE ba.user_id = auth.uid()
        AND ba.caderno_id = (book_answers.template_id)::text
        AND ba.role = ANY (ARRAY['reviewer', 'approver'])
    ))
  );

CREATE POLICY "users_update" ON public.book_answers
  FOR UPDATE TO authenticated
  USING (
    (user_id = auth.uid())
    OR
    (EXISTS (
      SELECT 1 FROM book_assignments ba
      WHERE ba.user_id = auth.uid()
        AND ba.caderno_id = (book_answers.template_id)::text
        AND ba.role = ANY (ARRAY['reviewer', 'approver'])
    ))
  )
  WITH CHECK (
    ((user_id = auth.uid()) AND (status <> 'aprovado'))
    OR
    (EXISTS (
      SELECT 1 FROM book_assignments ba
      WHERE ba.user_id = auth.uid()
        AND ba.caderno_id = (book_answers.template_id)::text
        AND ba.role = ANY (ARRAY['reviewer', 'approver'])
    ))
  );

-- ---- BOOK_ASSIGNMENTS (5 policies) ----

CREATE POLICY "Company admins can manage org assignments" ON public.book_assignments
  FOR ALL
  USING (
    organization_id IN (
      SELECT profiles.organization_id
      FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'company_admin'
    )
  );

CREATE POLICY "Holding admins can manage all assignments" ON public.book_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'holding_admin'
    )
  );

CREATE POLICY "Users can view own assignments" ON public.book_assignments
  FOR SELECT
  USING (
    (user_id = auth.uid())
    OR
    (organization_id IN (
      SELECT profiles.organization_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    ))
  );

CREATE POLICY "assignments_admin_super" ON public.book_assignments
  FOR ALL TO authenticated
  USING (
    is_super_admin((SELECT auth.uid())) OR is_admin((SELECT auth.uid()))
  );

CREATE POLICY "assignments_manager_select" ON public.book_assignments
  FOR SELECT TO authenticated
  USING (
    is_manager_of_holding((SELECT auth.uid()), organization_id)
    OR is_manager_of_company((SELECT auth.uid()), organization_id)
  );

-- ---- BOOK_QUESTION_JUNCTION (2 policies) ----

CREATE POLICY "book_question_junction_admin" ON public.book_question_junction
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "book_question_junction_select" ON public.book_question_junction
  FOR SELECT TO authenticated
  USING (true);

-- ---- BOOK_QUESTIONS (3 policies) ----

CREATE POLICY "allow_all_book_questions" ON public.book_questions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "question_templates_admin" ON public.book_questions
  FOR ALL
  USING (true);

CREATE POLICY "question_templates_select" ON public.book_questions
  FOR SELECT
  USING (true);

-- ---- BOOK_TEMPLATES (3 policies) ----

CREATE POLICY "allow_all_book_templates" ON public.book_templates
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "templates_admin" ON public.book_templates
  FOR ALL TO authenticated
  USING (
    is_super_admin((SELECT auth.uid())) OR is_admin((SELECT auth.uid()))
  );

CREATE POLICY "templates_select" ON public.book_templates
  FOR SELECT TO authenticated
  USING (true);

-- ---- COMPANIES (3 policies) ----

CREATE POLICY "companies_admin_super" ON public.companies
  FOR ALL TO authenticated
  USING (
    is_super_admin((SELECT auth.uid())) OR is_admin((SELECT auth.uid()))
  );

CREATE POLICY "companies_manager" ON public.companies
  FOR ALL TO authenticated
  USING (
    is_manager_of_company((SELECT auth.uid()), id)
  );

CREATE POLICY "companies_member_select" ON public.companies
  FOR SELECT TO authenticated
  USING (
    is_member_of_company((SELECT auth.uid()), id)
  );

-- ---- COMPANY_TEMPLATES (3 policies) ----

CREATE POLICY "allow_all_company_templates" ON public.company_templates
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "company_templates_admin_manage" ON public.company_templates
  FOR ALL TO authenticated
  USING (
    (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) ~~ '%%admin%%'
  )
  WITH CHECK (
    (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) ~~ '%%admin%%'
  );

CREATE POLICY "company_templates_members_select" ON public.company_templates
  FOR SELECT TO authenticated
  USING (
    profile_company(company_id)
  );

-- ---- ORGANIZATION_MEMBERS (2 policies) ----

CREATE POLICY "manager_can_insert_members" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    ((SELECT COALESCE(profiles.role, '') FROM profiles WHERE profiles.id = auth.uid()) = 'admin')
    OR is_manager_of_org(organization_id)
  );

CREATE POLICY "view_company_members" ON public.organization_members
  FOR SELECT TO authenticated
  USING (
    ((SELECT COALESCE(profiles.role, '') FROM profiles WHERE profiles.id = auth.uid()) = 'admin')
    OR
    (organization_id = (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid()))
  );

-- ---- ORGANIZATIONS (8 policies) ----

CREATE POLICY "Holding admins can manage organizations" ON public.organizations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'holding_admin'
    )
  );

CREATE POLICY "Holding admins can view all organizations" ON public.organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'holding_admin'
    )
  );

CREATE POLICY "Users can view own organization" ON public.organizations
  FOR SELECT
  USING (
    id IN (
      SELECT profiles.organization_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "admins_and_members_can_view_orgs" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    ((SELECT COALESCE(profiles.role, '') FROM profiles WHERE profiles.id = auth.uid()) = 'admin')
    OR
    (EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.organization_id = organizations.id
    ))
  );

CREATE POLICY "allow authenticated insert organizations" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "organizations_admin_super" ON public.organizations
  FOR ALL TO authenticated
  USING (
    is_super_admin((SELECT auth.uid())) OR is_admin((SELECT auth.uid()))
  );

CREATE POLICY "organizations_manager" ON public.organizations
  FOR ALL TO authenticated
  USING (
    is_manager_of_holding((SELECT auth.uid()), id)
    OR is_manager_of_company((SELECT auth.uid()), id)
  );

CREATE POLICY "organizations_member_select" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    is_member_of_company((SELECT auth.uid()), id)
  );

-- ---- PROFILES (4 policies) ----

CREATE POLICY "profiles_company_admin_org" ON public.profiles
  FOR ALL TO authenticated
  USING (
    (organization_id = get_profile_organization((SELECT auth.uid())))
    AND (get_profile_role((SELECT auth.uid())) = 'company_admin')
  );

CREATE POLICY "profiles_holding_admin" ON public.profiles
  FOR ALL TO authenticated
  USING (
    get_profile_role((SELECT auth.uid())) = 'holding_admin'
  );

CREATE POLICY "profiles_org_member_read" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    organization_id = get_profile_organization((SELECT auth.uid()))
  );

CREATE POLICY "profiles_super_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    is_privileged_admin((SELECT auth.uid()))
  );

-- ============================================================================
-- NOTA: As tabelas abaixo NAO tinham policies no banco antigo
-- (RLS ativado mas sem policies = acesso bloqueado exceto service_role)
-- Mantendo identico ao antigo:
-- - profiles_backup: sem policies (so service_role acessa)
-- - system_permissions: sem policies (so service_role acessa)
-- - system_users: sem policies (so service_role acessa)
-- - user_system_permissions: sem policies (so service_role acessa)
-- - comment_history: sem policies (so service_role acessa)
-- ============================================================================

-- ============================================================================
-- PASSO 4: Verificacao - rode para confirmar que esta identico
-- ============================================================================

-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- ============================================================================
-- FIM! RLS agora esta identico ao banco antigo.
-- ============================================================================
