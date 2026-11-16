import {
  CircularApplicationRow,
  CollegeTag,
  FilterState,
  Language,
  MediumCategory,
  PaymentMethod,
  PaymentRequestRecord,
  PaymentRequestRow,
  PaymentRequestStatus,
  SupabaseTutorProfileTableRow,
  TuitionCircularRow,
  TuitionJob,
  TutorProfile,
  TutorReview,
  TutorVerificationRow,
  Upazila,
  VerificationRequest,
  VerificationStatus,
  SiteNotice,
  GuardianRequestRecord,
  GuardianRequestRow,
} from '../types/madaripur';
import { UPAZILA_LABELS } from '../data/madaripurData';


export function filterTutors(
  tutors: TutorProfile[],
  filters: FilterState,
  shortlistedIds: string[] = []
): TutorProfile[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return tutors.filter((tutor) => {
    if (filters.shortlistedOnly && !shortlistedIds.includes(tutor.id)) {
      return false;
    }

    if (filters.upazila !== 'All' && tutor.upazila !== filters.upazila) {
      return false;
    }

    if (filters.mode !== 'All' && !tutor.modes.includes(filters.mode)) {
      return false;
    }

    if (filters.medium !== 'All' && !tutor.mediums.includes(filters.medium)) {
      return false;
    }

    if (
      filters.college !== 'All' &&
      !matchesCollegeFilter(tutor, filters.college)
    ) {
      return false;
    }

    if (filters.gender !== 'All' && tutor.gender !== filters.gender) {
      return false;
    }

    if (tutor.monthlyFee > filters.maxBudget) {
      return false;
    }

    if (filters.verifiedOnly && !(tutor.nidVerified && tutor.uniIdVerified)) {
      return false;
    }

    if (query.length > 0) {
      const searchableFields = [
        tutor.nameEn,
        tutor.nameBn,
        tutor.collegeTag,
        tutor.institutionFullEn,
        tutor.institutionFullBn,
        tutor.departmentEn,
        tutor.departmentBn,
        tutor.upazila,
        ...tutor.subjectsEn,
        ...tutor.subjectsBn,
        ...tutor.coveredAreasEn,
        ...tutor.coveredAreasBn,
      ]
        .join(' ')
        .toLowerCase();

      if (!searchableFields.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

export function validatePhoneBD(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(?:\+?88)?01[3-9]\d{8}$/.test(cleaned);
}

export function validateNIDNumber(nid: string): boolean {
  const cleaned = nid.replace(/[\s-]/g, '');
  return /^(\d{10}|\d{13}|\d{17})$/.test(cleaned);
}

export function calculateAverageRating(reviews: TutorReview[]): number {
  if (!reviews || reviews.length === 0) {
    return 0;
  }
  const sum = reviews.reduce(
    (acc, r) => acc + Math.max(1, Math.min(5, r.rating)),
    0
  );
  return Number((sum / reviews.length).toFixed(2));
}

export function addReviewToTutor(
  tutor: TutorProfile,
  newReview: TutorReview
): TutorProfile {
  const updatedReviews = [newReview, ...tutor.reviews];
  const newAvg = calculateAverageRating(updatedReviews);
  return {
    ...tutor,
    reviews: updatedReviews,
    rating: newAvg,
    totalReviews: updatedReviews.length,
  };
}

export function removeReviewFromTutor(
  tutor: TutorProfile,
  reviewId: string
): TutorProfile {
  const updatedReviews = tutor.reviews.filter((r) => r.id !== reviewId);
  const newAvg = calculateAverageRating(updatedReviews);
  return {
    ...tutor,
    reviews: updatedReviews,
    rating: newAvg,
    totalReviews: updatedReviews.length,
  };
}

export function processVerificationDecision(
  tutors: TutorProfile[],
  requests: VerificationRequest[],
  requestId: string,
  decision: VerificationStatus,
  adminNote: string = ''
): { tutors: TutorProfile[]; requests: VerificationRequest[] } {
  const targetReq = requests.find((r) => r.id === requestId);
  if (!targetReq) {
    return { tutors, requests };
  }

  const cleanNote = adminNote.trim();
  const isRejectedDecision = decision === 'Rejected';
  const isPendingDecision = decision === 'Pending';

  const resolvedAdminNote = isPendingDecision
    ? cleanNote || undefined
    : cleanNote ||
      (decision === 'Approved'
        ? 'NID & Institutional ID verified against registrar records.'
        : 'Document scan unclear or ID mismatch.');

  const updatedRequests = requests.map((req) =>
    req.id === requestId
      ? {
          ...req,
          status: decision,
          is_rejected: isRejectedDecision,
          rejection_note: isRejectedDecision ? resolvedAdminNote : undefined,
          adminNote: resolvedAdminNote,
          reviewedAt: isPendingDecision ? undefined : 'Just now',
        }
      : req
  );

  const isApproved = decision === 'Approved';
  const generatedCode = 'MDP-VERIFIED';

  const existingTutor = tutors.find((t) => t.id === targetReq.tutorId);
  let updatedTutors: TutorProfile[];

  if (existingTutor) {
    updatedTutors = tutors.map((t) =>
      t.id === targetReq.tutorId
        ? {
            ...t,
            profilePhotoUrl: targetReq.profilePhotoDataUrl || t.profilePhotoUrl,
            nidVerified: isApproved,
            uniIdVerified: isApproved,
            verificationStatus: decision,
            verificationCode: isApproved
              ? generatedCode
              : isPendingDecision
              ? 'VERIFICATION-PENDING'
              : 'VERIFICATION-REJECTED',
          }
        : t
    );
  } else if (isApproved) {
    const resolvedCollege: Exclude<CollegeTag, 'All'> =
      targetReq.collegeTag || 'Govt. Nazimuddin College';
    const resolvedUpazila: Exclude<Upazila, 'All'> =
      targetReq.upazila || 'Madaripur Sadar';
    const newTutor: TutorProfile = {
      id: targetReq.tutorId,
      nameEn: targetReq.tutorNameEn,
      nameBn: targetReq.tutorNameBn || targetReq.tutorNameEn,
      gender: targetReq.gender,
      profilePhotoUrl: targetReq.profilePhotoDataUrl || undefined,
      collegeTag: resolvedCollege,
      institutionFullEn: `${targetReq.institutionFullEn || resolvedCollege} (${targetReq.departmentEn || 'Honours'})`,
      institutionFullBn: `${targetReq.institutionFullEn || resolvedCollege} (${targetReq.departmentEn || 'Honours'})`,
      departmentEn: targetReq.departmentEn || 'Honours',
      departmentBn: targetReq.departmentEn || 'Honours',
      upazila: resolvedUpazila,
      coveredAreasEn: [resolvedUpazila],
      coveredAreasBn: [resolvedUpazila],
      modes: ['Home', 'Online'],
      mediums: ['Bangla Medium', 'English Version'],
      subjectsEn: targetReq.subjectsEn,
      subjectsBn: targetReq.subjectsEn,
      preferredClassesEn: 'Class 8–12 (SSC & HSC)',
      preferredClassesBn: 'অষ্টম–দ্বাদশ শ্রেণি',
      monthlyFee: targetReq.monthlyFee,
      experienceYears: 2,
      responseTimeEn: '15 mins avg',
      responseTimeBn: 'গড়ে ১৫ মিনিট',
      nidVerified: true,
      uniIdVerified: true,
      verificationStatus: 'Approved',
      verificationCode: generatedCode,
      rating: 0,
      totalReviews: 0,
      studentsTaught: 0,
      bioEn: `Verified educator from ${targetReq.institutionFullEn} (${targetReq.departmentEn}) serving students across ${targetReq.upazila}.`,
      bioBn: `${targetReq.institutionFullEn} (${targetReq.departmentEn}) এর যাচাইকৃত শিক্ষক, ${targetReq.upazila} এলাকায় পাঠদান করেন।`,
      hscGpa: 'GPA 5.00',
      sscGpa: 'GPA 5.00',
      availableDaysEn: '4 Days/Week (Afternoon/Evening)',
      availableDaysBn: 'সপ্তাহে ৪ দিন (বিকাল/সন্ধ্যা)',
      portraitVariant: targetReq.gender === 'Female' ? 'sadia' : 'tanvir',
      reviews: [],
    };
    updatedTutors = [newTutor, ...tutors];
  } else {
    updatedTutors = tutors;
  }

  return { tutors: updatedTutors, requests: updatedRequests };
}

/**
 * Purges unusable data across the platform:
 * - Removes any rejected verification requests
 * - Removes any tutors whose verification was rejected or who have 0 subjects/invalid fee
 * - Removes any tuition jobs with invalid salary or empty subjects
 */
export function purgeUnusablePlatformData(
  tutors: TutorProfile[],
  requests: VerificationRequest[],
  jobs: TuitionJob[]
): {
  tutors: TutorProfile[];
  requests: VerificationRequest[];
  jobs: TuitionJob[];
  removedCount: number;
} {
  const cleanTutors = tutors.filter(
    (t) =>
      t.verificationStatus !== 'Rejected' &&
      (t.nidVerified || t.verificationStatus === 'Pending') &&
      t.subjectsEn.length > 0 &&
      t.monthlyFee >= 1000
  );

  const cleanRequests = requests.filter((r) => r.status !== 'Rejected');

  const cleanJobs = jobs.filter(
    (j) => j.salaryBdt >= 1000 && j.subjectsEn.length > 0
  );

  const removedCount =
    tutors.length -
    cleanTutors.length +
    (requests.length - cleanRequests.length) +
    (jobs.length - cleanJobs.length);

  return {
    tutors: cleanTutors,
    requests: cleanRequests,
    jobs: cleanJobs,
    removedCount,
  };
}

export const DEFAULT_ADMIN_PIN = '153800';
export const ADMIN_EMAIL = 'drabirm4@gmail.com';
export const ADMIN_USERNAME = 'drabirm4';
export const ADMIN_SESSION_STORAGE_KEY = 'madaripur_admin_unlocked';

export function isAdminEmail(emailOrUsername?: string | null): boolean {
  if (!emailOrUsername) return false;
  const normalized = emailOrUsername.trim().toLowerCase();
  return (
    normalized === ADMIN_EMAIL ||
    normalized === ADMIN_USERNAME ||
    normalized.split('@')[0] === ADMIN_USERNAME
  );
}

export const PROTECTED_ADMIN_DELETE_ERROR =
  'Protected Admin account (drabirm4@gmail.com) cannot be deleted from the Admin Review Desk.';

export function isAuthorizedAdminAccount(
  user?: { email?: string | null; fullName?: string | null; id?: string | null } | null
): boolean {
  if (!user) return false;
  const emailNorm = (user.email || '').trim().toLowerCase();
  const nameNorm = (user.fullName || '').trim().toLowerCase();
  const idNorm = (user.id || '').trim().toLowerCase();
  return (
    emailNorm === ADMIN_EMAIL ||
    emailNorm === ADMIN_USERNAME ||
    emailNorm.split('@')[0] === ADMIN_USERNAME ||
    nameNorm === ADMIN_USERNAME ||
    nameNorm === ADMIN_EMAIL ||
    idNorm === 'admin-drabirm4' ||
    idNorm === ADMIN_USERNAME
  );
}

export function isProtectedAdminProfile(
  target?:
    | {
        email?: string | null;
        userEmail?: string | null;
        user_email?: string | null;
        userId?: string | null;
        user_id?: string | null;
        tutorId?: string | null;
        tutor_id?: string | null;
        id?: string | null;
        fullName?: string | null;
      }
    | string
    | null
): boolean {
  if (!target) return false;
  if (typeof target === 'string') {
    const clean = target.trim().toLowerCase();
    const withoutPrefix = clean.startsWith('tutor-ver-')
      ? clean.slice('tutor-ver-'.length)
      : clean;
    return (
      isAdminEmail(clean) ||
      isAdminEmail(withoutPrefix) ||
      clean === 'admin-drabirm4' ||
      withoutPrefix === 'admin-drabirm4'
    );
  }
  const candidates = [
    target.email,
    target.userEmail,
    target.user_email,
    target.userId,
    target.user_id,
    target.tutorId,
    target.tutor_id,
    target.id,
    target.fullName,
  ];
  return candidates.some((val) => {
    if (!val) return false;
    const clean = String(val).trim().toLowerCase();
    return isAdminEmail(clean) || clean === 'admin-drabirm4';
  });
}

export function verifyAdminPin(
  inputPin: string,
  expectedPin: string = DEFAULT_ADMIN_PIN
): { valid: boolean; error?: string } {
  const trimmed = (inputPin || '').trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Please enter the Admin Password/PIN.',
    };
  }
  if (trimmed === expectedPin) {
    return { valid: true };
  }
  return {
    valid: false,
    error: 'Incorrect Admin PIN. Access denied.',
  };
}

export function canAccessDesk(
  targetDesk: string,
  isAdminUnlocked: boolean,
  currentUser?: { email?: string | null; fullName?: string | null } | null
): boolean {
  if (targetDesk === 'admin_review') {
    if (currentUser !== undefined && !isAuthorizedAdminAccount(currentUser)) {
      return false;
    }
    return Boolean(isAdminUnlocked);
  }
  return true;
}

export function canPostTuitionCircular(
  activeDesk: string,
  isAdminUnlocked: boolean = true,
  currentUser?: { email?: string | null; fullName?: string | null } | null
): boolean {
  if (currentUser !== undefined && !isAuthorizedAdminAccount(currentUser)) {
    return false;
  }
  return Boolean(isAdminUnlocked) && activeDesk === 'admin_review';
}

export function publishAdminTuitionCircular(
  activeDesk: string,
  existingJobs: TuitionJob[],
  newJob: TuitionJob,
  isAdminUnlocked: boolean = true,
  currentUser?: { email?: string | null; fullName?: string | null } | null
): { jobs: TuitionJob[]; allowed: boolean } {
  if (!canPostTuitionCircular(activeDesk, isAdminUnlocked, currentUser)) {
    return { jobs: existingJobs, allowed: false };
  }
  return {
    jobs: [newJob, ...existingJobs],
    allowed: true,
  };
}

const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaNumber(num: number | string): string {
  return String(num).replace(/\d/g, (d) => banglaDigits[Number(d)] ?? d);
}

export function formatBDT(amount: number, lang: Language): string {
  const formatted = amount.toLocaleString('en-IN');
  if (lang === 'bn') {
    return `৳${toBanglaNumber(formatted)}`;
  }
  return `৳${formatted}`;
}

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  provider: 'email' | 'google';
  avatarUrl?: string;
  createdAt: string;
}

export interface SupabaseSessionUserInput {
  id: string;
  email?: string | null;
  created_at?: string | null;
  user_metadata?: {
    full_name?: string | null;
    name?: string | null;
    avatar_url?: string | null;
    picture?: string | null;
  } | null;
  app_metadata?: {
    provider?: string | null;
    providers?: string[] | null;
  } | null;
  identities?: Array<{ provider?: string | null }> | null;
}

export function isGoogleSessionUser(
  sessionUser?: SupabaseSessionUserInput | null
): boolean {
  if (!sessionUser) return false;
  const primaryProvider = (sessionUser.app_metadata?.provider || '')
    .trim()
    .toLowerCase();
  if (primaryProvider === 'google') return true;
  if (
    Array.isArray(sessionUser.app_metadata?.providers) &&
    sessionUser.app_metadata.providers.some(
      (p) => (p || '').trim().toLowerCase() === 'google'
    )
  ) {
    return true;
  }
  if (
    Array.isArray(sessionUser.identities) &&
    sessionUser.identities.some(
      (i) => (i?.provider || '').trim().toLowerCase() === 'google'
    )
  ) {
    return true;
  }
  return false;
}

export function mapSupabaseSessionToUser(
  sessionUser: SupabaseSessionUserInput
): UserAccount {
  const cleanEmail = (sessionUser.email || '').trim();
  const emailPrefix = cleanEmail ? cleanEmail.split('@')[0] : '';
  const fullName =
    (
      sessionUser.user_metadata?.full_name ||
      sessionUser.user_metadata?.name ||
      emailPrefix ||
      'User'
    ).trim() || 'User';
  const avatarUrl =
    (
      sessionUser.user_metadata?.avatar_url ||
      sessionUser.user_metadata?.picture ||
      ''
    ).trim() || undefined;

  return {
    id: sessionUser.id,
    fullName,
    email: cleanEmail,
    provider: isGoogleSessionUser(sessionUser) ? 'google' : 'email',
    avatarUrl,
    createdAt: new Date(
      sessionUser.created_at || Date.now()
    ).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  };
}

export const UNSUBMITTED_PROFILE_BANNER_EN =
  'Complete Your Profile — Please click Upload Profile to submit your details for verification.';
export const UNSUBMITTED_PROFILE_BANNER_BN =
  'Complete Your Profile — Please click Upload Profile to submit your details for verification.';
export const PROFILE_FIELD_PLACEHOLDER = 'Not Provided Yet';
export const NEW_ACCOUNT_HEADER_BADGE =
  'New Account · Profile Not Submitted';
export const NO_FILE_UPLOADED_PLACEHOLDER = 'No file uploaded yet';

export function isTutorProfileSubmitted(
  profile?: Partial<VerificationRequest> | null
): boolean {
  if (!profile) return false;
  const hasPhone = Boolean((profile.phone || '').trim());
  const cleanRegId = (profile.studentRegId || '').trim();
  const hasRealRegId = Boolean(
    cleanRegId &&
      cleanRegId.toLowerCase() !== 'pending reg id' &&
      cleanRegId.toLowerCase() !== 'pending'
  );
  const cleanNid = (profile.nidNumber || '').trim();
  const hasRealNid = Boolean(
    cleanNid &&
      cleanNid.toLowerCase() !== 'pending' &&
      cleanNid.toLowerCase() !== 'pendingnid'
  );
  const hasInstitution = Boolean(
    (profile.institutionFullEn || '').trim() ||
      (profile.collegeTag || '').trim()
  );
  const hasScans = Boolean(profile.nidScanDataUrl || profile.uniScanDataUrl);
  return hasPhone || hasRealNid || hasRealRegId || hasScans || hasInstitution;
}

export function formatProfileFieldOrPlaceholder(
  value?: string | number | null
): string {
  if (value === null || value === undefined) return PROFILE_FIELD_PLACEHOLDER;
  if (typeof value === 'number') {
    return value > 0 ? String(value) : PROFILE_FIELD_PLACEHOLDER;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : PROFILE_FIELD_PLACEHOLDER;
}

export function sanitizeUnsubmittedGoogleProfile(
  profile: VerificationRequest
): VerificationRequest {
  const hasPhone = Boolean((profile.phone || '').trim());
  const cleanNid = (profile.nidNumber || '').trim();
  const hasNid = Boolean(
    cleanNid &&
      cleanNid.toLowerCase() !== 'pending' &&
      cleanNid.toLowerCase() !== 'pendingnid'
  );
  const cleanRegId = (profile.studentRegId || '').trim();
  const hasRegId = Boolean(
    cleanRegId &&
      cleanRegId.toLowerCase() !== 'pending reg id' &&
      cleanRegId.toLowerCase() !== 'pending'
  );
  const hasScans = Boolean(profile.nidScanDataUrl || profile.uniScanDataUrl);
  const hasManualSubmission = hasPhone || hasNid || hasRegId || hasScans;
  const looksLikeLegacyAutoFill =
    !hasManualSubmission &&
    (profile.uniDocumentName === 'Govt_Nazimuddin_College_Student_ID.jpg' ||
      (profile.profilePhotoName || '').toLowerCase().includes('google_avatar') ||
      profile.departmentEn === 'Honours / General' ||
      profile.academicSession === '2025-2026' ||
      profile.experience === '1+ Year Experience' ||
      profile.experience === '2+ Years Experience' ||
      profile.id.toUpperCase().startsWith('VER-2026-G') ||
      !profile.institutionFullEn);

  if (!looksLikeLegacyAutoFill) {
    return profile;
  }

  return {
    ...profile,
    id: '',
    tutorId: '',
    tutorNameEn: '',
    tutorNameBn: '',
    email: undefined,
    userEmail: undefined,
    phone: '',
    upazila: '',
    collegeTag: '',
    institutionFullEn: '',
    departmentEn: '',
    medium: '',
    experience: '',
    nidNumber: '',
    studentRegId: '',
    academicSession: '',
    profilePhotoName: undefined,
    profilePhotoDataUrl: undefined,
    nidDocumentName: '',
    uniDocumentName: '',
    nidScanDataUrl: undefined,
    uniScanDataUrl: undefined,
    subjectsEn: [],
    monthlyFee: 0,
  };
}

export function buildInitialGoogleTutorProfile(
  sessionUser?: SupabaseSessionUserInput | null,
  _existingVerificationCode?: string
): VerificationRequest {
  return {
    id: '',
    userEmail: undefined,
    email: undefined,
    userId: (sessionUser?.id || '').trim(),
    tutorId: '',
    tutorNameEn: '',
    tutorNameBn: '',
    gender: 'Male',
    upazila: '',
    phone: '',
    profilePhotoName: undefined,
    profilePhotoDataUrl: undefined,
    nidNumber: '',
    nidDocumentName: '',
    nidScanDataUrl: undefined,
    collegeTag: '',
    institutionFullEn: '',
    departmentEn: '',
    studentRegId: '',
    academicSession: '',
    uniDocumentName: '',
    uniScanDataUrl: undefined,
    subjectsEn: [],
    medium: '',
    experience: '',
    monthlyFee: 0,
    submittedAt: '',
    status: 'Pending',
    hiddenFromAdmin: false,
  };
}

export function validateAccountInput(
  mode: 'signup' | 'signin',
  fullName: string,
  email: string,
  password: string
): { valid: boolean; error?: string } {
  const trimmedName = fullName.trim();
  const trimmedEmail = email.trim();

  if (mode === 'signup' && trimmedName.length < 2) {
    return {
      valid: false,
      error: 'Please enter your full name (at least 2 characters).',
    };
  }

  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return {
      valid: false,
      error: 'Please enter a valid email address (e.g. name@example.com).',
    };
  }

  if (!password || password.length < 6) {
    return {
      valid: false,
      error: 'Password must be at least 6 characters long.',
    };
  }

  return { valid: true };
}

export const EMAIL_CONFIRMATION_MESSAGE =
  'Account created successfully! Check your email and confirm your account before logging in.';

export function evaluateSignUpOutcome(
  hasSession: boolean,
  errorMessage?: string | null,
  submittedEmail?: string
): {
  shouldRedirect: boolean;
  redirectToSignIn: boolean;
  shouldSignOutTempSession: boolean;
  prefilledEmail: string;
  infoMessage?: string;
  errorMessage?: string;
} {
  const cleanEmail = (submittedEmail || '').trim();

  if (errorMessage) {
    return {
      shouldRedirect: false,
      redirectToSignIn: false,
      shouldSignOutTempSession: false,
      prefilledEmail: cleanEmail,
      errorMessage,
    };
  }

  // Never auto-login after signUp; always redirect to Sign In with pre-filled email and success message
  return {
    shouldRedirect: false,
    redirectToSignIn: true,
    shouldSignOutTempSession: Boolean(hasSession),
    prefilledEmail: cleanEmail,
    infoMessage: EMAIL_CONFIRMATION_MESSAGE,
  };
}

export function canAccessProtectedRoute(
  hasActiveSession: boolean,
  targetDesk: string,
  isAdminUnlocked: boolean = false
): { allowed: boolean; redirectTo: string } {
  if (targetDesk === 'admin_review') {
    return {
      allowed: Boolean(isAdminUnlocked),
      redirectTo: '/',
    };
  }
  if (
    targetDesk === 'tutors' ||
    targetDesk === 'tutor_board' ||
    targetDesk === 'tutor_upload' ||
    targetDesk === 'job_board' ||
    targetDesk === 'account'
  ) {
    return { allowed: true, redirectTo: '/' };
  }
  if (!hasActiveSession) {
    return { allowed: false, redirectTo: '/login' };
  }
  return { allowed: true, redirectTo: '/' };
}

const VALID_UPAZILAS: Exclude<Upazila, 'All'>[] = [
  'Madaripur Sadar',
  'Shibchar',
  'Kalkini',
  'Rajoir',
  'Dasar',
];

export function mapTuitionJobToCircularRow(
  job: TuitionJob
): TuitionCircularRow {
  const cleanClass = (job.studentClassEn || '').trim();
  const cleanSubjects =
    job.subjectsEn && job.subjectsEn.length > 0
      ? job.subjectsEn.join(', ')
      : 'General Science & Math';
  const classSubject =
    job.classSubject?.trim() ||
    (cleanClass ? `${cleanClass} · ${cleanSubjects}` : cleanSubjects);

  const tutoringFormat =
    job.tutoringFormat?.trim() || `${job.mode} · ${job.medium}`;
  const tutorPreference =
    job.tutorPreference?.trim() || job.preferredGender || 'Any';

  return {
    circular_id: job.id,
    title: (job.titleEn || job.requirements || '').trim(),
    class_subject: classSubject,
    upazila: job.upazila || 'Madaripur Sadar',
    location_details: (job.landmarkEn || job.upazila || '').trim(),
    tutoring_format: tutoringFormat,
    salary: Number(job.salaryBdt) || 3000,
    days_per_week: Number(job.daysPerWeek) || 3,
    tutor_preference: tutorPreference,
    guardian_phone: (job.contactPhone || '').trim(),
    status: (job.status || 'Active').trim(),
    num_students: Number(job.numStudents) || 1,
  };
}

export function buildLiveSupabaseCircularInsertPayload(
  job: TuitionJob
): Record<string, any> {
  const legacyRow = mapTuitionJobToCircularRow(job);
  const cleanSubjects =
    job.subjectsEn && job.subjectsEn.length > 0
      ? job.subjectsEn.join(', ')
      : legacyRow.class_subject || 'General Science & Math';
  const cleanGuardianName = (job.guardianName || 'Verified Guardian').trim();

  return {
    id: job.id,
    title: legacyRow.title,
    class_level: (
      job.studentClassEn ||
      legacyRow.class_subject ||
      'SSC / HSC'
    ).trim(),
    medium: (job.medium || 'Bangla Medium').trim(),
    subjects: cleanSubjects,
    location: legacyRow.location_details || legacyRow.upazila,
    upazila: legacyRow.upazila,
    salary: Number(legacyRow.salary) || 3000,
    days_per_week: String(legacyRow.days_per_week || 3),
    tutor_gender: legacyRow.tutor_preference || job.preferredGender || 'Any',
    guardian_name: cleanGuardianName,
    guardian_phone: legacyRow.guardian_phone,
    guardian_address: legacyRow.location_details || legacyRow.upazila,
    status: 'Active',
    applicants: [],
    rejection_note: null,
    raw_data: {
      ...legacyRow,
      circular_id: job.id,
      status: 'Active',
      hidden_from_admin: false,
      guardian_name: cleanGuardianName,
      mode: job.mode || 'Home',
      medium: job.medium || 'Bangla Medium',
    },
  };
}

export async function insertTuitionCircularToSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  job: TuitionJob
): Promise<{ ok: boolean; error: { message: string } | null }> {
  if (!supabaseClient || typeof supabaseClient.from !== 'function') {
    return { ok: false, error: { message: 'Supabase client unavailable' } };
  }

  const legacyRow = mapTuitionJobToCircularRow(job);
  const liveRow = buildLiveSupabaseCircularInsertPayload(job);

  try {
    // 1. Primary insert for live `public.tuition_circulars` table (`id`, `status: 'Active'`, `raw_data.hidden_from_admin: false`)
    const primaryRes = await supabaseClient
      .from('tuition_circulars')
      .insert([liveRow]);

    if (!primaryRes?.error) {
      return { ok: true, error: null };
    }

    // 2. Fallback for `circular_id` + `hidden_from_admin` table schema
    const secondaryRes = await supabaseClient
      .from('tuition_circulars')
      .insert([
        {
          ...legacyRow,
          status: 'Active',
          hidden_from_admin: false,
        },
      ]);

    if (!secondaryRes?.error) {
      return { ok: true, error: null };
    }

    // 3. Fallback for `circular_id` table schema without `hidden_from_admin`
    const tertiaryRes = await supabaseClient
      .from('tuition_circulars')
      .insert([{ ...legacyRow, status: 'Active' }]);

    if (!tertiaryRes?.error) {
      return { ok: true, error: null };
    }

    return {
      ok: false,
      error: {
        message:
          primaryRes.error?.message ||
          secondaryRes.error?.message ||
          tertiaryRes.error?.message ||
          'Failed to insert tuition circular',
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: {
        message:
          err instanceof Error
            ? err.message
            : 'Failed to insert tuition circular',
      },
    };
  }
}

export async function updateTuitionCircularInSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  circularId: string,
  updates: {
    status?: string;
    guardian_phone?: string;
    location_details?: string;
  }
): Promise<void> {
  if (
    !supabaseClient ||
    typeof supabaseClient.from !== 'function' ||
    !circularId
  ) {
    return;
  }

  const livePayload: Record<string, any> = {};
  const legacyPayload: Record<string, any> = {};

  if (updates.status !== undefined) {
    livePayload.status = updates.status;
    legacyPayload.status = updates.status;
  }
  if (updates.guardian_phone !== undefined) {
    livePayload.guardian_phone = updates.guardian_phone;
    legacyPayload.guardian_phone = updates.guardian_phone;
  }
  if (updates.location_details !== undefined) {
    livePayload.location = updates.location_details;
    livePayload.guardian_address = updates.location_details;
    legacyPayload.location_details = updates.location_details;
  }

  try {
    const res = await supabaseClient
      .from('tuition_circulars')
      .update(livePayload)
      .eq('id', circularId);
    if (res?.error) {
      await supabaseClient
        .from('tuition_circulars')
        .update(legacyPayload)
        .eq('circular_id', circularId);
    }
  } catch {
    try {
      await supabaseClient
        .from('tuition_circulars')
        .update(legacyPayload)
        .eq('circular_id', circularId);
    } catch {
      // Ignore network errors
    }
  }
}

export async function hideTuitionCircularInSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  circularId: string
): Promise<void> {
  if (
    !supabaseClient ||
    typeof supabaseClient.from !== 'function' ||
    !circularId
  ) {
    return;
  }

  try {
    const existingRes = await supabaseClient
      .from('tuition_circulars')
      .select('id,raw_data')
      .eq('id', circularId)
      .limit(1);

    if (
      !existingRes?.error &&
      Array.isArray(existingRes?.data) &&
      existingRes.data.length > 0
    ) {
      const existingRaw =
        existingRes.data[0]?.raw_data &&
        typeof existingRes.data[0].raw_data === 'object'
          ? existingRes.data[0].raw_data
          : {};
      await supabaseClient
        .from('tuition_circulars')
        .update({
          raw_data: {
            ...existingRaw,
            hidden_from_admin: true,
          },
        })
        .eq('id', circularId);
      return;
    }
  } catch {
    // Fallback below
  }

  try {
    await supabaseClient
      .from('tuition_circulars')
      .update({ hidden_from_admin: true })
      .eq('circular_id', circularId);
  } catch {
    // Ignore network errors
  }
}

export async function deleteTuitionCircularFromSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  circularId: string
): Promise<void> {
  if (
    !supabaseClient ||
    typeof supabaseClient.from !== 'function' ||
    !circularId
  ) {
    return;
  }

  try {
    await supabaseClient
      .from('circular_applications')
      .delete()
      .eq('circular_id', circularId);
  } catch {
    // Ignore application delete error
  }

  try {
    const delById = await supabaseClient
      .from('tuition_circulars')
      .delete()
      .eq('id', circularId);
    if (delById?.error) {
      await supabaseClient
        .from('tuition_circulars')
        .delete()
        .eq('circular_id', circularId);
    }
  } catch {
    try {
      await supabaseClient
        .from('tuition_circulars')
        .delete()
        .eq('circular_id', circularId);
    } catch {
      // Ignore circular delete error
    }
  }
}

export function sortCircularRowsNewestFirst(
  rows: TuitionCircularRow[]
): TuitionCircularRow[] {
  return [...rows].sort((a, b) => {
    const timeA = Date.parse(a.created_at || '') || 0;
    const timeB = Date.parse(b.created_at || '') || 0;
    return timeB - timeA;
  });
}

export function mapCircularRowToTuitionJob(
  row: TuitionCircularRow
): TuitionJob {
  const rawData =
    row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {};

  const rawUpazila = (
    row.upazila ||
    rawData.upazila ||
    'Madaripur Sadar'
  ).trim();
  const matchedUpazila =
    VALID_UPAZILAS.find(
      (u) => u.toLowerCase() === rawUpazila.toLowerCase()
    ) ||
    VALID_UPAZILAS.find((u) =>
      rawUpazila.toLowerCase().includes(u.toLowerCase())
    ) ||
    'Madaripur Sadar';

  const landmark = (
    row.location_details ||
    rawData.location_details ||
    row.location ||
    row.guardian_address ||
    rawData.landmarkEn ||
    matchedUpazila
  ).trim();

  const subjectsFromCol = Array.isArray(row.subjects)
    ? row.subjects.join(', ')
    : (row.subjects || '').trim();
  const classLevelFromCol = (row.class_level || '').trim();
  const combinedClassSubjectFromCols =
    classLevelFromCol && subjectsFromCol
      ? `${classLevelFromCol} · ${subjectsFromCol}`
      : classLevelFromCol || subjectsFromCol;

  const rawClassSubject: string = String(
    row.class_subject ||
      rawData.class_subject ||
      combinedClassSubjectFromCols ||
      'Class 9-10 · General Science & Math'
  ).trim();

  let studentClass = rawClassSubject;
  let subjectsList = [rawClassSubject];
  if (rawClassSubject.includes('·')) {
    const [clsPart, ...subjParts] = rawClassSubject.split('·');
    studentClass = clsPart.trim() || 'SSC / HSC';
    const joinedSubj = subjParts.join('·').trim();
    subjectsList = joinedSubj
      ? joinedSubj
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [rawClassSubject];
  } else if (rawClassSubject.includes(',')) {
    const parts = rawClassSubject.split(',');
    if (parts.length > 1) {
      studentClass = parts[0].trim();
      subjectsList = parts
        .slice(1)
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
  }

  const rawMediumCol = (row.medium || rawData.medium || '').trim();
  const rawModeCol = (rawData.mode || 'Home').trim();
  const rawFormat = (
    row.tutoring_format ||
    rawData.tutoring_format ||
    (rawMediumCol ? `${rawModeCol} · ${rawMediumCol}` : 'Home · Bangla Medium')
  ).trim();

  const mode: TuitionJob['mode'] = rawFormat.toLowerCase().includes('online')
    ? 'Online'
    : rawFormat.toLowerCase().includes('group')
    ? 'Group'
    : 'Home';

  const medium: TuitionJob['medium'] = rawFormat
    .toLowerCase()
    .includes('english version')
    ? 'English Version'
    : rawFormat.toLowerCase().includes('admission')
    ? 'Admission Test'
    : rawFormat.toLowerCase().includes('madrasah') ||
      rawFormat.toLowerCase().includes('quran')
    ? 'Madrasah/Quranic'
    : rawFormat.toLowerCase().includes('ict')
    ? 'ICT'
    : 'Bangla Medium';

  const rawPref = (
    row.tutor_preference ||
    rawData.tutor_preference ||
    row.tutor_gender ||
    'Any'
  ).trim();
  const preferredGender: 'Any' | 'Male' | 'Female' = rawPref
    .toLowerCase()
    .includes('female')
    ? 'Female'
    : rawPref.toLowerCase().includes('male')
    ? 'Male'
    : 'Any';

  const createdDate = row.created_at ? new Date(row.created_at) : null;
  const isValidDate = createdDate && !Number.isNaN(createdDate.getTime());
  const formattedDateEn = isValidDate
    ? createdDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Live Circular';

  const titleText = (
    row.title ||
    rawData.title ||
    `${rawClassSubject} Tutor Needed in ${matchedUpazila}`
  ).trim();

  const parsedSalary =
    Number(String(row.salary ?? rawData.salary ?? '').replace(/[^\d.]/g, '')) ||
    3000;
  const parsedDays =
    Number(
      String(row.days_per_week ?? rawData.days_per_week ?? '').replace(
        /[^\d]/g,
        ''
      )
    ) || 3;
  const parsedNumStudents =
    Number(
      String(
        row.num_students ?? rawData.num_students ?? rawData.numStudents ?? ''
      ).replace(/[^\d]/g, '')
    ) || 1;

  const resolvedId = (
    row.circular_id ||
    rawData.circular_id ||
    row.id ||
    rawData.id ||
    `MDP-${Math.floor(2047 + Math.random() * 900)}`
  ).trim();

  const rawStatus = (row.status || rawData.status || 'Active').trim();
  const normalizedStatus =
    rawStatus.toLowerCase() === 'open' || rawStatus.toLowerCase() === 'active'
      ? 'Active'
      : rawStatus;

  const guardianName = (
    row.guardian_name ||
    rawData.guardian_name ||
    rawData.guardianName ||
    'Verified Guardian'
  ).trim();

  const guardianPhone = (
    row.guardian_phone ||
    rawData.guardian_phone ||
    rawData.contactPhone ||
    ''
  ).trim();

  const hiddenFromAdmin = Boolean(
    row.hidden_from_admin ??
      rawData.hidden_from_admin ??
      rawData.hiddenFromAdmin ??
      false
  );

  return {
    id: resolvedId,
    titleEn: titleText,
    titleBn: titleText,
    studentClassEn: studentClass,
    studentClassBn: studentClass,
    upazila: matchedUpazila,
    landmarkEn: landmark,
    landmarkBn: landmark,
    medium,
    mode,
    subjectsEn: subjectsList.length > 0 ? subjectsList : [rawClassSubject],
    subjectsBn: subjectsList.length > 0 ? subjectsList : [rawClassSubject],
    daysPerWeek: parsedDays,
    salaryBdt: parsedSalary,
    numStudents: parsedNumStudents,
    preferredGender,
    preferredInstitutionEn: 'Verified Madaripur Tutor',
    preferredInstitutionBn: 'যাচাইকৃত মাদারীপুর টিউটর',
    postedAgoEn: formattedDateEn,
    postedAgoBn: formattedDateEn,
    guardianName,
    contactPhone: guardianPhone,
    requirements: titleText,
    classSubject: rawClassSubject,
    tutoringFormat: rawFormat,
    tutorPreference: rawPref,
    status: normalizedStatus,
    createdAt: row.created_at || new Date().toISOString(),
    applicantsCount: 0,
    urgent: true,
    hiddenFromAdmin,
  };
}

export interface CircularApplicationInput {
  tutorId: string;
  tutorName: string;
  tutorPhone: string;
  qualification: string;
  experienceNote?: string;
  userEmail?: string | null;
  userId?: string | null;
}

export function normalizeLookupToken(val?: string | null): string {
  return (val || '').trim().toLowerCase().replace(/[\s-]/g, '');
}

export function validateCircularApplicationInput(
  input: CircularApplicationInput
): { valid: boolean; error?: string } {
  const cleanName = (input.tutorName || '').trim();
  const cleanPhone = (input.tutorPhone || '').trim();
  const cleanQual = (input.qualification || '').trim();

  if (cleanName.length < 2) {
    return {
      valid: false,
      error: 'Please enter your full name.',
    };
  }

  if (!validatePhoneBD(cleanPhone)) {
    return {
      valid: false,
      error: 'Please enter a valid 11-digit BD mobile number (01XXXXXXXXX).',
    };
  }

  if (cleanQual.length < 2) {
    return {
      valid: false,
      error: 'Please enter your University / College & Qualification.',
    };
  }

  return { valid: true };
}

export function buildCircularApplicationRow(
  circularId: string,
  input: CircularApplicationInput,
  userAccount?: UserAccount | null,
  tutorProfile?: VerificationRequest | null
): CircularApplicationRow {
  const cleanPhone = (
    input.tutorPhone ||
    tutorProfile?.phone ||
    ''
  )
    .trim()
    .replace(/[\s-]/g, '');
  const cleanTutorId =
    (input.tutorId || '').trim() ||
    (tutorProfile?.id || '').trim() ||
    cleanPhone;
  const cleanName =
    (input.tutorName || '').trim() ||
    (tutorProfile?.tutorNameEn || '').trim() ||
    (userAccount?.fullName || '').trim();
  const cleanQualification =
    (input.qualification || '').trim() ||
    (tutorProfile
      ? `${tutorProfile.institutionFullEn} · ${tutorProfile.departmentEn}`
      : '');

  const rawEmail = (
    input.userEmail ||
    userAccount?.email ||
    tutorProfile?.userEmail ||
    ''
  )
    .trim()
    .toLowerCase();
  const rawUserId = (
    input.userId ||
    (rawEmail ? rawEmail.split('@')[0] : '') ||
    userAccount?.id ||
    userAccount?.fullName ||
    tutorProfile?.userId ||
    ''
  ).trim();

  return {
    circular_id: circularId.trim(),
    user_email: rawEmail || null,
    user_id: rawUserId || null,
    tutor_id: cleanTutorId,
    tutor_name: cleanName,
    tutor_phone: cleanPhone,
    institution_qualification: cleanQualification,
    experience_note: (input.experienceNote || '').trim(),
    status: 'Pending',
  };
}

export const DUPLICATE_CIRCULAR_APPLICATION_MESSAGE =
  'You have already applied to this tuition circular. You can apply once per circular.';

export function isActiveApplicationRow(app: CircularApplicationRow): boolean {
  return (
    app.circular_id !== 'ARCHIVED-TEST' &&
    (app.status || '').trim().toLowerCase() !== 'archived'
  );
}

export function getApplicationsForCircular(
  applications: CircularApplicationRow[],
  circularId: string
): CircularApplicationRow[] {
  const targetCircularId = (circularId || '').trim();
  return applications.filter(
    (app) =>
      isActiveApplicationRow(app) &&
      (app.circular_id || '').trim() === targetCircularId
  );
}

export function getConfirmedApplicationForCircular(
  applications: CircularApplicationRow[],
  circularId: string
): CircularApplicationRow | undefined {
  return applications.find((app) => {
    if (!isActiveApplicationRow(app) || app.circular_id !== circularId) {
      return false;
    }
    const s = (app.status || '').trim().toLowerCase();
    return (
      s === 'confirmed' ||
      s === 'approved' ||
      s === 'verified_for_tuition' ||
      s === 'verified for tuition'
    );
  });
}

export function matchesTutorIdentifier(
  app: CircularApplicationRow,
  lookupQuery: string
): boolean {
  if (!isActiveApplicationRow(app)) return false;
  const token = normalizeLookupToken(lookupQuery);
  if (!token) return false;
  const appIdToken = normalizeLookupToken(app.tutor_id);
  const appPhoneToken = normalizeLookupToken(app.tutor_phone);
  return appIdToken === token || appPhoneToken === token;
}

export function findTutorApplicationsByQuery(
  applications: CircularApplicationRow[],
  lookupQuery: string
): CircularApplicationRow[] {
  const token = normalizeLookupToken(lookupQuery);
  if (!token) return [];
  return applications.filter((app) => matchesTutorIdentifier(app, lookupQuery));
}

export function getTutorApplicationForCircular(
  applications: CircularApplicationRow[],
  circularId: string,
  lookupQuery: string
): CircularApplicationRow | undefined {
  const circularApps = getApplicationsForCircular(applications, circularId);
  if (circularApps.length === 0) return undefined;
  const matching = circularApps.filter((app) =>
    matchesTutorIdentifier(app, lookupQuery)
  );
  if (matching.length === 0) return undefined;
  return (
    matching.find(
      (app) => (app.status || '').trim().toLowerCase() === 'confirmed'
    ) || matching[0]
  );
}

/**
 * Strictly checks if a circular application belongs to the currently logged-in user.
 * Never matches when the visitor is logged out or when the application is bound to another account.
 */
export const ADMIN_REJECTION_QUICK_REASONS = [
  'NID/Student ID Unclear',
  'Subject/Class Mismatch',
  'Location Too Far',
  'Incomplete Profile',
] as const;

export function doesApplicationBelongToUser(
  app: CircularApplicationRow,
  user?: UserAccount | string | null,
  userProfile?: VerificationRequest | null
): boolean {
  if (!isActiveApplicationRow(app) || (!user && !userProfile)) return false;

  const cleanEmail = (
    typeof user === 'string'
      ? user
      : user?.email || userProfile?.userEmail || userProfile?.email || ''
  )
    .trim()
    .toLowerCase();
  const explicitUserId = (
    typeof user === 'string' ? '' : user?.id || userProfile?.userId || ''
  )
    .trim()
    .toLowerCase();
  const cleanUserId = (
    typeof user === 'string'
      ? user.split('@')[0]
      : user?.id ||
        user?.fullName ||
        userProfile?.userId ||
        (cleanEmail ? cleanEmail.split('@')[0] : '')
  )
    .trim()
    .toLowerCase();
  const cleanUsernameFromEmail = cleanEmail ? cleanEmail.split('@')[0] : '';

  const appEmail = (app.user_email || '').trim().toLowerCase();
  const appUserId = (app.user_id || '').trim().toLowerCase();

  // Primary check: user_id === currentUser.id OR LOWER(user_email) === LOWER(currentUser.email)
  if (cleanEmail && appEmail && appEmail === cleanEmail) {
    return true;
  }
  if (explicitUserId && appUserId && appUserId === explicitUserId) {
    return true;
  }

  // If the application has an explicit user_email recorded, check if it matches profile email
  if (appEmail) {
    const profileEmail = (userProfile?.userEmail || userProfile?.email || '')
      .trim()
      .toLowerCase();
    if (profileEmail && appEmail === profileEmail) {
      return true;
    }
    if (cleanEmail && appEmail !== cleanEmail) {
      return false;
    }
  }

  // If the application has a user_id recorded, check against the logged-in user's username/id
  if (appUserId) {
    if (
      (cleanUserId && appUserId === cleanUserId) ||
      (cleanUsernameFromEmail && appUserId === cleanUsernameFromEmail) ||
      (cleanEmail && appUserId === cleanEmail)
    ) {
      return true;
    }
  }

  // Check against the tutor's profile (tutor ID or phone) when owned by current user
  if (userProfile) {
    const profileEmail = (userProfile.userEmail || userProfile.email || '')
      .trim()
      .toLowerCase();
    const isProfileOwnedByCurrentUser =
      !cleanEmail || !profileEmail || profileEmail === cleanEmail;

    if (isProfileOwnedByCurrentUser) {
      const profileCodeToken = normalizeLookupToken(userProfile.id);
      const profileTutorIdToken = normalizeLookupToken(userProfile.tutorId);
      const profilePhoneToken = normalizeLookupToken(userProfile.phone);
      const appIdToken = normalizeLookupToken(app.tutor_id);
      const appPhoneToken = normalizeLookupToken(app.tutor_phone);
      if (
        (profileCodeToken && appIdToken && appIdToken === profileCodeToken) ||
        (profileTutorIdToken &&
          appIdToken &&
          appIdToken === profileTutorIdToken) ||
        (profilePhoneToken && appPhoneToken && appPhoneToken === profilePhoneToken)
      ) {
        return true;
      }
    }
  }

  return false;
}

export function hasTutorAlreadyAppliedToCircular(
  applications: CircularApplicationRow[],
  circularId: string,
  user?: UserAccount | string | null,
  userProfile?: VerificationRequest | null,
  candidateInput?: {
    tutorId?: string | null;
    tutorPhone?: string | null;
    userEmail?: string | null;
    userId?: string | null;
  }
): CircularApplicationRow | undefined {
  const existingForUser = getUserApplicationForCircular(
    applications,
    circularId,
    user,
    userProfile
  );
  if (existingForUser) return existingForUser;

  if (!candidateInput) return undefined;
  const candidateId = normalizeLookupToken(candidateInput.tutorId);
  const candidatePhone = normalizeLookupToken(candidateInput.tutorPhone);
  const candidateEmail = (candidateInput.userEmail || '').trim().toLowerCase();
  const candidateUserId = (candidateInput.userId || '').trim().toLowerCase();

  const circularApps = getApplicationsForCircular(applications, circularId);
  return circularApps.find((app) => {
    const appEmail = (app.user_email || '').trim().toLowerCase();
    const appUserId = (app.user_id || '').trim().toLowerCase();
    const appId = normalizeLookupToken(app.tutor_id);
    const appPhone = normalizeLookupToken(app.tutor_phone);

    if (candidateEmail && appEmail && candidateEmail === appEmail) return true;
    if (candidateUserId && appUserId && candidateUserId === appUserId)
      return true;
    if (candidateId && appId && candidateId === appId) return true;
    if (candidatePhone && appPhone && candidatePhone === appPhone) return true;
    return false;
  });
}

export function isTutorAccountRestricted(
  profile?: Partial<VerificationRequest> | null
): boolean {
  if (!profile) return false;
  if (profile.is_rejected === true) return true;
  const rawStatus = (profile.status || '').trim().toLowerCase();
  return rawStatus === 'rejected';
}

export function getTutorAccountRestrictionDetails(
  profile?: Partial<VerificationRequest> | null,
  userApplications: CircularApplicationRow[] = []
): {
  isRestricted: boolean;
  badgeText: string;
  adminNote: string;
} {
  const restricted = isTutorAccountRestricted(profile);
  const rejectedAppWithNote = userApplications.find(
    (a) =>
      (a.status || '').trim().toLowerCase() === 'rejected' &&
      Boolean(extractAdminNoteFromApplication(a) || a.rejection_note)
  );
  const noteFromProfile = (
    profile?.rejection_note ||
    profile?.adminNote ||
    ''
  ).trim();
  const noteFromApp = rejectedAppWithNote
    ? (
        rejectedAppWithNote.rejection_note ||
        extractAdminNoteFromApplication(rejectedAppWithNote) ||
        ''
      ).trim()
    : '';
  const resolvedNote =
    noteFromProfile ||
    noteFromApp ||
    'Your profile or verification documents require attention. Please review your NID/Student ID details and contact Admin for re-verification.';

  return {
    isRestricted: restricted,
    badgeText: 'Action Required / Application Restricted',
    adminNote: resolvedNote,
  };
}

export type CircularCardApplyButtonStateType =
  | 'restricted'
  | 'pending'
  | 'confirmed'
  | 'media_fee'
  | 'rejected'
  | 'can_apply';

export function getCircularCardApplyButtonState(
  application?: CircularApplicationRow | null,
  options?: {
    isTutorRestricted?: boolean;
    isPaymentApproved?: boolean;
    lang?: Language;
  }
): {
  state: CircularCardApplyButtonStateType;
  label: string;
  interactive: boolean;
} {
  const lang = options?.lang || 'en';
  const isRestricted = Boolean(options?.isTutorRestricted);
  const isPaymentApproved = Boolean(options?.isPaymentApproved);

  if (application && isActiveApplicationRow(application)) {
    const normalized = (application.status || 'Pending').trim().toLowerCase();
    if (
      normalized === 'confirmed' ||
      normalized === 'approved' ||
      (normalized === 'verified_for_tuition' && isPaymentApproved)
    ) {
      return {
        state: 'confirmed',
        label:
          lang === 'en'
            ? '✅ Selected for Tuition'
            : '✅ টিউশনির জন্য নির্বাচিত',
        interactive: false,
      };
    }

    if (
      normalized === 'verified_for_tuition' ||
      normalized === 'verified for tuition'
    ) {
      return {
        state: 'media_fee',
        label:
          lang === 'en'
            ? '💳 Verified · Pay Media Fee'
            : '💳 ভেরিফাইড · মিডিয়া ফি দিন',
        interactive: true,
      };
    }

    if (normalized === 'rejected') {
      return {
        state: 'rejected',
        label: lang === 'en' ? '🚫 Not Selected' : '🚫 নির্বাচিত হননি',
        interactive: false,
      };
    }

    return {
      state: 'pending',
      label: 'Already Applied ✓',
      interactive: false,
    };
  }

  if (isRestricted) {
    return {
      state: 'restricted',
      label:
        lang === 'en' ? '🔒 Account Restricted' : '🔒 অ্যাকাউন্ট সীমাবদ্ধ',
      interactive: false,
    };
  }

  return {
    state: 'can_apply',
    label: lang === 'en' ? '🚀 Apply Now' : '🚀 আবেদন করুন',
    interactive: true,
  };
}

export function getUserApplicationForCircular(
  applications: CircularApplicationRow[],
  circularId: string,
  user?: UserAccount | string | null,
  userProfile?: VerificationRequest | null
): CircularApplicationRow | undefined {
  if (!user && !userProfile) return undefined;
  const circularApps = getApplicationsForCircular(applications, circularId);
  const myApps = circularApps.filter((app) =>
    doesApplicationBelongToUser(app, user, userProfile)
  );
  if (myApps.length === 0) return undefined;
  return (
    myApps.find(
      (app) => (app.status || '').trim().toLowerCase() === 'confirmed'
    ) || myApps[0]
  );
}

export function getUserAppliedApplications(
  applications: CircularApplicationRow[],
  user?: UserAccount | string | null,
  userProfile?: VerificationRequest | null
): CircularApplicationRow[] {
  if (!user && !userProfile) return [];
  return applications.filter((app) =>
    doesApplicationBelongToUser(app, user, userProfile)
  );
}

export function getUserCircularApplicationStatusBadge(
  status?: string,
  _lang: Language = 'en',
  mediaFee?: number
): {
  label: string;
  tone: 'pending' | 'confirmed' | 'rejected';
} {
  const normalized = (status || 'Pending').trim().toLowerCase();
  if (
    normalized === 'verified_for_tuition' ||
    normalized === 'verified for tuition'
  ) {
    if (typeof mediaFee === 'number' && mediaFee > 0) {
      return {
        label:
          _lang === 'en'
            ? `💳 Verified (Media Fee Required: ৳${mediaFee})`
            : `💳 ভেরিফাইড (মিডিয়া ফি প্রয়োজন: ৳${mediaFee})`,
        tone: 'confirmed',
      };
    }
    return {
      label:
        _lang === 'en'
          ? '💳 Verified for Tuition (Media Fee Required)'
          : '💳 টিউশনির জন্য ভেরিফাইড · মিডিয়া ফি প্রদান করুন',
      tone: 'confirmed',
    };
  }
  if (normalized === 'confirmed' || normalized === 'approved') {
    return {
      label:
        _lang === 'en'
          ? '✅ Confirmed for Tuition'
          : '✅ টিউশনির জন্য নিশ্চিত (Confirmed)',
      tone: 'confirmed',
    };
  }
  if (normalized === 'rejected') {
    return {
      label: '❌ Rejected',
      tone: 'rejected',
    };
  }
  return {
    label: '⏳ Applied - Pending',
    tone: 'pending',
  };
}

/**
 * Links an application from "circular_applications" with the applicant's full record
 * from the Supabase "tutor_verifications" table (matching by user_email, user_id,
 * verification_code / tutor_id, or mobile_number / tutor_phone).
 */
export function findApplicantFullTutorProfile(
  app: CircularApplicationRow,
  verificationRequests: VerificationRequest[]
): VerificationRequest | undefined {
  if (!verificationRequests || verificationRequests.length === 0) {
    return undefined;
  }

  const appEmail = (app.user_email || '').trim().toLowerCase();
  const appUserId = (app.user_id || '').trim().toLowerCase();
  const appTutorIdToken = normalizeLookupToken(app.tutor_id);
  const appPhoneToken = normalizeLookupToken(app.tutor_phone);

  // 1. Match by user_email
  if (appEmail) {
    const byEmail = verificationRequests.find(
      (req) => (req.userEmail || '').trim().toLowerCase() === appEmail
    );
    if (byEmail) return byEmail;
  }

  // 2. Match by verification_code / tutor_id
  if (appTutorIdToken) {
    const byTutorId = verificationRequests.find(
      (req) =>
        normalizeLookupToken(req.id) === appTutorIdToken ||
        normalizeLookupToken(req.tutorId) === appTutorIdToken
    );
    if (byTutorId) return byTutorId;
  }

  // 3. Match by user_id
  if (appUserId) {
    const byUserId = verificationRequests.find((req) => {
      const reqUserId = (req.userId || '').trim().toLowerCase();
      const reqEmailPrefix = (req.userEmail || '')
        .trim()
        .toLowerCase()
        .split('@')[0];
      return (
        (reqUserId && reqUserId === appUserId) ||
        (reqEmailPrefix && reqEmailPrefix === appUserId)
      );
    });
    if (byUserId) return byUserId;
  }

  // 4. Match by mobile_number / tutor_phone
  if (appPhoneToken) {
    const byPhone = verificationRequests.find(
      (req) => normalizeLookupToken(req.phone) === appPhoneToken
    );
    if (byPhone) return byPhone;
  }

  return undefined;
}

export function enrichCircularJobsWithApplications(
  jobs: TuitionJob[],
  applications: CircularApplicationRow[]
): TuitionJob[] {
  return jobs.map((job) => {
    const jobApps = getApplicationsForCircular(applications, job.id);
    const confirmedApp = getConfirmedApplicationForCircular(
      applications,
      job.id
    );
    const isConfirmedStatus =
      Boolean(confirmedApp) ||
      (job.status || '').trim().toLowerCase().startsWith('confirmed');

    return {
      ...job,
      applicantsCount: jobApps.length,
      status: isConfirmedStatus ? 'Confirmed' : job.status || 'Active',
      confirmedTutorId: confirmedApp?.tutor_id || job.confirmedTutorId,
      confirmedTutorName: confirmedApp?.tutor_name || job.confirmedTutorName,
    };
  });
}

export interface ConfirmCircularOptions {
  status?: 'verified_for_tuition' | 'confirmed' | 'Confirmed' | string;
  mediaFee?: number;
  guardianPhone?: string;
  guardianAddress?: string;
  adminNote?: string;
}

export function formatApplicationNoteWithMetadata(
  existingNote?: string | null,
  options?: {
    isDirectConfirmed?: boolean;
    mediaFee?: number;
    adminNote?: string;
  }
): string {
  let cleaned = (existingNote || '')
    .replace(/\s*\[Media Fee:.*?\]/gi, '')
    .trim();

  if (options?.adminNote !== undefined) {
    cleaned = cleaned.replace(/\s*\[Admin Note:.*?\]/gi, '').trim();
    const trimmedAdminNote = options.adminNote.trim();
    if (trimmedAdminNote) {
      cleaned = `${cleaned} [Admin Note: ${trimmedAdminNote}]`.trim();
    }
  }

  if (
    !options?.isDirectConfirmed &&
    options?.mediaFee !== undefined &&
    options.mediaFee > 0
  ) {
    cleaned = `${cleaned} [Media Fee: ৳${options.mediaFee}]`.trim();
  }

  return cleaned;
}

export function confirmTutorForCircularState(
  jobs: TuitionJob[],
  applications: CircularApplicationRow[],
  circularId: string,
  targetApplication: CircularApplicationRow,
  options?: ConfirmCircularOptions
): { jobs: TuitionJob[]; applications: CircularApplicationRow[] } {
  const targetStatus = options?.status || 'verified_for_tuition';
  const isDirectConfirmed =
    targetStatus.trim().toLowerCase() === 'confirmed' ||
    targetStatus.trim().toLowerCase() === 'approved';
  const mediaFee = options?.mediaFee;
  const guardianPhone = options?.guardianPhone;
  const guardianAddress = options?.guardianAddress;
  const adminNote = options?.adminNote;

  const updatedApplications = applications.map((app) => {
    if (app.circular_id !== circularId) return app;
    const isTarget =
      (targetApplication.id && app.id === targetApplication.id) ||
      (!targetApplication.id &&
        normalizeLookupToken(app.tutor_id) ===
          normalizeLookupToken(targetApplication.tutor_id) &&
        normalizeLookupToken(app.tutor_phone) ===
          normalizeLookupToken(targetApplication.tutor_phone));

    if (isTarget) {
      const expNote = formatApplicationNoteWithMetadata(app.experience_note, {
        isDirectConfirmed,
        mediaFee: isDirectConfirmed ? 0 : mediaFee,
        adminNote,
      });

      return {
        ...app,
        status: targetStatus,
        is_rejected: false,
        rejection_note: null,
        media_fee: isDirectConfirmed
          ? 0
          : mediaFee !== undefined
          ? mediaFee
          : app.media_fee,
        guardian_phone: guardianPhone || app.guardian_phone,
        guardian_address: guardianAddress || app.guardian_address,
        admin_note:
          adminNote !== undefined ? adminNote.trim() : app.admin_note,
        experience_note: expNote,
      };
    }
    return app;
  });

  const updatedJobs = enrichCircularJobsWithApplications(
    jobs.map((job) =>
      job.id === circularId
        ? {
            ...job,
            status: 'Confirmed',
            confirmedTutorId: targetApplication.tutor_id,
            confirmedTutorName: targetApplication.tutor_name,
            contactPhone: guardianPhone || job.contactPhone,
            landmarkEn: guardianAddress || job.landmarkEn,
            landmarkBn: guardianAddress || job.landmarkBn,
          }
        : job
    ),
    updatedApplications
  );

  return {
    jobs: updatedJobs,
    applications: updatedApplications,
  };
}

export function rejectTutorForCircularState(
  jobs: TuitionJob[],
  applications: CircularApplicationRow[],
  circularId: string,
  targetApplication: CircularApplicationRow,
  rejectionNote?: string
): { jobs: TuitionJob[]; applications: CircularApplicationRow[] } {
  const cleanNote = (rejectionNote || '').trim();
  const updatedApplications = applications.map((app) => {
    if (app.circular_id !== circularId) return app;
    const isTarget =
      (targetApplication.id && app.id === targetApplication.id) ||
      (!targetApplication.id &&
        normalizeLookupToken(app.tutor_id) ===
          normalizeLookupToken(targetApplication.tutor_id) &&
        normalizeLookupToken(app.tutor_phone) ===
          normalizeLookupToken(targetApplication.tutor_phone));

    if (isTarget) {
      const resolvedNote =
        cleanNote || extractAdminNoteFromApplication(app) || undefined;
      const expNote = formatApplicationNoteWithMetadata(app.experience_note, {
        adminNote: resolvedNote,
      });
      return {
        ...app,
        status: 'Rejected',
        is_rejected: true,
        rejection_note: resolvedNote || null,
        admin_note: resolvedNote || app.admin_note,
        experience_note: expNote,
      };
    }
    return app;
  });

  const stillHasConfirmed = Boolean(
    getConfirmedApplicationForCircular(updatedApplications, circularId)
  );

  const updatedJobs = enrichCircularJobsWithApplications(
    jobs.map((job) =>
      job.id === circularId && !stillHasConfirmed
        ? {
            ...job,
            status: 'Active',
            confirmedTutorId: undefined,
            confirmedTutorName: undefined,
          }
        : job
    ),
    updatedApplications
  );

  return {
    jobs: updatedJobs,
    applications: updatedApplications,
  };
}

export function unblockTutorForCircularState(
  jobs: TuitionJob[],
  applications: CircularApplicationRow[],
  circularId: string,
  targetApplication: CircularApplicationRow
): { jobs: TuitionJob[]; applications: CircularApplicationRow[] } {
  const updatedApplications = applications.map((app) => {
    if (app.circular_id !== circularId) return app;
    const isTarget =
      (targetApplication.id && app.id === targetApplication.id) ||
      (!targetApplication.id &&
        normalizeLookupToken(app.tutor_id) ===
          normalizeLookupToken(targetApplication.tutor_id) &&
        normalizeLookupToken(app.tutor_phone) ===
          normalizeLookupToken(targetApplication.tutor_phone));

    if (isTarget) {
      const cleanExp = getCleanApplicantExperienceNote(app);
      return {
        ...app,
        status: 'Pending',
        is_rejected: false,
        rejection_note: null,
        admin_note: null,
        experience_note: cleanExp,
      };
    }
    return app;
  });

  const updatedJobs = enrichCircularJobsWithApplications(
    jobs,
    updatedApplications
  );

  return {
    jobs: updatedJobs,
    applications: updatedApplications,
  };
}

export function matchesAdminTabFilter(
  rawStatus: string | undefined,
  tab: 'All' | 'Pending' | 'Approved' | 'Rejected'
): boolean {
  if (tab === 'All') return true;
  const normalized = (rawStatus || 'Pending').trim().toLowerCase();
  if (tab === 'Pending') {
    return normalized === 'pending';
  }
  if (tab === 'Approved') {
    return normalized === 'confirmed' || normalized === 'approved';
  }
  if (tab === 'Rejected') {
    return normalized === 'rejected';
  }
  return true;
}

export function getCircularClassSubjectLabel(
  jobs: TuitionJob[],
  circularId: string,
  lang: Language = 'en'
): string {
  const matched = jobs.find((j) => j.id === circularId);
  if (!matched) {
    return lang === 'en'
      ? 'Tuition Circular Application'
      : 'টিউশনি সার্কুলার আবেদন';
  }
  if (matched.classSubject) {
    return matched.classSubject;
  }
  const cls =
    lang === 'en' ? matched.studentClassEn : matched.studentClassBn;
  const subjs = (
    lang === 'en' ? matched.subjectsEn : matched.subjectsBn
  ).join(', ');
  return cls && subjs ? `${cls} · ${subjs}` : cls || subjs || matched.titleEn;
}

export function extractCircularDetails(
  job: TuitionJob,
  lang: Language = 'en'
): {
  tuitionType: string;
  category: string;
  studentClass: string;
  numStudentsText: string;
  tutoringDaysText: string;
  preferredTutorText: string;
  locationText: string;
  subjectsList: string[];
} {
  const isEn = lang === 'en';

  // 1. Tuition Type
  let tuitionType = isEn ? 'Home Tuition' : 'হোম টিউশনি';
  if (job.mode === 'Online') {
    tuitionType = isEn ? 'Online Class' : 'অনলাইন ক্লাস';
  } else if (job.mode === 'Group') {
    tuitionType = isEn ? 'Group / Batch' : 'গ্রুপ / ব্যাচ';
  }

  // 2. Category / Medium
  const category =
    job.medium || (isEn ? 'Bangla Medium' : 'বাংলা মাধ্যম');

  // 3. Class & 8. Subjects
  let studentClass = isEn ? job.studentClassEn : job.studentClassBn;
  let subjectsList = isEn ? job.subjectsEn : job.subjectsBn;

  if (job.classSubject) {
    if (job.classSubject.includes('·')) {
      const [clsPart, ...subjParts] = job.classSubject.split('·');
      studentClass = clsPart.trim() || studentClass;
      const joined = subjParts.join('·').trim();
      if (joined) {
        subjectsList = joined
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    } else if (job.classSubject.includes(',')) {
      const parts = job.classSubject.split(',');
      if (parts.length > 1) {
        studentClass = parts[0].trim();
        subjectsList = parts.slice(1).map((s) => s.trim()).filter(Boolean);
      }
    }
  }

  if (!subjectsList || subjectsList.length === 0) {
    subjectsList = isEn ? ['General Science & Math'] : ['সাধারণ গণিত ও বিজ্ঞান'];
  }

  // 4. No. of Students
  const num = Number(job.numStudents) || 1;
  const numStudentsText = isEn
    ? `${num} ${num === 1 ? 'Student' : 'Students'}`
    : `${toBanglaNumber(num)} জন শিক্ষার্থী`;

  // 5. Tutoring Days
  const days = Number(job.daysPerWeek) || 3;
  const tutoringDaysText = isEn
    ? `${days} days/week`
    : `সপ্তাহে ${toBanglaNumber(days)} দিন`;

  // 6. Preferred Tutor
  let preferredTutorText = isEn ? 'Any Tutor' : 'যেকোনো টিউটর';
  const pref = (job.tutorPreference || job.preferredGender || '').toLowerCase();
  if (pref.includes('female')) {
    preferredTutorText = isEn ? 'Female Tutor' : 'মহিলা টিউটর';
  } else if (pref.includes('male')) {
    preferredTutorText = isEn ? 'Male Tutor' : 'পুরুষ টিউটর';
  }

  // 7. Location
  const upzName = isEn
    ? job.upazila
    : UPAZILA_LABELS[job.upazila]?.bn || job.upazila;
  const landmark = isEn ? job.landmarkEn : job.landmarkBn;
  const locationText = landmark ? `${upzName}: ${landmark}` : upzName;

  return {
    tuitionType,
    category,
    studentClass: studentClass || (isEn ? 'General' : 'সাধারণ'),
    numStudentsText,
    tutoringDaysText,
    preferredTutorText,
    locationText,
    subjectsList,
  };
}

export const SPECIFIC_MADARIPUR_COLLEGES: Exclude<CollegeTag, 'All'>[] = [
  'Madaripur Govt. College (Govt. Nazimuddin College)',
  'Govt. Sufia Mohila College, Madaripur',
  'Govt. Barhamganj College, Shibchar',
  'Kalkini Syed Abul Hossain College (Govt.)',
  "Govt. Sheikh Hasina Academy & Women's College, Dasar",
  'Rajoir Gopalganj K.J.S. Pilot Model Institution & College',
  'Rajoir Govt. Degree College',
  'Shibchar Nandakumar Model Institution & College',
  'Elias Ahmed Chowdhury Degree College, Shibchar',
  "Syed Abul Hossain Academy & Women's College, Madaripur",
  'Charmuguria Merchant College, Madaripur',
  'Khoajpur Tekerhat Fazlul Haque Degree College',
  'Alhaj Aminuddin High School & College, Madaripur',
  'Shashikar Shahid Smriti Degree College, Dasar',
  'Khaserhat Syed Abul Hossain Degree College, Kalkini',
  'Barthi Tara Prasanna High School & College',
  'Kadambari Union Degree College, Rajoir',
  'Rizvia Islamia Kamil Madrasah, Madaripur',
  'Madaripur Technical School & College (TSC)',
];

export const MADARIPUR_INSTITUTION_CATEGORIES: Exclude<CollegeTag, 'All'>[] = [
  ...SPECIFIC_MADARIPUR_COLLEGES,
  'Public University (DU / BUET / JU / RU / JNU)',
  'Medical College',
  'National University (NU) Affiliated College',
  'Private University / Other Institution',
];

/**
 * Aggressively memoized static/semi-static dropdown option lists so components
 * never reallocate or recompute dropdown arrays across renders or tab switches.
 */
export const MEMOIZED_ALL_UPAZILAS: readonly Upazila[] = Object.freeze([
  'All',
  'Madaripur Sadar',
  'Shibchar',
  'Kalkini',
  'Rajoir',
  'Dasar',
] as const);

export const MEMOIZED_COLLEGE_TAGS: readonly CollegeTag[] = Object.freeze([
  'All',
  ...MADARIPUR_INSTITUTION_CATEGORIES,
] as const);

export const MEMOIZED_MEDIUM_CATEGORIES: readonly MediumCategory[] = Object.freeze([
  'All',
  'Bangla Medium',
  'English Version',
  'Admission Test',
  'Madrasah/Quranic',
  'ICT',
] as const);

export const MADARIPUR_COLLEGE_LABELS_BN: Record<CollegeTag, string> = {
  All: 'সকল প্রতিষ্ঠান',
  'Madaripur Govt. College (Govt. Nazimuddin College)':
    'মাদারীপুর সরকারি কলেজ (সরকারি নাজিমউদ্দিন কলেজ)',
  'Govt. Sufia Mohila College, Madaripur':
    'সরকারি সুফিয়া মহিলা কলেজ, মাদারীপুর',
  'Govt. Barhamganj College, Shibchar': 'সরকারি বরহামগঞ্জ কলেজ, শিবচর',
  'Kalkini Syed Abul Hossain College (Govt.)':
    'কালকিনি সৈয়দ আবুল হোসেন কলেজ (সরকারি)',
  "Govt. Sheikh Hasina Academy & Women's College, Dasar":
    'সরকারি শেখ হাসিনা একাডেমি অ্যান্ড উইমেন্স কলেজ, ডাসার',
  'Rajoir Gopalganj K.J.S. Pilot Model Institution & College':
    'রাজৈর গোপালগঞ্জ কে.জে.এস. পাইলট মডেল ইনস্টিটিউশন ও কলেজ',
  'Rajoir Govt. Degree College': 'রাজৈর সরকারি ডিগ্রি কলেজ',
  'Shibchar Nandakumar Model Institution & College':
    'শিবচর নন্দকুমার মডেল ইনস্টিটিউশন ও কলেজ',
  'Elias Ahmed Chowdhury Degree College, Shibchar':
    'ইলিয়াস আহমেদ চৌধুরী ডিগ্রি কলেজ, শিবচর',
  "Syed Abul Hossain Academy & Women's College, Madaripur":
    'সৈয়দ আবুল হোসেন একাডেমি অ্যান্ড উইমেন্স কলেজ, মাদারীপুর',
  'Charmuguria Merchant College, Madaripur':
    'চরমুগরিয়া মার্চেন্টস কলেজ, মাদারীপুর',
  'Khoajpur Tekerhat Fazlul Haque Degree College':
    'খোয়াজপুর টেকেরহাট ফজলুল হক ডিগ্রি কলেজ',
  'Alhaj Aminuddin High School & College, Madaripur':
    'আলহাজ্ব আমিনউদ্দিন হাই স্কুল অ্যান্ড কলেজ, মাদারীপুর',
  'Shashikar Shahid Smriti Degree College, Dasar':
    'শশিকর শহীদ স্মৃতি ডিগ্রি কলেজ, ডাসার',
  'Khaserhat Syed Abul Hossain Degree College, Kalkini':
    'খাসেরহাট সৈয়দ আবুল হোসেন ডিগ্রি কলেজ, কালকিনি',
  'Barthi Tara Prasanna High School & College':
    'বার্থী তারা প্রসন্ন উচ্চ বিদ্যালয় ও কলেজ',
  'Kadambari Union Degree College, Rajoir':
    'কদমবাড়ী ইউনিয়ন ডিগ্রি কলেজ, রাজৈর',
  'Rizvia Islamia Kamil Madrasah, Madaripur':
    'রিজভিয়া ইসলামিয়া কামিল মাদ্রাসা, মাদারীপুর',
  'Madaripur Technical School & College (TSC)':
    'মাদারীপুর টেকনিক্যাল স্কুল ও কলেজ (TSC)',
  'Public University (DU / BUET / JU / RU / JNU)':
    'পাবলিক বিশ্ববিদ্যালয় (ঢাবি / বুয়েট / জাবি / রাবি / জবি)',
  'Medical College': 'মেডিকেল কলেজ',
  'National University (NU) Affiliated College':
    'জাতীয় বিশ্ববিদ্যালয় (NU) অধিভুক্ত কলেজ',
  'Private University / Other Institution':
    'বেসরকারি বিশ্ববিদ্যালয় / অন্যান্য প্রতিষ্ঠান',
  'Govt. Nazimuddin College': 'সরকারি নাজিমউদ্দিন কলেজ',
  'Madaripur Govt. College': 'মাদারীপুর সরকারি কলেজ',
  DU: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
  BUET: 'বুয়েট (BUET)',
  Medical: 'মেডিকেল কলেজ',
};

const VALID_COLLEGES: Exclude<CollegeTag, 'All'>[] = [
  ...MADARIPUR_INSTITUTION_CATEGORIES,
  'Govt. Nazimuddin College',
  'Madaripur Govt. College',
  'DU',
  'BUET',
  'Medical',
];

export function isSpecificMadaripurCollege(category: string): boolean {
  const clean = (category || '').trim();
  return SPECIFIC_MADARIPUR_COLLEGES.includes(
    clean as Exclude<CollegeTag, 'All'>
  );
}

export function resolveAutoFilledInstitutionName(
  selectedCategory: string,
  currentFullInstitutionName: string,
  previousCategory?: string
): string {
  const cleanSelected = (selectedCategory || '').trim();
  const cleanCurrent = (currentFullInstitutionName || '').trim();
  const cleanPrev = (previousCategory || '').trim();

  const isDefaultOrEmpty =
    !cleanCurrent ||
    (cleanPrev && cleanCurrent.toLowerCase() === cleanPrev.toLowerCase()) ||
    VALID_COLLEGES.some(
      (c) => c.toLowerCase() === cleanCurrent.toLowerCase()
    );

  if (isSpecificMadaripurCollege(cleanSelected)) {
    if (isDefaultOrEmpty) {
      return cleanSelected;
    }
    return cleanCurrent;
  }

  // If switching from a specific Madaripur college to a general category (e.g. Public University / Medical College)
  // and the field only held the previous auto-filled college name, clear it so the tutor can type their university name
  if (
    cleanCurrent &&
    SPECIFIC_MADARIPUR_COLLEGES.some(
      (c) => c.toLowerCase() === cleanCurrent.toLowerCase()
    )
  ) {
    return '';
  }

  return cleanCurrent;
}

export function matchesCollegeFilter(
  tutor: TutorProfile,
  selectedCollege: CollegeTag
): boolean {
  if (selectedCollege === 'All') return true;
  if (tutor.collegeTag === selectedCollege) return true;

  if (
    selectedCollege ===
      'Madaripur Govt. College (Govt. Nazimuddin College)' &&
    (tutor.collegeTag === 'Govt. Nazimuddin College' ||
      tutor.collegeTag === 'Madaripur Govt. College')
  ) {
    return true;
  }

  if (
    (selectedCollege === 'Govt. Nazimuddin College' ||
      selectedCollege === 'Madaripur Govt. College') &&
    tutor.collegeTag === 'Madaripur Govt. College (Govt. Nazimuddin College)'
  ) {
    return true;
  }

  if (
    selectedCollege === 'Public University (DU / BUET / JU / RU / JNU)' &&
    (tutor.collegeTag === 'DU' || tutor.collegeTag === 'BUET')
  ) {
    return true;
  }

  if (selectedCollege === 'Medical College' && tutor.collegeTag === 'Medical') {
    return true;
  }

  return false;
}

const VALID_MEDIUMS: Exclude<MediumCategory, 'All'>[] = [
  'Bangla Medium',
  'English Version',
  'Admission Test',
  'Madrasah/Quranic',
  'ICT',
];

export interface TutorProfileFormInput {
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  upazila?: string | null;
  institution?: string | null;
  department?: string | null;
  medium?: string | null;
  experience?: string | null;
  nidNumber?: string | null;
  studentRegId?: string | null;
  monthlyFee?: string | number | null;
  subjects?: string | string[] | null;
  profilePhotoName?: string | null;
  profilePhotoType?: string | null;
  nidDocumentName?: string | null;
  nidDocumentType?: string | null;
  uniDocumentName?: string | null;
  uniDocumentType?: string | null;
}

export function validateTutorProfileSubmission(
  input: TutorProfileFormInput
): {
  valid: boolean;
  errorEn?: string;
  errorBn?: string;
} {
  const cleanName = (input.fullName || '').trim();
  if (!cleanName) {
    return {
      valid: false,
      errorEn: 'Please enter the tutor full name.',
      errorBn: 'অনুগ্রহ করে শিক্ষকের পূর্ণ নাম লিখুন।',
    };
  }

  const cleanPhone = (input.phone || '').trim();
  if (!cleanPhone || !validatePhoneBD(cleanPhone)) {
    return {
      valid: false,
      errorEn:
        'Please enter a valid 11-digit BD mobile number (e.g. 01308937770).',
      errorBn: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01308937770)।',
    };
  }

  const cleanEmail = (input.email || '').trim();
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return {
      valid: false,
      errorEn: 'Please enter a valid email address.',
      errorBn: 'অনুগ্রহ করে সঠিক ইমেইল অ্যাড্রেস প্রদান করুন।',
    };
  }

  // Non-critical / optional fields: validate format only if non-empty
  const cleanNid = (input.nidNumber || '').replace(/[\s-]/g, '');
  if (
    cleanNid &&
    cleanNid.toLowerCase() !== 'pending' &&
    cleanNid.toLowerCase() !== 'pendingnid' &&
    !validateNIDNumber(cleanNid)
  ) {
    return {
      valid: false,
      errorEn:
        'Please enter a valid 10, 13, or 17-digit Bangladesh Smart NID number (or leave blank if pending).',
      errorBn:
        'সঠিক ১০, ১৩ অথবা ১৭ ডিজিটের জাতীয় পরিচয়পত্র (NID) নম্বর দিন (অথবা খালি রাখুন)।',
    };
  }

  if (input.profilePhotoName && input.profilePhotoName.trim()) {
    const photoCheck = validateProfilePhotoFile(
      input.profilePhotoName,
      input.profilePhotoType || 'image/jpeg'
    );
    if (!photoCheck.valid) {
      return {
        valid: false,
        errorEn: photoCheck.error,
        errorBn: 'শুধুমাত্র JPG, JPEG অথবা PNG ফরম্যাটের ছবি গ্রহণযোগ্য।',
      };
    }
  }

  if (input.nidDocumentName && input.nidDocumentName.trim()) {
    const nidCheck = validateNidOrStudentIdJpgFile(
      input.nidDocumentName,
      input.nidDocumentType || undefined
    );
    if (!nidCheck.valid) {
      return {
        valid: false,
        errorEn: nidCheck.error,
        errorBn:
          'এনআইডি এবং স্টুডেন্ট আইডি কার্ডের জন্য শুধুমাত্র JPG (.jpg / .jpeg) ফাইল গ্রহণযোগ্য।',
      };
    }
  }

  if (input.uniDocumentName && input.uniDocumentName.trim()) {
    const uniCheck = validateNidOrStudentIdJpgFile(
      input.uniDocumentName,
      input.uniDocumentType || undefined
    );
    if (!uniCheck.valid) {
      return {
        valid: false,
        errorEn: uniCheck.error,
        errorBn:
          'এনআইডি এবং স্টুডেন্ট আইডি কার্ডের জন্য শুধুমাত্র JPG (.jpg / .jpeg) ফাইল গ্রহণযোগ্য।',
      };
    }
  }

  return { valid: true };
}

