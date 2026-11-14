-- ============================================================================
-- Tutor Zone (Madaripur) — Profile Upload Schema, Optional Null Handling & Storage Sync
-- Migration: 20261103_profile_upload_and_storage_sync.sql
-- ============================================================================
-- Fixes user profile information upload and document syncing with Supabase:
-- 1. Ensures public.tutor_verifications, public.profiles, and public.tutors
--    contain all form fields (full_name, phone, email, upazila, institution,
--    medium, experience, verification details, and document URLs) and relaxes
--    non-critical NOT NULL constraints so blank optional fields never fail.
-- 2. Configures Supabase Storage buckets ('tutor-documents' and 'profiles')
--    and RLS policies so Profile Photos, Smart NID scans, and Student ID card
--    scans upload cleanly and return public URLs.
-- 3. Adds a trigger to keep public.profiles and public.tutors automatically
--    synchronized whenever a tutor uploads or updates their profile.
-- ============================================================================

-- 1. Ensure all columns exist on public.tutor_verifications and allow NULL/empty on optional fields
ALTER TABLE IF EXISTS public.tutor_verifications
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS user_id text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS institution text,
  ADD COLUMN IF NOT EXISTS medium text DEFAULT 'Bangla Medium',
  ADD COLUMN IF NOT EXISTS experience text DEFAULT '2+ Years Experience',
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS profile_photo_name text,
  ADD COLUMN IF NOT EXISTS nid_scan_url text,
  ADD COLUMN IF NOT EXISTS nid_file_name text,
  ADD COLUMN IF NOT EXISTS student_id_scan_url text,
  ADD COLUMN IF NOT EXISTS student_id_file_name text,
  ADD COLUMN IF NOT EXISTS admin_audit_note text,
  ADD COLUMN IF NOT EXISTS hidden_from_admin boolean DEFAULT false;

DO $$
BEGIN
  IF to_regclass('public.tutor_verifications') IS NOT NULL THEN
    ALTER TABLE public.tutor_verifications ALTER COLUMN smart_nid_number SET DEFAULT '';
    ALTER TABLE public.tutor_verifications ALTER COLUMN smart_nid_number DROP NOT NULL;
    ALTER TABLE public.tutor_verifications ALTER COLUMN university_college_name DROP NOT NULL;
    ALTER TABLE public.tutor_verifications ALTER COLUMN department_degree DROP NOT NULL;
    ALTER TABLE public.tutor_verifications ALTER COLUMN student_registration_id DROP NOT NULL;
    ALTER TABLE public.tutor_verifications ALTER COLUMN teaching_subjects DROP NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    NULL;
END;
$$;

-- 2. Ensure public.profiles and public.tutors match all form fields with nullable optional fields
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_code text UNIQUE,
  user_id text,
  email text,
  user_email text,
  full_name text NOT NULL,
  phone text,
  mobile_number text,
  upazila text DEFAULT 'Madaripur Sadar',
  gender text DEFAULT 'Male',
  institution text,
  institution_category text DEFAULT 'Govt. Nazimuddin College',
  university_college_name text,
  department text,
  department_degree text,
  medium text DEFAULT 'Bangla Medium',
  experience text DEFAULT '2+ Years Experience',
  expected_fee numeric DEFAULT 3500,
  teaching_subjects text,
  smart_nid_number text DEFAULT '',
  student_registration_id text DEFAULT '',
  profile_photo_url text,
  profile_photo_name text,
  nid_scan_url text,
  nid_file_name text,
  student_id_scan_url text,
  student_id_file_name text,
  role text NOT NULL DEFAULT 'tutor',
  status text NOT NULL DEFAULT 'Pending',
  verification_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS verification_code text,
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS mobile_number text,
  ADD COLUMN IF NOT EXISTS gender text DEFAULT 'Male',
  ADD COLUMN IF NOT EXISTS institution_category text DEFAULT 'Govt. Nazimuddin College',
  ADD COLUMN IF NOT EXISTS university_college_name text,
  ADD COLUMN IF NOT EXISTS department_degree text,
  ADD COLUMN IF NOT EXISTS medium text DEFAULT 'Bangla Medium',
  ADD COLUMN IF NOT EXISTS experience text DEFAULT '2+ Years Experience',
  ADD COLUMN IF NOT EXISTS expected_fee numeric DEFAULT 3500,
  ADD COLUMN IF NOT EXISTS teaching_subjects text,
  ADD COLUMN IF NOT EXISTS smart_nid_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS student_registration_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS profile_photo_name text,
  ADD COLUMN IF NOT EXISTS nid_file_name text,
  ADD COLUMN IF NOT EXISTS student_id_file_name text,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS public.tutors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  verification_code text UNIQUE,
  user_id text,
  email text,
  user_email text,
  full_name text NOT NULL,
  phone text,
  mobile_number text,
  upazila text DEFAULT 'Madaripur Sadar',
  gender text DEFAULT 'Male',
  institution text,
  institution_category text DEFAULT 'Govt. Nazimuddin College',
  university_college_name text,
  department text,
  department_degree text,
  medium text DEFAULT 'Bangla Medium',
  experience text DEFAULT '2+ Years Experience',
  expected_fee numeric DEFAULT 3500,
  teaching_subjects text,
  smart_nid_number text DEFAULT '',
  student_registration_id text DEFAULT '',
  profile_photo_url text,
  profile_photo_name text,
  nid_scan_url text,
  nid_file_name text,
  student_id_scan_url text,
  student_id_file_name text,
  status text NOT NULL DEFAULT 'Pending',
  verification_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS public.tutors
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS institution text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS medium text DEFAULT 'Bangla Medium',
  ADD COLUMN IF NOT EXISTS experience text DEFAULT '2+ Years Experience',
  ADD COLUMN IF NOT EXISTS smart_nid_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS profile_photo_name text,
  ADD COLUMN IF NOT EXISTS nid_file_name text,
  ADD COLUMN IF NOT EXISTS student_id_file_name text,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Automatic Trigger: Sync tutor_verifications inserts/updates into public.profiles & public.tutors
