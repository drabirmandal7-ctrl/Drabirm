import { SupabaseClient } from '@supabase/supabase-js';
import { VerificationRequest } from '../types/madaripur';
import {
  PROTECTED_ADMIN_DELETE_ERROR,
  extractSupabaseStorageTargets,
  isProtectedAdminProfile,
} from './tutorEngine';

export interface AdminDeleteProfileOptions {
  requestId: string;
  targetProfile?: VerificationRequest | null;
  affectedCircularIds?: string[];
}

export interface AdminDeleteProfileResult {
  ok: boolean;
  deletedCode: string;
  cleanedStorageBuckets: string[];
  errorMessage?: string;
}

function isMissingTableOrColumnError(err?: {
  message?: string;
  code?: string;
} | null): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = (err.code || '').toUpperCase();
  return (
    code === '42P01' ||
    code === '42703' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    msg.includes('could not find the table') ||
    msg.includes('relation') ||
    msg.includes('does not exist') ||
    msg.includes('schema cache')
  );
}

/**
 * Performs comprehensive Admin "Delete for Everyone" / Profile Deletion in Supabase:
 * 1. Cleans up associated uploaded files from Supabase Storage (Profile photo, NID scan, Student ID scan).
 * 2. Executes cascade deletion in dependency order across:
 *    - `public.payments`
 *    - `public.documents`
 *    - `public.circular_applications` (and resets any affected `public.tuition_circulars` back to 'Active')
 *    - `public.tutor_verifications`
 *    - `public.tutors`
 *    - `public.profiles`
 * 3. Verifies deletion and applies a tombstone fallback if RLS on any custom instance restricts hard DELETE.
 */
