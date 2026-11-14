import { SupabaseClient } from '@supabase/supabase-js';
import {
  TutorVerificationRow,
  VerificationRequest,
} from '../types/madaripur';
import {
  SupabaseSessionUserInput,
  buildInitialGoogleTutorProfile,
  buildSupabaseStorageObjectPath,
  isActiveVerificationRequest,
  isTutorProfileSubmitted,
  mapSupabaseRowToVerificationRequest,
  mapVerificationRequestToProfilesTableRow,
  mapVerificationRequestToSupabaseRow,
  sanitizeStorageFileName,
} from './tutorEngine';

export interface TutorUploadFileBundle {
  profilePhotoFile?: File | null;
  nidScanFile?: File | null;
  uniScanFile?: File | null;
}

export interface StorageUploadOutcome {
  url: string | null;
  fileName: string | null;
  bucket: string | null;
  storagePath: string | null;
}

export interface SyncTutorProfileResult {
  ok: boolean;
  savedRequest: VerificationRequest;
  uploadedBuckets: string[];
  errorMessage?: string;
}

const PREFERRED_STORAGE_BUCKETS = [
  'tutor-documents',
  'profiles',
  'avatars',
  'documents',
] as const;

/**
 * Converts a base64 Data URL (`data:image/jpeg;base64,...`) into a binary Blob
 * for uploading to a Supabase Storage bucket.
 */
export function dataUrlToBlob(
  dataUrl?: string | null
): { blob: Blob; mimeType: string } | null {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return null;
  }
  try {
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return null;
    const header = dataUrl.slice(0, commaIdx);
    const base64 = dataUrl.slice(commaIdx + 1);
    const mimeMatch = header.match(/data:([^;]+);base64/i);
    const mimeType = mimeMatch?.[1] || 'image/jpeg';

    const binaryStr =
      typeof atob === 'function'
        ? atob(base64)
        : Buffer.from(base64, 'base64').toString('binary');
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return {
      blob: new Blob([bytes], { type: mimeType }),
      mimeType,
    };
  } catch {
    return null;
  }
}

export const DEFAULT_IMAGE_MAX_DIMENSION = 600;
export const DEFAULT_IMAGE_COMPRESSION_QUALITY = 0.55;

/**
 * Calculates target dimensions for an image so its maximum width or height
 * does not exceed `maxDimension` (default 600px) while preserving aspect ratio.
 */
export function calculateCompressedDimensions(
  width: number,
  height: number,
  maxDimension = DEFAULT_IMAGE_MAX_DIMENSION
): { width: number; height: number } {
  if (!width || !height || width <= 0 || height <= 0) {
    return { width: 0, height: 0 };
  }
  if (width <= maxDimension && height <= maxDimension) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  if (width >= height) {
    return {
      width: maxDimension,
      height: Math.max(1, Math.round((height * maxDimension) / width)),
    };
  }
  return {
    width: Math.max(1, Math.round((width * maxDimension) / height)),
    height: maxDimension,
  };
}

/**
 * Lightweight client-side HTML5 Canvas image compression utility (`compressImageFile`).
 * Automatically resizes large camera photos to a maximum width/height of `600px`
 * (preserving aspect ratio) and compresses to `image/webp` or `image/jpeg` at `0.55` quality
 * (~25KB–45KB max) before saving to Supabase so database payload size drops by ~90%.
 */