CREATE OR REPLACE FUNCTION public.sync_tutor_verification_to_profiles_and_tutors()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    INSERT INTO public.profiles (
      verification_code,
      user_id,
      email,
      user_email,
      full_name,
      phone,
      mobile_number,
      upazila,
      gender,
      institution,
      institution_category,
      university_college_name,
      department,
      department_degree,
      medium,
      experience,
      expected_fee,
      teaching_subjects,
      smart_nid_number,
      student_registration_id,
      profile_photo_url,
      profile_photo_name,
      nid_scan_url,
      nid_file_name,
      student_id_scan_url,
      student_id_file_name,
      status,
      verification_status,
      updated_at
    ) VALUES (
      NEW.verification_code,
      NEW.user_id,
      coalesce(NEW.user_email, NEW.email),
      coalesce(NEW.user_email, NEW.email),
      coalesce(NEW.full_name, 'Verified Tutor'),
      coalesce(NEW.mobile_number, NEW.phone, ''),
      coalesce(NEW.mobile_number, NEW.phone, ''),
      coalesce(NEW.upazila, 'Madaripur Sadar'),
      coalesce(NEW.gender, 'Male'),
      coalesce(NEW.university_college_name, NEW.institution, NEW.institution_category, 'Govt. Nazimuddin College'),
      coalesce(NEW.institution_category, 'Govt. Nazimuddin College'),
      coalesce(NEW.university_college_name, NEW.institution, 'Govt. Nazimuddin College'),
      coalesce(NEW.department_degree, 'Honours / General'),
      coalesce(NEW.department_degree, 'Honours / General'),
      coalesce(NEW.medium, 'Bangla Medium'),
      coalesce(NEW.experience, '2+ Years Experience'),
      coalesce(NEW.expected_fee, 3500),
      coalesce(NEW.teaching_subjects, 'General Science & Math'),
      coalesce(NEW.smart_nid_number, ''),
      coalesce(NEW.student_registration_id, ''),
      NEW.profile_photo_url,
      NEW.profile_photo_name,
      NEW.nid_scan_url,
      NEW.nid_file_name,
      NEW.student_id_scan_url,
      NEW.student_id_file_name,
      coalesce(NEW.status, 'Pending'),
      lower(coalesce(NEW.status, 'pending')),
      now()
    )
    ON CONFLICT (verification_code) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      email = EXCLUDED.email,
      user_email = EXCLUDED.user_email,
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      mobile_number = EXCLUDED.mobile_number,
      upazila = EXCLUDED.upazila,
      gender = EXCLUDED.gender,
      institution = EXCLUDED.institution,
      institution_category = EXCLUDED.institution_category,
      university_college_name = EXCLUDED.university_college_name,
      department = EXCLUDED.department,
      department_degree = EXCLUDED.department_degree,
      medium = EXCLUDED.medium,
      experience = EXCLUDED.experience,
      expected_fee = EXCLUDED.expected_fee,
      teaching_subjects = EXCLUDED.teaching_subjects,
      smart_nid_number = EXCLUDED.smart_nid_number,
      student_registration_id = EXCLUDED.student_registration_id,
      profile_photo_url = EXCLUDED.profile_photo_url,
      profile_photo_name = EXCLUDED.profile_photo_name,
      nid_scan_url = EXCLUDED.nid_scan_url,
      nid_file_name = EXCLUDED.nid_file_name,
      student_id_scan_url = EXCLUDED.student_id_scan_url,
      student_id_file_name = EXCLUDED.student_id_file_name,
      status = EXCLUDED.status,
      verification_status = EXCLUDED.verification_status,
      updated_at = now();
  END IF;

  IF to_regclass('public.tutors') IS NOT NULL THEN
    INSERT INTO public.tutors (
      verification_code,
      user_id,
      email,
      user_email,
      full_name,
      phone,
      mobile_number,
      upazila,
      gender,
      institution,
      institution_category,
      university_college_name,
      department,
      department_degree,
      medium,
      experience,
      expected_fee,
      teaching_subjects,
      smart_nid_number,
      student_registration_id,
      profile_photo_url,
      profile_photo_name,
      nid_scan_url,
      nid_file_name,
      student_id_scan_url,
      student_id_file_name,
      status,
      verification_status,
      updated_at
    ) VALUES (
      NEW.verification_code,
      NEW.user_id,
      coalesce(NEW.user_email, NEW.email),
      coalesce(NEW.user_email, NEW.email),
      coalesce(NEW.full_name, 'Verified Tutor'),
      coalesce(NEW.mobile_number, NEW.phone, ''),
      coalesce(NEW.mobile_number, NEW.phone, ''),
      coalesce(NEW.upazila, 'Madaripur Sadar'),
      coalesce(NEW.gender, 'Male'),
      coalesce(NEW.university_college_name, NEW.institution, NEW.institution_category, 'Govt. Nazimuddin College'),
      coalesce(NEW.institution_category, 'Govt. Nazimuddin College'),
      coalesce(NEW.university_college_name, NEW.institution, 'Govt. Nazimuddin College'),
      coalesce(NEW.department_degree, 'Honours / General'),
      coalesce(NEW.department_degree, 'Honours / General'),
      coalesce(NEW.medium, 'Bangla Medium'),
      coalesce(NEW.experience, '2+ Years Experience'),
      coalesce(NEW.expected_fee, 3500),
      coalesce(NEW.teaching_subjects, 'General Science & Math'),
      coalesce(NEW.smart_nid_number, ''),
      coalesce(NEW.student_registration_id, ''),
      NEW.profile_photo_url,
      NEW.profile_photo_name,
      NEW.nid_scan_url,
      NEW.nid_file_name,
      NEW.student_id_scan_url,
      NEW.student_id_file_name,
      coalesce(NEW.status, 'Pending'),
      lower(coalesce(NEW.status, 'pending')),
      now()
    )
    ON CONFLICT (verification_code) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      email = EXCLUDED.email,
      user_email = EXCLUDED.user_email,
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      mobile_number = EXCLUDED.mobile_number,
      upazila = EXCLUDED.upazila,
      gender = EXCLUDED.gender,
      institution = EXCLUDED.institution,
      institution_category = EXCLUDED.institution_category,
      university_college_name = EXCLUDED.university_college_name,
      department = EXCLUDED.department,
      department_degree = EXCLUDED.department_degree,
      medium = EXCLUDED.medium,
      experience = EXCLUDED.experience,
      expected_fee = EXCLUDED.expected_fee,
      teaching_subjects = EXCLUDED.teaching_subjects,
      smart_nid_number = EXCLUDED.smart_nid_number,
      student_registration_id = EXCLUDED.student_registration_id,
      profile_photo_url = EXCLUDED.profile_photo_url,
      profile_photo_name = EXCLUDED.profile_photo_name,
      nid_scan_url = EXCLUDED.nid_scan_url,
      nid_file_name = EXCLUDED.nid_file_name,
      student_id_scan_url = EXCLUDED.student_id_scan_url,
      student_id_file_name = EXCLUDED.student_id_file_name,
      status = EXCLUDED.status,
      verification_status = EXCLUDED.verification_status,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.tutor_verifications') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_sync_tutor_verifications_to_profiles ON public.tutor_verifications;
    CREATE TRIGGER trg_sync_tutor_verifications_to_profiles
      AFTER INSERT OR UPDATE ON public.tutor_verifications
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_tutor_verification_to_profiles_and_tutors();
  END IF;