export function sanitizeStorageFileName(
  fileName?: string | null,
  fallback = 'document.jpg'
): string {
  const raw = (fileName || '').trim();
  if (!raw) return fallback;
  const cleaned = raw
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || fallback;
}

export function buildSupabaseStorageObjectPath(
  verificationCode: string,
  docType: 'profile_photo' | 'nid_scan' | 'student_id_scan',
  fileName?: string | null
): string {
  const cleanCode =
    (verificationCode || 'VER-2026-000')
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '_') || 'VER-2026-000';
  const defaultName =
    docType === 'profile_photo'
      ? 'profile_photo.jpg'
      : docType === 'nid_scan'
      ? 'smart_nid_scan.jpg'
      : 'student_id_scan.jpg';
  const cleanFile = sanitizeStorageFileName(fileName, defaultName);
  return `verifications/${cleanCode}/${docType}_${cleanFile}`;
}

export function mapVerificationRequestToProfilesTableRow(
  req: Partial<VerificationRequest> & { id: string }
): SupabaseTutorProfileTableRow {
  const cleanCode = (req.id || 'VER-2026-100').trim() || 'VER-2026-100';
  const cleanEmail = (req.userEmail || req.email || '').trim().toLowerCase();
  const cleanUserId = (
    req.userId ||
    (cleanEmail ? cleanEmail.split('@')[0] : '') ||
    ''
  ).trim();
  const cleanName = (req.tutorNameEn || req.tutorNameBn || '').trim();
  const cleanPhone = (req.phone || '').trim();
  const cleanUpazila = (req.upazila || '').trim();
  const cleanGender = req.gender === 'Female' ? 'Female' : 'Male';
  const cleanCategory = (req.collegeTag || '').trim();
  const cleanInstitution =
    (req.institutionFullEn || '').trim() || cleanCategory;
  const hasSubmittedDetails = Boolean(
    cleanPhone || cleanInstitution || (req.nidNumber || '').trim() || (req.studentRegId || '').trim()
  );
  const cleanDepartment =
    (req.departmentEn || '').trim() ||
    (hasSubmittedDetails ? 'Honours / General' : '');
  const cleanMedium = (req.medium || '').trim();
  const cleanExperience = (req.experience || '').trim();
  const rawFeeNum =
    req.monthlyFee !== undefined && req.monthlyFee !== null
      ? Number(String(req.monthlyFee).replace(/[^\d.]/g, '')) || 0
      : hasSubmittedDetails
      ? 3500
      : 0;
  const cleanSubjects =
    Array.isArray(req.subjectsEn) && req.subjectsEn.filter(Boolean).length > 0
      ? req.subjectsEn.map((s) => s.trim()).filter(Boolean).join(', ')
      : hasSubmittedDetails
      ? 'General Science & Math'
      : '';
  const cleanNid = (req.nidNumber || '').replace(/[\s-]/g, '');
  const cleanRegId = (req.studentRegId || '').trim();
  const cleanStatus = (req.status || 'Pending').trim() || 'Pending';

  return {
    verification_code: cleanCode,
    user_id: cleanUserId || null,
    email: cleanEmail || null,
    user_email: cleanEmail || null,
    full_name: cleanName,
    phone: cleanPhone,
    mobile_number: cleanPhone,
    upazila: cleanUpazila,
    gender: cleanGender,
    institution: cleanInstitution,
    institution_category: cleanCategory,
    university_college_name: cleanInstitution,
    department: cleanDepartment,
    department_degree: cleanDepartment,
    medium: cleanMedium,
    experience: cleanExperience,
    expected_fee: rawFeeNum,
    teaching_subjects: cleanSubjects,
    smart_nid_number: cleanNid,
    student_registration_id: cleanRegId,
    profile_photo_url: req.profilePhotoDataUrl || null,
    profile_photo_name: req.profilePhotoName || null,
    nid_scan_url: req.nidScanDataUrl || null,
    nid_file_name: req.nidDocumentName || null,
    student_id_scan_url: req.uniScanDataUrl || null,
    student_id_file_name: req.uniDocumentName || null,
    status: cleanStatus,
    verification_status: cleanStatus.toLowerCase(),
  };
}

export function encodeDepartmentWithMeta(
  department?: string | null,
  medium?: string | null,
  experience?: string | null
): string {
  const cleanDept = (department || '').trim();
  const cleanMed = (medium || '').trim();
  const cleanExp = (experience || '').trim();
  if (!cleanMed && !cleanExp) {
    return cleanDept;
  }
  const parts = [cleanDept];
  if (cleanMed) {
    parts.push(`||MEDIUM:${cleanMed}`);
  }
  if (cleanExp) {
    parts.push(`||EXP:${cleanExp}`);
  }
  return parts.join('');
}

export function decodeDepartmentWithMeta(
  rawDepartmentDegree?: string | null,
  fallbackMedium?: string | null,
  fallbackExperience?: string | null
): {
  department: string;
  medium: string;
  experience: string;
} {
  let raw = (rawDepartmentDegree || '').trim();
  let extractedMed = (fallbackMedium || '').trim();
  let extractedExp = (fallbackExperience || '').trim();

  const expIdx = raw.indexOf('||EXP:');
  if (expIdx !== -1) {
    const expVal = raw.slice(expIdx + '||EXP:'.length).trim();
    raw = raw.slice(0, expIdx).trim();
    if (!extractedExp && expVal) {
      extractedExp = expVal;
    }
  }

  const medIdx = raw.indexOf('||MEDIUM:');
  if (medIdx !== -1) {
    const medVal = raw.slice(medIdx + '||MEDIUM:'.length).trim();
    raw = raw.slice(0, medIdx).trim();
    if (!extractedMed && medVal) {
      extractedMed = medVal;
    }
  }

  return {
    department: raw,
    medium: extractedMed,
    experience: extractedExp,
  };
}

export function mapVerificationRequestToSupabaseRow(
  req: VerificationRequest
): TutorVerificationRow {
  const normalized = mapVerificationRequestToProfilesTableRow(req);

  return {
    verification_code: normalized.verification_code,
    user_email: normalized.user_email,
    user_id: normalized.user_id,
    full_name: normalized.full_name,
    mobile_number: normalized.mobile_number,
    upazila: normalized.upazila,
    gender: normalized.gender,
    expected_fee: normalized.expected_fee,
    profile_photo_url: normalized.profile_photo_url,
    profile_photo_name: normalized.profile_photo_name,
    smart_nid_number: normalized.smart_nid_number,
    institution_category: normalized.institution_category,
    university_college_name: normalized.university_college_name,
    department_degree: encodeDepartmentWithMeta(
      normalized.department_degree,
      normalized.medium,
      normalized.experience
    ),
    student_registration_id: normalized.student_registration_id,
    teaching_subjects: normalized.teaching_subjects,
    nid_scan_url: normalized.nid_scan_url,
    nid_file_name: normalized.nid_file_name,
    student_id_scan_url: normalized.student_id_scan_url,
    student_id_file_name: normalized.student_id_file_name,
    status: normalized.status,
    hidden_from_admin: Boolean(req.hiddenFromAdmin),
  };
}

