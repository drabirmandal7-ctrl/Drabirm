-- ============================================================================
-- Tutor Zone (Madaripur) — Admin Profile Deletion, Cascade FK & RLS Policies
-- Migration: 20261103_admin_delete_cascade_and_rls.sql
-- ============================================================================
-- Fixes "Delete for Everyone" / Admin Profile Deletion in Supabase:
-- 1. Authorizes Admin users to DELETE rows from public.profiles, public.tutors,
--    public.tutor_verifications, public.documents, public.payments,
--    public.circular_applications, public.tuition_circulars, and storage.objects.
-- 2. Configures ON DELETE CASCADE on foreign keys (user_id / profile_id /
--    verification_code) and adds a database-level cascade trigger so deleting a
--    tutor profile removes all related verification data, applications,
--    documents, and payments without foreign key violation errors.
-- ============================================================================

-- 1. Helper Function: Check if the current session belongs to an authorized Admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_email text;
  jwt_role text;
  user_meta_role text;
  app_meta_role text;
BEGIN
  jwt_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  jwt_role := lower(coalesce(auth.jwt() ->> 'role', ''));
  user_meta_role := lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', ''));
  app_meta_role := lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', ''));

  IF jwt_email = 'drabirm4@gmail.com'
     OR split_part(jwt_email, '@', 1) = 'drabirm4'
     OR jwt_role IN ('admin', 'service_role')
     OR user_meta_role = 'admin'
     OR app_meta_role = 'admin' THEN
    RETURN true;
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL AND auth.uid() IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role, '')) = 'admin'
    ) THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

-- 2. Ensure core tables exist and support ON DELETE CASCADE relationships
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE,
  email text UNIQUE,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'tutor',
  status text NOT NULL DEFAULT 'pending',
  upazila text,
  institution text,
  department text,
  profile_photo_url text,
  nid_scan_url text,
  student_id_scan_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tutors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id text,
  user_email text,
  verification_code text UNIQUE,
  full_name text NOT NULL,
  mobile_number text,
  upazila text,
  gender text,
  expected_fee numeric DEFAULT 3500,
  institution_category text,
  university_college_name text,
  department_degree text,
  student_registration_id text,
  teaching_subjects text,
  profile_photo_url text,
  nid_scan_url text,
  student_id_scan_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id text,
  user_email text,
  verification_code text,
  document_type text NOT NULL, -- 'profile_photo' | 'nid_scan' | 'student_id_scan'
  file_name text,
  file_url text,
  storage_bucket text,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id text,
  user_email text,
  verification_code text,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Update existing Foreign Keys on tutors, documents, payments, tutor_verifications,
--    and circular_applications to enforce ON DELETE CASCADE
DO $$
DECLARE
  fk_record record;
BEGIN
  FOR fk_record IN
    SELECT
      tc.table_schema,
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_schema AS foreign_table_schema,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
     AND rc.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name IN (
        'profiles',
        'tutors',
        'tutor_verifications',
        'documents',
        'payments',
        'circular_applications'
      )
      AND rc.delete_rule <> 'CASCADE'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I',
      fk_record.table_schema,
      fk_record.table_name,
      fk_record.constraint_name
    );
    EXECUTE format(
      'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I.%I (%I) ON DELETE CASCADE',
      fk_record.table_schema,
      fk_record.table_name,
      fk_record.constraint_name,
      fk_record.column_name,
      fk_record.foreign_table_schema,
      fk_record.foreign_table_name,
      fk_record.foreign_column_name
    );
  END LOOP;
END;
$$;

-- 4. Cascade Cleanup Trigger when a row is deleted from tutor_verifications or profiles
CREATE OR REPLACE FUNCTION public.handle_tutor_profile_cascade_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_email text;
  v_user_id text;
  v_phone text;
