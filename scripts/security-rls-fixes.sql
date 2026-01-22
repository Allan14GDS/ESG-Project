-- =====================================================
-- SECURITY: RLS POLICY FIXES
-- Run this migration to fix security vulnerabilities
-- =====================================================

-- 1. Enable RLS on profiles_backup (currently disabled)
ALTER TABLE public.profiles_backup ENABLE ROW LEVEL SECURITY;

-- Add restrictive policy - only super admins can access backup
CREATE POLICY "profiles_backup_super_admin_only" ON public.profiles_backup
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_main'
    )
  );

-- 2. Add policies for system_permissions (has RLS but no policies)
CREATE POLICY "system_permissions_admin_read" ON public.system_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin_main', 'holding_admin')
    )
  );

CREATE POLICY "system_permissions_admin_manage" ON public.system_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_main'
    )
  );

-- 3. Add policies for system_users (has RLS but no policies)
CREATE POLICY "system_users_admin_only" ON public.system_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_main'
    )
  );

-- 4. Add policies for user_system_permissions (has RLS but no policies)
CREATE POLICY "user_system_permissions_admin_manage" ON public.user_system_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_main'
    )
  );

CREATE POLICY "user_system_permissions_user_read_own" ON public.user_system_permissions
  FOR SELECT
  USING (user_id = auth.uid());

-- 5. Remove overly permissive "allow_all" policies (DANGEROUS!)
-- These policies allow ANY authenticated user to do ANYTHING

-- Remove allow_all from book_questions
DROP POLICY IF EXISTS "allow_all_book_questions" ON public.book_questions;

-- Remove allow_all from book_templates  
DROP POLICY IF EXISTS "allow_all_book_templates" ON public.book_templates;

-- Remove allow_all from company_templates
DROP POLICY IF EXISTS "allow_all_company_templates" ON public.company_templates;

-- 6. Add proper restrictive policies for book_questions
CREATE POLICY "book_questions_admin_manage" ON public.book_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin_main', 'holding_admin')
    )
  );

CREATE POLICY "book_questions_authenticated_read" ON public.book_questions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 7. Add proper restrictive policies for book_templates
CREATE POLICY "book_templates_admin_manage" ON public.book_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin_main', 'holding_admin')
    )
  );

CREATE POLICY "book_templates_authenticated_read" ON public.book_templates
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 8. Add proper restrictive policies for company_templates
CREATE POLICY "company_templates_admin_manage" ON public.company_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin_main', 'holding_admin')
    )
  );

CREATE POLICY "company_templates_members_read" ON public.company_templates
  FOR SELECT
  USING (
    company_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- VERIFICATION QUERIES (run after migration)
-- =====================================================

-- Check all tables have RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check all policies:
-- SELECT tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public';