END;
$$;

-- 4. Provision Supabase Storage Buckets ('tutor-documents' & 'profiles') and RLS Policies
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('tutor-documents', 'tutor-documents', true)
    ON CONFLICT (id) DO UPDATE SET public = true;

    INSERT INTO storage.buckets (id, name, public)
    VALUES ('profiles', 'profiles', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
  END IF;

  IF to_regclass('storage.objects') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Public read access on tutor-documents and profiles" ON storage.objects;
    CREATE POLICY "Public read access on tutor-documents and profiles"
      ON storage.objects FOR SELECT
      USING (bucket_id IN ('tutor-documents', 'profiles', 'avatars', 'documents'));

    DROP POLICY IF EXISTS "Allow tutor file uploads to tutor-documents and profiles" ON storage.objects;
    CREATE POLICY "Allow tutor file uploads to tutor-documents and profiles"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id IN ('tutor-documents', 'profiles', 'avatars', 'documents'));

    DROP POLICY IF EXISTS "Allow tutor file updates on tutor-documents and profiles" ON storage.objects;
    CREATE POLICY "Allow tutor file updates on tutor-documents and profiles"
      ON storage.objects FOR UPDATE
      USING (bucket_id IN ('tutor-documents', 'profiles', 'avatars', 'documents'))
      WITH CHECK (bucket_id IN ('tutor-documents', 'profiles', 'avatars', 'documents'));
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    NULL;
END;
$$;