export async function executeAdminDeleteProfileEverywhere(
  supabase: SupabaseClient,
  options: AdminDeleteProfileOptions
): Promise<AdminDeleteProfileResult> {
  const rawCode = (options.requestId || '').trim();
  const cleanCode = rawCode.startsWith('tutor-ver-')
    ? rawCode.slice('tutor-ver-'.length)
    : rawCode;
  let profile = options.targetProfile || null;

  // Never allow the protected Admin account (drabirm4@gmail.com) to be deleted
  if (
    isProtectedAdminProfile(rawCode) ||
    isProtectedAdminProfile(cleanCode) ||
    isProtectedAdminProfile(profile)
  ) {
    return {
      ok: false,
      deletedCode: cleanCode,
      cleanedStorageBuckets: [],
      errorMessage: PROTECTED_ADMIN_DELETE_ERROR,
    };
  }

  // If targetProfile is missing email or scan URLs, look up the live row from Supabase first
  if (
    (!profile || (!profile.userEmail && !profile.email)) &&
    cleanCode &&
    typeof supabase.from === 'function'
  ) {
    try {
      const lookupRes = await supabase
        .from('tutor_verifications')
        .select('*')
        .eq('verification_code', cleanCode)
        .limit(1);
      if (
        !lookupRes.error &&
        Array.isArray(lookupRes.data) &&
        lookupRes.data.length > 0
      ) {
        const row = lookupRes.data[0] as Record<string, unknown>;
        profile = {
          ...(profile || ({ id: cleanCode } as VerificationRequest)),
          supabaseRowId:
            profile?.supabaseRowId ||
            (typeof row.id === 'string' ? row.id : undefined),
          userEmail:
            profile?.userEmail ||
            (typeof row.user_email === 'string' ? row.user_email : undefined) ||
            (typeof row.email === 'string' ? row.email : undefined),
          userId:
            profile?.userId ||
            (typeof row.user_id === 'string' ? row.user_id : undefined),
          phone:
            profile?.phone ||
            (typeof row.mobile_number === 'string' ? row.mobile_number : ''),
          profilePhotoDataUrl:
            profile?.profilePhotoDataUrl ||
            (typeof row.profile_photo_url === 'string'
              ? row.profile_photo_url
              : undefined),
          nidScanDataUrl:
            profile?.nidScanDataUrl ||
            (typeof row.nid_scan_url === 'string'
              ? row.nid_scan_url
              : undefined),
          uniScanDataUrl:
            profile?.uniScanDataUrl ||
            (typeof row.student_id_scan_url === 'string'
              ? row.student_id_scan_url
              : undefined),
        };
      }
    } catch {
      // Proceed with provided profile metadata
    }
  }

  if (isProtectedAdminProfile(profile)) {
    return {
      ok: false,
      deletedCode: cleanCode,
      cleanedStorageBuckets: [],
      errorMessage: PROTECTED_ADMIN_DELETE_ERROR,
    };
  }

  const cleanEmail = (profile?.userEmail || profile?.email || '')
    .trim()
    .toLowerCase();
  const emailPrefix = cleanEmail ? cleanEmail.split('@')[0] : '';
  const cleanUserId = (
    profile?.userId ||
    profile?.supabaseRowId ||
    emailPrefix ||
    cleanCode
  ).trim();
  const cleanRowId = (profile?.supabaseRowId || '').trim();
  const cleanPhone = (profile?.phone || '').trim();
  const affectedCircularIds = options.affectedCircularIds || [];

  if (
    isProtectedAdminProfile(cleanEmail) ||
    isProtectedAdminProfile(cleanUserId)
  ) {
    return {
      ok: false,
      deletedCode: cleanCode,
      cleanedStorageBuckets: [],
      errorMessage: PROTECTED_ADMIN_DELETE_ERROR,
    };
  }

  const cleanedStorageBuckets: string[] = [];

  // 1. Clean up uploaded files from Supabase Storage (Profile Photo, Smart NID Scan, Student ID Scan)
  const storageTargets = extractSupabaseStorageTargets(
    profile || { id: cleanCode, userId: cleanUserId }
  );

  await Promise.all(
    Object.entries(storageTargets).map(async ([bucket, paths]) => {
      if (!paths || paths.length === 0) return;
      try {
        const bucketApi = supabase.storage.from(bucket);
        if (cleanCode && typeof bucketApi.list === 'function') {
          try {
            const { data: listed } = await bucketApi.list(
              `verifications/${cleanCode}`
            );
            if (Array.isArray(listed)) {
              for (const item of listed) {
                if (item?.name) {
                  paths.push(`verifications/${cleanCode}/${item.name}`);
                }
              }
            }
          } catch {
            // Optional list check
          }
        }
        const uniquePaths = Array.from(new Set(paths));
        const { error } = await bucketApi.remove(uniquePaths);
        if (!error) {
          cleanedStorageBuckets.push(bucket);
        }
      } catch {
        // Ignore storage bucket missing/permission warnings so DB deletion always proceeds
      }
    })
  );

  // 2. Call `delete_user_everywhere` RPC to delete the user from both `public` tables and `auth.users`
  if (cleanEmail && typeof supabase.rpc === 'function') {
    try {
      await supabase.rpc('delete_user_everywhere', {
        target_email: cleanEmail,
      });
    } catch {
      // Continue to explicit table cascade delete queries below
    }
  }

  // Also invoke `admin_delete_tutor_everywhere` if installed
  if (typeof supabase.rpc === 'function') {
    try {
      await supabase.rpc('admin_delete_tutor_everywhere', {
        target_verification_code: cleanCode || null,
        target_user_email: cleanEmail || null,
        target_user_id: cleanUserId || null,
      });
    } catch {
      // RPC is optional; direct cascade queries below handle all tables
    }
  }

  // 3. Cascade Delete Step A: Dependent rows in `payments` and `documents` (if tables exist)
  const dependentTables = ['payments', 'documents'] as const;
  for (const table of dependentTables) {
    try {
      if (cleanCode) {
        const res = await supabase
          .from(table)
          .delete()
          .eq('verification_code', cleanCode);
        if (res.error && isMissingTableOrColumnError(res.error)) {
          continue;
        }
      }
      if (cleanEmail) {
        await supabase.from(table).delete().eq('user_email', cleanEmail);
      }
      if (cleanUserId) {
        await supabase.from(table).delete().eq('user_id', cleanUserId);
      }
    } catch {
      // Ignore optional table errors
    }
  }

  // 4. Cascade Delete Step B: Related rows in `circular_applications` & reset affected `tuition_circulars`
  try {
    const appDeletePromises: PromiseLike<unknown>[] = [];
    if (cleanCode) {
      appDeletePromises.push(
        supabase
          .from('circular_applications')
          .delete()
          .eq('tutor_id', cleanCode),
        supabase
          .from('circular_applications')
          .delete()
          .eq('tutor_id', `tutor-ver-${cleanCode}`)
      );
    }
    if (cleanEmail) {
      appDeletePromises.push(
        supabase
          .from('circular_applications')
          .delete()
          .eq('user_email', cleanEmail)
      );
    }
    if (cleanUserId) {
      appDeletePromises.push(
        supabase
          .from('circular_applications')
          .delete()
          .eq('user_id', cleanUserId)
      );
    }
    if (emailPrefix && emailPrefix !== cleanUserId) {
      appDeletePromises.push(
        supabase
          .from('circular_applications')
          .delete()
          .eq('user_id', emailPrefix)
      );
    }
    if (cleanPhone) {
      appDeletePromises.push(
        supabase
          .from('circular_applications')
          .delete()
          .eq('tutor_phone', cleanPhone)
      );
    }
    await Promise.all(appDeletePromises);

    if (affectedCircularIds.length > 0) {
      await Promise.all(
        affectedCircularIds.map(async (circularId) => {
          const byId = await supabase
            .from('tuition_circulars')
            .update({ status: 'Active' })
            .eq('id', circularId);
          if (byId?.error) {
            await supabase
              .from('tuition_circulars')
              .update({ status: 'Active' })
              .eq('circular_id', circularId);
          }
        })
      );
    }
  } catch {
    // Continue to main profile deletion
  }

  // 5. Cascade Delete Step C: Primary verification records in `tutor_verifications`
  let primaryDeleteError: string | undefined;
  try {
    if (cleanRowId) {
      const byRowId = await supabase
        .from('tutor_verifications')
        .delete()
        .eq('id', cleanRowId);
      if (byRowId.error && !isMissingTableOrColumnError(byRowId.error)) {
        primaryDeleteError = byRowId.error.message;
      }
    }

    if (cleanCode) {
      const byCode = await supabase
        .from('tutor_verifications')
        .delete()
        .eq('verification_code', cleanCode);
      if (byCode.error && !isMissingTableOrColumnError(byCode.error)) {
        primaryDeleteError = byCode.error.message;
      }
    }

    if (cleanEmail) {
      await supabase
        .from('tutor_verifications')
        .delete()
        .eq('user_email', cleanEmail);
    }

    if (cleanUserId) {
      await supabase
        .from('tutor_verifications')
        .delete()
        .eq('user_id', cleanUserId);
    }

    // Check if any row still exists (e.g. if an external RLS policy blocked hard DELETE)
    if (cleanCode) {
      const verifyCheck = await supabase
        .from('tutor_verifications')
        .select('id,verification_code')
        .eq('verification_code', cleanCode)
        .limit(1);

      if (
        !verifyCheck.error &&
        Array.isArray(verifyCheck.data) &&
        verifyCheck.data.length > 0
      ) {
        // Apply tombstone fallback so the profile is permanently archived and wiped
        await supabase
          .from('tutor_verifications')
          .update({
            verification_code: `DELETED-${cleanCode}-${Date.now()}`,
            user_email: null,
            user_id: null,
            profile_photo_url: null,
            nid_scan_url: null,
            student_id_scan_url: null,
            status: 'Archived',
            hidden_from_admin: true,
          })
          .eq('verification_code', cleanCode);
      }
    }
  } catch (err) {
    primaryDeleteError =
      err instanceof Error ? err.message : 'Failed to delete tutor verification';
  }

  // 6. Cascade Delete Step D: Target both `public.profiles` and `public.tutors` tables (`supabase.from('profiles').delete().eq('id', userId)`)
  try {
    if (cleanUserId) {
      await supabase.from('profiles').delete().eq('id', cleanUserId);
      await supabase.from('profiles').delete().eq('user_id', cleanUserId);
    }
    if (cleanRowId && cleanRowId !== cleanUserId) {
      await supabase.from('profiles').delete().eq('id', cleanRowId);
    }
    if (cleanEmail) {
      await supabase.from('profiles').delete().eq('email', cleanEmail);
      await supabase.from('profiles').delete().eq('user_email', cleanEmail);
    }
    if (cleanCode) {
      await supabase
        .from('profiles')
        .delete()
        .eq('verification_code', cleanCode);
    }
  } catch {
    // Ignore if `public.profiles` is not provisioned in schema cache
  }

  try {
    if (cleanUserId) {
      await supabase.from('tutors').delete().eq('id', cleanUserId);
      await supabase.from('tutors').delete().eq('user_id', cleanUserId);
    }
    if (cleanCode) {
      await supabase
        .from('tutors')
        .delete()
        .eq('verification_code', cleanCode);
    }
    if (cleanEmail) {
      await supabase.from('tutors').delete().eq('user_email', cleanEmail);
      await supabase.from('tutors').delete().eq('email', cleanEmail);
    }
  } catch {
    // Ignore if `public.tutors` is not provisioned in schema cache
  }

  if (primaryDeleteError) {
    return {
      ok: false,
      deletedCode: cleanCode,
      cleanedStorageBuckets,
      errorMessage: primaryDeleteError,
    };
  }

  return {
    ok: true,
    deletedCode: cleanCode,
    cleanedStorageBuckets,
  };
}