export function mapSupabaseRowToVerificationRequest(
  row: TutorVerificationRow
): VerificationRequest {
  const rawUpazila = (row.upazila || '').trim();
  const matchedUpazila: Exclude<Upazila, 'All'> | '' = rawUpazila
    ? VALID_UPAZILAS.find(
        (u) => u.toLowerCase() === rawUpazila.toLowerCase()
      ) ||
      VALID_UPAZILAS.find((u) =>
        rawUpazila.toLowerCase().includes(u.toLowerCase())
      ) ||
      'Madaripur Sadar'
    : '';

  const rawCategory = (
    row.institution_category ||
    row.institution ||
    row.university_college_name ||
    ''
  ).trim();
  const matchedCollege: Exclude<CollegeTag, 'All'> | '' = rawCategory
    ? VALID_COLLEGES.find(
        (c) => c.toLowerCase() === rawCategory.toLowerCase()
      ) ||
      VALID_COLLEGES.find((c) =>
        rawCategory.toLowerCase().includes(c.toLowerCase())
      ) ||
      'Govt. Nazimuddin College'
    : '';

  const gender: 'Male' | 'Female' =
    (row.gender || '').trim().toLowerCase() === 'female' ? 'Female' : 'Male';

  const rawStatus = (row.status || 'Pending').trim().toLowerCase();
  const status: VerificationStatus =
    rawStatus === 'approved' || rawStatus === 'verified'
      ? 'Approved'
      : rawStatus === 'rejected'
      ? 'Rejected'
      : 'Pending';

  const subjectsList = (row.teaching_subjects || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const parsedFee =
    row.expected_fee !== undefined && row.expected_fee !== null
      ? Number(String(row.expected_fee).replace(/[^\d.]/g, '')) || 0
      : 0;

  const createdDate = row.created_at ? new Date(row.created_at) : null;
  const isValidDate = createdDate && !Number.isNaN(createdDate.getTime());
  const submittedAt = isValidDate
    ? createdDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Just now';

  const verCode =
    (row.verification_code || '').trim() ||
    `VER-2026-${(row.id || '101').slice(0, 4).toUpperCase()}`;

  const cleanName = (row.full_name || '').trim();
  const resolvedEmail = (row.user_email || row.email || '')
    .trim()
    .toLowerCase();
  const resolvedPhone = (row.mobile_number || row.phone || '').trim();
  const decodedDeptMeta = decodeDepartmentWithMeta(
    row.department_degree,
    row.medium,
    row.experience
  );
  const resolvedMedium = decodedDeptMeta.medium;
  const resolvedExperience = decodedDeptMeta.experience;
  const resolvedInstitution = (
    row.university_college_name ||
    row.institution ||
    matchedCollege ||
    ''
  ).trim();
  const resolvedDepartment = decodedDeptMeta.department;

  const mapped: VerificationRequest = {
    id: verCode,
    supabaseRowId: row.id,
    userEmail: resolvedEmail || undefined,
    email: resolvedEmail || undefined,
    userId: row.user_id ? row.user_id.trim() : undefined,
    tutorId: `tutor-ver-${verCode}`,
    tutorNameEn: cleanName,
    tutorNameBn: cleanName,
    gender,
    upazila: matchedUpazila,
    phone: resolvedPhone,
    profilePhotoName: row.profile_photo_name || undefined,
    profilePhotoDataUrl: row.profile_photo_url || undefined,
    nidNumber: (row.smart_nid_number || '').trim(),
    nidDocumentName: (row.nid_file_name || '').trim(),
    nidScanDataUrl: row.nid_scan_url || undefined,
    collegeTag: matchedCollege,
    institutionFullEn: resolvedInstitution,
    departmentEn: resolvedDepartment,
    studentRegId: (row.student_registration_id || '').trim(),
    academicSession: resolvedInstitution ? 'Verified Session' : '',
    uniDocumentName: (row.student_id_file_name || '').trim(),
    uniScanDataUrl: row.student_id_scan_url || undefined,
    subjectsEn: subjectsList,
    medium: resolvedMedium,
    experience: resolvedExperience,
    monthlyFee: parsedFee,
    submittedAt,
    status,
    is_rejected: Boolean(row.is_rejected) || status === 'Rejected',
    rejection_note:
      row.rejection_note ||
      (status === 'Rejected' ? row.admin_audit_note || undefined : undefined),
    adminNote: row.admin_audit_note || row.rejection_note || undefined,
    hiddenFromAdmin: Boolean(row.hidden_from_admin),
  };

  return sanitizeUnsubmittedGoogleProfile(mapped);
}

export function mapApprovedVerificationToPublicTutor(
  req: VerificationRequest
): TutorProfile {
  const subjects =
    req.subjectsEn && req.subjectsEn.length > 0
      ? req.subjectsEn
      : ['General Science & Math'];

  const rawMedium = (req.medium || '').trim();
  const matchedMedium = VALID_MEDIUMS.find(
    (m) => m.toLowerCase() === rawMedium.toLowerCase()
  );
  const mediums: Exclude<MediumCategory, 'All'>[] = matchedMedium
    ? Array.from(new Set([matchedMedium, 'Bangla Medium']))
    : ['Bangla Medium', 'English Version'];

  const parsedExpYears =
    Number(String(req.experience || '2').replace(/[^\d]/g, '')) || 2;
  const resolvedCollege: Exclude<CollegeTag, 'All'> =
    req.collegeTag || 'Govt. Nazimuddin College';
  const resolvedUpazila: Exclude<Upazila, 'All'> =
    req.upazila || 'Madaripur Sadar';
  const resolvedInst = req.institutionFullEn || resolvedCollege;

  return {
    id: req.tutorId || `tutor-ver-${req.id}`,
    nameEn: req.tutorNameEn,
    nameBn: req.tutorNameBn || req.tutorNameEn,
    gender: req.gender,
    profilePhotoUrl: req.profilePhotoDataUrl || undefined,
    collegeTag: resolvedCollege,
    institutionFullEn: req.departmentEn
      ? `${resolvedInst} (${req.departmentEn})`
      : resolvedInst,
    institutionFullBn: req.departmentEn
      ? `${resolvedInst} (${req.departmentEn})`
      : resolvedInst,
    departmentEn: req.departmentEn || 'Honours',
    departmentBn: req.departmentEn || 'Honours',
    upazila: resolvedUpazila,
    coveredAreasEn: [resolvedUpazila],
    coveredAreasBn: [resolvedUpazila],
    modes: ['Home', 'Online'],
    mediums,
    subjectsEn: subjects,
    subjectsBn: subjects,
    preferredClassesEn: 'Class 8–12 (SSC & HSC)',
    preferredClassesBn: 'অষ্টম–দ্বাদশ শ্রেণি',
    monthlyFee: Number(req.monthlyFee) || 3500,
    experienceYears: parsedExpYears,
    responseTimeEn: '15 mins avg',
    responseTimeBn: 'গড়ে ১৫ মিনিট',
    nidVerified: true,
    uniIdVerified: true,
    verificationStatus: 'Approved',
    verificationCode: 'MDP-VERIFIED',
    rating: 0,
    totalReviews: 0,
    studentsTaught: 0,
    bioEn: `Verified educator from ${resolvedInst}${req.departmentEn ? ` (${req.departmentEn})` : ''} serving students across ${resolvedUpazila}.`,
    bioBn: `${resolvedInst}${req.departmentEn ? ` (${req.departmentEn})` : ''} এর যাচাইকৃত শিক্ষক, ${resolvedUpazila} এলাকায় পাঠদান করেন।`,
    hscGpa: 'GPA 5.00',
    sscGpa: 'GPA 5.00',
    availableDaysEn: '4 Days/Week (Afternoon/Evening)',
    availableDaysBn: 'সপ্তাহে ৪ দিন (বিকাল/সন্ধ্যা)',
    portraitVariant: req.gender === 'Female' ? 'sadia' : 'tanvir',
    reviews: [],
  };
}

export function syncPublicTutorsFromVerifications(
  requests: VerificationRequest[],
  existingTutors: TutorProfile[] = []
): TutorProfile[] {
  const existingById = new Map<string, TutorProfile>();
  for (const t of existingTutors) {
    existingById.set(t.id, t);
  }

  const requestTutorIds = new Set(
    requests.map((r) => r.tutorId || `tutor-ver-${r.id}`)
  );

  const approvedTutors: TutorProfile[] = requests
    .filter((r) => isActiveVerificationRequest(r) && r.status === 'Approved')
    .map((req) => {
      const publicTutor = mapApprovedVerificationToPublicTutor(req);
      const prev = existingById.get(publicTutor.id);
      if (prev) {
        return {
          ...publicTutor,
          reviews: prev.reviews || [],
          rating: prev.rating || 0,
          totalReviews: prev.totalReviews || 0,
        };
      }
      return publicTutor;
    });

  const nonVerificationTutors = existingTutors.filter(
    (t) => !t.id.startsWith('tutor-ver-') && !requestTutorIds.has(t.id)
  );

  return [...approvedTutors, ...nonVerificationTutors];
}

export const TUTOR_PROFILE_STORAGE_KEY = 'madaripur_tutor_profile_v1';

export function getTutorProfileStorageKeyForUser(
  userOrEmail?:
    | { email?: string | null; id?: string | null; fullName?: string | null }
    | string
    | null
): string | null {
  if (!userOrEmail) return null;
  if (typeof userOrEmail === 'string') {
    const clean = userOrEmail.trim().toLowerCase();
    return clean ? `tutor_profile_${clean}` : null;
  }
  const emailOrId = (
    userOrEmail.email ||
    userOrEmail.id ||
    userOrEmail.fullName ||
    ''
  )
    .trim()
    .toLowerCase();
  return emailOrId ? `tutor_profile_${emailOrId}` : null;
}

export function maskSmartNidNumber(nidNumber: string): string {
  const digits = (nidNumber || '').replace(/[\s-]/g, '').trim();
  if (!digits) return '••••••••••';
  if (digits.length <= 6) {
    return `${digits.slice(0, 2)}•••${digits.slice(-1)}`;
  }
  const prefix = digits.slice(0, 3);
  const suffix = digits.slice(-4);
  const maskedCount = Math.max(4, digits.length - 7);
  return `${prefix}${'•'.repeat(maskedCount)}${suffix}`;
}

export function findTutorVerificationProfile(
  requests: VerificationRequest[],
  userOrEmail?:
    | { email?: string | null; id?: string | null; fullName?: string | null }
    | string
    | null,
  explicitUserId?: string | null
): VerificationRequest | null {
  if (!userOrEmail && !explicitUserId) {
    return null;
  }

  let accountEmail = '';
  let accountUserId = (explicitUserId || '').trim().toLowerCase();
  let accountUsername = '';

  if (typeof userOrEmail === 'string') {
    const clean = userOrEmail.trim().toLowerCase();
    if (clean.includes('@')) {
      accountEmail = clean;
      accountUsername = clean.split('@')[0] || '';
    } else {
      accountUserId = accountUserId || clean;
      accountUsername = clean;
    }
  } else if (userOrEmail) {
    accountEmail = (userOrEmail.email || '').trim().toLowerCase();
    accountUserId =
      accountUserId || (userOrEmail.id || '').trim().toLowerCase();
    accountUsername =
      (accountEmail ? accountEmail.split('@')[0] : '') ||
      (userOrEmail.fullName || '').trim().toLowerCase();
  }

  if (!accountEmail && !accountUserId && !accountUsername) {
    return null;
  }

  for (const req of requests) {
    if (!isActiveVerificationRequest(req)) continue;
    const reqEmail = (req.userEmail || '').trim().toLowerCase();
    const reqUserId = (req.userId || '').trim().toLowerCase();
    const reqEmailPrefix = reqEmail.includes('@') ? reqEmail.split('@')[0] : '';

    const emailMatch =
      Boolean(accountEmail) && Boolean(reqEmail) && reqEmail === accountEmail;
    const idMatch =
      Boolean(accountUserId) &&
      Boolean(reqUserId) &&
      reqUserId === accountUserId;
    const usernameMatch =
      Boolean(accountUsername) &&
      ((Boolean(reqUserId) && reqUserId === accountUsername) ||
        (Boolean(reqEmailPrefix) &&
          !accountEmail &&
          reqEmailPrefix === accountUsername));

    if (emailMatch || idMatch || usernameMatch) {
      return req;
    }
  }

  return null;
}

export function getTutorProfileStatusBadge(
  status: VerificationStatus,
  lang: Language = 'en'
): {
  label: string;
  tone: 'pending' | 'approved' | 'rejected';
} {
  if (status === 'Approved') {
    return {
      label:
        lang === 'en'
          ? '✅ Approved & Verified Tutor (Public Badge Active)'
          : '✅ Approved & Verified Tutor (পাবলিক ভেরিফাইড ব্যাজ সক্রিয়)',
      tone: 'approved',
    };
  }
  if (status === 'Rejected') {
    return {
      label:
        lang === 'en'
          ? '❌ Verification Rejected'
          : '❌ Verification Rejected (ভেরিফিকেশন বাতিল)',
      tone: 'rejected',
    };
  }
  return {
    label:
      lang === 'en'
        ? '⏳ Verification Pending (Under Admin Review)'
        : '⏳ Verification Pending (Under Admin Review)',
    tone: 'pending',
  };
}

export function validateProfilePhotoFile(
  fileName: string,
  mimeType?: string
): { valid: boolean; error?: string } {
  const cleanName = (fileName || '').trim().toLowerCase();
  const cleanMime = (mimeType || '').trim().toLowerCase();

  if (!cleanName) {
    return {
      valid: false,
      error: 'Please choose a JPG or PNG photo file.',
    };
  }

  const hasValidExt = /\.(jpg|jpeg|png)$/i.test(cleanName);
  const hasValidMime =
    !cleanMime ||
    cleanMime === 'image/jpeg' ||
    cleanMime === 'image/jpg' ||
    cleanMime === 'image/png';

  if (!hasValidExt || !hasValidMime) {
    return {
      valid: false,
      error:
        'Only JPG, JPEG, or PNG image files (.jpg, .jpeg, .png) are allowed for your Profile Photo.',
    };
  }

  return { valid: true };
}

export const NID_STUDENT_ID_JPG_ONLY_ERROR =
  'Only JPG (.jpg / .jpeg) files are allowed for NID and Student ID Card uploads.';

export function validateNidOrStudentIdJpgFile(
  fileName: string,
  mimeType?: string
): { valid: boolean; error?: string } {
  const cleanName = (fileName || '').trim().toLowerCase();
  const cleanMime = (mimeType || '').trim().toLowerCase();

  if (!cleanName) {
    return {
      valid: false,
      error: NID_STUDENT_ID_JPG_ONLY_ERROR,
    };
  }

  const hasValidJpgExt = /\.(jpg|jpeg)$/i.test(cleanName);
  const hasValidJpgMime =
    !cleanMime || cleanMime === 'image/jpeg' || cleanMime === 'image/jpg';

  if (!hasValidJpgExt || !hasValidJpgMime) {
    return {
      valid: false,
      error: NID_STUDENT_ID_JPG_ONLY_ERROR,
    };
  }

  return { valid: true };
}

/* ============================================================================
   ADMIN PANEL 2-MODE DELETION ("Delete from Admin Panel" vs "Delete from Everywhere")
   ============================================================================ */

export function getApplicationAdminKey(app: CircularApplicationRow): string {
  return (
    (app.id || '').trim() ||
    `${(app.circular_id || '').trim()}::${normalizeLookupToken(
      app.tutor_id
    )}::${normalizeLookupToken(app.tutor_phone)}`
  );
}

function isKeyInCollection(
  key: string,
  collection?: Set<string> | string[]
): boolean {
  if (!key || !collection) return false;
  if (collection instanceof Set) return collection.has(key);
  return collection.includes(key);
}

export function isHiddenFromAdminApplication(
  app: CircularApplicationRow,
  hiddenAppIds?: Set<string> | string[]
): boolean {
  if (Boolean(app.hidden_from_admin)) return true;
  const compositeKey = getApplicationAdminKey(app);
  const rawId = (app.id || '').trim();
  return (
    isKeyInCollection(compositeKey, hiddenAppIds) ||
    (Boolean(rawId) && isKeyInCollection(rawId, hiddenAppIds))
  );
}

export function isHiddenFromAdminVerification(
  req: VerificationRequest,
  hiddenReqIds?: Set<string> | string[]
): boolean {
  if (Boolean(req.hiddenFromAdmin)) return true;
  return isKeyInCollection((req.id || '').trim(), hiddenReqIds);
}

export function isHiddenFromAdminCircular(
  job: TuitionJob,
  hiddenJobIds?: Set<string> | string[]
): boolean {
  if (Boolean(job.hiddenFromAdmin)) return true;
  return isKeyInCollection((job.id || '').trim(), hiddenJobIds);
}

export function filterAdminVisibleApplications(
  applications: CircularApplicationRow[],
  hiddenAppIds?: Set<string> | string[]
): CircularApplicationRow[] {
  return applications.filter(
    (app) =>
      isActiveApplicationRow(app) &&
      !isHiddenFromAdminApplication(app, hiddenAppIds)
  );
}

export function isActiveVerificationRequest(req: VerificationRequest): boolean {
  const code = (req.id || '').trim().toUpperCase();
  const statusNorm = (req.status || '').trim().toLowerCase();
  return (
    code !== 'ARCHIVED-TEST' &&
    !code.startsWith('DELETED-') &&
    statusNorm !== 'archived' &&
    statusNorm !== 'deleted'
  );
}

export function filterAdminVisibleVerifications(
  requests: VerificationRequest[],
  hiddenReqIds?: Set<string> | string[]
): VerificationRequest[] {
  return requests.filter(
    (req) =>
      isActiveVerificationRequest(req) &&
      isTutorProfileSubmitted(req) &&
      !isHiddenFromAdminVerification(req, hiddenReqIds)
  );
}

export function filterAdminVisibleCirculars(
  jobs: TuitionJob[],
  hiddenJobIds?: Set<string> | string[]
): TuitionJob[] {
  return jobs.filter((job) => !isHiddenFromAdminCircular(job, hiddenJobIds));
}

export function isSameCircularApplication(
  a: CircularApplicationRow,
  b: CircularApplicationRow
): boolean {
  if (a.id && b.id && a.id === b.id) return true;
  return (
    a.circular_id === b.circular_id &&
    normalizeLookupToken(a.tutor_id) === normalizeLookupToken(b.tutor_id) &&
    normalizeLookupToken(a.tutor_phone) === normalizeLookupToken(b.tutor_phone)
  );
}

export function hideApplicationFromAdminOnly(
  applications: CircularApplicationRow[],
  targetApp: CircularApplicationRow
): CircularApplicationRow[] {
  if (isProtectedAdminProfile(targetApp)) {
    return applications;
  }
  return applications.map((app) =>
    isSameCircularApplication(app, targetApp)
      ? { ...app, hidden_from_admin: true }
      : app
  );
}

export function deleteApplicationFromEverywhereState(
  jobs: TuitionJob[],
  applications: CircularApplicationRow[],
  targetApp: CircularApplicationRow
): { jobs: TuitionJob[]; applications: CircularApplicationRow[] } {
  if (isProtectedAdminProfile(targetApp)) {
    return {
      jobs,
      applications,
    };
  }
  const remainingApplications = applications.filter(
    (app) => !isSameCircularApplication(app, targetApp)
  );
  const stillHasConfirmed = Boolean(
    getConfirmedApplicationForCircular(
      remainingApplications,
      targetApp.circular_id
    )
  );
  const updatedJobs = enrichCircularJobsWithApplications(
    jobs.map((job) =>
      job.id === targetApp.circular_id && !stillHasConfirmed
        ? {
            ...job,
            status: 'Active',
            confirmedTutorId: undefined,
            confirmedTutorName: undefined,
          }
        : job
    ),
    remainingApplications
  );
  return {
    jobs: updatedJobs,
    applications: remainingApplications,
  };
}

export function hideVerificationFromAdminOnly(
  requests: VerificationRequest[],
  requestId: string
): VerificationRequest[] {
  if (isProtectedAdminProfile(requestId)) {
    return requests;
  }
  const targetClean = (requestId || '').trim().toLowerCase();
  return requests.map((req) =>
    req.id.trim().toLowerCase() === targetClean && !isProtectedAdminProfile(req)
      ? { ...req, hiddenFromAdmin: true }
      : req
  );
}

export function doesApplicationMatchTutorProfile(
  app: CircularApplicationRow,
  req: VerificationRequest
): boolean {
  const reqIdToken = normalizeLookupToken(req.id);
  const reqTutorIdToken = normalizeLookupToken(req.tutorId);
  const reqEmail = (req.userEmail || '').trim().toLowerCase();
  const reqUserId = (req.userId || '').trim().toLowerCase();
  const reqPhoneToken = normalizeLookupToken(req.phone);

  const appTutorIdToken = normalizeLookupToken(app.tutor_id);
  const appEmail = (app.user_email || '').trim().toLowerCase();
  const appUserId = (app.user_id || '').trim().toLowerCase();
  const appPhoneToken = normalizeLookupToken(app.tutor_phone);

  if (
    reqIdToken &&
    (appTutorIdToken === reqIdToken || appTutorIdToken === reqTutorIdToken)
  ) {
    return true;
  }
  if (reqEmail && appEmail && reqEmail === appEmail) {
    return true;
  }
  if (reqUserId && appUserId && reqUserId === appUserId) {
    return true;
  }
  if (reqPhoneToken && appPhoneToken && reqPhoneToken === appPhoneToken) {
    return true;
  }
  return false;
}

export function deleteVerificationFromEverywhereState(
  tutors: TutorProfile[],
  requests: VerificationRequest[],
  requestId: string,
  applications: CircularApplicationRow[] = [],
  jobs: TuitionJob[] = []
): {
  tutors: TutorProfile[];
  requests: VerificationRequest[];
  applications: CircularApplicationRow[];
  jobs: TuitionJob[];
  affectedCircularIds: string[];
} {
  const rawClean = (requestId || '').trim().toLowerCase();
  const targetClean = rawClean.startsWith('tutor-ver-')
    ? rawClean.slice('tutor-ver-'.length)
    : rawClean;

  const matchedReq = requests.find(
    (req) =>
      req.id.trim().toLowerCase() === targetClean ||
      req.id.trim().toLowerCase() === rawClean ||
      (req.tutorId && req.tutorId.trim().toLowerCase() === rawClean) ||
      (req.supabaseRowId && req.supabaseRowId.trim().toLowerCase() === rawClean)
  );

  // Never allow the protected Admin account (drabirm4@gmail.com) to be deleted
  if (
    isProtectedAdminProfile(requestId) ||
    isProtectedAdminProfile(matchedReq)
  ) {
    return {
      tutors,
      requests,
      applications,
      jobs,
      affectedCircularIds: [],
    };
  }

  const matchedEmail = (matchedReq?.userEmail || '').trim().toLowerCase();
  const matchedUserId = (matchedReq?.userId || '').trim().toLowerCase();
  const matchedTutorIdClean = matchedReq?.tutorId
    ? matchedReq.tutorId.trim().toLowerCase()
    : '';

  const isTargetReq = (req: VerificationRequest): boolean => {
    if (isProtectedAdminProfile(req)) {
      return false;
    }
    const rId = req.id.trim().toLowerCase();
    const rTutorId = (req.tutorId || '').trim().toLowerCase();
    const rRowId = (req.supabaseRowId || '').trim().toLowerCase();
    const rEmail = (req.userEmail || '').trim().toLowerCase();
    const rUserId = (req.userId || '').trim().toLowerCase();

    if (
      rId === targetClean ||
      rId === rawClean ||
      (rTutorId && (rTutorId === rawClean || rTutorId === matchedTutorIdClean)) ||
      (rRowId && rRowId === rawClean)
    ) {
      return true;
    }
    if (matchedEmail && rEmail && rEmail === matchedEmail) {
      return true;
    }
    if (matchedUserId && rUserId && rUserId === matchedUserId) {
      return true;
    }
    return false;
  };

  const deletedReqs = requests.filter(isTargetReq);
  const remainingRequests = requests.filter((req) => !isTargetReq(req));

  const deletedCodes = new Set<string>([targetClean, rawClean]);
  const deletedTutorIds = new Set<string>([
    `tutor-ver-${targetClean}`,
    rawClean,
  ]);
  if (matchedTutorIdClean) deletedTutorIds.add(matchedTutorIdClean);
  for (const d of deletedReqs) {
    deletedCodes.add(d.id.trim().toLowerCase());
    deletedTutorIds.add(`tutor-ver-${d.id.trim().toLowerCase()}`);
    if (d.tutorId) deletedTutorIds.add(d.tutorId.trim().toLowerCase());
  }

  const remainingTutors = tutors.filter(
    (t) =>
      !deletedCodes.has(t.verificationCode.trim().toLowerCase()) &&
      !deletedTutorIds.has(t.id.trim().toLowerCase())
  );

  // Cascade delete related circular applications for this tutor profile
  const affectedCircularSet = new Set<string>();
  const remainingApplications = applications.filter((app) => {
    const appTutorToken = normalizeLookupToken(app.tutor_id);
    const matchesByCode =
      appTutorToken === normalizeLookupToken(targetClean) ||
      appTutorToken === normalizeLookupToken(rawClean);
    const matchesByProfile = deletedReqs.some((d) =>
      doesApplicationMatchTutorProfile(app, d)
    );
    if (matchesByCode || matchesByProfile) {
      if (app.circular_id) affectedCircularSet.add(app.circular_id);
      return false;
    }
    return true;
  });

  const affectedCircularIds = Array.from(affectedCircularSet);

  const updatedJobs =
    jobs.length > 0
      ? enrichCircularJobsWithApplications(
          jobs.map((job) => {
            if (!affectedCircularSet.has(job.id)) return job;
            const stillHasConfirmed = Boolean(
              getConfirmedApplicationForCircular(remainingApplications, job.id)
            );
            if (!stillHasConfirmed) {
              return {
                ...job,
                status: 'Active',
                confirmedTutorId: undefined,
                confirmedTutorName: undefined,
              };
            }
            return job;
          }),
          remainingApplications
        )
      : jobs;

  return {
    tutors: remainingTutors,
    requests: remainingRequests,
    applications: remainingApplications,
    jobs: updatedJobs,
    affectedCircularIds,
  };
}

export interface StorageRemovalTarget {
  bucket: string;
  path: string;
}

export function parseSupabaseStorageUrl(
  rawUrl?: string | null
): StorageRemovalTarget | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('data:')) return null;

  // Match standard Supabase Storage URLs: /storage/v1/object/(public|authenticated|sign)/<bucket>/<path>
  const storageRegex =
    /\/storage\/v1\/object\/(?:public|authenticated|sign)\/([^/?#]+)\/([^?#]+)/i;
  const match = trimmed.match(storageRegex);
  if (match && match[1] && match[2]) {
    try {
      return {
        bucket: decodeURIComponent(match[1]),
        path: decodeURIComponent(match[2]),
      };
    } catch {
      return {
        bucket: match[1],
        path: match[2],
      };
    }
  }

  // Match bucket/path relative storage references (excluding http/https/blob)
  if (
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('blob:') &&
    trimmed.includes('/')
  ) {
    const [firstSeg, ...rest] = trimmed.replace(/^\/+/, '').split('/');
    const objectPath = rest.join('/');
    if (firstSeg && objectPath) {
      return {
        bucket: firstSeg,
        path: objectPath,
      };
    }
  }

  return null;
}

export function extractSupabaseStorageTargets(
  profile?: Partial<VerificationRequest> | null
): Record<string, string[]> {
  const grouped: Record<string, Set<string>> = {};
  if (!profile) return {};

  const addTarget = (bucket: string, path: string) => {
    const cleanBucket = bucket.trim();
    const cleanPath = path.trim().replace(/^\/+/, '');
    if (!cleanBucket || !cleanPath) return;
    if (!grouped[cleanBucket]) {
      grouped[cleanBucket] = new Set<string>();
    }
    grouped[cleanBucket].add(cleanPath);
  };

  const urls = [
    profile.profilePhotoDataUrl,
    profile.nidScanDataUrl,
    profile.uniScanDataUrl,
  ];

  for (const url of urls) {
    const parsed = parseSupabaseStorageUrl(url);
    if (parsed) {
      addTarget(parsed.bucket, parsed.path);
    }
  }

  // Also include file-name and buildSupabaseStorageObjectPath cleanup paths in standard buckets
  const cleanCode = (profile.id || '').trim();
  if (cleanCode) {
    const standardDocPaths = [
      buildSupabaseStorageObjectPath(
        cleanCode,
        'profile_photo',
        profile.profilePhotoName
      ),
      buildSupabaseStorageObjectPath(
        cleanCode,
        'nid_scan',
        profile.nidDocumentName
      ),
      buildSupabaseStorageObjectPath(
        cleanCode,
        'student_id_scan',
        profile.uniDocumentName
      ),
    ];
    for (const p of standardDocPaths) {
      addTarget('tutor-documents', p);
      addTarget('documents', p);
      addTarget('profiles', p);
      addTarget('avatars', p);
    }
  }

  const fileNames = [
    profile.profilePhotoName,
    profile.nidDocumentName,
    profile.uniDocumentName,
  ]
    .map((f) => (f || '').trim())
    .filter((f) => f && f !== 'Default_Avatar.svg');

  const prefixes = [
    (profile.id || '').trim(),
    (profile.userId || '').trim(),
    (profile.supabaseRowId || '').trim(),
  ].filter(Boolean);

  for (const fileName of fileNames) {
    const parsedFromName = parseSupabaseStorageUrl(fileName);
    if (parsedFromName) {
      addTarget(parsedFromName.bucket, parsedFromName.path);
    } else if (prefixes.length > 0) {
      for (const prefix of prefixes) {
        addTarget('tutor-documents', `${prefix}/${fileName}`);
        addTarget('documents', `${prefix}/${fileName}`);
        addTarget('profiles', `${prefix}/${fileName}`);
      }
    }
  }

  const result: Record<string, string[]> = {};
  for (const [bucket, pathSet] of Object.entries(grouped)) {
    result[bucket] = Array.from(pathSet);
  }
  return result;
}

export function applyAdminProfileEditState(
  tutors: TutorProfile[],
  requests: VerificationRequest[],
  applications: CircularApplicationRow[],
  jobs: TuitionJob[],
  updatedReq: VerificationRequest
): {
  tutors: TutorProfile[];
  requests: VerificationRequest[];
  applications: CircularApplicationRow[];
  jobs: TuitionJob[];
} {
  const targetIdLower = (updatedReq.id || '').trim().toLowerCase();
  const targetRowIdLower = (updatedReq.supabaseRowId || '').trim().toLowerCase();
  const targetEmailLower = (updatedReq.userEmail || updatedReq.email || '')
    .trim()
    .toLowerCase();

  let foundInRequests = false;
  const nextRequests = requests.map((req) => {
    const matchesById = req.id.trim().toLowerCase() === targetIdLower;
    const matchesByRowId =
      Boolean(targetRowIdLower) &&
      (req.supabaseRowId || '').trim().toLowerCase() === targetRowIdLower;
    if (matchesById || matchesByRowId) {
      foundInRequests = true;
      return {
        ...req,
        ...updatedReq,
        tutorNameBn: updatedReq.tutorNameBn || updatedReq.tutorNameEn,
      };
    }
    return req;
  });

  const finalRequests = foundInRequests
    ? nextRequests
    : [updatedReq, ...nextRequests];

  const syncedTutors = syncPublicTutorsFromVerifications(finalRequests, tutors);

  const qualLabel = [
    updatedReq.institutionFullEn || updatedReq.collegeTag,
    updatedReq.departmentEn,
  ]
    .filter(Boolean)
    .join(' · ');

  const nextApplications = applications.map((app) => {
    const appTutorToken = normalizeLookupToken(app.tutor_id);
    const appEmail = (app.user_email || '').trim().toLowerCase();
    const matches =
      appTutorToken === normalizeLookupToken(updatedReq.id) ||
      (Boolean(targetEmailLower) && appEmail === targetEmailLower);
    if (!matches) return app;
    return {
      ...app,
      tutor_name: updatedReq.tutorNameEn || app.tutor_name,
      tutor_phone: updatedReq.phone || app.tutor_phone,
      user_email: targetEmailLower || app.user_email,
      institution_qualification: qualLabel || app.institution_qualification,
    };
  });

  const nextJobs =
    jobs.length > 0
      ? enrichCircularJobsWithApplications(jobs, nextApplications)
      : jobs;

  return {
    tutors: syncedTutors,
    requests: finalRequests,
    applications: nextApplications,
    jobs: nextJobs,
  };
}

export function hideCircularFromAdminOnly(
  jobs: TuitionJob[],
  circularId: string
): TuitionJob[] {
  const targetClean = (circularId || '').trim().toLowerCase();
  return jobs.map((job) =>
    job.id.trim().toLowerCase() === targetClean
      ? { ...job, hiddenFromAdmin: true }
      : job
  );
}

export function deleteCircularFromEverywhereState(
  jobs: TuitionJob[],
  applications: CircularApplicationRow[],
  circularId: string
): { jobs: TuitionJob[]; applications: CircularApplicationRow[] } {
  const targetClean = (circularId || '').trim().toLowerCase();
  const remainingJobs = jobs.filter(
    (job) => job.id.trim().toLowerCase() !== targetClean
  );
  const remainingApplications = applications.filter(
    (app) => app.circular_id.trim().toLowerCase() !== targetClean
  );
  return {
    jobs: remainingJobs,
    applications: remainingApplications,
  };
}

export const ADMIN_REMOVED_PROFILE_NOTICE =
  'Your profile has been removed by the Administrator.';
export const EXPLICIT_LOGIN_INTENT_STORAGE_KEY =
  'madaripur_explicit_login_intent';
export const PROFILE_SYNCED_STORAGE_PREFIX = 'tutor_profile_synced_';

export interface BrowserStorageBundle {
  localStorage?: Pick<
    Storage,
    'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'
  > | null;
  sessionStorage?: Pick<
    Storage,
    'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'
  > | null;
}

function resolveBrowserStorages(bundle?: BrowserStorageBundle): {
  local: BrowserStorageBundle['localStorage'];
  session: BrowserStorageBundle['sessionStorage'];
} {
  const defaultLocal =
    typeof window !== 'undefined' ? window.localStorage : null;
  const defaultSession =
    typeof window !== 'undefined' ? window.sessionStorage : null;
  return {
    local: bundle?.localStorage !== undefined ? bundle.localStorage : defaultLocal,
    session:
      bundle?.sessionStorage !== undefined
        ? bundle.sessionStorage
        : defaultSession,
  };
}

export function markExplicitLoginIntent(bundle?: BrowserStorageBundle): void {
  const { local, session } = resolveBrowserStorages(bundle);
  const nowStr = String(Date.now());
  try {
    local?.setItem(EXPLICIT_LOGIN_INTENT_STORAGE_KEY, nowStr);
  } catch {
    // Ignore storage quota/security errors
  }
  try {
    session?.setItem(EXPLICIT_LOGIN_INTENT_STORAGE_KEY, nowStr);
  } catch {
    // Ignore storage quota/security errors
  }
}

let signUpFlowInProgressFlag = false;

export function markSignUpFlowInProgress(active: boolean): void {
  signUpFlowInProgressFlag = Boolean(active);
}

export function isSignUpFlowInProgress(): boolean {
  return signUpFlowInProgressFlag;
}

export function hasFreshExplicitLoginIntent(
  bundle?: BrowserStorageBundle,
  maxAgeMs = 180_000
): boolean {
  const { local, session } = resolveBrowserStorages(bundle);
  let raw: string | null = null;
  try {
    raw =
      session?.getItem(EXPLICIT_LOGIN_INTENT_STORAGE_KEY) ||
      local?.getItem(EXPLICIT_LOGIN_INTENT_STORAGE_KEY) ||
      null;
  } catch {
    return false;
  }
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts) || ts <= 0) return false;
  return Date.now() - ts <= maxAgeMs;
}

