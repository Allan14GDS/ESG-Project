-- ============================================================================
-- SCRIPT COMPLETO: Todas as 26 Funcoes RPC + Triggers do banco ANTIGO
-- Cole e execute no SQL Editor do NOVO Supabase:
-- https://supabase.com/dashboard/project/wajqqahhcneshjvrugyk/sql/new
-- ============================================================================

-- ============================================================================
-- PARTE 1: FUNCOES TRIGGER (updated_at)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_book_answers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_questions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- PARTE 2: TRIGGER handle_new_user (CRITICO! Cria profile ao signup)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_active,
    is_super_admin
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email,
      'Usuário'
    ),
    'employee',
    true,
    false
  );

  RETURN NEW;

EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Trigger no auth.users para criar profile automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PARTE 3: FUNCOES DE VERIFICACAO DE PERMISSAO (usadas por RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT (auth.uid())::uuid;
$function$;

CREATE OR REPLACE FUNCTION public.get_profile_organization(uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT organization_id FROM public.profiles WHERE id = uid LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_profile_role(uid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM public.profiles WHERE id = uid LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(p_profile uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_profile AND role IN ('admin_main','holding_admin','company_admin'));
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin(p_profile uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_profile AND is_super_admin = true);
$function$;

CREATE OR REPLACE FUNCTION public.is_privileged_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = uid AND role = ANY (ARRAY['superadmin','admin'])
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_manager_of_org(p_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = p_org
      AND om.role_in_org = 'gestor'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_manager_of_company(p_manager uuid, p_company uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM public.book_assignments a
    WHERE a.user_id = p_manager AND a.company_id = p_company AND a.role IN ('approver','contributor')
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_manager_of_holding(p_manager uuid, p_holding uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM public.book_assignments a
    WHERE a.user_id = p_manager AND a.organization_id = p_holding AND a.role IN ('approver','contributor')
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_member_of_company(p_profile uuid, p_company uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM public.organization_members m
    WHERE m.user_id = p_profile AND m.organization_id = p_company
  );
$function$;

CREATE OR REPLACE FUNCTION public.profile_company(p_company uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::uuid AND organization_id = p_company);
$function$;

-- ============================================================================
-- PARTE 4: FUNCOES RPC DE CONTAGEM E DASHBOARD
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_gestor_answer_counts(p_company_ids uuid[], p_org_ids uuid[])
RETURNS TABLE(template_id uuid, company_id uuid, answered_count bigint)
LANGUAGE sql
STABLE
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_gestor_correction_counts(p_company_ids uuid[], p_org_ids uuid[])
RETURNS TABLE(template_id uuid, company_id uuid, needs_correction_count bigint)
LANGUAGE sql
STABLE
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_user_answer_counts(p_user_id uuid)
RETURNS TABLE(template_id uuid, company_id uuid, answered_count bigint)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    ba.template_id,
    ba.company_id,
    COUNT(DISTINCT ba.question_id) as answered_count
  FROM book_answers ba
  WHERE ba.user_id = p_user_id
  GROUP BY ba.template_id, ba.company_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_correction_counts(p_user_id uuid)
RETURNS TABLE(template_id uuid, company_id uuid, needs_correction_count bigint)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    ba.template_id,
    ba.company_id,
    COUNT(DISTINCT ba.question_id) as needs_correction_count
  FROM book_answers ba
  WHERE ba.user_id = p_user_id
  AND ba.status IN ('rejeitado', 'pendente_revisao')
  GROUP BY ba.template_id, ba.company_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_questions_with_templates()
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
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_template_question_counts(p_template_ids uuid[])
RETURNS TABLE(template_id uuid, question_count bigint)
LANGUAGE sql
STABLE
AS $function$
  SELECT book_template_id as template_id, COUNT(*) as question_count
  FROM book_question_junction
  WHERE book_template_id = ANY(p_template_ids)
  GROUP BY book_template_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_company_progress(p_company_ids uuid[])
RETURNS TABLE(company_id uuid, answered_count bigint, total_questions bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ct.company_id,
    COALESCE(ans.cnt, 0) as answered_count,
    COALESCE(SUM(jc.question_count), 0) as total_questions
  FROM company_templates ct
  JOIN (
    SELECT bqj.book_template_id, COUNT(*) as question_count
    FROM book_question_junction bqj
    GROUP BY bqj.book_template_id
  ) jc ON jc.book_template_id = ct.template_id
  LEFT JOIN (
    SELECT ba.company_id as cid, ba.template_id as tid, COUNT(*) as cnt
    FROM book_answers ba
    WHERE ba.company_id = ANY(p_company_ids)
      AND ba.value IS NOT NULL
      AND ba.value != ''
    GROUP BY ba.company_id, ba.template_id
  ) ans ON ans.cid = ct.company_id AND ans.tid = ct.template_id
  WHERE ct.company_id = ANY(p_company_ids)
    AND ct.active = true
  GROUP BY ct.company_id, ans.cnt;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_daily_answer_counts(p_company_ids uuid[], p_days integer DEFAULT 30)
RETURNS TABLE(activity_date date, company_id uuid, answer_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    DATE(ba.updated_at) as activity_date,
    ba.company_id,
    COUNT(*) as answer_count
  FROM book_answers ba
  WHERE ba.company_id = ANY(p_company_ids)
    AND ba.updated_at >= (CURRENT_DATE - p_days)
  GROUP BY DATE(ba.updated_at), ba.company_id
  ORDER BY activity_date ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_daily_answer_counts_all(p_days integer DEFAULT 30)
RETURNS TABLE(activity_date date, company_id uuid, answer_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    DATE(ba.updated_at) as activity_date,
    ba.company_id,
    COUNT(*) as answer_count
  FROM book_answers ba
  WHERE ba.updated_at >= (CURRENT_DATE - p_days)
  GROUP BY DATE(ba.updated_at), ba.company_id
  ORDER BY activity_date ASC;
END;
$function$;

-- ============================================================================
-- PARTE 5: FUNCAO DE CRIACAO DE HOLDING
-- ============================================================================

-- NOTA: Esta funcao referencia a tabela 'holdings' que pode nao existir no novo DB.
-- Se der erro, ignore — ela so e usada se a tabela holdings existir.
CREATE OR REPLACE FUNCTION public.create_holding_with_profile(p_name text, p_cnpj text, p_email text, p_password_hash text)
RETURNS TABLE(holding_id uuid, organization_id uuid, profile_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_holding_id uuid;
  v_org_id uuid;
  v_profile_id uuid;
BEGIN
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'email is required';
  END IF;

  IF EXISTS(SELECT 1 FROM public.profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'email % already exists', p_email;
  END IF;

  INSERT INTO public.organizations (name, cnpj, type)
  VALUES (p_name, p_cnpj, 'holding')
  RETURNING id INTO v_org_id;

  INSERT INTO public.profiles (id, organization_id, email, full_name, role)
  VALUES (gen_random_uuid(), v_org_id, p_email, p_name || ' Admin', 'holding_admin')
  RETURNING id INTO v_profile_id;

  holding_id := v_org_id;
  organization_id := v_org_id;
  profile_id := v_profile_id;
  RETURN NEXT;
END;
$function$;

-- ============================================================================
-- PARTE 6: TRIGGERS NAS TABELAS
-- ============================================================================

-- Trigger updated_at em book_answers
DROP TRIGGER IF EXISTS update_book_answers_updated_at ON public.book_answers;
CREATE TRIGGER update_book_answers_updated_at
  BEFORE UPDATE ON public.book_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_book_answers_updated_at();

-- Trigger updated_at em book_questions
DROP TRIGGER IF EXISTS update_questions_updated_at ON public.book_questions;
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.book_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_questions_updated_at();

-- Trigger updated_at em profiles
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger updated_at em organizations
DROP TRIGGER IF EXISTS handle_updated_at ON public.organizations;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- PRONTO! Todas as 26 funcoes + triggers criados.
-- Agora falta: RLS policies (proximo script)
-- ============================================================================