export async function compressImageFile(
  file: File,
  maxDimension = DEFAULT_IMAGE_MAX_DIMENSION,
  quality = DEFAULT_IMAGE_COMPRESSION_QUALITY
): Promise<{ file: File; dataUrl: string }> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    try {
      if (typeof FileReader !== 'undefined') {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read selected file.'));
          }
        };
        reader.onerror = () => {
          reject(new Error('Could not read the selected file from device.'));
        };
        reader.readAsDataURL(file);
      } else if (typeof file.arrayBuffer === 'function') {
        file
          .arrayBuffer()
          .then((buf) => {
            const base64 = Buffer.from(buf).toString('base64');
            const mime = file.type || 'image/jpeg';
            resolve(`data:${mime};base64,${base64}`);
          })
          .catch(reject);
      } else {
        reject(new Error('File reading not supported in this environment.'));
      }
    } catch (err) {
      reject(err instanceof Error ? err : new Error('FileReader error'));
    }
  });

  // Skip canvas compression for non-images (e.g. PDFs) or non-DOM test environments
  const isCompressibleImage =
    /^image\/(jpeg|jpg|png|webp|heic|bmp)$/i.test(file.type) ||
    /\.(jpe?g|png|webp|heic|bmp)$/i.test(file.name);

  if (
    !isCompressibleImage ||
    typeof document === 'undefined' ||
    typeof Image === 'undefined'
  ) {
    return { file, dataUrl: rawDataUrl };
  }

  return new Promise<{ file: File; dataUrl: string }>((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const origWidth = img.naturalWidth || img.width;
          const origHeight = img.naturalHeight || img.height;
          if (!origWidth || !origHeight) {
            resolve({ file, dataUrl: rawDataUrl });
            return;
          }

          const { width, height } = calculateCompressedDimensions(
            origWidth,
            origHeight,
            maxDimension
          );

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ file, dataUrl: rawDataUrl });
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Try WebP first for maximum compression (~25KB–45KB), fallback to JPEG if unsupported
          const webpCandidate = canvas.toDataURL('image/webp', quality);
          const jpegCandidate = canvas.toDataURL('image/jpeg', quality);
          const useWebp =
            webpCandidate &&
            webpCandidate.startsWith('data:image/webp') &&
            webpCandidate.length <= jpegCandidate.length;
          const targetMime = useWebp ? 'image/webp' : 'image/jpeg';
          const compressedDataUrl = useWebp ? webpCandidate : jpegCandidate;

          const wasResized = width < origWidth || height < origHeight;
          const finalDataUrl =
            compressedDataUrl &&
            (compressedDataUrl.length < rawDataUrl.length || wasResized)
              ? compressedDataUrl
              : rawDataUrl;

          if (finalDataUrl === rawDataUrl) {
            resolve({ file, dataUrl: rawDataUrl });
            return;
          }

          const converted = dataUrlToBlob(finalDataUrl);
          if (!converted || typeof File === 'undefined') {
            resolve({ file, dataUrl: finalDataUrl });
            return;
          }

          const ext = targetMime === 'image/webp' ? '.webp' : '.jpg';
          const baseName = file.name
            ? file.name.replace(/\.[^/.]+$/, '')
            : 'document';
          const compressedFile = new File(
            [converted.blob],
            `${baseName}${ext}`,
            {
              type: targetMime,
              lastModified: Date.now(),
            }
          );

          resolve({
            file:
              compressedFile.size <= file.size || wasResized
                ? compressedFile
                : file,
            dataUrl: finalDataUrl,
          });
        } catch {
          resolve({ file, dataUrl: rawDataUrl });
        }
      };
      img.onerror = () => resolve({ file, dataUrl: rawDataUrl });
      img.src = rawDataUrl;
    } catch {
      resolve({ file, dataUrl: rawDataUrl });
    }
  });
}

/**
 * Reads a File into a Data URL and compresses image files (JPEG/PNG/WebP) via HTML5 Canvas
 * at max 600px width and 0.55 quality (~25KB–45KB) so uploads fit cleanly within Supabase limits.
 */
export async function readFileAsOptimizedDataUrl(
  file: File,
  maxDimension = DEFAULT_IMAGE_MAX_DIMENSION,
  quality = DEFAULT_IMAGE_COMPRESSION_QUALITY
): Promise<string> {
  const { dataUrl } = await compressImageFile(file, maxDimension, quality);
  return dataUrl;
}

/**
 * Uploads a single tutor document (Profile Photo, Smart NID Scan, or Student ID Card Scan)
 * to Supabase Storage and returns its public URL. If no Storage bucket is provisioned on the
 * remote instance or RLS restricts anonymous storage writes, gracefully falls back to the
 * inline Data URL so the profile row still saves the document cleanly.
 */