export function clearExplicitLoginIntent(bundle?: BrowserStorageBundle): void {
  const { local, session } = resolveBrowserStorages(bundle);
  try {
    local?.removeItem(EXPLICIT_LOGIN_INTENT_STORAGE_KEY);
  } catch {
    // Ignore storage restrictions
  }
  try {
    session?.removeItem(EXPLICIT_LOGIN_INTENT_STORAGE_KEY);
  } catch {
    // Ignore storage restrictions
  }
}

export function markTutorProfileSyncedForEmail(
  emailOrId?: string | null,
  bundle?: BrowserStorageBundle
): void {
  const clean = (emailOrId || '').trim().toLowerCase();
  if (!clean) return;
  const { local } = resolveBrowserStorages(bundle);
  try {
    local?.setItem(`${PROFILE_SYNCED_STORAGE_PREFIX}${clean}`, 'true');
  } catch {
    // Ignore storage restrictions
  }
}

/**
 * Purges any legacy cached profile payloads (`tutor_profile_<email>` and `madaripur_tutor_profile_v1`)
 * from localStorage so browser storage is NEVER used as a fallback for profile fields (`experience`, `medium`,
 * `nidScanDataUrl`, `uniScanDataUrl`), while recording a lightweight boolean marker (`tutor_profile_synced_<email>`)
 * so the browser knows the user previously had a profile if their Supabase row was deleted by the Admin.
 */
export function purgeLegacyLocalStorageProfileCache(
  bundle?: BrowserStorageBundle
): string[] {
  const { local } = resolveBrowserStorages(bundle);
  const removedKeys: string[] = [];
  if (!local) return removedKeys;

  try {
    if (local.getItem(TUTOR_PROFILE_STORAGE_KEY) !== null) {
      local.removeItem(TUTOR_PROFILE_STORAGE_KEY);
      removedKeys.push(TUTOR_PROFILE_STORAGE_KEY);
    }

    const keysToInspect: string[] = [];
    for (let i = 0; i < local.length; i += 1) {
      const k = local.key(i);
      if (k) keysToInspect.push(k);
    }

    for (const key of keysToInspect) {
      if (
        key.startsWith('tutor_profile_') &&
        !key.startsWith(PROFILE_SYNCED_STORAGE_PREFIX)
      ) {
        const emailSuffix = key
          .slice('tutor_profile_'.length)
          .trim()
          .toLowerCase();
        if (emailSuffix) {
          local.setItem(`${PROFILE_SYNCED_STORAGE_PREFIX}${emailSuffix}`, 'true');
        }
        local.removeItem(key);
        removedKeys.push(key);
      }
    }
  } catch {
    // Ignore storage access errors
  }

  return removedKeys;
}