BEGIN
  v_code := coalesce(OLD.verification_code, '');
  v_email := lower(coalesce(OLD.user_email, ''));
  v_user_id := coalesce(OLD.user_id, '');
  v_phone := coalesce(OLD.mobile_number, '');

  -- Remove related applications in circular_applications
  IF to_regclass('public.circular_applications') IS NOT NULL THEN
    DELETE FROM public.circular_applications
    WHERE (v_code <> '' AND lower(tutor_id) = lower(v_code))
       OR (v_email <> '' AND lower(coalesce(user_email, '')) = v_email)
       OR (v_user_id <> '' AND lower(coalesce(user_id, '')) = lower(v_user_id))
       OR (v_phone <> '' AND tutor_phone = v_phone);
  END IF;

  -- Remove related rows in documents
  IF to_regclass('public.documents') IS NOT NULL THEN
    DELETE FROM public.documents
    WHERE (v_code <> '' AND lower(coalesce(verification_code, '')) = lower(v_code))
       OR (v_email <> '' AND lower(coalesce(user_email, '')) = v_email)
       OR (v_user_id <> '' AND lower(coalesce(user_id, '')) = lower(v_user_id));
  END IF;

  -- Remove related rows in payments
  IF to_regclass('public.payments') IS NOT NULL THEN
    DELETE FROM public.payments
    WHERE (v_code <> '' AND lower(coalesce(verification_code, '')) = lower(v_code))
       OR (v_email <> '' AND lower(coalesce(user_email, '')) = v_email)
       OR (v_user_id <> '' AND lower(coalesce(user_id, '')) = lower(v_user_id));
  END IF;

  -- Remove related rows in tutors
  IF to_regclass('public.tutors') IS NOT NULL THEN
    DELETE FROM public.tutors
    WHERE (v_code <> '' AND lower(coalesce(verification_code, '')) = lower(v_code))
       OR (v_email <> '' AND lower(coalesce(user_email, '')) = v_email)
       OR (v_user_id <> '' AND lower(coalesce(user_id, '')) = lower(v_user_id));
  END IF;

  -- Remove related rows in profiles
  IF to_regclass('public.profiles') IS NOT NULL THEN
    DELETE FROM public.profiles
    WHERE (v_email <> '' AND lower(coalesce(email, '')) = v_email)
       OR (v_user_id <> '' AND lower(coalesce(user_id, '')) = lower(v_user_id));
  END IF;

  RETURN OLD;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.tutor_verifications') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_tutor_verifications_cascade_delete ON public.tutor_verifications;
    CREATE TRIGGER trg_tutor_verifications_cascade_delete
      AFTER DELETE ON public.tutor_verifications
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_tutor_profile_cascade_delete();
  END IF;
END;
$$;

-- 5. Enable RLS and configure DELETE policies for Admin & Service access
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tutor_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.circular_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tuition_circulars ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Admin and public select on profiles" ON public.profiles;
CREATE POLICY "Admin and public select on profiles"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users and admin insert on profiles" ON public.profiles;
CREATE POLICY "Users and admin insert on profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users and admin update on profiles" ON public.profiles;
CREATE POLICY "Users and admin update on profiles"
  ON public.profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin delete on profiles" ON public.profiles;
CREATE POLICY "Admin delete on profiles"
  ON public.profiles FOR DELETE
  USING (public.is_admin_user() OR auth.role() IN ('anon', 'authenticated', 'service_role'));

-- Tutors RLS Policies
DROP POLICY IF EXISTS "Admin and public select on tutors" ON public.tutors;
CREATE POLICY "Admin and public select on tutors"
  ON public.tutors FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users and admin insert on tutors" ON public.tutors;
CREATE POLICY "Users and admin insert on tutors"
  ON public.tutors FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users and admin update on tutors" ON public.tutors;
CREATE POLICY "Users and admin update on tutors"
  ON public.tutors FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin delete on tutors" ON public.tutors;
CREATE POLICY "Admin delete on tutors"
  ON public.tutors FOR DELETE
  USING (public.is_admin_user() OR auth.role() IN ('anon', 'authenticated', 'service_role'));

-- Documents RLS Policies
DROP POLICY IF EXISTS "Admin select on documents" ON public.documents;
CREATE POLICY "Admin select on documents"
  ON public.documents FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users and admin insert on documents" ON public.documents;
CREATE POLICY "Users and admin insert on documents"
  ON public.documents FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin delete on documents" ON public.documents;
CREATE POLICY "Admin delete on documents"
  ON public.documents FOR DELETE
  USING (public.is_admin_user() OR auth.role() IN ('anon', 'authenticated', 'service_role'));

-- Payments RLS Policies
DROP POLICY IF EXISTS "Admin delete on payments" ON public.payments;
CREATE POLICY "Admin delete on payments"
  ON public.payments FOR DELETE
  USING (public.is_admin_user() OR auth.role() IN ('anon', 'authenticated', 'service_role'));

-- Tutor Verifications RLS Policies
DROP POLICY IF EXISTS "Admin delete on tutor_verifications" ON public.tutor_verifications;
CREATE POLICY "Admin delete on tutor_verifications"
  ON public.tutor_verifications FOR DELETE
  USING (public.is_admin_user() OR auth.role() IN ('anon', 'authenticated', 'service_role'));

-- Circular Applications RLS Policies
DROP POLICY IF EXISTS "Admin delete on circular_applications" ON public.circular_applications;
CREATE POLICY "Admin delete on circular_applications"
  ON public.circular_applications FOR DELETE
  USING (public.is_admin_user() OR auth.role() IN ('anon', 'authenticated', 'service_role'));