export async function uploadDocumentToSupabaseStorage(
  supabase: SupabaseClient,
  options: {
    verificationCode: string;
    docType: 'profile_photo' | 'nid_scan' | 'student_id_scan';
    file?: File | null;
    dataUrl?: string | null;
    fileName?: string | null;
    availableBuckets?: string[];
  }
): Promise<StorageUploadOutcome> {
  const fallbackUrl = options.dataUrl ? options.dataUrl.trim() : null;
  const fallbackName = options.fileName
    ? sanitizeStorageFileName(options.fileName)
    : options.file?.name
    ? sanitizeStorageFileName(options.file.name)
    : null;

  // If already an external HTTP(S) Supabase Storage URL and no new file was picked, keep it as-is
  if (
    !options.file &&
    fallbackUrl &&
    (fallbackUrl.startsWith('http://') || fallbackUrl.startsWith('https://'))
  ) {
    return {
      url: fallbackUrl,
      fileName: fallbackName,
      bucket: null,
      storagePath: null,
    };
  }

  let uploadBody: File | Blob | null = options.file || null;
  let contentType = options.file?.type || 'image/jpeg';

  if (!uploadBody && fallbackUrl && fallbackUrl.startsWith('data:')) {
    const converted = dataUrlToBlob(fallbackUrl);
    if (converted) {
      uploadBody = converted.blob;
      contentType = converted.mimeType;
    }
  }

  if (!uploadBody) {
    return {
      url: fallbackUrl,
      fileName: fallbackName,
      bucket: null,
      storagePath: null,
    };
  }

  const candidateBuckets =
    options.availableBuckets !== undefined
      ? options.availableBuckets
      : [...PREFERRED_STORAGE_BUCKETS];

  if (candidateBuckets.length === 0) {
    return {
      url: fallbackUrl,
      fileName: fallbackName,
      bucket: null,
      storagePath: null,
    };
  }

  const objectPath = buildSupabaseStorageObjectPath(
    options.verificationCode,
    options.docType,
    fallbackName || options.file?.name
  );

  for (const bucket of candidateBuckets) {
    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(objectPath, uploadBody, {
          upsert: true,
          contentType,
          cacheControl: '3600',
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(objectPath);

        if (publicUrlData?.publicUrl) {
          return {
            url: publicUrlData.publicUrl,
            fileName: fallbackName,
            bucket,
            storagePath: objectPath,
          };
        }
      }
    } catch {
      // Try next candidate bucket or fall back to inline Data URL
    }
  }

  return {
    url: fallbackUrl,
    fileName: fallbackName,
    bucket: null,
    storagePath: null,
  };
}

function extractMissingColumnName(err?: {
  message?: string;
  code?: string;
} | null): string | null {
  if (!err || !err.message) return null;
  // Matches PostgREST PGRST204: Could not find the '<column>' column of '<table>' in the schema cache
  const match = err.message.match(/Could not find the '([^']+)' column/i);
  return match?.[1] || null;
}

/**
 * Executes an insert or update on a Supabase table while stripping any column
 * that is not present in the remote PostgREST schema cache (`PGRST204`).
 */
async function executeSchemaSafeMutation(
  supabase: SupabaseClient,
  table: string,
  mode: 'insert' | 'update',
  payload: Record<string, unknown>,
  matchColumn?: string,
  matchValue?: string
): Promise<{
  data: Record<string, unknown>[] | null;
  error: { message: string; code?: string } | null;
}> {
  const workingPayload: Record<string, unknown> = { ...payload };

  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res =
        mode === 'update' && matchColumn && matchValue
          ? await supabase
              .from(table)
              .update(workingPayload)
              .eq(matchColumn, matchValue)
              .select('*')
          : await supabase.from(table).insert([workingPayload]).select('*');

      if (!res.error) {
        return {
          data: (res.data as Record<string, unknown>[]) || null,
          error: null,
        };
      }

      const missingCol = extractMissingColumnName(res.error);
      if (missingCol && missingCol in workingPayload) {
        delete workingPayload[missingCol];
        continue;
      }

      return {
        data: null,
        error: {
          message: res.error.message || 'Database write failed',
          code: res.error.code,
        },
      };
    } catch (err) {
      return {
        data: null,
        error: {
          message:
            err instanceof Error ? err.message : 'Network error during sync',
        },
      };
    }
  }

  return {
    data: null,
    error: { message: 'Exceeded schema fallback attempts' },
  };
}

/**
 * Uploads tutor profile documents (Profile Photo, Smart NID Scan, Student ID Scan) to
 * Supabase Storage (with automatic inline Data URL fallback) and syncs the complete
 * tutor profile to Supabase (`tutor_verifications`, plus `profiles`/`tutors` when enabled).
 */