export function hasPriorSyncedTutorProfileForEmail(
  emailOrId?: string | null,
  bundle?: BrowserStorageBundle
): boolean {
  const clean = (emailOrId || '').trim().toLowerCase();
  if (!clean) return false;
  const { local } = resolveBrowserStorages(bundle);
  if (!local) return false;

  try {
    if (
      local.getItem(`${PROFILE_SYNCED_STORAGE_PREFIX}${clean}`) === 'true' ||
      local.getItem(`tutor_profile_${clean}`) !== null
    ) {
      return true;
    }
    const emailPrefix = clean.includes('@') ? clean.split('@')[0] : '';
    if (
      emailPrefix &&
      (local.getItem(`${PROFILE_SYNCED_STORAGE_PREFIX}${emailPrefix}`) ===
        'true' ||
        local.getItem(`tutor_profile_${emailPrefix}`) !== null)
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function isAuthUserDeletedError(
  error?: { message?: string; status?: number; code?: string } | null
): boolean {
  if (!error) return false;
  const status = Number(error.status || 0);
  const msg = (error.message || '').toLowerCase();
  const code = (error.code || '').toLowerCase();

  // Do not treat transient offline network errors as user deletion
  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed')
  ) {
    return false;
  }

  return (
    status === 401 ||
    status === 403 ||
    status === 404 ||
    code === 'user_not_found' ||
    code === 'session_not_found' ||
    msg.includes('user from sub claim in jwt does not exist') ||
    msg.includes('user not found') ||
    msg.includes('user_not_found') ||
    msg.includes('does not exist') ||
    msg.includes('invalid claim') ||
    msg.includes('user banned')
  );
}

export function shouldForceWipeDeletedUserSession(options: {
  email?: string | null;
  isAdmin: boolean;
  authUserDeleted: boolean;
  hasActiveSupabaseRow: boolean;
  hasTombstoneRow: boolean;
  hasExplicitLoginIntent: boolean;
  hadPriorSyncedProfile: boolean;
  isSessionOlderThanNewLoginWindow?: boolean;
}): boolean {
  if (options.isAdmin || isAdminEmail(options.email)) {
    return false;
  }
  if (options.authUserDeleted || options.hasTombstoneRow) {
    return true;
  }
  if (options.hasActiveSupabaseRow) {
    return false;
  }
  // If the user is actively completing an explicit Sign In / Google OAuth flow right now,
  // never wipe their session.
  if (options.hasExplicitLoginIntent) {
    return false;
  }
  // Only force-wipe if this account previously had a submitted/synced profile in Supabase
  // that has now been removed by the Admin. New accounts that have not manually submitted
  // their profile yet stay logged in with an empty profile state (isProfileSubmitted = false).
  return Boolean(options.hadPriorSyncedProfile);
}

export function isOAuthRedirectCallbackUrl(
  urlSearch?: string,
  urlHash?: string
): boolean {
  let search = urlSearch;
  let hash = urlHash;
  if (search === undefined || hash === undefined) {
    try {
      if (typeof window !== 'undefined' && window.location) {
        search = search ?? window.location.search ?? '';
        hash = hash ?? window.location.hash ?? '';
      }
    } catch {
      // Ignore location access errors
    }
  }
  const s = (search || '').toLowerCase();
  const h = (hash || '').toLowerCase();
  return (
    h.includes('access_token=') ||
    h.includes('refresh_token=') ||
    s.includes('code=') ||
    s.includes('access_token=')
  );
}

/**
 * Filters and maps live Supabase `tutor_verifications` rows into active `VerificationRequest[]`,
 * stripping out any deleted/tombstoned rows, unsubmitted placeholder rows, and duplicate entries
 * while protecting `drabirm4@gmail.com`.
 */
export function filterStrictLiveSupabaseVerifications(
  rows: TutorVerificationRow[],
  deletedIds?: Iterable<string>
): VerificationRequest[] {
  const deletedSet = new Set<string>();
  if (deletedIds) {
    for (const id of deletedIds) {
      const clean = (id || '').trim().toLowerCase();
      if (clean && !isAdminEmail(clean)) {
        deletedSet.add(clean);
      }
    }
  }

  const seenIds = new Set<string>();
  const seenEmails = new Set<string>();

  return (rows || [])
    .map(mapSupabaseRowToVerificationRequest)
    .filter((r) => {
      if (!isActiveVerificationRequest(r) || !isTutorProfileSubmitted(r)) {
        return false;
      }
      const idKey = (r.id || '').trim().toLowerCase();
      const emailKey = (r.userEmail || r.email || '').trim().toLowerCase();
      const userIdKey = (r.userId || '').trim().toLowerCase();
      const hasNameOrEmail = Boolean(
        (r.tutorNameEn || '').trim() || emailKey || userIdKey
      );
      if (!idKey || !hasNameOrEmail) {
        return false;
      }

      if (!isProtectedAdminProfile(r) && deletedSet.size > 0) {
        if (
          deletedSet.has(idKey) ||
          (emailKey && deletedSet.has(emailKey)) ||
          (userIdKey && deletedSet.has(userIdKey))
        ) {
          return false;
        }
      }

      if (seenIds.has(idKey)) return false;
      if (emailKey && seenEmails.has(emailKey)) return false;
      seenIds.add(idKey);
      if (emailKey) seenEmails.add(emailKey);
      return true;
    });
}

/**
 * Derives the Tutor Board and Dashboard tutor list strictly from active Approved
 * records in live Supabase (`remoteVerifications`), filtering out 100% of stale local
 * fallback entries that do not exist in live Supabase.
 */
export function syncStrictLiveSupabaseTutors(
  remoteVerifications: VerificationRequest[],
  previousTutors: TutorProfile[] = []
): TutorProfile[] {
  const activeApprovedTutorIds = new Set(
    (remoteVerifications || [])
      .filter((r) => isActiveVerificationRequest(r) && r.status === 'Approved')
      .map((r) => (r.tutorId || `tutor-ver-${r.id}`).trim().toLowerCase())
  );

  const synced = syncPublicTutorsFromVerifications(
    remoteVerifications,
    previousTutors
  );

  return synced.filter((t) =>
    activeApprovedTutorIds.has((t.id || '').trim().toLowerCase())
  );
}

/**
 * Completely clears all Tutor Zone and Supabase session keys from both
 * `localStorage` and `sessionStorage` when a user's profile is deleted by the Admin.
 */
export function clearAllTutorZoneBrowserStorage(
  bundle?: BrowserStorageBundle
): string[] {
  const { local, session } = resolveBrowserStorages(bundle);
  const clearedKeys: string[] = [];

  const shouldClearKey = (key: string): boolean => {
    const k = key.trim();
    return (
      k === TUTOR_PROFILE_STORAGE_KEY ||
      k === ADMIN_SESSION_STORAGE_KEY ||
      k === EXPLICIT_LOGIN_INTENT_STORAGE_KEY ||
      k.startsWith('tutor_profile_') ||
      k.startsWith('madaripur_') ||
      k.startsWith('sb-') ||
      k.includes('supabase.auth.token')
    );
  };

  for (const [label, store] of [
    ['localStorage', local],
    ['sessionStorage', session],
  ] as const) {
    if (!store) continue;
    try {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const k = store.key(i);
        if (k && shouldClearKey(k)) {
          keys.push(k);
        }
      }
      for (const k of keys) {
        store.removeItem(k);
        clearedKeys.push(`${label}:${k}`);
      }
    } catch {
      // Ignore storage access restrictions
    }
  }

  return clearedKeys;
}

export const SITE_SOCIAL_SETTINGS_STORAGE_KEY = 'tutor_zone_site_settings_v1';
export const SITE_SOCIAL_SETTINGS_SESSION_KEY =
  'tutor_zone_site_settings_session_v1';
export const SOCIAL_LINKS_UPDATED_TOAST = 'Social links updated for all users!';
export const HOMEPAGE_STATS_UPDATED_TOAST =
  'Homepage & Stats Updated Successfully!';
export const DEFAULT_BKASH_NUMBER = '01602393192';
export const DEFAULT_NAGAD_NUMBER = '01602393192';
export const DEFAULT_VERIFICATION_FEE_BDT = 500;
export const PAYMENT_REQUESTS_STORAGE_KEY = 'tutor_zone_payment_requests_v1';

export type HomepageStatsMode = 'auto' | 'manual';

export interface SiteSocialSettings {
  id: number;
  facebookUrl: string;
  whatsappContact: string;
  bkashNumber?: string;
  nagadNumber?: string;
  verificationFee?: number;
  stats_mode?: HomepageStatsMode;
  counter_mode?: HomepageStatsMode;
  manual_verified_tutors?: string;
  verified_tutors?: string;
  manual_online_tutors?: string;
  online_tutors?: string;
  manual_active_circulars?: string;
  active_circulars?: string;
  manual_total_applications?: string;
  total_applications?: string;
  trust_card_3_value?: string;
  trust_card_3_label?: string;
  trust_card_4_value?: string;
  trust_card_4_label?: string;
  hero_top_badge_1?: string;
  hero_top_badge_2?: string;
  hero_title?: string;
  guardian_card_title?: string;
  guardian_card_badge?: string;
  tutor_card_title?: string;
  tutor_card_desc?: string;
  rawData?: Record<string, unknown>;
  updatedAt?: string;
}

export const DEFAULT_SITE_SOCIAL_SETTINGS: SiteSocialSettings = {
  id: 1,
  facebookUrl: 'https://www.facebook.com/tutorzonebd',
  whatsappContact: '01602393192',
  bkashNumber: DEFAULT_BKASH_NUMBER,
  nagadNumber: DEFAULT_NAGAD_NUMBER,
  verificationFee: DEFAULT_VERIFICATION_FEE_BDT,
  stats_mode: 'auto',
  counter_mode: 'auto',
  manual_verified_tutors: '120+',
  verified_tutors: '120+',
  manual_online_tutors: '45+',
  online_tutors: '45+',
  manual_active_circulars: '30+',
  active_circulars: '30+',
  manual_total_applications: '85',
  total_applications: '85',
  trust_card_3_value: '100%',
  trust_card_3_label: '100% Smart NID Verified',
  trust_card_4_value: '< 24h',
  trust_card_4_label: 'Fast Guardian Matching',
  hero_top_badge_1: '🛡️ Manual NID & University ID Verification Workflow',
  hero_top_badge_2: 'Verified Guardian Reviews',
  hero_title: 'Verified home & online tutors',
  guardian_card_title: 'Need a Verified Home/Online Tutor?',
  guardian_card_badge: '2 Free Trial Classes',
  tutor_card_title: 'Looking for Tuitions?',
  tutor_card_desc:
    'Verify your Smart NID & Student ID once to get the glowing Verified Tutor badge and apply directly to live guardian circulars across Madaripur.',
};

/**
 * Resolves live homepage Trust Strip counters & hero copy based on `stats_mode` / `counter_mode` ('auto' vs 'manual').
 */
export function resolveHomepageLiveStats(
  settings: Partial<SiteSocialSettings> | null | undefined,
  autoCounts: {
    verifiedTutorsCount: number;
    onlineTutorsCount: number;
    activeCircularsCount: number;
    totalApplicationsCount?: number;
  },
  lang: Language = 'en'
): {
  statsMode: HomepageStatsMode;
  verifiedTutorsDisplay: string;
  onlineTutorsDisplay: string;
  activeCircularsDisplay: string;
  totalApplicationsDisplay: string;
  trustCard3Value: string;
  trustCard3Label: string;
  trustCard4Value: string;
  trustCard4Label: string;
  heroTopBadge1: string;
  heroTopBadge2: string;
  heroTitle: string;
  guardianCardTitle: string;
  guardianCardBadge: string;
  tutorCardTitle: string;
  tutorCardDesc: string;
} {
  const s = { ...DEFAULT_SITE_SOCIAL_SETTINGS, ...(settings || {}) };
  const rawMode =
    settings?.stats_mode ??
    settings?.counter_mode ??
    s.stats_mode ??
    s.counter_mode;
  const statsMode: HomepageStatsMode =
    rawMode === 'manual' ? 'manual' : 'auto';

  const autoVerifiedStr =
    lang === 'bn'
      ? `${toBanglaNumber(autoCounts.verifiedTutorsCount)}+`
      : `${autoCounts.verifiedTutorsCount}+`;
  const autoOnlineStr =
    lang === 'bn'
      ? `${toBanglaNumber(autoCounts.onlineTutorsCount)}+`
      : `${autoCounts.onlineTutorsCount}+`;
  const autoCircularsStr =
    lang === 'bn'
      ? `${toBanglaNumber(autoCounts.activeCircularsCount)}`
      : `${autoCounts.activeCircularsCount}`;
  const rawAutoApps = autoCounts.totalApplicationsCount ?? 0;
  const autoApplicationsStr =
    lang === 'bn' ? `${toBanglaNumber(rawAutoApps)}` : `${rawAutoApps}`;

  const manualVerified =
    settings?.manual_verified_tutors ??
    settings?.verified_tutors ??
    s.manual_verified_tutors ??
    s.verified_tutors ??
    DEFAULT_SITE_SOCIAL_SETTINGS.manual_verified_tutors!;
  const manualOnline =
    settings?.manual_online_tutors ??
    settings?.online_tutors ??
    s.manual_online_tutors ??
    s.online_tutors ??
    DEFAULT_SITE_SOCIAL_SETTINGS.manual_online_tutors!;
  const manualCirculars =
    settings?.manual_active_circulars ??
    settings?.active_circulars ??
    s.manual_active_circulars ??
    s.active_circulars ??
    DEFAULT_SITE_SOCIAL_SETTINGS.manual_active_circulars!;
  const manualApps =
    settings?.manual_total_applications ??
    settings?.total_applications ??
    s.manual_total_applications ??
    s.total_applications ??
    DEFAULT_SITE_SOCIAL_SETTINGS.manual_total_applications!;

  return {
    statsMode,
    verifiedTutorsDisplay:
      statsMode === 'manual' ? String(manualVerified).trim() : autoVerifiedStr,
    onlineTutorsDisplay:
      statsMode === 'manual' ? String(manualOnline).trim() : autoOnlineStr,
    activeCircularsDisplay:
      statsMode === 'manual'
        ? String(manualCirculars).trim()
        : autoCircularsStr,
    totalApplicationsDisplay:
      statsMode === 'manual' ? String(manualApps).trim() : autoApplicationsStr,
    trustCard3Value: (
      s.trust_card_3_value ||
      (lang === 'bn' ? '১০০%' : DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_3_value!)
    ).trim(),
    trustCard3Label: (
      s.trust_card_3_label ||
      (lang === 'bn'
        ? '১০০% স্মার্ট এনআইডি যাচাইকৃত'
        : DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_3_label!)
    ).trim(),
    trustCard4Value: (
      s.trust_card_4_value ||
      (lang === 'bn'
        ? '< ২৪ ঘণ্টা'
        : DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_4_value!)
    ).trim(),
    trustCard4Label: (
      s.trust_card_4_label ||
      (lang === 'bn'
        ? 'দ্রুত অভিভাবক ম্যাচিং'
        : DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_4_label!)
    ).trim(),
    heroTopBadge1: (
      s.hero_top_badge_1 || DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_1!
    ).trim(),
    heroTopBadge2: (
      s.hero_top_badge_2 || DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_2!
    ).trim(),
    heroTitle: (
      s.hero_title || DEFAULT_SITE_SOCIAL_SETTINGS.hero_title!
    ).trim(),
    guardianCardTitle: (
      s.guardian_card_title || DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_title!
    ).trim(),
    guardianCardBadge: (
      s.guardian_card_badge || DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_badge!
    ).trim(),
    tutorCardTitle: (
      s.tutor_card_title || DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_title!
    ).trim(),
    tutorCardDesc: (
      s.tutor_card_desc || DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_desc!
    ).trim(),
  };
}

/**
 * Normalizes a Facebook Page or Profile URL so it always opens cleanly in a new tab.
 */
export function normalizeFacebookUrl(rawInput: string | null | undefined): string {
  const trimmed = (rawInput || '').split('#tzcms=')[0].trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

/**
 * Converts plain Bangladeshi phone numbers (e.g. `017XXXXXXXX`, `+88017XXXXXXXX`, `88017XXXXXXXX`)
 * or direct WhatsApp URLs into clean `https://wa.me/8801XXXXXXXXX` direct chat links.
 */
export function formatWhatsAppDirectLink(
  rawInput: string | null | undefined,
  messageText?: string
): string {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) return '';

  const appendText = (baseUrl: string): string => {
    const cleanMsg = (messageText || '').trim();
    if (!cleanMsg) return baseUrl;
    const sep = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${sep}text=${encodeURIComponent(cleanMsg)}`;
  };

  // Check if input is already a URL or wa.me / whatsapp.com link
  if (/^(https?:\/\/|wa\.me\/|api\.whatsapp\.com\/|(?:www\.)?whatsapp\.com\/)/i.test(trimmed)) {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed.replace(/^\/+/, '')}`;

    // If a wa.me link contains an 11-digit BD local number starting with 01, prefix 88 automatically
    const localWaMatch = withProtocol.match(/^https?:\/\/wa\.me\/(01[3-9]\d{8})(?:[/?#].*)?$/i);
    if (localWaMatch) {
      return appendText(`https://wa.me/88${localWaMatch[1]}`);
    }
    return appendText(withProtocol);
  }

  const digits = trimmed.replace(/\D/g, '');
  if (/^01[3-9]\d{8}$/.test(digits)) {
    return appendText(`https://wa.me/88${digits}`);
  }
  if (/^1[3-9]\d{8}$/.test(digits)) {
    return appendText(`https://wa.me/880${digits}`);
  }
  if (/^8801[3-9]\d{8}$/.test(digits)) {
    return appendText(`https://wa.me/${digits}`);
  }
  if (digits.length >= 7) {
    return appendText(`https://wa.me/${digits}`);
  }

  return appendText(`https://${trimmed.replace(/^\/+/, '')}`);
}

/**
 * Checks whether a social/support channel input is configured and active.
 */
export function isSocialChannelActive(rawInput: string | null | undefined): boolean {
  return Boolean(rawInput && rawInput.trim().length > 0);
}

/**
 * Maps a row from `public.site_settings` (`id = 1`) to `SiteSocialSettings`.
 */
export function mapSiteSettingsRowToSocialSettings(
  row: Record<string, unknown> | null | undefined,
  fallback: SiteSocialSettings = DEFAULT_SITE_SOCIAL_SETTINGS
): SiteSocialSettings {
  if (!row || typeof row !== 'object') {
    return { ...fallback };
  }

  const pickString = (keys: string[], defaultVal: string): string => {
    for (const key of keys) {
      if (typeof row[key] === 'string' && (row[key] as string).trim().length > 0) {
        return (row[key] as string).trim();
      }
      if (typeof row[key] === 'string' && key in row) {
        return (row[key] as string).trim();
      }
    }
    return defaultVal;
  };

  const facebookUrl = pickString(
    ['facebook_url', 'facebookUrl', 'facebook_link', 'facebook'],
    fallback.facebookUrl
  );
  const whatsappContact = pickString(
    [
      'whatsapp_contact',
      'whatsapp_number',
      'whatsapp_url',
      'whatsappContact',
      'whatsapp_link',
      'whatsapp',
    ],
    fallback.whatsappContact
  );
  const bkashNumber = pickString(
    ['bkash_number', 'bkashNumber', 'bkash'],
    fallback.bkashNumber || DEFAULT_BKASH_NUMBER
  );
  const nagadNumber = pickString(
    ['nagad_number', 'nagadNumber', 'nagad'],
    fallback.nagadNumber || DEFAULT_NAGAD_NUMBER
  );
  const rawFee =
    row.verification_fee ?? row.verificationFee ?? fallback.verificationFee;
  const parsedFee = Number(rawFee);
  const verificationFee =
    Number.isFinite(parsedFee) && parsedFee > 0
      ? parsedFee
      : fallback.verificationFee || DEFAULT_VERIFICATION_FEE_BDT;
  const updatedAt = pickString(['updated_at', 'updatedAt'], fallback.updatedAt || '');

  let rawDataObj: Record<string, unknown> | undefined =
    fallback.rawData && typeof fallback.rawData === 'object'
      ? { ...fallback.rawData }
      : undefined;

  if (row.raw_data && typeof row.raw_data === 'object') {
    rawDataObj = {
      ...(rawDataObj || {}),
      ...(row.raw_data as Record<string, unknown>),
    };
  } else if (typeof row.raw_data === 'string' && row.raw_data.trim().startsWith('{')) {
    try {
      const parsedRaw = JSON.parse(row.raw_data) as Record<string, unknown>;
      rawDataObj = { ...(rawDataObj || {}), ...parsedRaw };
    } catch {
      // Ignore malformed JSON
    }
  } else if (row.rawData && typeof row.rawData === 'object') {
    rawDataObj = {
      ...(rawDataObj || {}),
      ...(row.rawData as Record<string, unknown>),
    };
  }

  // Also decode optional `#tzcms=` JSON metadata if stored in facebookUrl
  let cleanFacebookUrl = facebookUrl;
  if (facebookUrl.includes('#tzcms=')) {
    const [baseFb, encodedCms] = facebookUrl.split('#tzcms=');
    cleanFacebookUrl = baseFb.trim();
    if (encodedCms) {
      try {
        const parsedCms = JSON.parse(decodeURIComponent(encodedCms)) as Record<
          string,
          unknown
        >;
        rawDataObj = { ...(rawDataObj || {}), ...parsedCms };
      } catch {
        // Ignore malformed fragment
      }
    }
  }

  const pickCmsString = (keys: string[], defaultVal: string): string => {
    for (const key of keys) {
      const val = row[key];
      if (typeof val === 'string' && val.trim().length > 0) {
        return val.trim();
      }
      if (typeof val === 'number' && Number.isFinite(val)) {
        return String(val);
      }
      if (rawDataObj) {
        const rawVal = rawDataObj[key];
        if (typeof rawVal === 'string' && rawVal.trim().length > 0) {
          return rawVal.trim();
        }
        if (typeof rawVal === 'number' && Number.isFinite(rawVal)) {
          return String(rawVal);
        }
      }
    }
    return defaultVal;
  };

  const rawStatsMode = pickCmsString(
    ['counter_mode', 'stats_mode', 'statsMode', 'counterMode'],
    fallback.stats_mode || fallback.counter_mode || 'auto'
  );
  const stats_mode: HomepageStatsMode =
    rawStatsMode.toLowerCase() === 'manual' ? 'manual' : 'auto';

  const manual_verified_tutors = pickCmsString(
    [
      'verified_tutors',
      'manual_verified_tutors',
      'manualVerifiedTutors',
      'verifiedTutors',
    ],
    fallback.manual_verified_tutors ||
      fallback.verified_tutors ||
      DEFAULT_SITE_SOCIAL_SETTINGS.manual_verified_tutors!
  );
  const manual_online_tutors = pickCmsString(
    [
      'online_tutors',
      'manual_online_tutors',
      'manualOnlineTutors',
      'onlineTutors',
    ],
    fallback.manual_online_tutors ||
      fallback.online_tutors ||
      DEFAULT_SITE_SOCIAL_SETTINGS.manual_online_tutors!
  );
  const manual_active_circulars = pickCmsString(
    [
      'active_circulars',
      'manual_active_circulars',
      'manualActiveCirculars',
      'activeCirculars',
    ],
    fallback.manual_active_circulars ||
      fallback.active_circulars ||
      DEFAULT_SITE_SOCIAL_SETTINGS.manual_active_circulars!
  );
  const manual_total_applications = pickCmsString(
    [
      'total_applications',
      'manual_total_applications',
      'manualTotalApplications',
      'totalApplications',
    ],
    fallback.manual_total_applications ||
      fallback.total_applications ||
      DEFAULT_SITE_SOCIAL_SETTINGS.manual_total_applications!
  );
  const trust_card_3_value = pickCmsString(
    ['trust_card_3_value', 'badge_3_value', 'trustCard3Value'],
    fallback.trust_card_3_value ||
      DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_3_value!
  );
  const trust_card_3_label = pickCmsString(
    ['trust_card_3_label', 'badge_3_label', 'trustCard3Label'],
    fallback.trust_card_3_label ||
      DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_3_label!
  );
  const trust_card_4_value = pickCmsString(
    ['trust_card_4_value', 'badge_4_value', 'trustCard4Value'],
    fallback.trust_card_4_value ||
      DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_4_value!
  );
  const trust_card_4_label = pickCmsString(
    ['trust_card_4_label', 'badge_4_label', 'trustCard4Label'],
    fallback.trust_card_4_label ||
      DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_4_label!
  );
  const hero_top_badge_1 = pickCmsString(
    ['hero_top_badge_1', 'heroTopBadge1'],
    fallback.hero_top_badge_1 ||
      DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_1!
  );
  const hero_top_badge_2 = pickCmsString(
    ['hero_top_badge_2', 'heroTopBadge2'],
    fallback.hero_top_badge_2 ||
      DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_2!
  );
  const hero_title = pickCmsString(
    ['hero_title', 'heroTitle'],
    fallback.hero_title || DEFAULT_SITE_SOCIAL_SETTINGS.hero_title!
  );
  const guardian_card_title = pickCmsString(
    ['guardian_card_title', 'guardianCardTitle'],
    fallback.guardian_card_title ||
      DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_title!
  );
  const guardian_card_badge = pickCmsString(
    ['guardian_card_badge', 'guardianCardBadge'],
    fallback.guardian_card_badge ||
      DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_badge!
  );
  const tutor_card_title = pickCmsString(
    ['tutor_card_title', 'tutorCardTitle'],
    fallback.tutor_card_title ||
      DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_title!
  );
  const tutor_card_desc = pickCmsString(
    ['tutor_card_desc', 'tutorCardDesc'],
    fallback.tutor_card_desc ||
      DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_desc!
  );

  return {
    id: 1,
    facebookUrl: cleanFacebookUrl,
    whatsappContact,
    bkashNumber,
    nagadNumber,
    verificationFee,
    stats_mode,
    counter_mode: stats_mode,
    manual_verified_tutors,
    verified_tutors: manual_verified_tutors,
    manual_online_tutors,
    online_tutors: manual_online_tutors,
    manual_active_circulars,
    active_circulars: manual_active_circulars,
    manual_total_applications,
    total_applications: manual_total_applications,
    trust_card_3_value,
    trust_card_3_label,
    trust_card_4_value,
    trust_card_4_label,
    hero_top_badge_1,
    hero_top_badge_2,
    hero_title,
    guardian_card_title,
    guardian_card_badge,
    tutor_card_title,
    tutor_card_desc,
    ...(rawDataObj ? { rawData: rawDataObj } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

export interface SocialStorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
}

/**
 * Reads `SiteSocialSettings` from `sessionStorage` / `localStorage` with fallback to `DEFAULT_SITE_SOCIAL_SETTINGS`.
 */
export function readSiteSocialSettingsFromStorage(
  storage?: SocialStorageLike | null
): SiteSocialSettings {
  if (storage === undefined && typeof window !== 'undefined') {
    try {
      const sessionRaw = window.sessionStorage.getItem(
        SITE_SOCIAL_SETTINGS_SESSION_KEY
      );
      if (sessionRaw) {
        const parsedSession = JSON.parse(sessionRaw) as Record<string, unknown>;
        return mapSiteSettingsRowToSocialSettings(
          parsedSession,
          DEFAULT_SITE_SOCIAL_SETTINGS
        );
      }
    } catch {
      // Fallback to localStorage
    }
  }

  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;

  if (!targetStorage) {
    return { ...DEFAULT_SITE_SOCIAL_SETTINGS };
  }

  try {
    const raw = targetStorage.getItem(SITE_SOCIAL_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SITE_SOCIAL_SETTINGS };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return mapSiteSettingsRowToSocialSettings(parsed, DEFAULT_SITE_SOCIAL_SETTINGS);
  } catch {
    return { ...DEFAULT_SITE_SOCIAL_SETTINGS };
  }
}

/**
 * Persists `SiteSocialSettings` (`id = 1`) into `localStorage` and `sessionStorage`.
 */
export function writeSiteSocialSettingsToStorage(
  settings: Partial<SiteSocialSettings>,
  storage?: SocialStorageLike | null
): SiteSocialSettings {
  const current = readSiteSocialSettingsFromStorage(storage);
  const resolvedRawData: Record<string, unknown> = {
    ...(current.rawData || {}),
    ...(settings.rawData || {}),
  };

  const resolvedMode: HomepageStatsMode =
    (settings.stats_mode ??
      settings.counter_mode ??
      current.stats_mode ??
      current.counter_mode ??
      DEFAULT_SITE_SOCIAL_SETTINGS.stats_mode) === 'manual'
      ? 'manual'
      : 'auto';

  const resolvedVerified =
    settings.manual_verified_tutors !== undefined
      ? settings.manual_verified_tutors.trim() ||
        DEFAULT_SITE_SOCIAL_SETTINGS.manual_verified_tutors
      : settings.verified_tutors !== undefined
      ? settings.verified_tutors.trim() ||
        DEFAULT_SITE_SOCIAL_SETTINGS.manual_verified_tutors
      : current.manual_verified_tutors ||
        DEFAULT_SITE_SOCIAL_SETTINGS.manual_verified_tutors;

  const resolvedOnline =
    settings.manual_online_tutors !== undefined
      ? settings.manual_online_tutors.trim() ||
        DEFAULT_SITE_SOCIAL_SETTINGS.manual_online_tutors
      : settings.online_tutors !== undefined
      ? settings.online_tutors.trim() ||
        DEFAULT_SITE_SOCIAL_SETTINGS.manual_online_tutors
      : current.manual_online_tutors ||
        DEFAULT_SITE_SOCIAL_SETTINGS.manual_online_tutors;

  const resolvedCirculars =
    settings.manual_active_circulars !== undefined
      ? settings.manual_active_circulars.trim() ||
        DEFAULT_SITE_SOCIAL_SETTINGS.manual_active_circulars
      : settings.active_circulars !== undefined
      ? settings.active_circulars.trim() ||
        DEFAULT_SITE_SOCIAL_SETTINGS.manual_active_circulars
      : current.manual_active_circulars ||
        DEFAULT_SITE_SOCIAL_SETTINGS.manual_active_circulars;

  const resolvedApps =
    settings.manual_total_applications !== undefined
      ? settings.manual_total_applications.trim() ||
        DEFAULT_SITE_SOCIAL_SETTINGS.manual_total_applications
      : settings.total_applications !== undefined
      ? settings.total_applications.trim() ||
        DEFAULT_SITE_SOCIAL_SETTINGS.manual_total_applications
      : current.manual_total_applications ||
        DEFAULT_SITE_SOCIAL_SETTINGS.manual_total_applications;

  const next: SiteSocialSettings = {
    id: 1,
    facebookUrl:
      settings.facebookUrl !== undefined
        ? settings.facebookUrl.split('#tzcms=')[0].trim()
        : current.facebookUrl,
    whatsappContact:
      settings.whatsappContact !== undefined
        ? settings.whatsappContact.trim()
        : current.whatsappContact,
    bkashNumber:
      settings.bkashNumber !== undefined
        ? settings.bkashNumber.trim() || DEFAULT_BKASH_NUMBER
        : current.bkashNumber || DEFAULT_BKASH_NUMBER,
    nagadNumber:
      settings.nagadNumber !== undefined
        ? settings.nagadNumber.trim() || DEFAULT_NAGAD_NUMBER
        : current.nagadNumber || DEFAULT_NAGAD_NUMBER,
    verificationFee:
      settings.verificationFee !== undefined && Number(settings.verificationFee) > 0
        ? Number(settings.verificationFee)
        : current.verificationFee || DEFAULT_VERIFICATION_FEE_BDT,
    stats_mode: resolvedMode,
    counter_mode: resolvedMode,
    manual_verified_tutors: resolvedVerified,
    verified_tutors: resolvedVerified,
    manual_online_tutors: resolvedOnline,
    online_tutors: resolvedOnline,
    manual_active_circulars: resolvedCirculars,
    active_circulars: resolvedCirculars,
    manual_total_applications: resolvedApps,
    total_applications: resolvedApps,
    trust_card_3_value:
      settings.trust_card_3_value !== undefined
        ? settings.trust_card_3_value.trim() ||
          DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_3_value
        : current.trust_card_3_value ||
          DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_3_value,
    trust_card_3_label:
      settings.trust_card_3_label !== undefined
        ? settings.trust_card_3_label.trim() ||
          DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_3_label
        : current.trust_card_3_label ||
          DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_3_label,
    trust_card_4_value:
      settings.trust_card_4_value !== undefined
        ? settings.trust_card_4_value.trim() ||
          DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_4_value
        : current.trust_card_4_value ||
          DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_4_value,
    trust_card_4_label:
      settings.trust_card_4_label !== undefined
        ? settings.trust_card_4_label.trim() ||
          DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_4_label
        : current.trust_card_4_label ||
          DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_4_label,
    hero_top_badge_1:
      settings.hero_top_badge_1 !== undefined
        ? settings.hero_top_badge_1.trim() ||
          DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_1
        : current.hero_top_badge_1 ||
          DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_1,
    hero_top_badge_2:
      settings.hero_top_badge_2 !== undefined
        ? settings.hero_top_badge_2.trim() ||
          DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_2
        : current.hero_top_badge_2 ||
          DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_2,
    hero_title:
      settings.hero_title !== undefined
        ? settings.hero_title.trim() ||
          DEFAULT_SITE_SOCIAL_SETTINGS.hero_title
        : current.hero_title || DEFAULT_SITE_SOCIAL_SETTINGS.hero_title,
    guardian_card_title:
      settings.guardian_card_title !== undefined
        ? settings.guardian_card_title.trim() ||
          DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_title
        : current.guardian_card_title ||
          DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_title,
    guardian_card_badge:
      settings.guardian_card_badge !== undefined
        ? settings.guardian_card_badge.trim() ||
          DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_badge
        : current.guardian_card_badge ||
          DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_badge,
    tutor_card_title:
      settings.tutor_card_title !== undefined
        ? settings.tutor_card_title.trim() ||
          DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_title
        : current.tutor_card_title ||
          DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_title,
    tutor_card_desc:
      settings.tutor_card_desc !== undefined
        ? settings.tutor_card_desc.trim() ||
          DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_desc
        : current.tutor_card_desc ||
          DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_desc,
    ...(Object.keys(resolvedRawData).length > 0 ? { rawData: resolvedRawData } : {}),
    updatedAt: settings.updatedAt || new Date().toISOString(),
  };

  const serialized = JSON.stringify(next);

  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;

  if (targetStorage) {
    try {
      targetStorage.setItem(SITE_SOCIAL_SETTINGS_STORAGE_KEY, serialized);
    } catch {
      // Ignore storage quota or security errors
    }
  }

  if (storage === undefined && typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(SITE_SOCIAL_SETTINGS_SESSION_KEY, serialized);
    } catch {
      // Ignore sessionStorage errors
    }
  }

  return next;
}

export const SITE_SETTINGS_SELECT_COLUMNS =
  'id,counter_mode,verified_tutors,online_tutors,active_circulars,total_applications,trust_card_3_value,trust_card_3_label,trust_card_4_value,trust_card_4_label,updated_at';

export const SITE_SETTINGS_LEGACY_COLUMNS =
  'id,facebook_url,whatsapp_url,bkash_number,nagad_number,verification_fee,stats_mode,manual_verified_tutors,manual_online_tutors,manual_active_circulars,badge_3_value,badge_3_label,badge_4_value,badge_4_label,hero_top_badge_1,hero_top_badge_2,hero_title,guardian_card_title,guardian_card_badge,tutor_card_title,tutor_card_desc,raw_data,updated_at';

export const SITE_SETTINGS_MINIMAL_COLUMNS = 'id,facebook_url,whatsapp_url,raw_data';

export const SITE_SETTINGS_SESSION_FETCHED_KEY =
  'tutorzone_site_settings_fetched_once_v1';

const siteSettingsClientKnownColumns = new WeakMap<object, Set<string>>();

/**
 * Fetches live social, payment & homepage CMS settings from Supabase `public.site_settings` (`id = 1`)
 * and syncs them to browser storage so regular users always receive real-time counter values.
 */
export async function fetchSiteSocialSettingsFromSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  storage?: SocialStorageLike | null
): Promise<SiteSocialSettings> {
  const localSettings = readSiteSocialSettingsFromStorage(storage);
  if (!supabaseClient || typeof supabaseClient.from !== 'function') {
    return localSettings;
  }

  const runSiteSettingsQuery = async (columns: string) => {
    const query = supabaseClient
      .from('site_settings')
      .select(columns)
      .eq('id', 1);
    if (typeof query.maybeSingle === 'function') {
      return query.maybeSingle();
    }
    if (typeof query.single === 'function') {
      return query.single();
    }
    if (typeof query.limit === 'function') {
      const res = await query.limit(1);
      return {
        data:
          Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null,
        error: res.error,
      };
    }
    return { data: null, error: null };
  };

  try {
    let res = await runSiteSettingsQuery(SITE_SETTINGS_SELECT_COLUMNS);
    if (res?.error) {
      res = await runSiteSettingsQuery(SITE_SETTINGS_LEGACY_COLUMNS);
    }
    if (res?.error) {
      res = await runSiteSettingsQuery(SITE_SETTINGS_MINIMAL_COLUMNS);
    }
    if (res?.error) {
      res = await runSiteSettingsQuery('id,facebook_url,whatsapp_url');
    }
    const row =
      !res?.error && res?.data && typeof res.data === 'object'
        ? (res.data as Record<string, unknown>)
        : null;

    if (row) {
      siteSettingsClientKnownColumns.set(
        supabaseClient as object,
        new Set(Object.keys(row))
      );
      const mapped = mapSiteSettingsRowToSocialSettings(row, localSettings);
      return writeSiteSocialSettingsToStorage(mapped, storage);
    }
  } catch {
    // Fallback cleanly to localStorage if table is not yet provisioned or network is offline
  }

  return localSettings;
}

/**
 * Fetches `site_settings` (`id = 1`) from Supabase. When `forceRefresh` is true,
 * bypasses sessionStorage cache completely so users receive real-time DB updates immediately.
 */
export async function fetchSiteSocialSettingsOncePerSession(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  forceRefresh = false,
  storage?: SocialStorageLike | null
): Promise<SiteSocialSettings> {
  const sessionStore =
    typeof window !== 'undefined' && window.sessionStorage
      ? window.sessionStorage
      : null;

  if (!forceRefresh && sessionStore) {
    try {
      const alreadyFetched =
        sessionStore.getItem(SITE_SETTINGS_SESSION_FETCHED_KEY) === '1';
      const cachedSession = sessionStore.getItem(
        SITE_SOCIAL_SETTINGS_SESSION_KEY
      );
      if (alreadyFetched && cachedSession) {
        return readSiteSocialSettingsFromStorage(storage);
      }
    } catch {
      // Ignore sessionStorage restrictions
    }
  }

  const fresh = await fetchSiteSocialSettingsFromSupabase(
    supabaseClient,
    storage
  );
  if (sessionStore) {
    try {
      sessionStore.setItem(
        SITE_SOCIAL_SETTINGS_SESSION_KEY,
        JSON.stringify(fresh)
      );
      sessionStore.setItem(SITE_SETTINGS_SESSION_FETCHED_KEY, '1');
    } catch {
      // Ignore sessionStorage quota errors
    }
  }
  return fresh;
}

/**
 * Saves and publishes Admin-configured Social, Payment, and Homepage & Live Stats CMS settings to
 * Supabase `public.site_settings` (`id = 1`) and `sessionStorage` / `localStorage` with a single query.
 */
export async function saveSiteSocialSettingsToSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  input: Partial<SiteSocialSettings>,
  storage?: SocialStorageLike | null
): Promise<{
  success: boolean;
  settings: SiteSocialSettings;
  syncedToSupabase: boolean;
  message: string;
}> {
  const currentLocal = readSiteSocialSettingsFromStorage(storage);
  const updatedAt = new Date().toISOString();
  const savedLocal = writeSiteSocialSettingsToStorage(
    {
      ...currentLocal,
      ...input,
      id: 1,
      updatedAt,
    },
    storage
  );

  let syncedToSupabase = false;
  const hasExplicitPaymentSettings =
    input.bkashNumber !== undefined ||
    input.nagadNumber !== undefined ||
    input.verificationFee !== undefined;

  const hasExplicitHomepageCmsSettings =
    input.stats_mode !== undefined ||
    input.counter_mode !== undefined ||
    input.manual_verified_tutors !== undefined ||
    input.verified_tutors !== undefined ||
    input.manual_online_tutors !== undefined ||
    input.online_tutors !== undefined ||
    input.manual_active_circulars !== undefined ||
    input.active_circulars !== undefined ||
    input.manual_total_applications !== undefined ||
    input.total_applications !== undefined ||
    input.trust_card_3_value !== undefined ||
    input.trust_card_3_label !== undefined ||
    input.trust_card_4_value !== undefined ||
    input.trust_card_4_label !== undefined ||
    input.hero_top_badge_1 !== undefined ||
    input.hero_top_badge_2 !== undefined ||
    input.hero_title !== undefined ||
    input.guardian_card_title !== undefined ||
    input.guardian_card_badge !== undefined ||
    input.tutor_card_title !== undefined ||
    input.tutor_card_desc !== undefined;

  if (supabaseClient && typeof supabaseClient.from === 'function') {
    const knownCols = siteSettingsClientKnownColumns.get(
      supabaseClient as object
    );
    const isLiveCounterModeSchema = Boolean(
      knownCols && knownCols.has('counter_mode') && !knownCols.has('facebook_url')
    );
    const supportsPaymentCols =
      !knownCols ||
      (knownCols.has('bkash_number') &&
        knownCols.has('nagad_number') &&
        knownCols.has('verification_fee'));

    const supportsHomepageCmsCols =
      !knownCols ||
      (knownCols.has('stats_mode') && knownCols.has('hero_title'));

    const liveCounterSchemaPayload: Record<string, unknown> = {
      id: 1,
      counter_mode: savedLocal.stats_mode || 'auto',
      verified_tutors: savedLocal.manual_verified_tutors,
      online_tutors: savedLocal.manual_online_tutors,
      active_circulars: savedLocal.manual_active_circulars,
      total_applications: savedLocal.manual_total_applications,
      trust_card_3_value: savedLocal.trust_card_3_value,
      trust_card_3_label: savedLocal.trust_card_3_label,
      trust_card_4_value: savedLocal.trust_card_4_value,
      trust_card_4_label: savedLocal.trust_card_4_label,
      updated_at: updatedAt,
    };

    const cmsMetadataPayload: Record<string, unknown> = {
      stats_mode: savedLocal.stats_mode || 'auto',
      manual_verified_tutors: savedLocal.manual_verified_tutors,
      manual_online_tutors: savedLocal.manual_online_tutors,
      manual_active_circulars: savedLocal.manual_active_circulars,
      manual_total_applications: savedLocal.manual_total_applications,
      trust_card_3_value: savedLocal.trust_card_3_value,
      trust_card_3_label: savedLocal.trust_card_3_label,
      trust_card_4_value: savedLocal.trust_card_4_value,
      trust_card_4_label: savedLocal.trust_card_4_label,
      hero_top_badge_1: savedLocal.hero_top_badge_1,
      hero_top_badge_2: savedLocal.hero_top_badge_2,
      hero_title: savedLocal.hero_title,
      guardian_card_title: savedLocal.guardian_card_title,
      guardian_card_badge: savedLocal.guardian_card_badge,
      tutor_card_title: savedLocal.tutor_card_title,
      tutor_card_desc: savedLocal.tutor_card_desc,
    };

    const facebookWithCmsFragment = `${savedLocal.facebookUrl}#tzcms=${encodeURIComponent(
      JSON.stringify(cmsMetadataPayload)
    )}`;

    const candidatePayloads: Record<string, unknown>[] = [];

    if (isLiveCounterModeSchema) {
      candidatePayloads.push(liveCounterSchemaPayload);
    }

    if (hasExplicitHomepageCmsSettings && supportsHomepageCmsCols && !isLiveCounterModeSchema) {
      if (!knownCols || knownCols.has('manual_total_applications')) {
        candidatePayloads.push({
          id: 1,
          facebook_url: savedLocal.facebookUrl,
          whatsapp_url: formatWhatsAppDirectLink(savedLocal.whatsappContact),
          bkash_number: savedLocal.bkashNumber || DEFAULT_BKASH_NUMBER,
          nagad_number: savedLocal.nagadNumber || DEFAULT_NAGAD_NUMBER,
          verification_fee:
            savedLocal.verificationFee || DEFAULT_VERIFICATION_FEE_BDT,
          ...cmsMetadataPayload,
          updated_at: updatedAt,
        });
      }
      candidatePayloads.push({
        id: 1,
        facebook_url: facebookWithCmsFragment,
        whatsapp_url: formatWhatsAppDirectLink(savedLocal.whatsappContact),
        bkash_number: savedLocal.bkashNumber || DEFAULT_BKASH_NUMBER,
        nagad_number: savedLocal.nagadNumber || DEFAULT_NAGAD_NUMBER,
        verification_fee:
          savedLocal.verificationFee || DEFAULT_VERIFICATION_FEE_BDT,
        stats_mode: savedLocal.stats_mode || 'auto',
        manual_verified_tutors: savedLocal.manual_verified_tutors,
        manual_online_tutors: savedLocal.manual_online_tutors,
        manual_active_circulars: savedLocal.manual_active_circulars,
        trust_card_3_value: savedLocal.trust_card_3_value,
        trust_card_3_label: savedLocal.trust_card_3_label,
        trust_card_4_value: savedLocal.trust_card_4_value,
        trust_card_4_label: savedLocal.trust_card_4_label,
        hero_top_badge_1: savedLocal.hero_top_badge_1,
        hero_top_badge_2: savedLocal.hero_top_badge_2,
        hero_title: savedLocal.hero_title,
        guardian_card_title: savedLocal.guardian_card_title,
        guardian_card_badge: savedLocal.guardian_card_badge,
        tutor_card_title: savedLocal.tutor_card_title,
        tutor_card_desc: savedLocal.tutor_card_desc,
        updated_at: updatedAt,
      });
    }

    if (hasExplicitHomepageCmsSettings && !isLiveCounterModeSchema) {
      candidatePayloads.push(liveCounterSchemaPayload);
      if (!knownCols || knownCols.has('raw_data')) {
        candidatePayloads.push({
          id: 1,
          facebook_url: savedLocal.facebookUrl,
          whatsapp_url: formatWhatsAppDirectLink(savedLocal.whatsappContact),
          bkash_number: savedLocal.bkashNumber || DEFAULT_BKASH_NUMBER,
          nagad_number: savedLocal.nagadNumber || DEFAULT_NAGAD_NUMBER,
          verification_fee:
            savedLocal.verificationFee || DEFAULT_VERIFICATION_FEE_BDT,
          raw_data: cmsMetadataPayload,
          updated_at: updatedAt,
        });
      }
      if (supportsPaymentCols) {
        candidatePayloads.push({
          id: 1,
          facebook_url: facebookWithCmsFragment,
          whatsapp_url: formatWhatsAppDirectLink(savedLocal.whatsappContact),
          bkash_number: savedLocal.bkashNumber || DEFAULT_BKASH_NUMBER,
          nagad_number: savedLocal.nagadNumber || DEFAULT_NAGAD_NUMBER,
          verification_fee:
            savedLocal.verificationFee || DEFAULT_VERIFICATION_FEE_BDT,
          updated_at: updatedAt,
        });
      }
      candidatePayloads.push({
        id: 1,
        facebook_url: facebookWithCmsFragment,
        whatsapp_url: formatWhatsAppDirectLink(savedLocal.whatsappContact),
        updated_at: updatedAt,
      });
      candidatePayloads.push({
        id: 1,
        facebook_url: facebookWithCmsFragment,
        whatsapp_url: formatWhatsAppDirectLink(savedLocal.whatsappContact),
      });
    }

    if (hasExplicitPaymentSettings && supportsPaymentCols && !isLiveCounterModeSchema) {
      candidatePayloads.push({
        id: 1,
        facebook_url: savedLocal.facebookUrl,
        whatsapp_url: formatWhatsAppDirectLink(savedLocal.whatsappContact),
        bkash_number: savedLocal.bkashNumber || DEFAULT_BKASH_NUMBER,
        nagad_number: savedLocal.nagadNumber || DEFAULT_NAGAD_NUMBER,
        verification_fee:
          savedLocal.verificationFee || DEFAULT_VERIFICATION_FEE_BDT,
        updated_at: updatedAt,
      });
    }

    if (!isLiveCounterModeSchema) {
      candidatePayloads.push(
        {
          id: 1,
          facebook_url: savedLocal.facebookUrl,
          whatsapp_url: formatWhatsAppDirectLink(savedLocal.whatsappContact),
          updated_at: updatedAt,
        },
        {
          id: 1,
          facebook_url: savedLocal.facebookUrl,
          whatsapp_url: formatWhatsAppDirectLink(savedLocal.whatsappContact),
        },
        {
          id: 1,
          facebook_url: savedLocal.facebookUrl,
          whatsapp_number: savedLocal.whatsappContact,
        },
        liveCounterSchemaPayload
      );
    }

    for (const payload of candidatePayloads) {
      try {
        const res = await supabaseClient
          .from('site_settings')
          .upsert(payload, { onConflict: 'id' });
        if (!res.error) {
          syncedToSupabase = true;
          break;
        }
      } catch {
        // Try next payload shape or fall back to localStorage
      }
    }
  }

  return {
    success: true,
    settings: savedLocal,
    syncedToSupabase,
    message: hasExplicitHomepageCmsSettings
      ? HOMEPAGE_STATS_UPDATED_TOAST
      : SOCIAL_LINKS_UPDATED_TOAST,
  };
}

/* ============================================================================
   BKASH & NAGAD PAYMENT VERIFICATION (SUPABASE `payment_requests` & `site_settings`)
   ============================================================================ */

export interface PaymentSubmissionInput {
  paymentMethod: PaymentMethod | string;
  senderNumber: string;
  transactionId: string;
  amount: number | string;
  purpose?: string;
  circularId?: string;
  circularTitle?: string;
  guardianPhone?: string;
  guardianAddress?: string;
  tutorName?: string;
  tutorId?: string;
  userEmail?: string | null;
  userId?: string | null;
}

export function validateTransactionId(trxId: string): boolean {
  const cleaned = (trxId || '').trim();
  return /^[A-Za-z0-9_-]{5,28}$/.test(cleaned);
}

export function validatePaymentSubmissionInput(
  input: PaymentSubmissionInput
): {
  valid: boolean;
  errorEn?: string;
  errorBn?: string;
  errorMessage?: string;
  cleanSenderNumber?: string;
  cleanTransactionId?: string;
  cleanAmount?: number;
} {
  const methodNorm = (input.paymentMethod || '').trim().toLowerCase();
  if (methodNorm !== 'bkash' && methodNorm !== 'nagad') {
    const errorEn = 'Please select a valid payment method (bKash or Nagad).';
    return {
      valid: false,
      errorEn,
      errorBn: 'অনুগ্রহ করে পেমেন্ট মাধ্যম নির্বাচন করুন (বিকাশ অথবা নগদ)।',
      errorMessage: errorEn,
    };
  }

  if (!validatePhoneBD(input.senderNumber || '')) {
    const errorEn =
      'Please enter a valid 11-digit BD sender mobile number (e.g. 01308937770).';
    return {
      valid: false,
      errorEn,
      errorBn:
        'সঠিক ১১ ডিজিটের প্রেরক বিকাশ/নগদ মোবাইল নম্বর দিন (যেমন: 01308937770)।',
      errorMessage: errorEn,
    };
  }

  if (!validateTransactionId(input.transactionId || '')) {
    const errorEn =
      'Please enter a valid Transaction ID (TrxID, 5–28 alphanumeric characters).';
    return {
      valid: false,
      errorEn,
      errorBn: 'সঠিক ট্রানজেকশন আইডি (TrxID) প্রদান করুন (ন্যূনতম ৫ অক্ষর)।',
      errorMessage: errorEn,
    };
  }

  const parsedAmount = Number(String(input.amount).replace(/[^\d.]/g, ''));
  if (!Number.isFinite(parsedAmount) || parsedAmount < 50) {
    const errorEn = 'Please enter a valid payment amount (minimum ৳50 BDT).';
    return {
      valid: false,
      errorEn,
      errorBn: 'সঠিক পেমেন্ট পরিমাণ উল্লেখ করুন (ন্যূনতম ৫০ টাকা)।',
      errorMessage: errorEn,
    };
  }

  const rawSender = (input.senderNumber || '').trim().replace(/[\s-]/g, '');
  const cleanSenderNumber = rawSender.startsWith('+88')
    ? rawSender.slice(3)
    : rawSender.startsWith('880') && rawSender.length === 13
    ? rawSender.slice(2)
    : rawSender;

  return {
    valid: true,
    cleanSenderNumber,
    cleanTransactionId: (input.transactionId || '').trim().toUpperCase(),
    cleanAmount: parsedAmount,
  };
}

export function buildPaymentRequestRow(
  input: PaymentSubmissionInput,
  userAccount?: UserAccount | null,
  tutorProfile?: VerificationRequest | null
): PaymentRequestRow {
  const cleanMethod: PaymentMethod =
    (input.paymentMethod || '').trim().toLowerCase() === 'nagad'
      ? 'Nagad'
      : 'bKash';
  const cleanSender = (input.senderNumber || '').trim().replace(/[\s-]/g, '');
  const cleanTrxId = (input.transactionId || '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();
  const cleanAmount =
    Number(String(input.amount).replace(/[^\d.]/g, '')) ||
    DEFAULT_VERIFICATION_FEE_BDT;
  const cleanPurpose =
    (input.purpose || '').trim() || 'Profile Verification Fee';

  const cleanEmail = (
    input.userEmail ||
    userAccount?.email ||
    tutorProfile?.userEmail ||
    tutorProfile?.email ||
    `${cleanSender}@tutorzone.local`
  )
    .trim()
    .toLowerCase();
  const cleanTutorName = (
    input.tutorName ||
    tutorProfile?.tutorNameEn ||
    userAccount?.fullName ||
    (cleanEmail ? cleanEmail.split('@')[0] : '') ||
    'Verified Tutor'
  ).trim();

  return {
    user_email: cleanEmail,
    user_name: cleanTutorName,
    payment_method: cleanMethod,
    sender_number: cleanSender,
    transaction_id: cleanTrxId,
    amount: cleanAmount,
    purpose: cleanPurpose,
    circular_id: (input.circularId || '').trim() || null,
    circular_title: (input.circularTitle || '').trim() || null,
    guardian_phone: (input.guardianPhone || '').trim() || null,
    guardian_address: (input.guardianAddress || '').trim() || null,
    status: 'Pending',
    created_at: new Date().toISOString(),
  };
}

export function mapPaymentRequestRowToRecord(
  row: PaymentRequestRow & Record<string, any>
): PaymentRequestRecord {
  const rawData =
    row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {};
  const rawMethod = (
    row.payment_method ||
    row.method ||
    rawData.payment_method ||
    'bKash'
  )
    .toString()
    .trim();
  const paymentMethod: PaymentMethod =
    rawMethod.toLowerCase() === 'nagad' ? 'Nagad' : 'bKash';

  const rawStatus = (row.status || rawData.status || 'Pending')
    .toString()
    .trim()
    .toLowerCase();
  const status: PaymentRequestStatus =
    rawStatus === 'approved' || rawStatus === 'verified'
      ? 'Approved'
      : rawStatus === 'rejected'
      ? 'Rejected'
      : 'Pending';

  const rawTrx = (
    row.transaction_id ||
    row.trx_id ||
    rawData.transaction_id ||
    ''
  )
    .trim()
    .toUpperCase();
  const requestCode =
    (row.request_code || rawData.request_code || '').trim() ||
    (rawTrx ? `PAY-${rawTrx}` : row.id ? String(row.id) : 'PAY-2026');
  const id = (row.id ? String(row.id) : requestCode).trim();

  const createdDate = row.created_at ? new Date(row.created_at) : null;
  const createdAt =
    createdDate && !Number.isNaN(createdDate.getTime())
      ? createdDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : row.created_at || 'Just now';

  const cleanEmail =
    (row.user_email || rawData.user_email || '').trim().toLowerCase() ||
    undefined;
  const cleanUserId =
    (row.user_id || rawData.user_id || '').trim() ||
    (cleanEmail ? cleanEmail.split('@')[0] : undefined);
  const cleanTutorName =
    (
      row.user_name ||
      row.tutor_name ||
      rawData.user_name ||
      rawData.tutor_name ||
      ''
    ).trim() || (cleanEmail ? cleanEmail.split('@')[0] : 'Tutor Applicant');

  return {
    id,
    requestCode,
    userId: cleanUserId,
    userEmail: cleanEmail,
    tutorId:
      (row.tutor_id || rawData.tutor_id || '').trim() || undefined,
    tutorName: cleanTutorName,
    paymentMethod,
    senderNumber: (
      row.sender_number ||
      row.phone ||
      rawData.sender_number ||
      ''
    ).trim(),
    transactionId: rawTrx,
    amount:
      Number(String(row.amount ?? rawData.amount ?? '').replace(/[^\d.]/g, '')) ||
      DEFAULT_VERIFICATION_FEE_BDT,
    purpose:
      (row.purpose || rawData.purpose || '').trim() ||
      'Profile Verification Fee',
    circularId:
      (row.circular_id || rawData.circular_id || '').trim() || undefined,
    circularTitle:
      (row.circular_title || rawData.circular_title || '').trim() || undefined,
    guardianPhone:
      (row.guardian_phone || rawData.guardian_phone || '').trim() || undefined,
    guardianAddress:
      (row.guardian_address || rawData.guardian_address || '').trim() ||
      undefined,
    status,
    adminNote:
      (
        row.admin_note ||
        row.rejection_note ||
        rawData.admin_note ||
        ''
      ).trim() || undefined,
    hiddenFromAdmin: Boolean(
      row.hidden_from_admin ?? rawData.hidden_from_admin ?? false
    ),
    createdAt,
  };
}

export function doesPaymentBelongToUser(
  payment: PaymentRequestRecord,
  user?: Partial<UserAccount> | string | null,
  userProfile?: VerificationRequest | null
): boolean {
  if (!user && !userProfile) return false;
  const cleanEmail = (
    typeof user === 'string'
      ? user
      : user?.email || userProfile?.userEmail || userProfile?.email || ''
  )
    .trim()
    .toLowerCase();
  const cleanUserId = (
    typeof user === 'string'
      ? user.split('@')[0]
      : user?.id ||
        userProfile?.userId ||
        (cleanEmail ? cleanEmail.split('@')[0] : '')
  )
    .trim()
    .toLowerCase();
  const cleanTutorId = (userProfile?.id || '').trim().toLowerCase();

  const payEmail = (payment.userEmail || '').trim().toLowerCase();
  const payUserId = (payment.userId || '').trim().toLowerCase();
  const payTutorId = (payment.tutorId || '').trim().toLowerCase();

  if (payEmail && cleanEmail) {
    return payEmail === cleanEmail;
  }
  if (payUserId && cleanUserId && payUserId === cleanUserId) {
    return true;
  }
  if (payTutorId && cleanTutorId && payTutorId === cleanTutorId) {
    return true;
  }
  return false;
}

export function getUserPaymentRequests(
  payments: PaymentRequestRecord[],
  user?: Partial<UserAccount> | string | null,
  userProfile?: VerificationRequest | null
): PaymentRequestRecord[] {
  if (!Array.isArray(payments)) return [];
  return payments.filter((p) => doesPaymentBelongToUser(p, user, userProfile));
}

export function getTutorPaymentVerificationSummary(
  payments: PaymentRequestRecord[],
  user?: Partial<UserAccount> | string | null,
  userProfile?: VerificationRequest | null
): {
  hasApproved: boolean;
  hasVerifiedPayment: boolean;
  hasPending: boolean;
  hasPendingPayment: boolean;
  hasRejected: boolean;
  latestRequest?: PaymentRequestRecord;
  latestPayment?: PaymentRequestRecord;
  totalCount: number;
} {
  const userPayments = getUserPaymentRequests(payments, user, userProfile);
  const hasApproved = userPayments.some((p) => p.status === 'Approved');
  const hasPending = userPayments.some((p) => p.status === 'Pending');
  const hasRejected = userPayments.some((p) => p.status === 'Rejected');
  return {
    hasApproved,
    hasVerifiedPayment: hasApproved,
    hasPending,
    hasPendingPayment: hasPending,
    hasRejected,
    latestRequest: userPayments[0],
    latestPayment: userPayments[0],
    totalCount: userPayments.length,
  };
}

/**
 * Finds a specific payment record associated with a tuition circular ID.
 */
export function getPaymentForCircular(
  payments: PaymentRequestRecord[],
  circularId: string
): PaymentRequestRecord | undefined {
  if (!circularId || !Array.isArray(payments)) return undefined;
  const cleanId = circularId.trim().toLowerCase();

  // 1. Direct circularId match
  const directMatch = payments.find(
    (p) => (p.circularId || '').trim().toLowerCase() === cleanId
  );
  if (directMatch) return directMatch;

  // 2. Purpose contains circularId (e.g. "Tuition Media Fee (MDP-2041)")
  const purposeMatch = payments.find((p) =>
    (p.purpose || '').trim().toLowerCase().includes(cleanId)
  );
  if (purposeMatch) return purposeMatch;

  // 3. Circular title match
  const titleMatch = payments.find(
    (p) => (p.circularTitle || '').trim().toLowerCase() === cleanId
  );
  if (titleMatch) return titleMatch;

  return undefined;
}

/**
 * Checks if the user has an Admin-approved payment for a specific tuition circular.
 */
export function isPaymentApprovedForCircular(
  payments: PaymentRequestRecord[],
  circularId: string,
  user?: Partial<UserAccount> | string | null,
  userProfile?: VerificationRequest | null
): boolean {
  const userPayments = getUserPaymentRequests(payments, user, userProfile);
  const matched = getPaymentForCircular(userPayments, circularId);
  return matched?.status === 'Approved';
}

/**
 * Checks if the user has at least one confirmed or verified circular application.
 */
export function hasUserConfirmedTuition(
  applications: CircularApplicationRow[],
  user?: Partial<UserAccount> | string | null,
  userProfile?: VerificationRequest | null
): boolean {
  const userApps = getUserAppliedApplications(
    applications,
    user as UserAccount | string | null | undefined,
    userProfile
  );
  return userApps.some((a) => {
    const s = (a.status || '').trim().toLowerCase();
    return (
      s === 'confirmed' ||
      s === 'approved' ||
      s === 'verified_for_tuition' ||
      s === 'verified for tuition'
    );
  });
}

/**
 * Extracts the media fee assigned to an application (defaults to 1000 BDT).
 */
export function extractMediaFeeFromApplication(
  app?: Partial<CircularApplicationRow> | null,
  defaultFee: number = 1000
): number {
  if (!app) return defaultFee;
  if (app.media_fee && typeof app.media_fee === 'number' && app.media_fee > 0) {
    return app.media_fee;
  }
  const noteMatch = (app.experience_note || '').match(/\[Media Fee:\s*৳?(\d+)\]/i);
  if (noteMatch) {
    const parsed = Number(noteMatch[1]);
    if (parsed > 0) return parsed;
  }
  return defaultFee;
}

/**
 * Extracts custom Admin Note / Instructions assigned to an application.
 */
export function extractAdminNoteFromApplication(
  app?: Partial<CircularApplicationRow> | null
): string {
  if (!app) return '';
  if (app.rejection_note && app.rejection_note.trim()) {
    return app.rejection_note.trim();
  }
  if (app.admin_note && app.admin_note.trim()) {
    return app.admin_note.trim();
  }
  const noteMatch = (app.experience_note || '').match(
    /\[Admin Note:\s*([^\]]+)\]/i
  );
  if (noteMatch && noteMatch[1]) {
    return noteMatch[1].trim();
  }
  return '';
}

/**
 * Returns the applicant's clean experience note without internal [Media Fee: ...] or [Admin Note: ...] tags.
 */
export function getCleanApplicantExperienceNote(
  app?: Partial<CircularApplicationRow> | null
): string {
  if (!app || !app.experience_note) return '';
  return app.experience_note
    .replace(/\s*\[Media Fee:.*?\]/gi, '')
    .replace(/\s*\[Admin Note:.*?\]/gi, '')
    .trim();
}

/**
 * Rule 1: Hide the general bKash/Nagad payment section from the main Profile page for regular users.
 * Returns true only if the user is an authorized Admin.
 */
export function canShowPaymentSectionOnProfile(
  _applications: CircularApplicationRow[] = [],
  _payments: PaymentRequestRecord[] = [],
  _user?: Partial<UserAccount> | string | null,
  _userProfile?: VerificationRequest | null,
  isAdmin: boolean = false
): boolean {
  return Boolean(isAdmin);
}

export function filterAdminVisiblePaymentRequests(
  payments: PaymentRequestRecord[],
  hiddenIds: string[] = []
): PaymentRequestRecord[] {
  const hiddenSet = new Set(hiddenIds.map((id) => id.trim().toLowerCase()));
  return (payments || []).filter((p) => {
    if (p.hiddenFromAdmin) return false;
    if (hiddenSet.has(p.id.toLowerCase())) return false;
    if (hiddenSet.has(p.requestCode.toLowerCase())) return false;
    return true;
  });
}

export function readPaymentRequestsFromStorage(
  storage?: SocialStorageLike | null
): PaymentRequestRecord[] {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;

  if (!targetStorage) return [];
  try {
    const raw = targetStorage.getItem(PAYMENT_REQUESTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PaymentRequestRecord[];
  } catch {
    return [];
  }
}

export function writePaymentRequestsToStorage(
  records: PaymentRequestRecord[],
  storage?: SocialStorageLike | null
): PaymentRequestRecord[] {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;

  if (targetStorage) {
    try {
      targetStorage.setItem(
        PAYMENT_REQUESTS_STORAGE_KEY,
        JSON.stringify(records)
      );
    } catch {
      // Ignore storage quota errors
    }
  }
  return records;
}

export const PAYMENT_REQUESTS_SELECT_COLUMNS =
  'id,tutor_id,tutor_name,amount,purpose,circular_id,status,raw_data,created_at';

export const PAYMENT_REQUESTS_FALLBACK_COLUMNS =
  'id,tutor_id,amount,status,raw_data,created_at';

export async function fetchPaymentRequestsFromSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  storage?: SocialStorageLike | null
): Promise<PaymentRequestRecord[]> {
  const localRecords = readPaymentRequestsFromStorage(storage);
  if (!supabaseClient || typeof supabaseClient.from !== 'function') {
    return localRecords;
  }

  try {
    let res = await supabaseClient
      .from('payment_requests')
      .select(PAYMENT_REQUESTS_SELECT_COLUMNS)
      .order('created_at', { ascending: false });

    if (res.error) {
      res = await supabaseClient
        .from('payment_requests')
        .select(PAYMENT_REQUESTS_FALLBACK_COLUMNS)
        .order('created_at', { ascending: false });
    }

    if (!res.error && Array.isArray(res.data)) {
      const remoteRecords = (res.data as PaymentRequestRow[]).map(
        mapPaymentRequestRowToRecord
      );
      const localByTrx = new Map(
        localRecords.map((loc) => [loc.transactionId.toLowerCase(), loc])
      );
      const enrichedRemote = remoteRecords.map((rem) => {
        const localMatch = localByTrx.get(rem.transactionId.toLowerCase());
        if (localMatch?.adminNote && !rem.adminNote) {
          return { ...rem, adminNote: localMatch.adminNote };
        }
        return rem;
      });
      const seenKeys = new Set(
        enrichedRemote.map(
          (r) =>
            `${r.transactionId.toLowerCase()}|${r.requestCode.toLowerCase()}`
        )
      );
      const merged = [
        ...enrichedRemote,
        ...localRecords.filter(
          (loc) =>
            !seenKeys.has(
              `${loc.transactionId.toLowerCase()}|${loc.requestCode.toLowerCase()}`
            ) &&
            !enrichedRemote.some(
              (rem) =>
                rem.id === loc.id ||
                rem.requestCode === loc.requestCode ||
                rem.transactionId.toLowerCase() ===
                  loc.transactionId.toLowerCase()
            )
        ),
      ];
      return writePaymentRequestsToStorage(merged, storage);
    }
  } catch {
    // Fallback to local records if table does not exist yet
  }

  return localRecords;
}

export async function submitPaymentRequestToSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  input: PaymentSubmissionInput,
  userAccount?: UserAccount | null,
  tutorProfile?: VerificationRequest | null,
  storage?: SocialStorageLike | null
): Promise<{
  ok: boolean;
  record: PaymentRequestRecord;
  payment: PaymentRequestRecord;
  syncedToSupabase: boolean;
  errorMessage?: string;
}> {
  const validation = validatePaymentSubmissionInput(input);
  if (!validation.valid) {
    throw new Error(validation.errorEn || 'Invalid payment submission.');
  }

  const row = buildPaymentRequestRow(input, userAccount, tutorProfile);
  let finalRecord = mapPaymentRequestRowToRecord(row);
  let syncedToSupabase = false;

  if (supabaseClient && typeof supabaseClient.from === 'function') {
    const livePayRow = {
      id: `PAY-${row.transaction_id || Date.now()}`,
      tutor_id: tutorProfile?.id || userAccount?.id || row.user_email || null,
      tutor_name: row.user_name || 'Verified Tutor',
      phone: row.sender_number,
      method: row.payment_method,
      trx_id: row.transaction_id,
      amount: row.amount,
      purpose: row.purpose,
      circular_id: row.circular_id,
      status: 'Pending',
      rejection_note: null,
      raw_data: row,
    };

    try {
      const insertChain = supabaseClient.from('payment_requests').insert([row]);
      if (typeof insertChain.select === 'function') {
        const selected = insertChain.select();
        if (selected && typeof selected.maybeSingle === 'function') {
          let res = await selected.maybeSingle();
          if (res.error) {
            const fbChain = supabaseClient
              .from('payment_requests')
              .insert([livePayRow])
              .select();
            res =
              typeof fbChain.maybeSingle === 'function'
                ? await fbChain.maybeSingle()
                : await fbChain;
          }
          if (!res.error && res.data) {
            const rowData = Array.isArray(res.data) ? res.data[0] : res.data;
            if (rowData) {
              finalRecord = mapPaymentRequestRowToRecord(
                rowData as PaymentRequestRow
              );
            }
            syncedToSupabase = true;
          } else if (!res.error) {
            syncedToSupabase = true;
          }
        } else {
          let res = await selected;
          if (res.error) {
            res = await supabaseClient
              .from('payment_requests')
              .insert([livePayRow])
              .select();
          }
          if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
            finalRecord = mapPaymentRequestRowToRecord(
              res.data[0] as PaymentRequestRow
            );
            syncedToSupabase = true;
          } else if (!res.error) {
            syncedToSupabase = true;
          }
        }
      } else {
        let res = await insertChain;
        if (res?.error) {
          res = await supabaseClient
            .from('payment_requests')
            .insert([livePayRow]);
        }
        if (!res?.error) {
          syncedToSupabase = true;
        }
      }
    } catch {
      // Fallback cleanly to local storage persistence
    }
  }

  const existing = readPaymentRequestsFromStorage(storage);
  const next = [
    finalRecord,
    ...existing.filter(
      (r) =>
        r.id !== finalRecord.id &&
        r.requestCode !== finalRecord.requestCode &&
        r.transactionId.toLowerCase() !== finalRecord.transactionId.toLowerCase()
    ),
  ];
  writePaymentRequestsToStorage(next, storage);

  return {
    ok: true,
    record: finalRecord,
    payment: finalRecord,
    syncedToSupabase,
  };
}

export async function updatePaymentRequestStatusInSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  targetIdOrCode: string,
  decision: Exclude<PaymentRequestStatus, 'Pending'> | 'Verified',
  adminNote: string = '',
  storage?: SocialStorageLike | null
): Promise<PaymentRequestRecord[]> {
  const cleanTarget = (targetIdOrCode || '').trim().toLowerCase();
  const cleanNote = adminNote.trim();
  const normalizedDecision: Exclude<PaymentRequestStatus, 'Pending'> =
    decision === 'Rejected' ? 'Rejected' : 'Approved';

  const current = readPaymentRequestsFromStorage(storage);
  let matchedRecord: PaymentRequestRecord | undefined;

  const updated = current.map((rec) => {
    if (
      rec.id.toLowerCase() === cleanTarget ||
      rec.requestCode.toLowerCase() === cleanTarget ||
      rec.transactionId.toLowerCase() === cleanTarget
    ) {
      matchedRecord = {
        ...rec,
        status: normalizedDecision,
        adminNote: cleanNote || rec.adminNote,
      };
      return matchedRecord;
    }
    return rec;
  });

  writePaymentRequestsToStorage(updated, storage);

  if (supabaseClient && typeof supabaseClient.from === 'function') {
    try {
      const payload: Record<string, unknown> = {
        status: normalizedDecision,
      };
      const targetId = matchedRecord?.id || targetIdOrCode;
      if (targetId && !targetId.startsWith('PAY-')) {
        await supabaseClient
          .from('payment_requests')
          .update(payload)
          .eq('id', targetId);
      } else if (matchedRecord?.transactionId) {
        await supabaseClient
          .from('payment_requests')
          .update(payload)
          .eq('transaction_id', matchedRecord.transactionId);
      }
    } catch {
      // Local state already updated
    }
  }

  return updated;
}