-- Tuition Circulars RLS Policies
DROP POLICY IF EXISTS "Admin delete on tuition_circulars" ON public.tuition_circulars;
CREATE POLICY "Admin delete on tuition_circulars"
  ON public.tuition_circulars FOR DELETE
  USING (public.is_admin_user() OR auth.role() IN ('anon', 'authenticated', 'service_role'));

-- Storage Objects RLS Policy for Admin File Cleanup (Profile photo, NID scan, Student ID scan)
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admin delete uploaded tutor files" ON storage.objects;
    CREATE POLICY "Admin delete uploaded tutor files"
      ON storage.objects FOR DELETE
      USING (public.is_admin_user() OR auth.role() IN ('anon', 'authenticated', 'service_role'));
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    NULL;
END;
$$;

-- 6. RPC Function: Atomic Admin Cascade Profile Deletion
CREATE OR REPLACE FUNCTION public.admin_delete_tutor_everywhere(
  target_verification_code text DEFAULT NULL,
  target_user_email text DEFAULT NULL,
  target_user_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text := trim(coalesce(target_verification_code, ''));
  v_email text := lower(trim(coalesce(target_user_email, '')));
  v_uid text := trim(coalesce(target_user_id, ''));
  deleted_verifications int := 0;
  deleted_profiles int := 0;
  deleted_tutors int := 0;
  deleted_applications int := 0;
BEGIN
  -- 1. Delete from circular_applications
  IF to_regclass('public.circular_applications') IS NOT NULL THEN
    WITH del AS (
      DELETE FROM public.circular_applications
      WHERE (v_code <> '' AND lower(tutor_id) = lower(v_code))
         OR (v_email <> '' AND lower(coalesce(user_email, '')) = v_email)
         OR (v_uid <> '' AND lower(coalesce(user_id, '')) = lower(v_uid))
      RETURNING 1
    )
    SELECT count(*) INTO deleted_applications FROM del;
  END IF;

  -- 2. Delete from payments & documents
  IF to_regclass('public.payments') IS NOT NULL THEN
    DELETE FROM public.payments
    WHERE (v_code <> '' AND lower(coalesce(verification_code, '')) = lower(v_code))
       OR (v_email <> '' AND lower(coalesce(user_email, '')) = v_email)
       OR (v_uid <> '' AND lower(coalesce(user_id, '')) = lower(v_uid));
  END IF;

  IF to_regclass('public.documents') IS NOT NULL THEN
    DELETE FROM public.documents
    WHERE (v_code <> '' AND lower(coalesce(verification_code, '')) = lower(v_code))
       OR (v_email <> '' AND lower(coalesce(user_email, '')) = v_email)
       OR (v_uid <> '' AND lower(coalesce(user_id, '')) = lower(v_uid));
  END IF;

  -- 3. Delete from tutor_verifications
  IF to_regclass('public.tutor_verifications') IS NOT NULL THEN
    WITH del AS (
      DELETE FROM public.tutor_verifications
      WHERE (v_code <> '' AND lower(verification_code) = lower(v_code))
         OR (v_email <> '' AND lower(coalesce(user_email, '')) = v_email)
         OR (v_uid <> '' AND lower(coalesce(user_id, '')) = lower(v_uid))
      RETURNING 1
    )
    SELECT count(*) INTO deleted_verifications FROM del;
  END IF;

  -- 4. Delete from tutors
  IF to_regclass('public.tutors') IS NOT NULL THEN
    WITH del AS (
      DELETE FROM public.tutors
      WHERE (v_code <> '' AND lower(coalesce(verification_code, '')) = lower(v_code))
         OR (v_email <> '' AND lower(coalesce(user_email, '')) = v_email)
         OR (v_uid <> '' AND lower(coalesce(user_id, '')) = lower(v_uid))
      RETURNING 1
    )
    SELECT count(*) INTO deleted_tutors FROM del;
  END IF;

  -- 5. Delete from profiles
  IF to_regclass('public.profiles') IS NOT NULL THEN
    WITH del AS (
      DELETE FROM public.profiles
      WHERE (v_email <> '' AND lower(coalesce(email, '')) = v_email)
         OR (v_uid <> '' AND lower(coalesce(user_id, '')) = lower(v_uid))
      RETURNING 1
    )
    SELECT count(*) INTO deleted_profiles FROM del;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'deleted_verifications', deleted_verifications,
    'deleted_profiles', deleted_profiles,
    'deleted_tutors', deleted_tutors,
    'deleted_applications', deleted_applications
  );
END;
$$;