export async function syncTutorProfileToSupabase(
  supabase: SupabaseClient,
  req: VerificationRequest,
  files?: TutorUploadFileBundle,
  options?: { syncSecondaryTables?: boolean }
): Promise<SyncTutorProfileResult> {
  const uploadedBuckets: string[] = [];

  // 1. Discover available Supabase Storage buckets cleanly (returns 200 OK [] if none exist)
  let availableBuckets: string[] = [];
  try {
    if (
      supabase.storage &&
      typeof supabase.storage.listBuckets === 'function'
    ) {
      const { data: bucketList, error: bucketErr } =
        await supabase.storage.listBuckets();
      if (!bucketErr && Array.isArray(bucketList)) {
        const bucketNames = new Set(
          bucketList.map((b) => (b.name || b.id || '').trim()).filter(Boolean)
        );
        availableBuckets = PREFERRED_STORAGE_BUCKETS.filter((b) =>
          bucketNames.has(b)
        );
        if (availableBuckets.length === 0 && bucketNames.size > 0) {
          availableBuckets = Array.from(bucketNames);
        }
      }
    } else if (supabase.storage) {
      availableBuckets = [...PREFERRED_STORAGE_BUCKETS];
    }
  } catch {
    availableBuckets = [];
  }

  // 2. Aggressively compress any File objects to max 600px at 0.55 quality before uploading/saving to Supabase
  const [compressedPhoto, compressedNid, compressedUni] = await Promise.all([
    files?.profilePhotoFile
      ? compressImageFile(
          files.profilePhotoFile,
          DEFAULT_IMAGE_MAX_DIMENSION,
          DEFAULT_IMAGE_COMPRESSION_QUALITY
        )
      : Promise.resolve(null),
    files?.nidScanFile
      ? compressImageFile(
          files.nidScanFile,
          DEFAULT_IMAGE_MAX_DIMENSION,
          DEFAULT_IMAGE_COMPRESSION_QUALITY
        )
      : Promise.resolve(null),
    files?.uniScanFile
      ? compressImageFile(
          files.uniScanFile,
          DEFAULT_IMAGE_MAX_DIMENSION,
          DEFAULT_IMAGE_COMPRESSION_QUALITY
        )
      : Promise.resolve(null),
  ]);

  // 3. Upload Profile Photo, Smart NID Scan, and Student ID Card Scan
  const [photoOutcome, nidOutcome, uniOutcome] = await Promise.all([
    uploadDocumentToSupabaseStorage(supabase, {
      verificationCode: req.id,
      docType: 'profile_photo',
      file: compressedPhoto?.file ?? files?.profilePhotoFile,
      dataUrl: compressedPhoto?.dataUrl ?? req.profilePhotoDataUrl,
      fileName: req.profilePhotoName,
      availableBuckets,
    }),
    uploadDocumentToSupabaseStorage(supabase, {
      verificationCode: req.id,
      docType: 'nid_scan',
      file: compressedNid?.file ?? files?.nidScanFile,
      dataUrl: compressedNid?.dataUrl ?? req.nidScanDataUrl,
      fileName: req.nidDocumentName,
      availableBuckets,
    }),
    uploadDocumentToSupabaseStorage(supabase, {
      verificationCode: req.id,
      docType: 'student_id_scan',
      file: compressedUni?.file ?? files?.uniScanFile,
      dataUrl: compressedUni?.dataUrl ?? req.uniScanDataUrl,
      fileName: req.uniDocumentName,
      availableBuckets,
    }),
  ]);

  for (const outcome of [photoOutcome, nidOutcome, uniOutcome]) {
    if (outcome.bucket && !uploadedBuckets.includes(outcome.bucket)) {
      uploadedBuckets.push(outcome.bucket);
    }
  }

  const enrichedReq: VerificationRequest = {
    ...req,
    email: (req.userEmail || req.email || '').trim().toLowerCase() || undefined,
    userEmail:
      (req.userEmail || req.email || '').trim().toLowerCase() || undefined,
    medium: (req.medium || '').trim(),
    experience: (req.experience || '').trim(),
    profilePhotoDataUrl: photoOutcome.url || req.profilePhotoDataUrl,
    profilePhotoName:
      photoOutcome.fileName || req.profilePhotoName || undefined,
    nidScanDataUrl: nidOutcome.url || req.nidScanDataUrl,
    nidDocumentName:
      nidOutcome.fileName || req.nidDocumentName || '',
    uniScanDataUrl: uniOutcome.url || req.uniScanDataUrl,
    uniDocumentName:
      uniOutcome.fileName || req.uniDocumentName || '',
    status: 'Pending',
    hiddenFromAdmin: false,
  };

  // 3. Check if a row already exists in `tutor_verifications` by `verification_code` or `user_email`
  let existingRow: TutorVerificationRow | null = null;
  const cleanCode = (enrichedReq.id || '').trim();
  const cleanEmail = (enrichedReq.userEmail || '').trim().toLowerCase();

  try {
    if (cleanCode) {
      const codeLookup = await supabase
        .from('tutor_verifications')
        .select('*')
        .eq('verification_code', cleanCode)
        .limit(1);
      if (
        !codeLookup.error &&
        Array.isArray(codeLookup.data) &&
        codeLookup.data.length > 0
      ) {
        existingRow = codeLookup.data[0] as TutorVerificationRow;
      }
    }

    if (!existingRow && cleanEmail) {
      const emailLookup = await supabase
        .from('tutor_verifications')
        .select('*')
        .eq('user_email', cleanEmail)
        .order('created_at', { ascending: false })
        .limit(1);
      if (
        !emailLookup.error &&
        Array.isArray(emailLookup.data) &&
        emailLookup.data.length > 0
      ) {
        existingRow = emailLookup.data[0] as TutorVerificationRow;
      }
    }
  } catch {
    // Proceed to insert/update below
  }

  const targetVerificationCode =
    existingRow?.verification_code?.trim() || cleanCode;
  const reqForDb: VerificationRequest = {
    ...enrichedReq,
    id: targetVerificationCode,
    tutorId: `tutor-ver-${targetVerificationCode}`,
    supabaseRowId: existingRow?.id || enrichedReq.supabaseRowId,
  };

  const verificationPayload = mapVerificationRequestToSupabaseRow(reqForDb);

  // 4. Upsert/Update or Insert into `public.tutor_verifications`
  let mutationResult: {
    data: Record<string, unknown>[] | null;
    error: { message: string; code?: string } | null;
  };

  if (existingRow) {
    const matchCol = existingRow.id ? 'id' : 'verification_code';
    const matchVal = existingRow.id || targetVerificationCode;
    mutationResult = await executeSchemaSafeMutation(
      supabase,
      'tutor_verifications',
      'update',
      {
        ...verificationPayload,
        status: 'Pending',
        admin_audit_note: null,
        hidden_from_admin: false,
      },
      matchCol,
      matchVal
    );
  } else {
    mutationResult = await executeSchemaSafeMutation(
      supabase,
      'tutor_verifications',
      'insert',
      {
        ...verificationPayload,
        status: 'Pending',
        admin_audit_note: null,
        hidden_from_admin: false,
      }
    );
  }

  // Optional sync to `public.profiles` and `public.tutors` when explicitly enabled
  if (options?.syncSecondaryTables) {
    const fullTablePayload = mapVerificationRequestToProfilesTableRow(reqForDb);
    try {
      await executeSchemaSafeMutation(
        supabase,
        'profiles',
        existingRow ? 'update' : 'insert',
        { ...fullTablePayload },
        cleanEmail ? 'email' : 'verification_code',
        cleanEmail || targetVerificationCode
      );
    } catch {
      // Ignore if optional secondary table is not provisioned
    }
    try {
      await executeSchemaSafeMutation(
        supabase,
        'tutors',
        existingRow ? 'update' : 'insert',
        { ...fullTablePayload },
        'verification_code',
        targetVerificationCode
      );
    } catch {
      // Ignore if optional secondary table is not provisioned
    }
  }

  if (mutationResult.error) {
    return {
      ok: false,
      savedRequest: reqForDb,
      uploadedBuckets,
      errorMessage: mutationResult.error.message,
    };
  }

  const returnedRow = mutationResult.data?.[0] as
    | TutorVerificationRow
    | undefined;
  if (returnedRow) {
    const mappedBack = mapSupabaseRowToVerificationRequest(returnedRow);
    return {
      ok: true,
      savedRequest: {
        ...mappedBack,
        email: reqForDb.email || mappedBack.userEmail,
        userEmail: reqForDb.userEmail || mappedBack.userEmail,
        medium: reqForDb.medium || mappedBack.medium || '',
        experience: reqForDb.experience || mappedBack.experience || '',
        academicSession:
          reqForDb.academicSession || mappedBack.academicSession,
        profilePhotoDataUrl:
          mappedBack.profilePhotoDataUrl || reqForDb.profilePhotoDataUrl,
        profilePhotoName:
          mappedBack.profilePhotoName || reqForDb.profilePhotoName,
        nidScanDataUrl: mappedBack.nidScanDataUrl || reqForDb.nidScanDataUrl,
        uniScanDataUrl: mappedBack.uniScanDataUrl || reqForDb.uniScanDataUrl,
      },
      uploadedBuckets,
    };
  }

  return {
    ok: true,
    savedRequest: reqForDb,
    uploadedBuckets,
  };
}