export async function deletePaymentRequestFromSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  targetIdOrCode: string,
  storage?: SocialStorageLike | null
): Promise<PaymentRequestRecord[]> {
  const cleanTarget = (targetIdOrCode || '').trim().toLowerCase();
  const current = readPaymentRequestsFromStorage(storage);
  const targetRec = current.find(
    (rec) =>
      rec.id.toLowerCase() === cleanTarget ||
      rec.requestCode.toLowerCase() === cleanTarget ||
      rec.transactionId.toLowerCase() === cleanTarget
  );

  const remaining = current.filter(
    (rec) =>
      rec.id.toLowerCase() !== cleanTarget &&
      rec.requestCode.toLowerCase() !== cleanTarget &&
      rec.transactionId.toLowerCase() !== cleanTarget
  );
  writePaymentRequestsToStorage(remaining, storage);

  if (supabaseClient && typeof supabaseClient.from === 'function') {
    try {
      const targetId = targetRec?.id || targetIdOrCode;
      if (targetId && !targetId.startsWith('PAY-')) {
        await supabaseClient
          .from('payment_requests')
          .delete()
          .eq('id', targetId);
      } else if (targetRec?.transactionId) {
        await supabaseClient
          .from('payment_requests')
          .delete()
          .eq('transaction_id', targetRec.transactionId);
      }
    } catch {
      // Local state already updated
    }
  }

  return remaining;
}

/* ============================================================================
   OFFICIAL NOTICE & ANNOUNCEMENT SYSTEM (Supabase `public.site_notices`)
   ============================================================================ */
export const SITE_NOTICES_STORAGE_KEY = 'tutorzone_site_notices';

export const NOTICE_DEFAULT_CATEGORIES: string[] = [
  'Official Update',
  'Urgent',
  'Tuition Notice',
  'Security / Verification',
  'General Announcement',
];

