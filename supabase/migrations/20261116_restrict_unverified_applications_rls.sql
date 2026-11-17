-- ============================================================================
-- STRICT RLS POLICY: RESTRICT UNVERIFIED USERS FROM APPLYING TO TUITION CIRCULARS
-- Allows INSERT on `public.applications` and `public.circular_applications`
-- ONLY when the authenticated user's profile in `public.tutors` or
-- `public.tutor_verifications` is verified (`is_verified = true` or `status IN ('verified', 'Approved')`).
-- ============================================================================

-- 1. Enable Row Level Security on applications tables
ALTER TABLE IF EXISTS public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.circular_applications ENABLE ROW LEVEL SECURITY;

-- 2. Security-definer helper function to check if the current authenticated user is a verified tutor
CREATE OR REPLACE FUNCTION public.is_authenticated_tutor_verified()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tutors t
    WHERE (
      t.id::text = auth.uid()::text
      OR lower(coalesce(t.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    AND (
      lower(coalesce(t.status, '')) IN ('verified', 'approved')
    )
  )
  OR EXISTS (
    SELECT 1
    FROM public.tutor_verifications tv
    WHERE (
      coalesce(tv.user_id, '') = auth.uid()::text
      OR lower(coalesce(tv.user_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    AND (
      lower(coalesce(tv.status, '')) IN ('verified', 'approved')
    )
  );
$$;

-- 3. RLS INSERT Policy for `public.applications`
DROP POLICY IF EXISTS "Allow insert only for verified tutors" ON public.applications;

CREATE POLICY "Allow insert only for verified tutors"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_authenticated_tutor_verified()
);

-- 4. RLS INSERT Policy for `public.circular_applications`
DROP POLICY IF EXISTS "Allow insert only for verified tutors on circular_applications" ON public.circular_applications;

CREATE POLICY "Allow insert only for verified tutors on circular_applications"
ON public.circular_applications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_authenticated_tutor_verified()
);