/**
 * Saves Admin Panel edits for a user's profile directly to Supabase:
 * - Updates `public.profiles` (`.eq('id', userId)` and fallback match on `email` / `verification_code`)
 * - Updates `public.tutors` (`.eq('id', userId)` and `.eq('verification_code', code)`)
 * - Updates `public.tutor_verifications` (`.eq('id', supabaseRowId)` or `.eq('verification_code', code)`)
 * - Syncs applicant metadata in `public.circular_applications`
 */
export async function executeAdminUpdateProfileInSupabase(
  supabase: SupabaseClient,
  updatedReq: VerificationRequest
): Promise<{
  ok: boolean;
  savedRequest: VerificationRequest;
  errorMessage?: string;
}> {
  const cleanCode = (updatedReq.id || '').trim();
  const cleanRowId = (updatedReq.supabaseRowId || '').trim();
  const cleanEmail = (updatedReq.userEmail || updatedReq.email || '')
    .trim()
    .toLowerCase();
  const cleanUserId = (
    updatedReq.userId ||
    cleanRowId ||
    (cleanEmail ? cleanEmail.split('@')[0] : '') ||
    cleanCode
  ).trim();

  const profilesPayload = mapVerificationRequestToProfilesTableRow(updatedReq);
  const verificationPayload = mapVerificationRequestToSupabaseRow(updatedReq);

  // 1. Update `public.profiles` (`supabase.from('profiles').update(...).eq('id', userId)`)
  try {
    if (cleanUserId) {
      await supabase
        .from('profiles')
        .update({
          ...profilesPayload,
          status: updatedReq.status,
          verification_status: updatedReq.status.toLowerCase(),
        })
        .eq('id', cleanUserId);
    }
    if (cleanEmail) {
      await executeSchemaSafeMutation(
        supabase,
        'profiles',
        'update',
        {
          ...profilesPayload,
          status: updatedReq.status,
          verification_status: updatedReq.status.toLowerCase(),
        },
        'email',
        cleanEmail
      );
    }
  } catch {
    // Optional table if not provisioned in schema cache
  }

  // 2. Update `public.tutors`
  try {
    if (cleanUserId) {
      await supabase
        .from('tutors')
        .update({
          ...profilesPayload,
          status: updatedReq.status,
          verification_status: updatedReq.status.toLowerCase(),
        })
        .eq('id', cleanUserId);
    }
    if (cleanCode) {
      await executeSchemaSafeMutation(
        supabase,
        'tutors',
        'update',
        {
          ...profilesPayload,
          status: updatedReq.status,
          verification_status: updatedReq.status.toLowerCase(),
        },
        'verification_code',
        cleanCode
      );
    }
  } catch {
    // Optional table if not provisioned in schema cache
  }

  // 3. Update primary `public.tutor_verifications` table
  const matchColumn = cleanRowId ? 'id' : 'verification_code';
  const matchValue = cleanRowId || cleanCode;

  const primaryRes = await executeSchemaSafeMutation(
    supabase,
    'tutor_verifications',
    'update',
    {
      ...verificationPayload,
      status: updatedReq.status,
      admin_audit_note: updatedReq.adminNote ?? null,
    },
    matchColumn,
    matchValue
  );

  // 4. Sync related `circular_applications` rows for this tutor
  try {
    const qualLabel = [
      updatedReq.institutionFullEn || updatedReq.collegeTag,
      updatedReq.departmentEn,
    ]
      .filter(Boolean)
      .join(' · ');
    if (cleanCode) {
      await supabase
        .from('circular_applications')
        .update({
          tutor_name: updatedReq.tutorNameEn,
          tutor_phone: updatedReq.phone,
          ...(qualLabel ? { institution_qualification: qualLabel } : {}),
        })
        .eq('tutor_id', cleanCode);
    }
  } catch {
    // Non-blocking circular application sync
  }

  if (primaryRes.error) {
    return {
      ok: false,
      savedRequest: updatedReq,
      errorMessage: primaryRes.error.message,
    };
  }

  const returnedRow = primaryRes.data?.[0] as TutorVerificationRow | undefined;
  if (returnedRow) {
    const mappedBack = mapSupabaseRowToVerificationRequest(returnedRow);
    return {
      ok: true,
      savedRequest: {
        ...mappedBack,
        email: updatedReq.email || mappedBack.userEmail,
        userEmail: updatedReq.userEmail || mappedBack.userEmail,
        medium: updatedReq.medium ?? mappedBack.medium ?? '',
        experience: updatedReq.experience ?? mappedBack.experience ?? '',
      },
    };
  }

  return {
    ok: true,
    savedRequest: updatedReq,
  };
}