export function readSiteNoticesFromStorage(
  storage?: SocialStorageLike | null
): SiteNotice[] {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;
  if (!targetStorage) return [];
  try {
    const raw = targetStorage.getItem(SITE_NOTICES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeSiteNoticesToStorage(
  notices: SiteNotice[],
  storage?: SocialStorageLike | null
): void {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;
  if (!targetStorage) return;
  try {
    targetStorage.setItem(SITE_NOTICES_STORAGE_KEY, JSON.stringify(notices));
  } catch {
    // Ignore storage quota errors
  }
}

export function getActiveSiteNotices(notices: SiteNotice[]): SiteNotice[] {
  if (!Array.isArray(notices)) return [];
  return notices.filter((n) => n.is_active !== false);
}

export function getNoticeCategoryBadgeStyle(category?: string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  const c = (category || '').trim().toLowerCase();
  if (
    c.includes('urgent') ||
    c.includes('জরুরি') ||
    c.includes('alert') ||
    c.includes('emergency')
  ) {
    return {
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500',
    };
  }
  if (
    c.includes('tuition') ||
    c.includes('টিউশনি') ||
    c.includes('circular') ||
    c.includes('job')
  ) {
    return {
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      dot: 'bg-blue-500',
    };
  }
  if (
    c.includes('security') ||
    c.includes('verification') ||
    c.includes('ভেরিফিকেশন') ||
    c.includes('warn')
  ) {
    return {
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
    };
  }
  // Default: Official Update / General Announcement
  return {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  };
}

export const SITE_NOTICES_SELECT_COLUMNS =
  'id,title,content,is_active,raw_data,created_at';

export const SITE_NOTICES_FALLBACK_COLUMNS =
  'id,title,content,is_active,created_at';

export const SITE_NOTICES_SESSION_FETCHED_KEY =
  'tutorzone_site_notices_fetched_once_v1';

export async function fetchSiteNoticesFromSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  storage?: SocialStorageLike | null
): Promise<SiteNotice[]> {
  const fallback = readSiteNoticesFromStorage(storage);
  if (!supabaseClient || typeof supabaseClient.from !== 'function') {
    return fallback;
  }
  try {
    let res = await supabaseClient
      .from('site_notices')
      .select(SITE_NOTICES_SELECT_COLUMNS)
      .order('created_at', { ascending: false });

    if (res.error) {
      res = await supabaseClient
        .from('site_notices')
        .select(SITE_NOTICES_FALLBACK_COLUMNS)
        .order('created_at', { ascending: false });
    }

    const { data, error } = res;

    if (error || !Array.isArray(data)) {
      return fallback;
    }
    const mapped: SiteNotice[] = data.map((row: any) => {
      const rawData =
        row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {};
      return {
        id: String(row.id),
        title: String(row.title || ''),
        content: String(row.content || ''),
        badge_text: row.badge_text
          ? String(row.badge_text)
          : rawData.badge_text
          ? String(rawData.badge_text)
          : 'Official Notice',
        image_url: row.image_url
          ? String(row.image_url)
          : rawData.image_url
          ? String(rawData.image_url)
          : undefined,
        is_active: row.is_active !== false,
        created_at: row.created_at ? String(row.created_at) : undefined,
      };
    });
    writeSiteNoticesToStorage(mapped, storage);
    return mapped;
  } catch {
    return fallback;
  }
}

/**
 * Fetches semi-static `site_notices` from Supabase at most once per browser session,
 * returning cached notices unless `forceRefresh = true` is passed.
 */
export async function fetchSiteNoticesOncePerSession(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  forceRefresh = false,
  storage?: SocialStorageLike | null
): Promise<SiteNotice[]> {
  const sessionStore =
    typeof window !== 'undefined' && window.sessionStorage
      ? window.sessionStorage
      : null;

  if (!forceRefresh && sessionStore) {
    try {
      if (sessionStore.getItem(SITE_NOTICES_SESSION_FETCHED_KEY) === '1') {
        return readSiteNoticesFromStorage(storage);
      }
    } catch {
      // Ignore sessionStorage restrictions
    }
  }

  const fresh = await fetchSiteNoticesFromSupabase(supabaseClient, storage);
  if (sessionStore) {
    try {
      sessionStore.setItem(SITE_NOTICES_SESSION_FETCHED_KEY, '1');
    } catch {
      // Ignore sessionStorage quota errors
    }
  }
  return fresh;
}

export async function saveSiteNoticeToSupabase(
  noticeInput: {
    id?: string;
    title: string;
    content: string;
    badge_text?: string;
    image_url?: string | null;
    is_active?: boolean;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  storage?: SocialStorageLike | null
): Promise<SiteNotice> {
  const payload: Record<string, any> = {
    title: noticeInput.title.trim(),
    content: noticeInput.content.trim(),
    badge_text: (noticeInput.badge_text || 'Official Notice').trim(),
    image_url: noticeInput.image_url?.trim() || null,
    is_active: noticeInput.is_active !== false,
  };

  const liveNoticeId =
    noticeInput.id && !noticeInput.id.startsWith('local-')
      ? noticeInput.id
      : `NOTICE-${Date.now()}`;
  const livePayload: Record<string, any> = {
    id: liveNoticeId,
    title: payload.title,
    content: payload.content,
    is_active: payload.is_active,
    raw_data: {
      badge_text: payload.badge_text,
      image_url: payload.image_url,
    },
  };

  let savedNotice: SiteNotice | null = null;

  if (supabaseClient && typeof supabaseClient.from === 'function') {
    try {
      if (noticeInput.id && !noticeInput.id.startsWith('local-')) {
        let { data, error } = await supabaseClient
          .from('site_notices')
          .update(payload)
          .eq('id', noticeInput.id)
          .select();
        if (error) {
          const fallbackRes = await supabaseClient
            .from('site_notices')
            .update({
              title: livePayload.title,
              content: livePayload.content,
              is_active: livePayload.is_active,
              raw_data: livePayload.raw_data,
            })
            .eq('id', noticeInput.id)
            .select();
          data = fallbackRes.data;
          error = fallbackRes.error;
        }
        if (!error && Array.isArray(data) && data[0]) {
          savedNotice = {
            id: String(data[0].id),
            title: String(data[0].title || ''),
            content: String(data[0].content || ''),
            badge_text:
              data[0].badge_text ||
              data[0].raw_data?.badge_text ||
              payload.badge_text,
            image_url:
              data[0].image_url ||
              data[0].raw_data?.image_url ||
              undefined,
            is_active: data[0].is_active !== false,
            created_at: data[0].created_at || new Date().toISOString(),
          };
        }
      } else {
        let { data, error } = await supabaseClient
          .from('site_notices')
          .insert([payload])
          .select();
        if (error) {
          const fallbackRes = await supabaseClient
            .from('site_notices')
            .insert([livePayload])
            .select();
          data = fallbackRes.data;
          error = fallbackRes.error;
        }
        if (!error && Array.isArray(data) && data[0]) {
          savedNotice = {
            id: String(data[0].id),
            title: String(data[0].title || ''),
            content: String(data[0].content || ''),
            badge_text:
              data[0].badge_text ||
              data[0].raw_data?.badge_text ||
              payload.badge_text,
            image_url:
              data[0].image_url ||
              data[0].raw_data?.image_url ||
              undefined,
            is_active: data[0].is_active !== false,
            created_at: data[0].created_at || new Date().toISOString(),
          };
        }
      }
    } catch {
      // Fall through to optimistic local item
    }
  }

  if (!savedNotice) {
    savedNotice = {
      id: noticeInput.id || `local-notice-${Date.now()}`,
      title: payload.title,
      content: payload.content,
      badge_text: payload.badge_text,
      image_url: payload.image_url || undefined,
      is_active: payload.is_active,
      created_at: new Date().toISOString(),
    };
  }

  const current = readSiteNoticesFromStorage(storage);
  const existingIdx = current.findIndex((n) => n.id === savedNotice!.id);
  let updatedList: SiteNotice[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = savedNotice;
  } else {
    updatedList = [savedNotice, ...current];
  }
  writeSiteNoticesToStorage(updatedList, storage);

  return savedNotice;
}

export async function toggleSiteNoticeStatusInSupabase(
  id: string,
  nextActive: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  storage?: SocialStorageLike | null
): Promise<SiteNotice[]> {
  const current = readSiteNoticesFromStorage(storage);
  const updated = current.map((n) =>
    n.id === id ? { ...n, is_active: nextActive } : n
  );
  writeSiteNoticesToStorage(updated, storage);

  if (
    supabaseClient &&
    typeof supabaseClient.from === 'function' &&
    !id.startsWith('local-')
  ) {
    try {
      await supabaseClient
        .from('site_notices')
        .update({ is_active: nextActive })
        .eq('id', id);
    } catch {
      // Ignore network errors, local is updated
    }
  }
  return updated;
}

export async function deleteSiteNoticeFromSupabase(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  storage?: SocialStorageLike | null
): Promise<SiteNotice[]> {
  const current = readSiteNoticesFromStorage(storage);
  const updated = current.filter((n) => n.id !== id);
  writeSiteNoticesToStorage(updated, storage);

  if (
    supabaseClient &&
    typeof supabaseClient.from === 'function' &&
    !id.startsWith('local-')
  ) {
    try {
      await supabaseClient
        .from('site_notices')
        .delete()
        .eq('id', id);
    } catch {
      // Ignore network errors, local is updated
    }
  }
  return updated;
}

/* ============================================================================
   GUARDIAN TUITION REQUEST SYSTEM (Supabase `public.guardian_requests`)
   ============================================================================ */
export const GUARDIAN_REQUESTS_STORAGE_KEY = 'tutorzone_guardian_requests';

export function readGuardianRequestsFromStorage(
  storage?: SocialStorageLike | null
): GuardianRequestRecord[] {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;
  if (!targetStorage) return [];
  try {
    const raw = targetStorage.getItem(GUARDIAN_REQUESTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeGuardianRequestsToStorage(
  requests: GuardianRequestRecord[],
  storage?: SocialStorageLike | null
): void {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;
  if (!targetStorage) return;
  try {
    targetStorage.setItem(GUARDIAN_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  } catch {
    // Ignore storage write errors
  }
}

export function encodeGuardianExtendedNotes(input: {
  mediumVersion?: string;
  schoolCollegeName?: string;
  numberOfStudents?: number | string;
  preferredUniversity?: string;
  preferredTimeDuration?: string;
  additionalNotes?: string;
  specialRequirements?: string;
}): string | null {
  const tags: string[] = [];
  if (input.mediumVersion && input.mediumVersion.trim()) {
    tags.push(`[Medium: ${input.mediumVersion.trim()}]`);
  }
  if (input.schoolCollegeName && input.schoolCollegeName.trim()) {
    tags.push(`[School: ${input.schoolCollegeName.trim()}]`);
  }
  const numStudents = Number(input.numberOfStudents);
  if (!Number.isNaN(numStudents) && numStudents > 0) {
    tags.push(`[Students: ${numStudents}]`);
  }
  if (input.preferredUniversity && input.preferredUniversity.trim()) {
    tags.push(`[PrefUni: ${input.preferredUniversity.trim()}]`);
  }
  if (input.preferredTimeDuration && input.preferredTimeDuration.trim()) {
    tags.push(`[Time: ${input.preferredTimeDuration.trim()}]`);
  }
  const rawNote = input.additionalNotes ?? input.specialRequirements ?? '';
  const cleanNotes = rawNote
    .replace(/\[(Medium|School|Students|PrefUni|Time):\s*[^\]]*\]/gi, '')
    .trim();
  const combined = [...tags, cleanNotes].filter(Boolean).join(' ');
  return combined || null;
}

export function decodeGuardianExtendedNotes(rawNotes?: string | null): {
  mediumVersion?: string;
  schoolCollegeName?: string;
  numberOfStudents?: number;
  preferredUniversity?: string;
  preferredTimeDuration?: string;
  cleanNotes?: string;
  specialRequirements?: string;
} {
  if (!rawNotes) return {};
  const str = String(rawNotes);
  const extractTag = (key: string): string | undefined => {
    const match = str.match(new RegExp(`\\[${key}:\\s*([^\\]]+)\\]`, 'i'));
    return match?.[1]?.trim() || undefined;
  };
  const mediumVersion = extractTag('Medium');
  const schoolCollegeName = extractTag('School');
  const studentsStr = extractTag('Students');
  const numberOfStudents = studentsStr ? Number(studentsStr) || 1 : undefined;
  const preferredUniversity = extractTag('PrefUni');
  const preferredTimeDuration = extractTag('Time');
  const cleanNotes = str
    .replace(/\[(Medium|School|Students|PrefUni|Time):\s*[^\]]*\]/gi, '')
    .trim();

  return {
    mediumVersion,
    schoolCollegeName,
    numberOfStudents,
    preferredUniversity,
    preferredTimeDuration,
    cleanNotes: cleanNotes || undefined,
    specialRequirements: cleanNotes || undefined,
  };
}

export function mapGuardianRowToRecord(row: any): GuardianRequestRecord {
  const rawData =
    row?.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {};
  const decoded = decodeGuardianExtendedNotes(
    row.additional_notes ?? row.note ?? rawData.additional_notes
  );
  const rawClass = String(
    row.student_class || rawData.student_class || ''
  );
  const inferredMedium =
    row.medium_version ||
    row.medium ||
    rawData.medium_version ||
    decoded.mediumVersion ||
    (/english/i.test(rawClass)
      ? 'English Version'
      : /madrasa|quran|alim|dakhil/i.test(rawClass)
      ? 'Madrasah/Quranic'
      : 'Bangla Medium');

  return {
    id: String(row.id || `gr-${Date.now()}`),
    guardianName: String(
      row.guardian_name || rawData.guardian_name || ''
    ),
    guardianPhone: String(
      row.guardian_phone || row.phone || rawData.guardian_phone || ''
    ),
    studentClass: rawClass,
    mediumVersion: String(inferredMedium),
    schoolCollegeName:
      row.school_college_name ||
      rawData.school_college_name ||
      decoded.schoolCollegeName ||
      undefined,
    numberOfStudents:
      Number(row.number_of_students ?? rawData.number_of_students) ||
      decoded.numberOfStudents ||
      1,
    subjects: String(row.subjects || rawData.subjects || ''),
    upazilaArea: String(
      row.upazila_area || row.upazila || rawData.upazila_area || 'Madaripur Sadar'
    ),
    fullAddress: String(
      row.full_address || row.location || rawData.full_address || ''
    ),
    offeredSalary:
      Number(row.offered_salary ?? row.salary ?? rawData.offered_salary) || 0,
    daysPerWeek:
      Number(row.days_per_week ?? rawData.days_per_week) || 4,
    preferredTimeDuration:
      row.preferred_time_duration ||
      rawData.preferred_time_duration ||
      decoded.preferredTimeDuration ||
      undefined,
    preferredGender: String(
      row.preferred_gender || rawData.preferred_gender || 'Any'
    ),
    preferredUniversity:
      row.preferred_university ||
      rawData.preferred_university ||
      decoded.preferredUniversity ||
      undefined,
    additionalNotes: decoded.cleanNotes,
    status: String(row.status || rawData.status || 'pending'),
    createdAt: row.created_at
      ? String(row.created_at)
      : new Date().toISOString(),
  };
}

export interface DetailedGuardianRequestView extends GuardianRequestRecord {
  id: string;
  requestId: string;
  guardianName: string;
  guardianPhone: string;
  submittedDateTime: string;
  studentClass: string;
  mediumVersion: string;
  schoolCollegeName: string;
  numberOfStudents: number;
  numberOfStudentsLabel: string;
  subjects: string;
  subjectsList: string[];
  preferredGender: string;
  preferredGenderLabel: string;
  preferredUniversity: string;
  offeredSalary: number;
  daysPerWeek: number;
  preferredTimeDuration: string;
  upazilaArea: string;
  fullAddress: string;
  additionalNotes: string;
  specialRequirements: string;
  status: string;
  createdAt: string;
}

export function extractDetailedGuardianRequestFields(
  req: GuardianRequestRecord & { specialRequirements?: string }
): DetailedGuardianRequestView {
  const rawExtendedSource =
    req.additionalNotes ?? req.specialRequirements ?? '';
  const decoded = decodeGuardianExtendedNotes(rawExtendedSource);
  const rawClass = (req.studentClass || 'Not specified').trim();

  const mediumVersion =
    (req.mediumVersion || decoded.mediumVersion || '').trim() ||
    (/english/i.test(rawClass)
      ? 'English Version'
      : /madrasa|quran|alim|dakhil/i.test(rawClass)
      ? 'Madrasah/Quranic'
      : 'Bangla Medium');

  const schoolCollegeName =
    (req.schoolCollegeName || decoded.schoolCollegeName || '').trim() ||
    'Local School / College (Madaripur)';

  const numberOfStudents =
    Number(req.numberOfStudents) || decoded.numberOfStudents || 1;
  const numberOfStudentsLabel =
    numberOfStudents === 1 ? '1 Student' : `${numberOfStudents} Students`;

  const subjectsList = (req.subjects || '')
    .split(/[,;·|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (subjectsList.length === 0 && req.subjects?.trim()) {
    subjectsList.push(req.subjects.trim());
  }

  const rawGender = (req.preferredGender || 'Any').trim();
  const preferredGenderLabel =
    /^male$/i.test(rawGender)
      ? 'Male Tutor'
      : /^female$/i.test(rawGender)
      ? 'Female Tutor'
      : rawGender || 'Any Gender';

  const preferredUniversity =
    (req.preferredUniversity || decoded.preferredUniversity || '').trim() ||
    'Any Verified University / College';

  const preferredTimeDuration =
    (req.preferredTimeDuration || decoded.preferredTimeDuration || '').trim() ||
    'Flexible / Evening (1.5 hrs)';

  let submittedDateTime = 'Recent Submission';
  if (req.createdAt) {
    const parsed = new Date(req.createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      submittedDateTime = parsed.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } else {
      submittedDateTime = req.createdAt;
    }
  }

  const cleanNotes =
    decoded.cleanNotes !== undefined
      ? decoded.cleanNotes || ''
      : rawExtendedSource.trim();

  const resolvedId = req.id || 'GR-NEW';

  return {
    id: resolvedId,
    requestId: resolvedId,
    guardianName: (req.guardianName || 'Guardian').trim(),
    guardianPhone: (req.guardianPhone || '').trim(),
    submittedDateTime,
    studentClass: rawClass,
    mediumVersion,
    schoolCollegeName,
    numberOfStudents,
    numberOfStudentsLabel,
    subjects: (req.subjects || subjectsList.join(', ')).trim(),
    subjectsList,
    preferredGender: rawGender,
    preferredGenderLabel,
    preferredUniversity,
    offeredSalary: Number(req.offeredSalary) || 0,
    daysPerWeek: Number(req.daysPerWeek) || 4,
    preferredTimeDuration,
    upazilaArea: (req.upazilaArea || 'Madaripur Sadar').trim(),
    fullAddress: (req.fullAddress || 'Address not specified').trim(),
    additionalNotes: cleanNotes,
    specialRequirements: cleanNotes,
    status: (req.status || 'pending').toLowerCase(),
    createdAt: req.createdAt || new Date().toISOString(),
  };
}

export const GUARDIAN_REQUESTS_SELECT_COLUMNS =
  'id,guardian_name,phone,student_class,subjects,upazila,salary,days_per_week,status,raw_data,created_at';

export const GUARDIAN_REQUESTS_FALLBACK_COLUMNS =
  'id,guardian_name,phone,student_class,subjects,upazila,salary,status,raw_data,created_at';

export async function fetchGuardianRequestsFromSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  storage?: SocialStorageLike | null
): Promise<GuardianRequestRecord[]> {
  const fallback = readGuardianRequestsFromStorage(storage);
  if (!supabaseClient || typeof supabaseClient.from !== 'function') {
    return fallback;
  }
  try {
    let res = await supabaseClient
      .from('guardian_requests')
      .select(GUARDIAN_REQUESTS_SELECT_COLUMNS)
      .order('created_at', { ascending: false });

    if (res.error) {
      res = await supabaseClient
        .from('guardian_requests')
        .select(GUARDIAN_REQUESTS_FALLBACK_COLUMNS)
        .order('created_at', { ascending: false });
    }

    const { data, error } = res;

    if (error || !Array.isArray(data)) {
      return fallback;
    }
    const mapped = data.map(mapGuardianRowToRecord);
    writeGuardianRequestsToStorage(mapped, storage);
    return mapped;
  } catch {
    return fallback;
  }
}

export async function submitGuardianRequestToSupabase(
  input: {
    guardianName: string;
    guardianPhone: string;
    studentClass: string;
    mediumVersion?: string;
    schoolCollegeName?: string;
    numberOfStudents?: number | string;
    subjects: string;
    upazilaArea: string;
    fullAddress: string;
    offeredSalary: number | string;
    daysPerWeek: number | string;
    preferredTimeDuration?: string;
    preferredGender?: string;
    preferredUniversity?: string;
    additionalNotes?: string;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  storage?: SocialStorageLike | null
): Promise<GuardianRequestRecord> {
  const encodedNotes = encodeGuardianExtendedNotes({
    mediumVersion: input.mediumVersion,
    schoolCollegeName: input.schoolCollegeName,
    numberOfStudents: input.numberOfStudents,
    preferredUniversity: input.preferredUniversity,
    preferredTimeDuration: input.preferredTimeDuration,
    additionalNotes: input.additionalNotes,
  });

  const payload = {
    guardian_name: input.guardianName.trim(),
    guardian_phone: input.guardianPhone.trim(),
    student_class: input.studentClass.trim(),
    subjects: input.subjects.trim(),
    upazila_area: input.upazilaArea.trim() || 'Madaripur Sadar',
    full_address: input.fullAddress.trim(),
    offered_salary: Number(input.offeredSalary) || 0,
    days_per_week: Number(input.daysPerWeek) || 4,
    preferred_gender: input.preferredGender?.trim() || 'Any',
    additional_notes: encodedNotes,
    status: 'pending',
  };

  const liveGrId = `GR-${Date.now()}`;
  const livePayload = {
    id: liveGrId,
    guardian_name: payload.guardian_name,
    phone: payload.guardian_phone,
    student_class: payload.student_class,
    medium: input.mediumVersion?.trim() || 'Bangla Medium',
    subjects: payload.subjects,
    salary: payload.offered_salary,
    days_per_week: String(payload.days_per_week),
    location: payload.full_address,
    upazila: payload.upazila_area,
    preferred_gender: payload.preferred_gender,
    note: encodedNotes,
    status: 'pending',
    raw_data: payload,
  };

  let savedRecord: GuardianRequestRecord | null = null;

  if (supabaseClient && typeof supabaseClient.from === 'function') {
    try {
      let { data, error } = await supabaseClient
        .from('guardian_requests')
        .insert([payload])
        .select();

      if (error) {
        const fallbackRes = await supabaseClient
          .from('guardian_requests')
          .insert([livePayload])
          .select();
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (!error && Array.isArray(data) && data[0]) {
        savedRecord = mapGuardianRowToRecord(data[0]);
      }
    } catch {
      // Fall through to local fallback
    }
  }

  if (!savedRecord) {
    savedRecord = {
      id: `local-gr-${Date.now()}`,
      guardianName: payload.guardian_name,
      guardianPhone: payload.guardian_phone,
      studentClass: payload.student_class,
      mediumVersion: input.mediumVersion?.trim() || 'Bangla Medium',
      schoolCollegeName: input.schoolCollegeName?.trim() || undefined,
      numberOfStudents: Number(input.numberOfStudents) || 1,
      subjects: payload.subjects,
      upazilaArea: payload.upazila_area,
      fullAddress: payload.full_address,
      offeredSalary: payload.offered_salary,
      daysPerWeek: payload.days_per_week,
      preferredTimeDuration: input.preferredTimeDuration?.trim() || undefined,
      preferredGender: payload.preferred_gender,
      preferredUniversity: input.preferredUniversity?.trim() || undefined,
      additionalNotes: input.additionalNotes?.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }

  const current = readGuardianRequestsFromStorage(storage);
  const updated = [
    savedRecord,
    ...current.filter((r) => r.id !== savedRecord!.id),
  ];
  writeGuardianRequestsToStorage(updated, storage);
  return savedRecord;
}

export async function updateGuardianRequestDetailsInSupabase(
  updatedRecord: GuardianRequestRecord & { specialRequirements?: string },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient?: any,
  storage?: SocialStorageLike | null
): Promise<GuardianRequestRecord[]> {
  const resolvedNote = (
    updatedRecord.specialRequirements ??
    updatedRecord.additionalNotes ??
    ''
  ).trim();
  const encodedNotes = encodeGuardianExtendedNotes({
    mediumVersion: updatedRecord.mediumVersion,
    schoolCollegeName: updatedRecord.schoolCollegeName,
    numberOfStudents: updatedRecord.numberOfStudents,
    preferredUniversity: updatedRecord.preferredUniversity,
    preferredTimeDuration: updatedRecord.preferredTimeDuration,
    additionalNotes: resolvedNote,
  });

  const normalizedRecord: GuardianRequestRecord = {
    ...updatedRecord,
    guardianName: (updatedRecord.guardianName || '').trim(),
    guardianPhone: (updatedRecord.guardianPhone || '').trim(),
    studentClass: (updatedRecord.studentClass || '').trim(),
    mediumVersion: (updatedRecord.mediumVersion || 'Bangla Medium').trim(),
    schoolCollegeName: updatedRecord.schoolCollegeName?.trim() || undefined,
    numberOfStudents: Number(updatedRecord.numberOfStudents) || 1,
    subjects: (updatedRecord.subjects || '').trim(),
    upazilaArea: (updatedRecord.upazilaArea || 'Madaripur Sadar').trim(),
    fullAddress: (updatedRecord.fullAddress || '').trim(),
    offeredSalary: Number(updatedRecord.offeredSalary) || 0,
    daysPerWeek: Number(updatedRecord.daysPerWeek) || 4,
    preferredTimeDuration:
      updatedRecord.preferredTimeDuration?.trim() || undefined,
    preferredGender: (updatedRecord.preferredGender || 'Any').trim(),
    preferredUniversity:
      updatedRecord.preferredUniversity?.trim() || undefined,
    additionalNotes: resolvedNote || undefined,
    status: updatedRecord.status || 'pending',
  };

  const current = readGuardianRequestsFromStorage(storage);
  const exists = current.some((r) => r.id === normalizedRecord.id);
  const updated = exists
    ? current.map((r) => (r.id === normalizedRecord.id ? normalizedRecord : r))
    : [normalizedRecord, ...current];
  writeGuardianRequestsToStorage(updated, storage);

  if (
    supabaseClient &&
    typeof supabaseClient.from === 'function' &&
    !normalizedRecord.id.startsWith('local-')
  ) {
    try {
      await supabaseClient
        .from('guardian_requests')
        .update({
          guardian_name: normalizedRecord.guardianName,
          guardian_phone: normalizedRecord.guardianPhone,
          student_class: normalizedRecord.studentClass,
          subjects: normalizedRecord.subjects,
          upazila_area: normalizedRecord.upazilaArea,
          full_address: normalizedRecord.fullAddress,
          offered_salary: normalizedRecord.offeredSalary,
          days_per_week: normalizedRecord.daysPerWeek,
          preferred_gender: normalizedRecord.preferredGender,
          additional_notes: encodedNotes,
          status: normalizedRecord.status,
        })
        .eq('id', normalizedRecord.id);
    } catch {
      // Local storage updated
    }
  }

  return updated;
}

export async function updateGuardianRequestStatusInSupabase(
  id: string,
  nextStatus: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  storage?: SocialStorageLike | null
): Promise<GuardianRequestRecord[]> {
  const current = readGuardianRequestsFromStorage(storage);
  const updated = current.map((r) =>
    r.id === id ? { ...r, status: nextStatus } : r
  );
  writeGuardianRequestsToStorage(updated, storage);

  if (
    supabaseClient &&
    typeof supabaseClient.from === 'function' &&
    !id.startsWith('local-')
  ) {
    try {
      await supabaseClient
        .from('guardian_requests')
        .update({ status: nextStatus })
        .eq('id', id);
    } catch {
      // Local fallback updated
    }
  }
  return updated;
}

export async function deleteGuardianRequestFromSupabase(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  storage?: SocialStorageLike | null
): Promise<GuardianRequestRecord[]> {
  const current = readGuardianRequestsFromStorage(storage);
  const updated = current.filter((r) => r.id !== id);
  writeGuardianRequestsToStorage(updated, storage);

  if (
    supabaseClient &&
    typeof supabaseClient.from === 'function' &&
    !id.startsWith('local-')
  ) {
    try {
      await supabaseClient
        .from('guardian_requests')
        .delete()
        .eq('id', id);
    } catch {
      // Local fallback updated
    }
  }
  return updated;
}

export type AdminSortOrder = 'newest' | 'oldest' | 'pending_first';

export type AdminSectionTab =
  | 'all_accordion'
  | 'payments'
  | 'verifications'
  | 'applications'
  | 'guardian_requests'
  | 'payments_and_guardians'
  | 'homepage_cms'
  | 'notice_board'
  | 'site_settings';

export function parseAdminItemTimestamp(
  rawDate?: string | null,
  fallbackOrder: number = 0
): number {
  if (!rawDate) return fallbackOrder;
  const trimmed = rawDate.trim();
  if (!trimmed) return fallbackOrder;
  if (trimmed.toLowerCase() === 'just now') {
    return 9_999_999_999_999 - fallbackOrder;
  }
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }
  return fallbackOrder;
}

export function isAdminRecordPending(status?: string | null): boolean {
  const norm = (status || 'pending').trim().toLowerCase();
  return norm === 'pending' || norm === 'under review' || norm === 'awaiting';
}

export function sortAdminPaymentRequests(
  items: PaymentRequestRecord[],
  sortBy: AdminSortOrder = 'newest'
): PaymentRequestRecord[] {
  const indexed = items.map((item, idx) => ({
    item,
    idx,
    ts: parseAdminItemTimestamp(item.createdAt, items.length - idx),
    pending: isAdminRecordPending(item.status),
  }));

  indexed.sort((a, b) => {
    if (sortBy === 'pending_first' && a.pending !== b.pending) {
      return a.pending ? -1 : 1;
    }
    if (sortBy === 'oldest') {
      return a.ts !== b.ts ? a.ts - b.ts : b.idx - a.idx;
    }
    return a.ts !== b.ts ? b.ts - a.ts : a.idx - b.idx;
  });

  return indexed.map((entry) => entry.item);
}

export function sortAdminVerificationRequests(
  items: VerificationRequest[],
  sortBy: AdminSortOrder = 'newest'
): VerificationRequest[] {
  const indexed = items.map((item, idx) => ({
    item,
    idx,
    ts: parseAdminItemTimestamp(item.submittedAt, items.length - idx),
    pending: isAdminRecordPending(item.status),
  }));

  indexed.sort((a, b) => {
    if (sortBy === 'pending_first' && a.pending !== b.pending) {
      return a.pending ? -1 : 1;
    }
    if (sortBy === 'oldest') {
      return a.ts !== b.ts ? a.ts - b.ts : b.idx - a.idx;
    }
    return a.ts !== b.ts ? b.ts - a.ts : a.idx - b.idx;
  });

  return indexed.map((entry) => entry.item);
}

export function sortAdminCircularApplications(
  items: CircularApplicationRow[],
  sortBy: AdminSortOrder = 'newest'
): CircularApplicationRow[] {
  const indexed = items.map((item, idx) => ({
    item,
    idx,
    ts: parseAdminItemTimestamp(item.created_at, items.length - idx),
    pending: isAdminRecordPending(item.status),
  }));

  indexed.sort((a, b) => {
    if (sortBy === 'pending_first' && a.pending !== b.pending) {
      return a.pending ? -1 : 1;
    }
    if (sortBy === 'oldest') {
      return a.ts !== b.ts ? a.ts - b.ts : b.idx - a.idx;
    }
    return a.ts !== b.ts ? b.ts - a.ts : a.idx - b.idx;
  });

  return indexed.map((entry) => entry.item);
}

export function sortAdminGuardianRequests(
  items: GuardianRequestRecord[],
  sortBy: AdminSortOrder = 'newest'
): GuardianRequestRecord[] {
  const indexed = items.map((item, idx) => ({
    item,
    idx,
    ts: parseAdminItemTimestamp(item.createdAt, items.length - idx),
    pending: isAdminRecordPending(item.status),
  }));

  indexed.sort((a, b) => {
    if (sortBy === 'pending_first' && a.pending !== b.pending) {
      return a.pending ? -1 : 1;
    }
    if (sortBy === 'oldest') {
      return a.ts !== b.ts ? a.ts - b.ts : b.idx - a.idx;
    }
    return a.ts !== b.ts ? b.ts - a.ts : a.idx - b.idx;
  });

  return indexed.map((entry) => entry.item);
}

/* ============================================================================
   OFFICIAL "DRABIR MANDAL" WATERMARK & BRANDING CONSTANTS
   ============================================================================ */
export const OFFICIAL_DEVELOPER_NAME = 'Drabir Mandal';
export const OFFICIAL_ISSUER_WATERMARK = 'Tutor Zone · Drabir Mandal';
export const OFFICIAL_CRAFTED_BY_BADGE = '⚡ Crafted by Drabir Mandal';
export const OFFICIAL_COPYRIGHT_NOTICE =
  '© 2026 Tutor Zone · Developed & Maintained by Drabir Mandal. All Rights Reserved.';

/* ============================================================================
   SUPABASE EGRESS OPTIMIZATION: LAZY VERIFICATION SCANS & SESSION CACHE
   ============================================================================ */

/**
 * Lightweight column projection for `tutor_verifications` on public Tutor Board,
 * Dashboard, and Circulars. Explicitly omits heavy Base64 `nid_scan_url` and
 * `student_id_scan_url` columns until the Admin opens the Admin Verification Desk
 * or full applicant profile modal.
 */
export const PUBLIC_TUTOR_SUMMARY_COLUMNS =
  'id,full_name,upazila,institution,teaching_subjects,expected_fee,profile_photo_url,status,gender,medium,experience';

export const PUBLIC_TUTOR_VERIFICATION_SELECT_COLUMNS =
  'id,verification_code,user_email,email,user_id,full_name,mobile_number,phone,upazila,institution,institution_category,university_college_name,department_degree,student_registration_id,teaching_subjects,expected_fee,profile_photo_url,profile_photo_name,smart_nid_number,nid_file_name,student_id_file_name,admin_audit_note,rejection_note,is_rejected,status,gender,medium,experience,hidden_from_admin,created_at';

export const PUBLIC_TUTOR_VERIFICATION_FALLBACK_COLUMNS =
  'id,verification_code,user_email,user_id,full_name,mobile_number,upazila,gender,expected_fee,profile_photo_url,profile_photo_name,smart_nid_number,institution_category,university_college_name,department_degree,student_registration_id,teaching_subjects,nid_file_name,student_id_file_name,admin_audit_note,status,hidden_from_admin,created_at';

/**
 * Explicit lightweight column projection for public `tuition_circulars`
 * and `circular_applications` queries (avoids SELECT *).
 */
export const PUBLIC_TUITION_CIRCULAR_COLUMNS =
  'id,title,class_level,medium,subjects,upazila,location,salary,days_per_week,tutor_gender,guardian_name,guardian_phone,guardian_address,status,applicants,rejection_note,raw_data,created_at';

export const PUBLIC_TUITION_CIRCULAR_FALLBACK_COLUMNS =
  'id,title,upazila,location,salary,days_per_week,guardian_phone,status,raw_data,created_at';

export const PUBLIC_CIRCULAR_APPLICATION_COLUMNS =
  'id,circular_id,user_email,user_id,tutor_id,tutor_name,tutor_phone,institution_qualification,experience_note,status,media_fee,guardian_phone,guardian_address,admin_note,rejection_note,is_rejected,hidden_from_admin,created_at';

export const PUBLIC_CIRCULAR_APPLICATION_FALLBACK_COLUMNS =
  'id,circular_id,user_email,user_id,tutor_id,tutor_name,tutor_phone,institution_qualification,experience_note,status,created_at';

/**
 * Dedicated column projection for lazy-loading heavy NID and Student ID Base64 scans
 * ONLY when the Admin opens the Admin Verification Desk or full profile modal.
 */
export const ADMIN_VERIFICATION_DOCUMENT_COLUMNS =
  'id,verification_code,nid_scan_url,student_id_scan_url,nid_file_name,student_id_file_name';

/**
 * Merges lazy-loaded NID and Student ID scan URLs into existing `VerificationRequest[]`
 * records in memory without losing any existing fields or previously loaded scans.
 */
export function mergeVerificationDocumentScans(
  requests: VerificationRequest[],
  scanRows: Partial<TutorVerificationRow>[]
): VerificationRequest[] {
  if (!Array.isArray(scanRows) || scanRows.length === 0) {
    return requests;
  }

  const scanByCode = new Map<string, Partial<TutorVerificationRow>>();
  const scanByRowId = new Map<string, Partial<TutorVerificationRow>>();

  for (const row of scanRows) {
    if (!row) continue;
    const code = (row.verification_code || '').trim().toLowerCase();
    if (code) {
      scanByCode.set(code, row);
    }
    const rowId = (row.id || '').trim().toLowerCase();
    if (rowId) {
      scanByRowId.set(rowId, row);
    }
  }

  return requests.map((req) => {
    const codeKey = (req.id || '').trim().toLowerCase();
    const rowIdKey = (req.supabaseRowId || '').trim().toLowerCase();
    const matched =
      (codeKey ? scanByCode.get(codeKey) : undefined) ||
      (rowIdKey ? scanByRowId.get(rowIdKey) : undefined);

    if (!matched) {
      return req;
    }

    return {
      ...req,
      nidScanDataUrl: matched.nid_scan_url || req.nidScanDataUrl,
      nidDocumentName: matched.nid_file_name || req.nidDocumentName,
      uniScanDataUrl: matched.student_id_scan_url || req.uniScanDataUrl,
      uniDocumentName: matched.student_id_file_name || req.uniDocumentName,
    };
  });
}

export const LIVE_SESSION_CACHE_STORAGE_KEY =
  'madaripur_live_session_cache_v1';

export const LIVE_SESSION_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes (120,000 ms)

export interface LiveSessionCachePayload {
  jobs?: TuitionJob[];
  applications?: CircularApplicationRow[];
  verifications?: VerificationRequest[];
  tutors?: TutorProfile[];
  updatedAt?: number;
}

export interface SessionCacheStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

function getDefaultSessionStorage(): SessionCacheStorageLike | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch {
    // Ignore restricted sessionStorage access
  }
  return null;
}

export function isLiveSessionCacheFresh(
  cache?: LiveSessionCachePayload | null,
  ttlMs = LIVE_SESSION_CACHE_TTL_MS
): boolean {
  if (!cache || typeof cache.updatedAt !== 'number' || cache.updatedAt <= 0) {
    return false;
  }
  const age = Date.now() - cache.updatedAt;
  return age >= 0 && age <= ttlMs;
}

export function readLiveSessionCacheFromStorage(
  storage: SessionCacheStorageLike | null = getDefaultSessionStorage()
): LiveSessionCachePayload | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(LIVE_SESSION_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LiveSessionCachePayload;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : undefined,
      applications: Array.isArray(parsed.applications)
        ? parsed.applications
        : undefined,
      verifications: Array.isArray(parsed.verifications)
        ? parsed.verifications
        : undefined,
      tutors: Array.isArray(parsed.tutors) ? parsed.tutors : undefined,
      updatedAt:
        typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeLiveSessionCacheToStorage(
  payload: LiveSessionCachePayload,
  storage: SessionCacheStorageLike | null = getDefaultSessionStorage()
): void {
  if (!storage) return;
  try {
    const existing = readLiveSessionCacheFromStorage(storage) || {};
    // Strip heavy NID/Student ID Base64 strings from sessionStorage cache so it stays compact and fast
    const lightweightVerifications = payload.verifications
      ? payload.verifications.map((req) => ({
          ...req,
          nidScanDataUrl: undefined,
          uniScanDataUrl: undefined,
        }))
      : existing.verifications;

    const nextPayload: LiveSessionCachePayload = {
      jobs: payload.jobs ?? existing.jobs,
      applications: payload.applications ?? existing.applications,
      verifications: lightweightVerifications,
      tutors: payload.tutors ?? existing.tutors,
      updatedAt:
        typeof payload.updatedAt === 'number' ? payload.updatedAt : Date.now(),
    };
    storage.setItem(LIVE_SESSION_CACHE_STORAGE_KEY, JSON.stringify(nextPayload));
  } catch {
    // Ignore storage quota errors
  }
}

export function invalidateLiveSessionCacheInStorage(
  storage: SessionCacheStorageLike | null = getDefaultSessionStorage()
): void {
  if (!storage) return;
  try {
    if (typeof storage.removeItem === 'function') {
      storage.removeItem(LIVE_SESSION_CACHE_STORAGE_KEY);
    } else {
      storage.setItem(LIVE_SESSION_CACHE_STORAGE_KEY, '');
    }
  } catch {
    // Ignore storage errors
  }
}