const inFlightGoogleSyncByKey = new Map<
  string,
  Promise<{
    profile: VerificationRequest;
    created: boolean;
    deletedByAdmin?: boolean;
  }>
>();

/**
 * Checks if an authenticated user already has a manually submitted profile row in
 * `tutor_verifications`. Does NOT automatically insert a new row into Supabase
 * `profiles` / `tutors` / `tutor_verifications` and does NOT auto-fill `full_name`,
 * `email`, `avatar_url`, or `verification_id` from Google `user_metadata`.
 */
export async function ensureGoogleUserProfileSynced(
  supabase: SupabaseClient,
  sessionUser: SupabaseSessionUserInput,
  _options?: { syncSecondaryTables?: boolean; allowCreateIfMissing?: boolean }
): Promise<{
  profile: VerificationRequest;
  created: boolean;
  deletedByAdmin?: boolean;
}> {
  const initialProfile = buildInitialGoogleTutorProfile(sessionUser);
  const cleanEmail = (sessionUser.email || '').trim().toLowerCase();
  const cleanUserId = (sessionUser.id || '').trim();
  const lockKey = cleanEmail || cleanUserId || 'anon';

  const existingInFlight = inFlightGoogleSyncByKey.get(lockKey);
  if (existingInFlight) {
    return existingInFlight;
  }

  const syncTask = (async () => {
    const emailPrefix = cleanEmail ? cleanEmail.split('@')[0] : '';
    let existingRow: TutorVerificationRow | null = null;

    try {
      if (cleanEmail) {
        const emailLookup = await supabase
          .from('tutor_verifications')
          .select('*')
          .eq('user_email', cleanEmail)
          .order('created_at', { ascending: false })
          .limit(1);
        if (
          !emailLookup.error &&
          Array.isArray(emailLookup.data) &&
          emailLookup.data.length > 0
        ) {
          existingRow = emailLookup.data[0] as TutorVerificationRow;
        }
      }

      if (!existingRow && cleanUserId) {
        const idLookup = await supabase
          .from('tutor_verifications')
          .select('*')
          .eq('user_id', cleanUserId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (
          !idLookup.error &&
          Array.isArray(idLookup.data) &&
          idLookup.data.length > 0
        ) {
          existingRow = idLookup.data[0] as TutorVerificationRow;
        }
      }

      if (!existingRow && emailPrefix && emailPrefix !== cleanUserId) {
        const prefixLookup = await supabase
          .from('tutor_verifications')
          .select('*')
          .eq('user_id', emailPrefix)
          .order('created_at', { ascending: false })
          .limit(1);
        if (
          !prefixLookup.error &&
          Array.isArray(prefixLookup.data) &&
          prefixLookup.data.length > 0
        ) {
          existingRow = prefixLookup.data[0] as TutorVerificationRow;
        }
      }
    } catch {
      // Return clean empty unsubmitted profile state if lookup fails
    }

    if (existingRow) {
      const mappedExisting = mapSupabaseRowToVerificationRequest(existingRow);
      if (!isActiveVerificationRequest(mappedExisting)) {
        return {
          profile: initialProfile,
          created: false,
          deletedByAdmin: true,
        };
      }
      if (isTutorProfileSubmitted(mappedExisting)) {
        return {
          profile: mappedExisting,
          created: false,
          deletedByAdmin: false,
        };
      }
      return {
        profile: initialProfile,
        created: false,
        deletedByAdmin: false,
      };
    }

    // Never auto-insert or auto-fill a profile row on login/signup.
    // Keep newly registered user's profile state completely blank (isProfileSubmitted = false).
    return {
      profile: initialProfile,
      created: false,
      deletedByAdmin: false,
    };
  })();

  inFlightGoogleSyncByKey.set(lockKey, syncTask);
  try {
    return await syncTask;
  } finally {
    inFlightGoogleSyncByKey.delete(lockKey);
  }
}


