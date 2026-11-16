/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import {
  INITIAL_TUITION_JOBS,
  INITIAL_TUTORS,
  INITIAL_VERIFICATION_REQUESTS,
} from './data/madaripurData';
import {
  CircularApplicationRow,
  FilterState,
  Language,
  MediumCategory,
  PaymentRequestRecord,
  PaymentRequestStatus,
  SiteNotice,
  GuardianRequestRecord,
  TrialBookingRecord,
  TuitionCircularRow,
  TuitionJob,
  TutorProfile,
  TutorReview,
  TutorVerificationRow,
  Upazila,
  VerificationRequest,
  VerificationStatus,
} from './types/madaripur';
import {
  ADMIN_REMOVED_PROFILE_NOTICE,
  ADMIN_SESSION_STORAGE_KEY,
  CircularApplicationInput,
  PROTECTED_ADMIN_DELETE_ERROR,
  TUTOR_PROFILE_STORAGE_KEY,
  UserAccount,
  addReviewToTutor,
  applyAdminProfileEditState,
  buildCircularApplicationRow,
  canAccessDesk,
  canPostTuitionCircular,
  clearAllTutorZoneBrowserStorage,
  clearExplicitLoginIntent,
  confirmTutorForCircularState,
  formatApplicationNoteWithMetadata,
  deleteApplicationFromEverywhereState,
  deleteCircularFromEverywhereState,
  deleteVerificationFromEverywhereState,
  enrichCircularJobsWithApplications,
  filterAdminVisibleApplications,
  filterStrictLiveSupabaseVerifications,
  filterTutors,
  getApplicationAdminKey,
  getApplicationsForCircular,
  getTutorProfileStorageKeyForUser,
  hasFreshExplicitLoginIntent,
  hasPriorSyncedTutorProfileForEmail,
  hideApplicationFromAdminOnly,
  hideCircularFromAdminOnly,
  hideVerificationFromAdminOnly,
  isActiveVerificationRequest,
  isAuthUserDeletedError,
  isAuthorizedAdminAccount,
  isGoogleSessionUser,
  isOAuthRedirectCallbackUrl,
  isProtectedAdminProfile,
  isSameCircularApplication,
  isSignUpFlowInProgress,
  isTutorProfileSubmitted,
  mapCircularRowToTuitionJob,
  mapSupabaseRowToVerificationRequest,
  SITE_SOCIAL_SETTINGS_STORAGE_KEY,
  SiteSocialSettings,
  PAYMENT_REQUESTS_STORAGE_KEY,
  PaymentSubmissionInput,
  GUARDIAN_REQUESTS_STORAGE_KEY,
  deleteGuardianRequestFromSupabase,
  deletePaymentRequestFromSupabase,
  deleteSiteNoticeFromSupabase,
  fetchGuardianRequestsFromSupabase,
  fetchPaymentRequestsFromSupabase,
  fetchSiteNoticesFromSupabase,
  fetchSiteSocialSettingsFromSupabase,
  formatWhatsAppDirectLink,
  mapSupabaseSessionToUser,
  mapTuitionJobToCircularRow,
  mapVerificationRequestToSupabaseRow,
  markTutorProfileSyncedForEmail,
  normalizeFacebookUrl,
  processVerificationDecision,
  publishAdminTuitionCircular,
  purgeLegacyLocalStorageProfileCache,
  readGuardianRequestsFromStorage,
  readPaymentRequestsFromStorage,
  readSiteNoticesFromStorage,
  readSiteSocialSettingsFromStorage,
  rejectTutorForCircularState,
  removeReviewFromTutor,
  sanitizeUnsubmittedGoogleProfile,
  saveSiteNoticeToSupabase,
  saveSiteSocialSettingsToSupabase,
  shouldForceWipeDeletedUserSession,
  sortCircularRowsNewestFirst,
  submitGuardianRequestToSupabase,
  submitPaymentRequestToSupabase,
  syncPublicTutorsFromVerifications,
  syncStrictLiveSupabaseTutors,
  toggleSiteNoticeStatusInSupabase,
  updateGuardianRequestDetailsInSupabase,
  updateGuardianRequestStatusInSupabase,
  updatePaymentRequestStatusInSupabase,
  extractDetailedGuardianRequestFields,
  hasTutorAlreadyAppliedToCircular,
  isTutorAccountRestricted,
  unblockTutorForCircularState,
  getCleanApplicantExperienceNote,
  findApplicantFullTutorProfile,
  PUBLIC_TUTOR_SUMMARY_COLUMNS,
  PUBLIC_TUTOR_VERIFICATION_SELECT_COLUMNS,
  PUBLIC_TUTOR_VERIFICATION_FALLBACK_COLUMNS,
  PUBLIC_TUITION_CIRCULAR_COLUMNS,
  PUBLIC_TUITION_CIRCULAR_FALLBACK_COLUMNS,
  PUBLIC_CIRCULAR_APPLICATION_COLUMNS,
  PUBLIC_CIRCULAR_APPLICATION_FALLBACK_COLUMNS,
  ADMIN_VERIFICATION_DOCUMENT_COLUMNS,
  mergeVerificationDocumentScans,
  fetchSiteSocialSettingsOncePerSession,
  fetchSiteNoticesOncePerSession,
  isLiveSessionCacheFresh,
  readLiveSessionCacheFromStorage,
  writeLiveSessionCacheToStorage,
  insertTuitionCircularToSupabase,
  updateTuitionCircularInSupabase,
  hideTuitionCircularInSupabase,
  deleteTuitionCircularFromSupabase,
  DUPLICATE_CIRCULAR_APPLICATION_MESSAGE,
  toBanglaNumber,
} from './utils/tutorEngine';
import { executeAdminDeleteProfileEverywhere } from './utils/supabaseAdminDelete';
import { BrandLogo } from './components/BrandLogo';
import {
  TutorUploadFileBundle,
  executeAdminUpdateProfileInSupabase,
  syncTutorProfileToSupabase,
} from './utils/supabaseProfileUpload';
import { supabase } from './supabaseClient';
import { BentoHero } from './components/BentoHero';
import { TutorDiscoveryConsole } from './components/TutorDiscoveryConsole';
import { VerificationCenter } from './components/VerificationCenter';
import { TuitionJobBoard } from './components/TuitionJobBoard';
import { NoticeBoard } from './components/NoticeBoard';
import { GuardianRequestModal } from './components/GuardianRequestModal';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { CreateAccountCard } from './components/CreateAccountCard';
import {
  AdminApplicantsModal,
  AdminPinModal,
  ApplyJobModal,
  BookTrialModal,
  FullProfileModal,
  PostJobModal,
} from './components/Modals';
import {
  PaidInvoiceModal,
  TermsAndRefundModal,
  ReceiptInvoiceData,
} from './components/LegalAndReceiptModals';
import {
  Briefcase,
  GraduationCap,
  LayoutDashboard,
  Lock,
  LogOut,
  PlusCircle,
  ShieldCheck,
  UserCheck,
  UserCircle2,
  Users,
} from 'lucide-react';

export type WorkspaceDesk =
  | 'tutors'
  | 'tutor_upload'
  | 'admin_review'
  | 'job_board'
  | 'tutor_board'
  | 'account';

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  upazila: 'All',
  mode: 'All',
  medium: 'All',
  college: 'All',
  gender: 'All',
  maxBudget: 10000,
  verifiedOnly: false,
  shortlistedOnly: false,
};

function clearAdminSessionStorage(): void {
  try {
    window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    // Always purge any legacy global tutor profile key so profiles never leak across accounts
    window.localStorage.removeItem(TUTOR_PROFILE_STORAGE_KEY);
  } catch {
    // Ignore storage restrictions
  }
}

const DELETED_PROFILES_STORAGE_KEY = 'madaripur_deleted_profiles_v1';

function readDeletedProfileIdsFromStorage(): string[] {
  try {
    const raw = window.localStorage.getItem(DELETED_PROFILES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((id) => String(id).trim().toLowerCase()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function addDeletedProfileIdsToStorage(ids: (string | undefined)[]): void {
  try {
    const current = new Set(readDeletedProfileIdsFromStorage());
    for (const id of ids) {
      const clean = (id || '').trim().toLowerCase();
      if (clean && !isProtectedAdminProfile(clean)) {
        current.add(clean);
      }
    }
    window.localStorage.setItem(
      DELETED_PROFILES_STORAGE_KEY,
      JSON.stringify(Array.from(current))
    );
  } catch {
    // Ignore storage restrictions
  }
}

function removeDeletedProfileIdsFromStorage(ids: (string | undefined)[]): void {
  try {
    const toRemove = new Set(
      ids.map((id) => (id || '').trim().toLowerCase()).filter(Boolean)
    );
    if (toRemove.size === 0) return;
    const filtered = readDeletedProfileIdsFromStorage().filter(
      (id) => !toRemove.has(id)
    );
    window.localStorage.setItem(
      DELETED_PROFILES_STORAGE_KEY,
      JSON.stringify(filtered)
    );
  } catch {
    // Ignore storage restrictions
  }
}

function isProfileMarkedDeleted(
  req: VerificationRequest,
  deletedSet: Set<string>
): boolean {
  if (deletedSet.size === 0 || isProtectedAdminProfile(req)) return false;
  const code = (req.id || '').trim().toLowerCase();
  const email = (req.userEmail || req.email || '').trim().toLowerCase();
  const userId = (req.userId || '').trim().toLowerCase();
  return (
    (Boolean(code) && deletedSet.has(code)) ||
    (Boolean(email) && deletedSet.has(email)) ||
    (Boolean(userId) && deletedSet.has(userId))
  );
}

function readAdminPinUnlockedFromTabStorage(): boolean {
  try {
    return window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  // Default isAdminUnlocked strictly to false on page load; never synced to Supabase
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [activeDesk, setActiveDesk] = useState<WorkspaceDesk>(() => {
    try {
      if (
        window.location.pathname === '/login' ||
        window.location.pathname === '/signup'
      ) {
        return 'account';
      }
    } catch {
      // Ignore location access errors
    }
    return 'tutors';
  });
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>(() => {
    try {
      return window.location.pathname === '/login' ? 'signin' : 'signup';
    } catch {
      return 'signup';
    }
  });
  const [authGuardNotice, setAuthGuardNotice] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Strictly tie Admin eligibility to the logged-in account (drabirm4@gmail.com or username drabirm4)
  const isAdminAccount = useMemo(
    () => isAuthorizedAdminAccount(currentUser),
    [currentUser]
  );
  // Both conditions must be true: logged into drabirm4@gmail.com/drabirm4 AND PIN 153800 unlocked in this browser tab
  const hasAdminAccess = Boolean(isAdminAccount && isAdminUnlocked);

  // Strictly isolated state buckets per desk (seeded from sessionStorage cache if available in this browser tab)
  const initialSessionCache = useMemo(
    () => readLiveSessionCacheFromStorage(),
    []
  );
  const [tutors, setTutors] = useState<TutorProfile[]>(() =>
    initialSessionCache?.tutors && initialSessionCache.tutors.length > 0
      ? initialSessionCache.tutors
      : initialSessionCache?.verifications
      ? syncStrictLiveSupabaseTutors(
          initialSessionCache.verifications,
          INITIAL_TUTORS
        )
      : INITIAL_TUTORS
  );
  const [verificationRequests, setVerificationRequests] = useState<
    VerificationRequest[]
  >(() => initialSessionCache?.verifications || INITIAL_VERIFICATION_REQUESTS);
  const [myTutorProfile, setMyTutorProfile] =
    useState<VerificationRequest | null>(null);
  const currentUserRef = useRef<UserAccount | null>(null);
  const myTutorProfileRef = useRef<VerificationRequest | null>(null);
  const removedByAdminRef = useRef<boolean>(false);
  const fetchProfileInFlightRef = useRef<Map<string, Promise<void>>>(new Map());
  const adminScansLoadedRef = useRef<boolean>(false);
  const hasInitialLiveFetchCompletedRef = useRef<boolean>(false);
  const lastSessionCacheAtRef = useRef<number>(
    initialSessionCache?.updatedAt || Date.now()
  );

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    myTutorProfileRef.current = myTutorProfile;
  }, [myTutorProfile]);
  const [jobs, setJobs] = useState<TuitionJob[]>(
    () => initialSessionCache?.jobs || INITIAL_TUITION_JOBS
  );
  const [circularApplications, setCircularApplications] = useState<
    CircularApplicationRow[]
  >(() => initialSessionCache?.applications || []);
  const [isLoadingCirculars, setIsLoadingCirculars] = useState<boolean>(false);

  // Persist fetched records (active tuition_circulars & approved tutor lists) in sessionStorage for 2 minutes so switching tabs does not re-download the database
  useEffect(() => {
    writeLiveSessionCacheToStorage({
      jobs,
      applications: circularApplications,
      verifications: verificationRequests,
      tutors,
      updatedAt: lastSessionCacheAtRef.current,
    });
  }, [jobs, circularApplications, verificationRequests, tutors]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [bookedTrials, setBookedTrials] = useState<TrialBookingRecord[]>([]);
  const [lastAdminMessage, setLastAdminMessage] = useState<string | null>(null);
  const [hiddenAdminAppIds, setHiddenAdminAppIds] = useState<string[]>([]);
  const [hiddenAdminReqIds, setHiddenAdminReqIds] = useState<string[]>([]);
  const [hiddenAdminJobIds, setHiddenAdminJobIds] = useState<string[]>([]);

  // Modal states
  const [activeProfileTutor, setActiveProfileTutor] =
    useState<TutorProfile | null>(null);
  const [activeTrialTutor, setActiveTrialTutor] =
    useState<TutorProfile | null>(null);
  const [activeApplyJob, setActiveApplyJob] = useState<TuitionJob | null>(null);
  const [activeAdminApplicantsJobId, setActiveAdminApplicantsJobId] = useState<
    string | null
  >(null);
  const [isPostJobOpen, setIsPostJobOpen] = useState<boolean>(false);
  const [siteSocialSettings, setSiteSocialSettings] =
    useState<SiteSocialSettings>(() => readSiteSocialSettingsFromStorage());
  const [paymentRequests, setPaymentRequests] = useState<
    PaymentRequestRecord[]
  >(() => readPaymentRequestsFromStorage());
  const [siteNotices, setSiteNotices] = useState<SiteNotice[]>(() =>
    readSiteNoticesFromStorage()
  );
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState<boolean>(false);
  const [guardianRequests, setGuardianRequests] = useState<GuardianRequestRecord[]>(
    () => readGuardianRequestsFromStorage()
  );
  const [activeInvoiceData, setActiveInvoiceData] =
    useState<ReceiptInvoiceData | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);
  const [isTermsRefundModalOpen, setIsTermsRefundModalOpen] =
    useState<boolean>(false);
  const [termsModalTab, setTermsModalTab] = useState<'terms' | 'refund'>(
    'refund'
  );

  const refreshSiteSocialSettings = useCallback(async (forceRefresh = true) => {
    const latest = await fetchSiteSocialSettingsOncePerSession(
      supabase,
      forceRefresh
    );
    setSiteSocialSettings(latest);
  }, []);

  const refreshPaymentRequests = useCallback(async () => {
    const latest = await fetchPaymentRequestsFromSupabase(supabase);
    setPaymentRequests(latest);
  }, []);

  const refreshSiteNotices = useCallback(async (forceRefresh = false) => {
    const latest = await fetchSiteNoticesOncePerSession(
      supabase,
      forceRefresh
    );
    setSiteNotices(latest);
  }, []);

  const refreshGuardianRequests = useCallback(async () => {
    const latest = await fetchGuardianRequestsFromSupabase(supabase);
    setGuardianRequests(latest);
  }, []);

  const handleSubmitGuardianRequest = useCallback(
    async (input: {
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
    }): Promise<GuardianRequestRecord> => {
      const res = await submitGuardianRequestToSupabase(input, supabase);
      setGuardianRequests((prev) => [res, ...prev.filter((g) => g.id !== res.id)]);
      return res;
    },
    []
  );

  const handleConvertGuardianRequestToCircular = useCallback(
    async (req: GuardianRequestRecord) => {
      const parsed = extractDetailedGuardianRequestFields(req);
      const mediumVal = (
        parsed.mediumVersion === 'English Version' ||
        parsed.mediumVersion === 'Admission Test' ||
        parsed.mediumVersion === 'Madrasah/Quranic' ||
        parsed.mediumVersion === 'ICT'
          ? parsed.mediumVersion
          : 'Bangla Medium'
      ) as Exclude<MediumCategory, 'All'>;

      const newJob: TuitionJob = {
        id: `MDP-${Math.floor(2500 + Math.random() * 7000)}`,
        titleEn: `${parsed.studentClass} (${parsed.mediumVersion}) Tutor Needed in ${parsed.upazilaArea}`,
        titleBn: `${parsed.studentClass} টিউটর প্রয়োজন (${parsed.upazilaArea})`,
        studentClassEn: `${parsed.studentClass}${
          req.schoolCollegeName ? ` · ${req.schoolCollegeName}` : ''
        }`,
        studentClassBn: parsed.studentClass,
        classSubject: `${parsed.studentClass} · ${parsed.subjectsList.join(', ')}`,
        upazila:
          (parsed.upazilaArea as Exclude<Upazila, 'All'>) || 'Madaripur Sadar',
        landmarkEn: parsed.fullAddress,
        landmarkBn: parsed.fullAddress,
        medium: mediumVal,
        mode: 'Home',
        subjectsEn:
          parsed.subjectsList.length > 0 ? parsed.subjectsList : [req.subjects],
        subjectsBn:
          parsed.subjectsList.length > 0 ? parsed.subjectsList : [req.subjects],
        daysPerWeek: parsed.daysPerWeek || 4,
        salaryBdt: parsed.offeredSalary || 5000,
        numStudents: parsed.numberOfStudents || 1,
        preferredGender: (parsed.preferredGender as any) || 'Any',
        tutorPreference: `${parsed.preferredGenderLabel}${
          req.preferredUniversity ? ` · ${req.preferredUniversity}` : ''
        }`,
        preferredInstitutionEn:
          req.preferredUniversity || 'Verified Madaripur Tutor',
        preferredInstitutionBn:
          req.preferredUniversity || 'যাচাইকৃত মাদারীপুর টিউটর',
        postedAgoEn: 'Just now',
        postedAgoBn: 'এইমাত্র',
        guardianName: parsed.guardianName,
        contactPhone: parsed.guardianPhone,
        requirements: [
          req.preferredTimeDuration
            ? `Time: ${req.preferredTimeDuration}`
            : '',
          parsed.additionalNotes,
        ]
          .filter(Boolean)
          .join(' · '),
        tutoringFormat: `Home · ${parsed.mediumVersion}`,
        status: 'Active',
        createdAt: new Date().toISOString(),
        applicantsCount: 0,
        urgent: true,
      };

      const result = publishAdminTuitionCircular('admin_review', jobs, newJob);
      if (result.allowed) {
        setJobs(result.jobs);
        try {
          await insertTuitionCircularToSupabase(supabase, {
            ...newJob,
            status: 'Active',
            hiddenFromAdmin: false,
          });
          await fetchLiveCirculars();
        } catch {
          // Local state updated
        }
      }

      const updatedRequests = await updateGuardianRequestStatusInSupabase(
        req.id,
        'converted',
        supabase
      );
      setGuardianRequests(updatedRequests);
    },
    [jobs]
  );

  const handleUpdateGuardianRequestStatus = useCallback(
    async (id: string, nextStatus: string) => {
      const updated = await updateGuardianRequestStatusInSupabase(
        id,
        nextStatus,
        supabase
      );
      setGuardianRequests(updated);
    },
    []
  );

  const handleUpdateGuardianRequestDetails = useCallback(
    async (updatedReq: GuardianRequestRecord) => {
      const updated = await updateGuardianRequestDetailsInSupabase(
        updatedReq,
        supabase
      );
      setGuardianRequests(updated);
    },
    []
  );

  const handleDeleteGuardianRequest = useCallback(
    async (id: string) => {
      const remaining = await deleteGuardianRequestFromSupabase(id, supabase);
      setGuardianRequests(remaining);
    },
    []
  );

  const handleSaveSiteSocialSettings = useCallback(
    async (input: Partial<SiteSocialSettings>) => {
      const result = await saveSiteSocialSettingsToSupabase(supabase, input);
      setSiteSocialSettings(result.settings);
    },
    []
  );

  const handleSubmitPaymentRequest = useCallback(
    async (input: PaymentSubmissionInput): Promise<PaymentRequestRecord> => {
      const res = await submitPaymentRequestToSupabase(
        supabase,
        input,
        currentUserRef.current,
        myTutorProfileRef.current
      );
      setPaymentRequests((prev) => {
        const exists = prev.some(
          (p) =>
            p.id.toLowerCase() === res.payment.id.toLowerCase() ||
            p.transactionId.toUpperCase() ===
              res.payment.transactionId.toUpperCase()
        );
        return exists
          ? prev.map((p) =>
              p.id.toLowerCase() === res.payment.id.toLowerCase() ||
              p.transactionId.toUpperCase() ===
                res.payment.transactionId.toUpperCase()
                ? res.payment
                : p
            )
          : [res.payment, ...prev];
      });
      return res.payment;
    },
    []
  );

  const handleAdminPaymentDecision = useCallback(
    async (
      paymentId: string,
      decision: Exclude<PaymentRequestStatus, 'Pending'>,
      adminNote?: string
    ) => {
      if (!hasAdminAccess) return;
      const updated = await updatePaymentRequestStatusInSupabase(
        supabase,
        paymentId,
        decision,
        adminNote || ''
      );
      setPaymentRequests(updated);
      setLastAdminMessage(
        decision === 'Approved'
          ? lang === 'en'
            ? `Approved payment ${paymentId} in Supabase payment_requests and synced to tutor Profile.`
            : `পেমেন্ট ${paymentId} যাচাইকৃত হিসেবে সুপাবেস ও টিউটর প্রোফাইলে আপডেট হয়েছে।`
          : lang === 'en'
          ? `Rejected payment ${paymentId} in Supabase payment_requests.`
          : `পেমেন্ট ${paymentId} বাতিল হিসেবে চিহ্নিত হয়েছে।`
      );
    },
    [hasAdminAccess, lang]
  );

  const handleDeletePaymentRequest = useCallback(
    async (paymentId: string) => {
      if (!hasAdminAccess) return;
      const remaining = await deletePaymentRequestFromSupabase(
        supabase,
        paymentId
      );
      setPaymentRequests(remaining);
      setLastAdminMessage(
        lang === 'en'
          ? `Deleted payment record ${paymentId} from payment_requests.`
          : `পেমেন্ট রেকর্ড ${paymentId} মুছে ফেলা হয়েছে।`
      );
    },
    [hasAdminAccess, lang]
  );

  const handleSaveSiteNotice = useCallback(
    async (input: {
      id?: string;
      title: string;
      content: string;
      badge_text?: string;
      image_url?: string | null;
      is_active?: boolean;
    }) => {
      const saved = await saveSiteNoticeToSupabase(input, supabase);
      setSiteNotices((prev) => {
        const index = prev.findIndex((n) => n.id === saved.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      return saved;
    },
    []
  );

  const handleToggleSiteNoticeActive = useCallback(
    async (id: string, nextActive: boolean) => {
      const updated = await toggleSiteNoticeStatusInSupabase(
        id,
        nextActive,
        supabase
      );
      setSiteNotices(updated);
      return updated;
    },
    []
  );

  const handleDeleteSiteNotice = useCallback(
    async (id: string) => {
      const remaining = await deleteSiteNoticeFromSupabase(id, supabase);
      setSiteNotices(remaining);
      return remaining;
    },
    []
  );

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Automatically remove any injected external hosting badges on documentElement & body
  useEffect(() => {
    if (typeof document === 'undefined' || !document.documentElement) return;

    const badgeSelectors =
      '#net-lify-badge, .netlify-badge, a[href*="netlify.com"], iframe[src*="netlify"], div[style*="z-index: 99999"], div[style*="z-index:99999"], [class*="netlify-badge"], [id*="netlify-badge"]';

    const removeBadgeNode = (el: HTMLElement) => {
      const rootContainer = document.getElementById('root');
      if (el === document.documentElement || el === document.body || el === rootContainer) {
        return;
      }
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');

      const parent = el.parentElement;
      if (
        parent &&
        parent !== document.documentElement &&
        parent !== document.body &&
        parent !== rootContainer &&
        parent.children.length === 1 &&
        typeof window !== 'undefined' &&
        window.getComputedStyle(parent).position === 'fixed'
      ) {
        parent.remove();
      } else {
        el.remove();
      }
    };

    const cleanInjectedBadges = () => {
      document.querySelectorAll(badgeSelectors).forEach((node) => {
        removeBadgeNode(node as HTMLElement);
      });

      const rootContainer = document.getElementById('root');
      const bodyChildren = document.body ? Array.from(document.body.children) : [];
      for (const child of bodyChildren) {
        const el = child as HTMLElement;
        if (!el || el === rootContainer || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') {
          continue;
        }
        const htmlText = (el.outerHTML || '').toLowerCase();
        const plainText = (el.textContent || '').toLowerCase();
        if (
          htmlText.includes('netlify.com') ||
          plainText.includes('netlify.com') ||
          plainText.includes('hosted by netlify') ||
          plainText.includes('deployed on netlify') ||
          plainText.includes('powered by netlify')
        ) {
          el.remove();
        }
      }
    };

    cleanInjectedBadges();

    const observer = new MutationObserver((mutations) => {
      const rootContainer = document.getElementById('root');
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((added) => {
          if (added.nodeType !== 1) return;
          const el = added as HTMLElement;
          if (el === rootContainer || (rootContainer && rootContainer.contains(el))) {
            return;
          }
          const htmlText = (el.outerHTML || '').toLowerCase();
          const plainText = (el.textContent || '').toLowerCase();
          if (
            el.matches?.(badgeSelectors) ||
            htmlText.includes('netlify.com') ||
            plainText.includes('netlify.com') ||
            plainText.includes('hosted by netlify') ||
            plainText.includes('deployed on netlify') ||
            plainText.includes('powered by netlify')
          ) {
            el.remove();
          }
        });
      }
      cleanInjectedBadges();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, []);

  // Enforce strict revocation if user is not logged into drabirm4@gmail.com / drabirm4
  useEffect(() => {
    if (!isAdminAccount) {
      if (isAdminUnlocked) {
        setIsAdminUnlocked(false);
      }
      if (isAdminModalOpen) {
        setIsAdminModalOpen(false);
      }
      if (isPostJobOpen) {
        setIsPostJobOpen(false);
      }
      if (activeAdminApplicantsJobId) {
        setActiveAdminApplicantsJobId(null);
      }
      if (activeDesk === 'admin_review') {
        setActiveDesk('tutors');
      }
    } else if (!isAdminUnlocked && activeDesk === 'admin_review') {
      setActiveDesk('tutors');
    }
  }, [
    isAdminAccount,
    isAdminUnlocked,
    isAdminModalOpen,
    isPostJobOpen,
    activeAdminApplicantsJobId,
    activeDesk,
  ]);

  // Force-wipe all Tutor Zone storage & React profile state, sign out of Supabase Auth, and redirect with Administrator removal notice
  const forceWipeAndSignOutDeletedUser = useCallback(async () => {
    removedByAdminRef.current = true;
    clearAllTutorZoneBrowserStorage();
    clearAdminSessionStorage();
    myTutorProfileRef.current = null;
    currentUserRef.current = null;
    setIsAdminUnlocked(false);
    setIsAdminModalOpen(false);
    setIsPostJobOpen(false);
    setActiveAdminApplicantsJobId(null);
    setMyTutorProfile(null);
    setCurrentUser(null);
    setAuthGuardNotice(ADMIN_REMOVED_PROFILE_NOTICE);
    setAuthMode('signin');
    setActiveDesk('account');
    try {
      window.history.replaceState({}, '', '/login');
    } catch {
      // Ignore history API restrictions
    }
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Ignore local signOut error
    }
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore network signOut error if user already deleted from auth.users
    }
    clearAllTutorZoneBrowserStorage();
  }, []);

  // Query Supabase "tutor_verifications" strictly where user_email (or user_id) equals the logged-in user's account
  const fetchMyTutorProfile = useCallback(
    async (userArg?: UserAccount | null) => {
      // Always purge any legacy cached profile payloads from localStorage so browser storage is NEVER used as a fallback
      purgeLegacyLocalStorageProfileCache();

      if (!userArg || (!userArg.email && !userArg.id)) {
        setMyTutorProfile(null);
        return;
      }

      const cleanEmail = (userArg.email || '').trim().toLowerCase();
      const emailPrefix = cleanEmail ? cleanEmail.split('@')[0] : '';
      const cleanUserId = (
        userArg.id ||
        emailPrefix ||
        userArg.fullName ||
        ''
      ).trim();
      const inFlightKey = (cleanEmail || cleanUserId || 'anon').toLowerCase();

      const existingPromise = fetchProfileInFlightRef.current.get(inFlightKey);
      if (existingPromise) {
        await existingPromise;
        return;
      }

      const runProfileVerification = async () => {
        const isAdmin = isAuthorizedAdminAccount(userArg);
        // Capture explicit login intent before any async network calls
        const hasExplicitLoginIntent =
          hasFreshExplicitLoginIntent() || isOAuthRedirectCallbackUrl();

        try {
          let authUserDeleted = false;
          let isSessionOlderThanNewLoginWindow = false;

          if (!isAdmin && typeof supabase.auth?.getUser === 'function') {
            try {
              const authRes = await supabase.auth.getUser();
              if (isAuthUserDeletedError(authRes.error)) {
                authUserDeleted = true;
              } else if (!authRes.error && !authRes.data?.user) {
                authUserDeleted = true;
              } else if (authRes.data?.user?.created_at) {
                const createdMs = Date.parse(authRes.data.user.created_at);
                if (
                  Number.isFinite(createdMs) &&
                  Date.now() - createdMs > 180_000
                ) {
                  isSessionOlderThanNewLoginWindow = true;
                }
              }
            } catch {
              // Ignore transient network errors on auth check
            }
          }

          if (authUserDeleted) {
            await forceWipeAndSignOutDeletedUser();
            return;
          }

          // If the user is actively completing an explicit login right now, clear any stale local deletion marker for their email
          if (hasExplicitLoginIntent) {
            removeDeletedProfileIdsFromStorage([cleanEmail, cleanUserId]);
          }

          let matchedRow: TutorVerificationRow | null = null;
          let querySucceeded = false;

          const fetchLightweightOwnProfile = async (
            column: 'user_email' | 'user_id',
            value: string
          ): Promise<{ data: TutorVerificationRow[] | null; error: any }> => {
            const res = await supabase
              .from('tutor_verifications')
              .select(PUBLIC_TUTOR_VERIFICATION_SELECT_COLUMNS)
              .eq(column, value)
              .order('created_at', { ascending: false })
              .limit(1);

            if (!res.error) {
              return {
                data: (res.data || null) as unknown as TutorVerificationRow[] | null,
                error: res.error,
              };
            }
            const fallbackRes = await supabase
              .from('tutor_verifications')
              .select(PUBLIC_TUTOR_VERIFICATION_FALLBACK_COLUMNS)
              .eq(column, value)
              .order('created_at', { ascending: false })
              .limit(1);
            return {
              data: (fallbackRes.data || null) as unknown as
                | TutorVerificationRow[]
                | null,
              error: fallbackRes.error,
            };
          };

          if (cleanEmail) {
            const emailRes = await fetchLightweightOwnProfile(
              'user_email',
              cleanEmail
            );

            if (!emailRes.error) {
              querySucceeded = true;
              if (Array.isArray(emailRes.data) && emailRes.data.length > 0) {
                matchedRow = emailRes.data[0] as TutorVerificationRow;
              }
            }
          }

          if (!matchedRow && cleanUserId) {
            const idRes = await fetchLightweightOwnProfile(
              'user_id',
              cleanUserId
            );

            if (!idRes.error) {
              querySucceeded = true;
              if (Array.isArray(idRes.data) && idRes.data.length > 0) {
                matchedRow = idRes.data[0] as TutorVerificationRow;
              }
            }
          }

          if (!matchedRow && emailPrefix && emailPrefix !== cleanUserId) {
            const prefixRes = await fetchLightweightOwnProfile(
              'user_id',
              emailPrefix
            );

            if (!prefixRes.error) {
              querySucceeded = true;
              if (Array.isArray(prefixRes.data) && prefixRes.data.length > 0) {
                matchedRow = prefixRes.data[0] as TutorVerificationRow;
              }
            }
          }

          if (matchedRow) {
            const mappedReq = mapSupabaseRowToVerificationRequest(matchedRow);
            const deletedSet = new Set(readDeletedProfileIdsFromStorage());
            const isTombstoneOrDeleted =
              !isActiveVerificationRequest(mappedReq) ||
              isProfileMarkedDeleted(mappedReq, deletedSet);

            if (isTombstoneOrDeleted) {
              if (!isAdmin) {
                await forceWipeAndSignOutDeletedUser();
              } else {
                setMyTutorProfile(null);
              }
              return;
            }

            if (!isTutorProfileSubmitted(mappedReq)) {
              clearExplicitLoginIntent();
              setMyTutorProfile(null);
              return;
            }

            markTutorProfileSyncedForEmail(cleanEmail || cleanUserId);
            clearExplicitLoginIntent();
            setMyTutorProfile(mappedReq);
            setVerificationRequests((prev) => {
              const exists = prev.some(
                (r) =>
                  r.id.toLowerCase() === mappedReq.id.toLowerCase() ||
                  (Boolean(cleanEmail) &&
                    (r.userEmail || '').trim().toLowerCase() === cleanEmail)
              );
              return exists
                ? prev.map((r) =>
                    r.id.toLowerCase() === mappedReq.id.toLowerCase() ||
                    (Boolean(cleanEmail) &&
                      (r.userEmail || '').trim().toLowerCase() === cleanEmail)
                      ? mappedReq
                      : r
                  )
                : [mappedReq, ...prev];
            });
            return;
          }

          // No row exists in Supabase `tutor_verifications` for this logged-in user
          if (querySucceeded && !isAdmin) {
            const deletedSet = new Set(readDeletedProfileIdsFromStorage());
            const inLocalDeletedSet =
              !hasExplicitLoginIntent &&
              ((Boolean(cleanEmail) && deletedSet.has(cleanEmail)) ||
                (Boolean(cleanUserId) &&
                  deletedSet.has(cleanUserId.toLowerCase())));
            const hadPriorSyncedProfile =
              inLocalDeletedSet ||
              Boolean(myTutorProfileRef.current) ||
              hasPriorSyncedTutorProfileForEmail(cleanEmail) ||
              hasPriorSyncedTutorProfileForEmail(cleanUserId);

            const shouldWipe = shouldForceWipeDeletedUserSession({
              email: cleanEmail,
              isAdmin,
              authUserDeleted,
              hasActiveSupabaseRow: false,
              hasTombstoneRow: inLocalDeletedSet,
              hasExplicitLoginIntent,
              hadPriorSyncedProfile,
              isSessionOlderThanNewLoginWindow,
            });

            if (shouldWipe) {
              await forceWipeAndSignOutDeletedUser();
              return;
            }

            // Keep newly registered or logged-in user's profile state completely blank (isProfileSubmitted = false)
            // until they explicitly click "Edit Profile Info", fill out the form manually, and click Save/Submit.
            clearExplicitLoginIntent();
            setMyTutorProfile(null);
            return;
          }

          setMyTutorProfile(null);
        } catch {
          // Keep current account-scoped state if network fails
        }
      };

      const taskPromise = runProfileVerification().finally(() => {
        fetchProfileInFlightRef.current.delete(inFlightKey);
      });
      fetchProfileInFlightRef.current.set(inFlightKey, taskPromise);
      await taskPromise;
    },
    [forceWipeAndSignOutDeletedUser]
  );

  // Restore optional user session if present and immediately purge any deleted non-admin user from local cache on app load
  useEffect(() => {
    let mounted = true;
    purgeLegacyLocalStorageProfileCache();

    try {
      supabase.auth
        .getSession()
        .then(async ({ data }) => {
          if (!mounted) return;
          if (data?.session?.user) {
            const mappedUser = mapSupabaseSessionToUser(data.session.user);
            if (isAuthorizedAdminAccount(mappedUser)) {
              setCurrentUser(mappedUser);
              if (readAdminPinUnlockedFromTabStorage()) {
                setIsAdminUnlocked(true);
              } else {
                clearAdminSessionStorage();
                setIsAdminUnlocked(false);
              }
            } else {
              clearAdminSessionStorage();
              setIsAdminUnlocked(false);
              setCurrentUser(mappedUser);
              // Immediately check whether this non-admin user's account and profile still exist in Supabase
              await fetchMyTutorProfile(mappedUser);
            }
          } else {
            if (!isOAuthRedirectCallbackUrl()) {
              clearExplicitLoginIntent();
            }
            clearAdminSessionStorage();
            setCurrentUser(null);
            setMyTutorProfile(null);
            setIsAdminUnlocked(false);
          }
        })
        .catch(() => {
          if (!mounted) return;
          clearAdminSessionStorage();
          setCurrentUser(null);
          setMyTutorProfile(null);
          setIsAdminUnlocked(false);
        });
    } catch {
      clearAdminSessionStorage();
      setCurrentUser(null);
      setMyTutorProfile(null);
      setIsAdminUnlocked(false);
    }

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!mounted) return;
          if (isSignUpFlowInProgress()) {
            // Do not auto-login or redirect to homepage during Create Account -> Sign In transition
            setCurrentUser(null);
            setMyTutorProfile(null);
            setAuthMode('signin');
            setActiveDesk('account');
            return;
          }
          if (event === 'SIGNED_OUT' || !session?.user) {
            clearAdminSessionStorage();
            setIsAdminUnlocked(false);
            setIsAdminModalOpen(false);
            setIsPostJobOpen(false);
            setActiveAdminApplicantsJobId(null);
            setCurrentUser(null);
            setMyTutorProfile(null);
            if (removedByAdminRef.current) {
              removedByAdminRef.current = false;
              setAuthGuardNotice(ADMIN_REMOVED_PROFILE_NOTICE);
              setAuthMode('signin');
              setActiveDesk('account');
            } else if (event === 'SIGNED_OUT') {
              setActiveDesk((prev) => (prev === 'account' ? 'account' : 'tutors'));
            } else {
              setActiveDesk((prev) =>
                prev === 'admin_review' ? 'tutors' : prev
              );
            }
          } else {
            const mappedUser = mapSupabaseSessionToUser(session.user);
            setCurrentUser((prevUser) => {
              if (
                prevUser?.email?.toLowerCase() !==
                mappedUser.email?.toLowerCase()
              ) {
                setMyTutorProfile(null);
              }
              return mappedUser;
            });
            if (!isAuthorizedAdminAccount(mappedUser)) {
              clearAdminSessionStorage();
              setIsAdminUnlocked(false);
              setIsAdminModalOpen(false);
              setIsPostJobOpen(false);
              setActiveAdminApplicantsJobId(null);
            }
          }
        }
      );
      subscription = authListener?.subscription || null;
    } catch {
      // Ignore auth listener initialization error
    }

    return () => {
      mounted = false;
      try {
        subscription?.unsubscribe();
      } catch {
        // Ignore unsubscribe error
      }
    };
  }, [fetchMyTutorProfile]);

  // Lazy-load heavy NID & Student ID Base64 scans ONLY when Admin opens Admin Verification Desk or Applicant Review modal
  const lazyLoadAdminVerificationScans = useCallback(async (force = false) => {
    if (adminScansLoadedRef.current && !force) {
      return;
    }
    try {
      const { data, error } = await supabase
        .from('tutor_verifications')
        .select(ADMIN_VERIFICATION_DOCUMENT_COLUMNS)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        adminScansLoadedRef.current = true;
        setVerificationRequests((prev) =>
          mergeVerificationDocumentScans(
            prev,
            data as unknown as Partial<TutorVerificationRow>[]
          )
        );
      }
    } catch {
      // Ignore lazy scan load error if offline
    }
  }, []);

  // Fetch live tuition circulars, circular_applications, and lightweight tutor_verifications (excluding Base64 NID/Student ID scans)
  const fetchLiveCirculars = useCallback(
    async (forceRefresh: boolean = true) => {
      if (!forceRefresh && hasInitialLiveFetchCompletedRef.current) {
        const cached = readLiveSessionCacheFromStorage();
        if (isLiveSessionCacheFresh(cached) && cached) {
          if (Array.isArray(cached.jobs) && cached.jobs.length > 0) {
            setJobs(cached.jobs);
          }
          if (Array.isArray(cached.applications)) {
            setCircularApplications(cached.applications);
          }
          if (Array.isArray(cached.verifications)) {
            setVerificationRequests((prev) => {
              const prevByCode = new Map(
                prev.map((p) => [(p.id || '').trim().toLowerCase(), p])
              );
              return cached.verifications!.map((req) => {
                const existing = prevByCode.get(
                  (req.id || '').trim().toLowerCase()
                );
                if (!existing) return req;
                return {
                  ...req,
                  nidScanDataUrl:
                    req.nidScanDataUrl || existing.nidScanDataUrl,
                  uniScanDataUrl:
                    req.uniScanDataUrl || existing.uniScanDataUrl,
                };
              });
            });
          }
          if (Array.isArray(cached.tutors) && cached.tutors.length > 0) {
            setTutors(cached.tutors);
          }
          return;
        }
      }

      setIsLoadingCirculars(true);
      try {
        const fetchLightweightVerifications = async () => {
          const res = await supabase
            .from('tutor_verifications')
            .select(PUBLIC_TUTOR_VERIFICATION_SELECT_COLUMNS)
            .order('created_at', { ascending: false });
          if (!res.error) return res;
          const summaryRes = await supabase
            .from('tutor_verifications')
            .select(PUBLIC_TUTOR_SUMMARY_COLUMNS)
            .order('created_at', { ascending: false });
          if (!summaryRes.error) return summaryRes;
          return supabase
            .from('tutor_verifications')
            .select(PUBLIC_TUTOR_VERIFICATION_FALLBACK_COLUMNS)
            .order('created_at', { ascending: false });
        };

        const fetchLightweightCirculars = async (): Promise<{
          data: TuitionCircularRow[] | null;
          error: any;
        }> => {
          const res = await supabase
            .from('tuition_circulars')
            .select(PUBLIC_TUITION_CIRCULAR_COLUMNS)
            .order('created_at', { ascending: false });
          if (!res.error) {
            return {
              data: (res.data || null) as unknown as TuitionCircularRow[] | null,
              error: res.error,
            };
          }
          const fallbackRes = await supabase
            .from('tuition_circulars')
            .select(PUBLIC_TUITION_CIRCULAR_FALLBACK_COLUMNS)
            .order('created_at', { ascending: false });
          return {
            data: (fallbackRes.data || null) as unknown as
              | TuitionCircularRow[]
              | null,
            error: fallbackRes.error,
          };
        };

        const fetchLightweightApplications = async (): Promise<{
          data: CircularApplicationRow[] | null;
          error: any;
        }> => {
          const res = await supabase
            .from('circular_applications')
            .select(PUBLIC_CIRCULAR_APPLICATION_COLUMNS)
            .order('created_at', { ascending: false });
          if (!res.error) {
            return {
              data: (res.data || null) as unknown as
                | CircularApplicationRow[]
                | null,
              error: res.error,
            };
          }
          const fallbackRes = await supabase
            .from('circular_applications')
            .select(PUBLIC_CIRCULAR_APPLICATION_FALLBACK_COLUMNS)
            .order('created_at', { ascending: false });
          return {
            data: (fallbackRes.data || null) as unknown as
              | CircularApplicationRow[]
              | null,
            error: fallbackRes.error,
          };
        };

        const [circularsRes, appsRes, verificationsRes] = await Promise.all([
          fetchLightweightCirculars(),
          fetchLightweightApplications(),
          fetchLightweightVerifications(),
        ]);

        const hasRemoteApps = !appsRes.error && Array.isArray(appsRes.data);
        const hasRemoteCirculars =
          !circularsRes.error && Array.isArray(circularsRes.data);
        const hasRemoteVerifications =
          !verificationsRes.error && Array.isArray(verificationsRes.data);
        const deletedIds = readDeletedProfileIdsFromStorage();
        const deletedSet = new Set(deletedIds);

        if (
          hasRemoteCirculars ||
          hasRemoteApps ||
          hasRemoteVerifications
        ) {
          hasInitialLiveFetchCompletedRef.current = true;
          lastSessionCacheAtRef.current = Date.now();
        }

        if (hasRemoteVerifications) {
          const remoteVerifications = filterStrictLiveSupabaseVerifications(
            verificationsRes.data as unknown as TutorVerificationRow[],
            deletedIds
          );
          // Preserve any already lazy-loaded NID/Student ID scans in memory
          setVerificationRequests((prev) => {
            const prevByCode = new Map(
              prev.map((p) => [(p.id || '').trim().toLowerCase(), p])
            );
            return remoteVerifications.map((req) => {
              const existing = prevByCode.get(
                (req.id || '').trim().toLowerCase()
              );
              if (!existing) return req;
              return {
                ...req,
                nidScanDataUrl: req.nidScanDataUrl || existing.nidScanDataUrl,
                uniScanDataUrl: req.uniScanDataUrl || existing.uniScanDataUrl,
              };
            });
          });
          setTutors((prevTutors) =>
            syncStrictLiveSupabaseTutors(remoteVerifications, prevTutors)
          );

          // If a non-admin user is currently logged in and their profile does not exist in live Supabase, verify & wipe immediately
          const activeUser = currentUserRef.current;
          if (activeUser && !isAuthorizedAdminAccount(activeUser)) {
            const cleanActiveEmail = (activeUser.email || '')
              .trim()
              .toLowerCase();
            const cleanActiveId = (activeUser.id || '').trim().toLowerCase();
            const stillExistsInLiveList = remoteVerifications.some((r) => {
              const rEmail = (r.userEmail || r.email || '')
                .trim()
                .toLowerCase();
              const rUserId = (r.userId || '').trim().toLowerCase();
              return (
                (Boolean(cleanActiveEmail) && rEmail === cleanActiveEmail) ||
                (Boolean(cleanActiveId) && rUserId === cleanActiveId)
              );
            });
            const hadPriorProfile = Boolean(
              myTutorProfileRef.current ||
                hasPriorSyncedTutorProfileForEmail(cleanActiveEmail) ||
                hasPriorSyncedTutorProfileForEmail(cleanActiveId)
            );
            if (
              !stillExistsInLiveList &&
              hadPriorProfile &&
              !hasFreshExplicitLoginIntent()
            ) {
              void fetchMyTutorProfile(activeUser);
            }
          }
        }

        if (hasRemoteApps) {
          const remoteApps = (appsRes.data as CircularApplicationRow[]).filter(
            (app) => {
              if (isProtectedAdminProfile(app)) return true;
              const appCode = (app.tutor_id || '').trim().toLowerCase();
              const appEmail = (app.user_email || '').trim().toLowerCase();
              const appUserId = (app.user_id || '').trim().toLowerCase();
              if (
                (appCode && deletedSet.has(appCode)) ||
                (appEmail && deletedSet.has(appEmail)) ||
                (appUserId && deletedSet.has(appUserId))
              ) {
                return false;
              }
              return true;
            }
          );
          setCircularApplications(remoteApps);

          if (hasRemoteCirculars) {
            const sortedRows = sortCircularRowsNewestFirst(
              circularsRes.data as TuitionCircularRow[]
            );
            const remoteJobs = sortedRows.map(mapCircularRowToTuitionJob);
            setJobs(enrichCircularJobsWithApplications(remoteJobs, remoteApps));
          } else {
            setJobs((prev) =>
              enrichCircularJobsWithApplications(prev, remoteApps)
            );
          }
        } else if (hasRemoteCirculars) {
          const sortedRows = sortCircularRowsNewestFirst(
            circularsRes.data as TuitionCircularRow[]
          );
          const remoteJobs = sortedRows.map(mapCircularRowToTuitionJob);
          setCircularApplications((prevApps) => {
            setJobs(enrichCircularJobsWithApplications(remoteJobs, prevApps));
            return prevApps;
          });
        }
      } catch {
        // Fallback to existing circulars in state if network/table is unavailable
      } finally {
        setIsLoadingCirculars(false);
      }
    },
    [fetchMyTutorProfile]
  );

  // Fetch live data on initial mount (always force-refreshing site_settings id = 1 to bypass stale cache)
  useEffect(() => {
    void fetchLiveCirculars();
    void refreshSiteSocialSettings(true);
    void refreshPaymentRequests();
    void refreshSiteNotices(false);
    void refreshGuardianRequests();

    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.key === SITE_SOCIAL_SETTINGS_STORAGE_KEY) {
        setSiteSocialSettings(readSiteSocialSettingsFromStorage());
      }
      if (!e.key || e.key === PAYMENT_REQUESTS_STORAGE_KEY) {
        setPaymentRequests(readPaymentRequestsFromStorage());
      }
      if (!e.key || e.key === GUARDIAN_REQUESTS_STORAGE_KEY) {
        setGuardianRequests(readGuardianRequestsFromStorage());
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [
    fetchLiveCirculars,
    refreshGuardianRequests,
    refreshPaymentRequests,
    refreshSiteNotices,
    refreshSiteSocialSettings,
  ]);

  // When switching between Dashboard ('tutors'), Tuition Circulars ('job_board'), or Tutor Board ('tutor_board'), pull fresh site_settings (id = 1)
  useEffect(() => {
    if (
      activeDesk === 'job_board' ||
      activeDesk === 'tutors' ||
      activeDesk === 'tutor_board'
    ) {
      void fetchLiveCirculars(false);
      void refreshSiteSocialSettings(true);
    }
  }, [activeDesk, fetchLiveCirculars, refreshSiteSocialSettings]);

  // Lazy-load NID and Student ID scans ONLY when Admin opens Admin Verification Desk or Applicant Review modal
  useEffect(() => {
    if (
      hasAdminAccess &&
      (activeDesk === 'admin_review' || Boolean(activeAdminApplicantsJobId))
    ) {
      void lazyLoadAdminVerificationScans(false);
    }
  }, [
    activeDesk,
    activeAdminApplicantsJobId,
    hasAdminAccess,
    lazyLoadAdminVerificationScans,
  ]);

  // Immediately clear or reload myTutorProfile whenever currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setMyTutorProfile(null);
    } else {
      void fetchMyTutorProfile(currentUser);
    }
  }, [currentUser, fetchMyTutorProfile]);

  // Navigate between public desks (1, 2, 4, account) and strictly locked Admin Desk (3)
  const handleProtectedNavigate = (targetDesk: WorkspaceDesk) => {
    if (targetDesk === 'admin_review') {
      if (!isAdminAccount) {
        setActiveDesk('tutors');
        return;
      }
      if (!canAccessDesk('admin_review', isAdminUnlocked, currentUser)) {
        setIsAdminModalOpen(true);
        return;
      }
      setActiveDesk('admin_review');
      return;
    }

    setActiveDesk(targetDesk);
    if (targetDesk !== 'account') {
      try {
        window.history.replaceState({}, '', '/');
      } catch {
        // Ignore history API restrictions
      }
    }
  };

  const handleUnlockAdmin = () => {
    if (!isAuthorizedAdminAccount(currentUser)) {
      clearAdminSessionStorage();
      setIsAdminUnlocked(false);
      setIsAdminModalOpen(false);
      setActiveDesk('tutors');
      return;
    }
    try {
      window.sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, 'true');
    } catch {
      // Ignore sessionStorage restrictions
    }
    setIsAdminUnlocked(true);
    setIsAdminModalOpen(false);
    setActiveDesk('admin_review');
  };

  const handleLockAdmin = () => {
    clearAdminSessionStorage();
    setIsAdminUnlocked(false);
    setIsAdminModalOpen(false);
    setIsPostJobOpen(false);
    setActiveAdminApplicantsJobId(null);
    setActiveDesk('tutors');
    try {
      window.history.replaceState({}, '', '/');
    } catch {
      // Ignore history API restrictions
    }
  };

  const handleAuthenticated = useCallback(
    (user: UserAccount) => {
      setMyTutorProfile(null);
      setCurrentUser(user);
      setAuthGuardNotice(null);
      setActiveDesk((prev) => (prev === 'account' ? 'tutors' : prev));
      void fetchMyTutorProfile(user);
      if (!isAuthorizedAdminAccount(user)) {
        clearAdminSessionStorage();
        setIsAdminUnlocked(false);
        setIsAdminModalOpen(false);
        setIsPostJobOpen(false);
        setActiveAdminApplicantsJobId(null);
      } else {
        // Require explicit Admin PIN (153800) entry in this browser tab unless already unlocked in this tab
        setIsAdminUnlocked(readAdminPinUnlockedFromTabStorage());
      }
    },
    [fetchMyTutorProfile]
  );

  useEffect(() => {
    const win = window as unknown as {
      __TUTOR_ZONE_AUTH__?: (
        user: UserAccount,
        unlockAdmin?: boolean,
        desk?: WorkspaceDesk
      ) => void;
    };
    win.__TUTOR_ZONE_AUTH__ = (user, unlockAdmin, desk) => {
      handleAuthenticated(user);
      if (unlockAdmin && isAuthorizedAdminAccount(user)) {
        try {
          window.sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, 'true');
        } catch {
          // Ignore storage error
        }
        setIsAdminUnlocked(true);
      }
      setActiveDesk(desk || 'tutors');
    };
    return () => {
      delete win.__TUTOR_ZONE_AUTH__;
    };
  }, [handleAuthenticated]);

  const handleSignOut = () => {
    clearAdminSessionStorage();
    setIsAdminUnlocked(false);
    setIsAdminModalOpen(false);
    setIsPostJobOpen(false);
    setActiveAdminApplicantsJobId(null);
    setMyTutorProfile(null);
    setCurrentUser(null);
    setAuthMode('signin');
    setActiveDesk('tutors');
    try {
      window.history.replaceState({}, '', '/');
    } catch {
      // Ignore history API restrictions
    }
  };

  const filteredTutors = useMemo(
    () => filterTutors(tutors, filters, shortlistedIds),
    [tutors, filters, shortlistedIds]
  );

  const handleUpdateFilters = (partial: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleToggleShortlist = (tutorId: string) => {
    setShortlistedIds((prev) =>
      prev.includes(tutorId)
        ? prev.filter((id) => id !== tutorId)
        : [...prev, tutorId]
    );
  };

  // Review & Star Rating Handlers (Isolated to Guardian Reviews on Find Tutors Desk)
  const handleAddReview = (tutorId: string, review: TutorReview) => {
    setTutors((prev) =>
      prev.map((t) => (t.id === tutorId ? addReviewToTutor(t, review) : t))
    );
    setActiveProfileTutor((prev) =>
      prev && prev.id === tutorId ? addReviewToTutor(prev, review) : prev
    );
  };

  const handleDeleteReview = (tutorId: string, reviewId: string) => {
    setTutors((prev) =>
      prev.map((t) =>
        t.id === tutorId ? removeReviewFromTutor(t, reviewId) : t
      )
    );
    setActiveProfileTutor((prev) =>
      prev && prev.id === tutorId ? removeReviewFromTutor(prev, reviewId) : prev
    );
  };

  // Tutor NID & University Verification Handlers connected to Supabase "tutor_verifications" with strict 1-to-1 account binding
  const handleSubmitVerification = async (
    newReq: VerificationRequest,
    files?: TutorUploadFileBundle
  ): Promise<VerificationRequest> => {
    if (!currentUser) {
      throw new Error('Please sign in to upload your tutor profile.');
    }

    const cleanUserEmail = (
      currentUser.email ||
      newReq.userEmail ||
      newReq.email ||
      ''
    )
      .trim()
      .toLowerCase();
    const cleanUserId = (
      cleanUserEmail.split('@')[0] ||
      currentUser.id ||
      currentUser.fullName ||
      ''
    ).trim();

    const normalizedReq: VerificationRequest = {
      ...newReq,
      email: cleanUserEmail || newReq.email,
      userEmail: cleanUserEmail,
      userId: cleanUserId,
      status: 'Pending',
      adminNote: undefined,
      hiddenFromAdmin: false,
    };

    const syncResult = await syncTutorProfileToSupabase(
      supabase,
      normalizedReq,
      files
    );
    const savedReq = syncResult.savedRequest;

    const existsInState = verificationRequests.some(
      (r) =>
        r.id.toLowerCase() === savedReq.id.toLowerCase() ||
        r.id.toLowerCase() === normalizedReq.id.toLowerCase() ||
        (Boolean(cleanUserEmail) &&
          (r.userEmail || '').trim().toLowerCase() === cleanUserEmail)
    );

    removeDeletedProfileIdsFromStorage([
      savedReq.id,
      normalizedReq.id,
      cleanUserEmail,
      cleanUserId,
    ]);
    setHiddenAdminReqIds((prev) =>
      prev.filter(
        (id) =>
          id.toLowerCase() !== savedReq.id.toLowerCase() &&
          id.toLowerCase() !== normalizedReq.id.toLowerCase()
      )
    );
    setMyTutorProfile(savedReq);
    setVerificationRequests((prev) =>
      existsInState
        ? prev.map((r) =>
            r.id.toLowerCase() === savedReq.id.toLowerCase() ||
            r.id.toLowerCase() === normalizedReq.id.toLowerCase() ||
            (Boolean(cleanUserEmail) &&
              (r.userEmail || '').trim().toLowerCase() === cleanUserEmail)
              ? savedReq
              : r
          )
        : [savedReq, ...prev]
    );
    setLastAdminMessage(null);

    if (!syncResult.ok && syncResult.errorMessage) {
      throw new Error(syncResult.errorMessage);
    }

    try {
      await Promise.all([
        fetchLiveCirculars(),
        fetchMyTutorProfile(currentUser),
      ]);
    } catch {
      // Optimistic local state already updated
    }

    return savedReq;
  };

  const handleAdminDecision = async (
    requestId: string,
    decision: VerificationStatus,
    adminNote: string
  ) => {
    if (!hasAdminAccess) return;
    const result = processVerificationDecision(
      tutors,
      verificationRequests,
      requestId,
      decision,
      adminNote
    );
    setTutors(result.tutors);
    setVerificationRequests(result.requests);

    const updatedReq = result.requests.find(
      (r) => r.id.toLowerCase() === requestId.toLowerCase()
    );
    if (updatedReq) {
      setMyTutorProfile((prev) => {
        if (!prev) return null;
        if (
          prev.id.toLowerCase() === updatedReq.id.toLowerCase() ||
          (updatedReq.userEmail &&
            prev.userEmail &&
            prev.userEmail.toLowerCase() === updatedReq.userEmail.toLowerCase())
        ) {
          return updatedReq;
        }
        return prev;
      });
    }

    setLastAdminMessage(
      decision === 'Approved'
        ? lang === 'en'
          ? 'Approved: Public verified profile is now live in "Dashboard". Confidential NID, scans, phone, and audit notes remain strictly inside Admin Review.'
          : 'অনুমোদিত: পাবলিক ভেরিফাইড প্রোফাইল এখন "ড্যাশবোর্ড"-এ যুক্ত হয়েছে। গোপনীয় এনআইডি, ছবি, ফোন নম্বর ও নোট শুধুমাত্র এই অ্যাডমিন রিভিউতেই সংরক্ষিত আছে।'
        : decision === 'Pending'
        ? lang === 'en'
          ? `Restriction lifted for tutor profile ${requestId}. Status restored to Pending Review.`
          : `টিউটর প্রোফাইল ${requestId}-এর নিষেধাজ্ঞা প্রত্যাহার করা হয়েছে।`
        : lang === 'en'
        ? 'Rejected: Request marked as rejected inside Admin Review.'
        : 'বাতিলকৃত: আবেদনটি অ্যাডমিন রিভিউতে বাতিল হিসেবে চিহ্নিত হয়েছে।'
    );

    try {
      await supabase
        .from('tutor_verifications')
        .update({
          status: decision,
          admin_audit_note: adminNote.trim() || null,
        })
        .eq('verification_code', requestId);
      await fetchLiveCirculars();
    } catch {
      // Optimistic local state already updated
    }
  };

  // 1a. "🧹 Delete from Admin Panel" for Tutor Verification Profile
  const handleHideRequestFromAdmin = async (requestId: string) => {
    if (!hasAdminAccess) return;
    const targetReq = verificationRequests.find(
      (r) => r.id.toLowerCase() === (requestId || '').trim().toLowerCase()
    );
    if (
      isProtectedAdminProfile(requestId) ||
      isProtectedAdminProfile(targetReq)
    ) {
      setLastAdminMessage(PROTECTED_ADMIN_DELETE_ERROR);
      throw new Error(PROTECTED_ADMIN_DELETE_ERROR);
    }

    setHiddenAdminReqIds((prev) =>
      prev.includes(requestId) ? prev : [...prev, requestId]
    );
    setVerificationRequests((prev) =>
      hideVerificationFromAdminOnly(prev, requestId)
    );
    setLastAdminMessage(
      lang === 'en'
        ? `Removed verification profile ${requestId} from Admin Panel only. The tutor's Profile tab and public Dashboard card remain completely intact.`
        : `ভেরিফিকেশন প্রোফাইল ${requestId} শুধুমাত্র অ্যাডমিন প্যানেল থেকে সরানো হয়েছে। শিক্ষকের প্রোফাইল ও পাবলিক ড্যাশবোর্ডে এটি অক্ষত আছে।`
    );

    try {
      await supabase
        .from('tutor_verifications')
        .update({ hidden_from_admin: true })
        .eq('verification_code', requestId);
    } catch {
      // Local hidden state already applied
    }
  };

  // Admin Edit Profile Handler: saves edited user profile fields across Supabase tables & local state
  const handleAdminEditProfile = async (
    updatedReq: VerificationRequest
  ): Promise<VerificationRequest> => {
    if (!hasAdminAccess) return updatedReq;

    const editedState = applyAdminProfileEditState(
      tutors,
      verificationRequests,
      circularApplications,
      jobs,
      updatedReq
    );
    setTutors(editedState.tutors);
    setVerificationRequests(editedState.requests);
    setCircularApplications(editedState.applications);
    setJobs(editedState.jobs);

    setMyTutorProfile((prev) => {
      if (!prev) return null;
      if (
        prev.id.toLowerCase() === updatedReq.id.toLowerCase() ||
        (updatedReq.userEmail &&
          prev.userEmail &&
          prev.userEmail.toLowerCase() === updatedReq.userEmail.toLowerCase())
      ) {
        return updatedReq;
      }
      return prev;
    });

    setLastAdminMessage(
      lang === 'en'
        ? `Updated profile for ${updatedReq.tutorNameEn} (${updatedReq.id}) and synced changes with Supabase.`
        : `${updatedReq.tutorNameEn} (${updatedReq.id})-এর প্রোফাইল আপডেট এবং সুপাবেসে সংরক্ষিত হয়েছে।`
    );

    const syncRes = await executeAdminUpdateProfileInSupabase(
      supabase,
      updatedReq
    );
    if (!syncRes.ok && syncRes.errorMessage) {
      throw new Error(syncRes.errorMessage);
    }

    try {
      await Promise.all([
        fetchLiveCirculars(),
        fetchMyTutorProfile(currentUser),
      ]);
    } catch {
      // Optimistic state already updated
    }

    return syncRes.savedRequest;
  };

  // 2a. "🗑️ Delete from Everywhere" for Tutor Verification Profile
  const handleDeleteVerificationRequest = async (requestId: string) => {
    if (!hasAdminAccess) return;
    const rawClean = (requestId || '').trim().toLowerCase();
    const targetClean = rawClean.startsWith('tutor-ver-')
      ? rawClean.slice('tutor-ver-'.length)
      : rawClean;

    const targetReq = verificationRequests.find(
      (r) =>
        r.id.toLowerCase() === targetClean ||
        r.id.toLowerCase() === rawClean ||
        (r.tutorId && r.tutorId.toLowerCase() === rawClean)
    );

    // Protect drabirm4@gmail.com from accidental deletion in Admin Review Desk
    if (
      isProtectedAdminProfile(requestId) ||
      isProtectedAdminProfile(targetClean) ||
      isProtectedAdminProfile(targetReq)
    ) {
      setLastAdminMessage(PROTECTED_ADMIN_DELETE_ERROR);
      throw new Error(PROTECTED_ADMIN_DELETE_ERROR);
    }

    addDeletedProfileIdsToStorage([
      requestId,
      targetClean,
      targetReq?.id,
      targetReq?.userEmail,
      targetReq?.email,
      targetReq?.userId,
    ]);

    const updated = deleteVerificationFromEverywhereState(
      tutors,
      verificationRequests,
      requestId,
      circularApplications,
      jobs
    );
    setTutors(updated.tutors);
    setVerificationRequests(updated.requests);
    setCircularApplications(updated.applications);
    setJobs(updated.jobs);

    // Clear myTutorProfile if the deleted profile belongs to the current session or matches requestId
    setMyTutorProfile((prev) => {
      if (!prev) return null;
      if (
        prev.id.toLowerCase() === targetClean ||
        prev.id.toLowerCase() === rawClean
      ) {
        return null;
      }
      if (
        targetReq?.userEmail &&
        prev.userEmail &&
        prev.userEmail.toLowerCase() === targetReq.userEmail.toLowerCase()
      ) {
        return null;
      }
      return prev;
    });

    // Clear any cached localStorage profile for this tutor so their Profile tab immediately resets
    try {
      window.localStorage.removeItem(TUTOR_PROFILE_STORAGE_KEY);
      if (targetReq?.userEmail || targetReq?.userId) {
        const keyForTarget = getTutorProfileStorageKeyForUser({
          email: targetReq.userEmail,
          id: targetReq.userId,
        });
        if (keyForTarget) {
          window.localStorage.removeItem(keyForTarget);
        }
      }
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith('tutor_profile_')) {
          const raw = window.localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as {
                id?: string;
                verificationCode?: string;
                userEmail?: string;
                cachedProfile?: { id?: string; userEmail?: string };
              };
              const parsedCode = (
                parsed.id ||
                parsed.verificationCode ||
                parsed.cachedProfile?.id ||
                ''
              ).toLowerCase();
              const parsedEmail = (
                parsed.userEmail ||
                parsed.cachedProfile?.userEmail ||
                ''
              ).toLowerCase();
              if (
                (parsedCode &&
                  (parsedCode === targetClean || parsedCode === rawClean)) ||
                (targetReq?.userEmail &&
                  parsedEmail &&
                  parsedEmail === targetReq.userEmail.toLowerCase())
              ) {
                keysToRemove.push(k);
              }
            } catch {
              // Ignore malformed JSON
            }
          }
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // Ignore storage access errors
    }

    setLastAdminMessage(
      lang === 'en'
        ? `Profile deleted successfully — Permanently removed tutor profile ${requestId}, related applications, and uploaded files from Supabase, Admin Panel, Dashboard, and Profile.`
        : `প্রোফাইল সফলভাবে মুছে ফেলা হয়েছে — টিউটর প্রোফাইল ${requestId} এবং সংশ্লিষ্ট ফাইল সুপাবেস ডাটাবেস, অ্যাডমিন প্যানেল, পাবলিক ড্যাশবোর্ড ও প্রোফাইল থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।`
    );

    try {
      const deleteResult = await executeAdminDeleteProfileEverywhere(supabase, {
        requestId,
        targetProfile: targetReq,
        affectedCircularIds: updated.affectedCircularIds,
      });

      await Promise.all([
        fetchLiveCirculars(),
        fetchMyTutorProfile(currentUser),
      ]);

      if (!deleteResult.ok && deleteResult.errorMessage) {
        throw new Error(deleteResult.errorMessage);
      }
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : 'Supabase delete failed';
      setLastAdminMessage(
        lang === 'en'
          ? `Profile deleted from dashboard (Supabase sync warning: ${errMsg})`
          : `প্রোফাইল ড্যাশবোর্ড থেকে সরানো হয়েছে (${errMsg})`
      );
      throw err;
    }
  };

  // 1b. "🧹 Delete from Admin Panel" for Tuition Circular Application
  const handleHideApplicationFromAdmin = async (
    applicant: CircularApplicationRow
  ) => {
    if (!hasAdminAccess) return;
    const adminKey = getApplicationAdminKey(applicant);
    setHiddenAdminAppIds((prev) => {
      const next = new Set(prev);
      next.add(adminKey);
      if (applicant.id) next.add(String(applicant.id));
      return Array.from(next);
    });
    setCircularApplications((prev) =>
      hideApplicationFromAdminOnly(prev, applicant)
    );
    setLastAdminMessage(
      lang === 'en'
        ? `Removed application by ${applicant.tutor_name} (${applicant.circular_id}) from Admin Panel only. The tutor still sees their application status in Tuition Circulars and Profile.`
        : `${applicant.tutor_name} (${applicant.circular_id})-এর আবেদনটি শুধুমাত্র অ্যাডমিন প্যানেল থেকে সরানো হয়েছে। টিউশনি সার্কুলার ও প্রোফাইলে ইউজারের স্ট্যাটাস অক্ষত আছে।`
    );

    try {
      let query = supabase
        .from('circular_applications')
        .update({ hidden_from_admin: true });
      if (applicant.id && !applicant.id.startsWith('local-')) {
        query = query.eq('id', applicant.id);
      } else {
        query = query
          .eq('circular_id', applicant.circular_id)
          .eq('tutor_id', applicant.tutor_id);
      }
      await query;
    } catch {
      // Local hidden state already applied
    }
  };

  // 2b. "🗑️ Delete from Everywhere" for Tuition Circular Application
  const handleDeleteApplicationEverywhere = async (
    applicant: CircularApplicationRow
  ) => {
    if (!hasAdminAccess) return;

    const wasConfirmed =
      (applicant.status || '').trim().toLowerCase() === 'confirmed';

    const updated = deleteApplicationFromEverywhereState(
      jobs,
      circularApplications,
      applicant
    );
    setCircularApplications(updated.applications);
    setJobs(updated.jobs);

    setLastAdminMessage(
      lang === 'en'
        ? `Permanently deleted application by ${applicant.tutor_name} for ${applicant.circular_id} from everywhere (Supabase database, Admin Panel, Tuition Circulars, and the user's applied view).`
        : `${applicant.circular_id}-এ ${applicant.tutor_name}-এর আবেদন সর্বত্র (ডাটাবেস, অ্যাডমিন প্যানেল ও ইউজারের ভিউ) থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।`
    );

    try {
      let deleteQuery = supabase.from('circular_applications').delete();
      if (applicant.id && !applicant.id.startsWith('local-')) {
        deleteQuery = deleteQuery.eq('id', applicant.id);
      } else {
        deleteQuery = deleteQuery
          .eq('circular_id', applicant.circular_id)
          .eq('tutor_id', applicant.tutor_id);
      }
      await deleteQuery;

      if (wasConfirmed) {
        const remainingConfirmed = updated.applications.some(
          (a) =>
            a.circular_id === applicant.circular_id &&
            (a.status || '').trim().toLowerCase() === 'confirmed' &&
            !isSameCircularApplication(a, applicant)
        );
        if (!remainingConfirmed) {
          await updateTuitionCircularInSupabase(
            supabase,
            applicant.circular_id,
            { status: 'Active' }
          );
        }
      }

      await fetchLiveCirculars();
    } catch {
      // Local deletion state already applied
    }
  };

  // 1c. "🧹 Delete from Admin Panel" for Live Tuition Circular
  const handleHideCircularFromAdmin = async (circularId: string) => {
    if (!hasAdminAccess) return;
    setHiddenAdminJobIds((prev) =>
      prev.includes(circularId) ? prev : [...prev, circularId]
    );
    setJobs((prev) => hideCircularFromAdminOnly(prev, circularId));
    setLastAdminMessage(
      lang === 'en'
        ? `Removed circular ${circularId} from Admin Panel only. The circular and its applicant statuses remain live in Tuition Circulars.`
        : `সার্কুলার ${circularId} শুধুমাত্র অ্যাডমিন প্যানেল থেকে সরানো হয়েছে। টিউশনি সার্কুলার পেজে এটি সম্পূর্ণ সচল আছে।`
    );

    try {
      await hideTuitionCircularInSupabase(supabase, circularId);
    } catch {
      // Local hidden state already applied
    }
  };

  // 2c. "🗑️ Delete from Everywhere" for Live Tuition Circular
  const handleDeleteCircularEverywhere = async (circularId: string) => {
    if (!hasAdminAccess) return;
    const updated = deleteCircularFromEverywhereState(
      jobs,
      circularApplications,
      circularId
    );
    setJobs(updated.jobs);
    setCircularApplications(updated.applications);
    if (activeAdminApplicantsJobId === circularId) {
      setActiveAdminApplicantsJobId(null);
    }

    setLastAdminMessage(
      lang === 'en'
        ? `Permanently deleted circular ${circularId} and its applications from everywhere (Supabase database, Admin Panel, and Tuition Circulars).`
        : `সার্কুলার ${circularId} এবং এর সকল আবেদন সর্বত্র থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।`
    );

    try {
      await deleteTuitionCircularFromSupabase(supabase, circularId);
      await fetchLiveCirculars();
    } catch {
      // Ignore delete network error
    }
  };

  const handleDeleteTutor = (tutorId: string) => {
    setTutors((prev) => prev.filter((t) => t.id !== tutorId));
    setShortlistedIds((prev) => prev.filter((id) => id !== tutorId));
    if (hasAdminAccess) {
      const code = tutorId.startsWith('tutor-ver-')
        ? tutorId.slice('tutor-ver-'.length)
        : tutorId;
      void handleDeleteVerificationRequest(code).catch(() => {
        // Already removed from local state
      });
    }
  };

  const handleDeleteJob = (jobId: string) => {
    void handleDeleteCircularEverywhere(jobId);
  };

  // Strictly isolated desk-specific clear actions (clearing one desk never affects other desks)
  const handleClearTutorDeskOnly = () => {
    setTutors([]);
    setShortlistedIds([]);
    setBookedTrials([]);
    setActiveProfileTutor(null);
    setActiveTrialTutor(null);
  };

  const handleClearAdminDeskOnly = () => {
    if (!hasAdminAccess) return;
    setVerificationRequests([]);
    setLastAdminMessage(
      lang === 'en'
        ? 'Admin Review cleared (other sections were not affected).'
        : 'শুধুমাত্র অ্যাডমিন রিভিউর ডাটা মুছে ফেলা হয়েছে (অন্যান্য অংশের ডাটা অক্ষত আছে)।'
    );
  };

  const handleClearJobDeskOnly = () => {
    setJobs([]);
    setCircularApplications([]);
    setActiveApplyJob(null);
    setActiveAdminApplicantsJobId(null);
  };

  const handleConfirmTrialBooking = (record: TrialBookingRecord) => {
    setBookedTrials((prev) => [record, ...prev]);
  };

  const handleConfirmJobApply = async (
    jobId: string,
    input: CircularApplicationInput
  ) => {
    if (isTutorAccountRestricted(myTutorProfile)) {
      throw new Error(
        lang === 'en'
          ? 'Your account is currently restricted from applying to circulars. Please contact Admin for re-verification.'
          : 'আপনার অ্যাকাউন্টে বর্তমানে আবেদনের সীমাবদ্ধতা রয়েছে। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।'
      );
    }

    const targetCircularId = jobId.trim();
    const targetEmail = (
      input.userEmail ||
      currentUser?.email ||
      myTutorProfile?.userEmail ||
      myTutorProfile?.email ||
      ''
    )
      .trim()
      .toLowerCase();
    const targetUserId = (
      currentUser?.id ||
      input.userId ||
      ''
    ).trim();

    const existingApp = hasTutorAlreadyAppliedToCircular(
      circularApplications,
      targetCircularId,
      currentUser,
      myTutorProfile,
      {
        tutorId: input.tutorId,
        tutorPhone: input.tutorPhone,
        userEmail: targetEmail || null,
        userId: targetUserId || null,
      }
    );
    if (existingApp) {
      throw new Error(DUPLICATE_CIRCULAR_APPLICATION_MESSAGE);
    }

    // Pre-insert check against Supabase public.circular_applications for the same (circular_id, user_email / user_id)
    if (targetCircularId && (targetEmail || targetUserId)) {
      try {
        const { data: existingRows, error: checkError } = await supabase
          .from('circular_applications')
          .select('id, circular_id, user_email, user_id, tutor_id, tutor_phone, status')
          .eq('circular_id', targetCircularId);

        if (!checkError && Array.isArray(existingRows)) {
          const foundDuplicateInDb = existingRows.find(
            (row: Record<string, unknown>) => {
              const statusStr = String(row.status || '')
                .trim()
                .toLowerCase();
              if (statusStr === 'archived') return false;
              const rowEmail = String(row.user_email || '')
                .trim()
                .toLowerCase();
              const rowUserId = String(row.user_id || '')
                .trim()
                .toLowerCase();
              if (targetEmail && rowEmail && rowEmail === targetEmail) {
                return true;
              }
              if (
                targetUserId &&
                rowUserId &&
                rowUserId === targetUserId.toLowerCase()
              ) {
                return true;
              }
              return false;
            }
          );

          if (foundDuplicateInDb) {
            await fetchLiveCirculars();
            throw new Error(DUPLICATE_CIRCULAR_APPLICATION_MESSAGE);
          }
        }
      } catch (dbCheckErr) {
        if (
          dbCheckErr instanceof Error &&
          dbCheckErr.message === DUPLICATE_CIRCULAR_APPLICATION_MESSAGE
        ) {
          throw dbCheckErr;
        }
      }
    }

    const newRow = buildCircularApplicationRow(
      targetCircularId,
      input,
      currentUser,
      myTutorProfile
    );
    const optimisticRow: CircularApplicationRow = {
      ...newRow,
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: new Date().toISOString(),
    };

    const nextApps = [optimisticRow, ...circularApplications];
    setCircularApplications(nextApps);
    setJobs((prev) => enrichCircularJobsWithApplications(prev, nextApps));

    try {
      const { error } = await supabase
        .from('circular_applications')
        .insert([newRow]);
      if (!error) {
        await fetchLiveCirculars();
      }
    } catch {
      // Keep optimistic application in state if network fails
    }
  };

  const handleConfirmApplicant = async (
    circularId: string,
    applicant: CircularApplicationRow,
    options?: {
      status?: 'confirmed' | 'verified_for_tuition' | string;
      mediaFee?: number;
      guardianPhone?: string;
      guardianAddress?: string;
      adminNote?: string;
    }
  ) => {
    if (!hasAdminAccess) return;

    const targetStatus = options?.status || 'verified_for_tuition';
    const isDirectConfirmed =
      targetStatus.trim().toLowerCase() === 'confirmed' ||
      targetStatus.trim().toLowerCase() === 'approved';
    const mediaFee = isDirectConfirmed ? 0 : options?.mediaFee ?? 1000;
    const guardianPhone = options?.guardianPhone?.trim();
    const guardianAddress = options?.guardianAddress?.trim();
    const adminNote = options?.adminNote;

    const updated = confirmTutorForCircularState(
      jobs,
      circularApplications,
      circularId,
      applicant,
      {
        status: targetStatus,
        mediaFee,
        guardianPhone,
        guardianAddress,
        adminNote,
      }
    );
    setCircularApplications(updated.applications);
    setJobs(updated.jobs);

    try {
      const expNote = formatApplicationNoteWithMetadata(
        applicant.experience_note,
        {
          isDirectConfirmed,
          mediaFee,
          adminNote,
        }
      );

      let appUpdateQuery = supabase
        .from('circular_applications')
        .update({
          status: targetStatus,
          experience_note: expNote,
        });

      if (applicant.id && !applicant.id.startsWith('local-')) {
        appUpdateQuery = appUpdateQuery.eq('id', applicant.id);
      } else {
        appUpdateQuery = appUpdateQuery
          .eq('circular_id', circularId)
          .eq('tutor_id', applicant.tutor_id);
      }

      await Promise.all([
        appUpdateQuery,
        updateTuitionCircularInSupabase(supabase, circularId, {
          status: 'Confirmed',
          guardian_phone: guardianPhone,
          location_details: guardianAddress,
        }),
      ]);

      await fetchLiveCirculars();
      setLastAdminMessage(
        isDirectConfirmed
          ? lang === 'en'
            ? `Confirmed ${applicant.tutor_name} (ID: ${applicant.tutor_id}) for Circular ${circularId}. Status updated to 'confirmed'.`
            : `সার্কুলার ${circularId}-এর জন্য ${applicant.tutor_name} (${applicant.tutor_id}) সরাসরি নিশ্চিত করা হয়েছে।`
          : lang === 'en'
          ? `Verified ${applicant.tutor_name} (ID: ${applicant.tutor_id}) for Circular ${circularId}. Status updated to 'verified_for_tuition' (Media Fee: ৳${mediaFee}).`
          : `সার্কুলার ${circularId}-এর জন্য ${applicant.tutor_name} (${applicant.tutor_id}) ভেরিফাই করা হয়েছে (মিডিয়া ফি: ৳${mediaFee})।`
      );
    } catch {
      // Keep local confirmed state if network fails
    }
  };

  const handleRejectApplicant = async (
    circularId: string,
    applicant: CircularApplicationRow,
    rejectionNote?: string,
    restrictAccount: boolean = true
  ) => {
    if (!hasAdminAccess) return;

    const cleanNote = (rejectionNote || '').trim();
    const updated = rejectTutorForCircularState(
      jobs,
      circularApplications,
      circularId,
      applicant,
      cleanNote
    );
    setCircularApplications(updated.applications);
    setJobs(updated.jobs);

    const linkedProfile = findApplicantFullTutorProfile(
      applicant,
      verificationRequests
    );
    if (restrictAccount && linkedProfile) {
      await handleAdminDecision(
        linkedProfile.id,
        'Rejected',
        cleanNote || 'Application rejected & account restricted by Admin.'
      );
    } else if (
      restrictAccount &&
      myTutorProfile &&
      (myTutorProfile.id.toLowerCase() === applicant.tutor_id.toLowerCase() ||
        myTutorProfile.phone === applicant.tutor_phone)
    ) {
      setMyTutorProfile((prev) =>
        prev
          ? {
              ...prev,
              status: 'Rejected',
              is_rejected: true,
              rejection_note:
                cleanNote ||
                'Application rejected & account restricted by Admin.',
              adminNote:
                cleanNote ||
                'Application rejected & account restricted by Admin.',
            }
          : null
      );
    }

    try {
      const expNote = formatApplicationNoteWithMetadata(
        applicant.experience_note,
        {
          adminNote: cleanNote || undefined,
        }
      );

      let appUpdateQuery = supabase
        .from('circular_applications')
        .update({
          status: 'Rejected',
          experience_note: expNote,
        });

      if (applicant.id && !applicant.id.startsWith('local-')) {
        appUpdateQuery = appUpdateQuery.eq('id', applicant.id);
      } else {
        appUpdateQuery = appUpdateQuery
          .eq('circular_id', circularId)
          .eq('tutor_id', applicant.tutor_id);
      }

      await appUpdateQuery;
      await fetchLiveCirculars();
      setLastAdminMessage(
        lang === 'en'
          ? `Rejected application from ${applicant.tutor_name} (ID: ${applicant.tutor_id}) for Circular ${circularId}${cleanNote ? ` — Note: "${cleanNote}"` : ''}.`
          : `সার্কুলার ${circularId}-এর জন্য ${applicant.tutor_name} (${applicant.tutor_id})-এর আবেদন বাতিল করা হয়েছে।`
      );
    } catch {
      // Keep local rejected state if network fails
    }
  };

  const handleUnblockApplicant = async (
    circularId: string,
    applicant: CircularApplicationRow
  ) => {
    if (!hasAdminAccess) return;

    const updated = unblockTutorForCircularState(
      jobs,
      circularApplications,
      circularId,
      applicant
    );
    setCircularApplications(updated.applications);
    setJobs(updated.jobs);

    const linkedProfile = findApplicantFullTutorProfile(
      applicant,
      verificationRequests
    );
    if (linkedProfile && isTutorAccountRestricted(linkedProfile)) {
      await handleAdminDecision(linkedProfile.id, 'Pending', '');
    } else if (
      myTutorProfile &&
      isTutorAccountRestricted(myTutorProfile) &&
      (myTutorProfile.id.toLowerCase() === applicant.tutor_id.toLowerCase() ||
        myTutorProfile.phone === applicant.tutor_phone)
    ) {
      setMyTutorProfile((prev) =>
        prev
          ? {
              ...prev,
              status: 'Pending',
              is_rejected: false,
              rejection_note: undefined,
              adminNote: undefined,
            }
          : null
      );
    }

    try {
      const cleanExp = getCleanApplicantExperienceNote(applicant);
      let appUpdateQuery = supabase
        .from('circular_applications')
        .update({
          status: 'Pending',
          experience_note: cleanExp,
        });

      if (applicant.id && !applicant.id.startsWith('local-')) {
        appUpdateQuery = appUpdateQuery.eq('id', applicant.id);
      } else {
        appUpdateQuery = appUpdateQuery
          .eq('circular_id', circularId)
          .eq('tutor_id', applicant.tutor_id);
      }

      await appUpdateQuery;
      await fetchLiveCirculars();
      setLastAdminMessage(
        lang === 'en'
          ? `Lifted restriction and restored application for ${applicant.tutor_name} (${applicant.tutor_id}) on Circular ${circularId}.`
          : `সার্কুলার ${circularId}-এ ${applicant.tutor_name} (${applicant.tutor_id})-এর নিষেধাজ্ঞা প্রত্যাহার করা হয়েছে।`
      );
    } catch {
      // Keep local unblocked state
    }
  };

  const handleAddJob = async (newJob: TuitionJob) => {
    if (!hasAdminAccess) {
      return;
    }
    const normalizedNewJob: TuitionJob = {
      ...newJob,
      status: 'Active',
      hiddenFromAdmin: false,
    };
    const result = publishAdminTuitionCircular(
      'admin_review',
      jobs,
      normalizedNewJob,
      hasAdminAccess,
      currentUser
    );
    if (!result.allowed) {
      return;
    }
    setJobs(result.jobs);

    try {
      const { ok, error } = await insertTuitionCircularToSupabase(
        supabase,
        normalizedNewJob
      );

      if (ok && !error) {
        await fetchLiveCirculars();
        setLastAdminMessage(
          lang === 'en'
            ? `Official Tuition Circular (${newJob.id}) saved to Supabase "tuition_circulars" and published to Tuition Circulars.`
            : `অ্যাডমিন কর্তৃক নতুন টিউশনি সার্কুলার (${newJob.id}) সুপাবেস ডাটাবেস ও টিউশনি সার্কুলারে প্রকাশিত হয়েছে।`
        );
      } else {
        setLastAdminMessage(
          lang === 'en'
            ? `Official Tuition Circular (${newJob.id}) published to Tuition Circulars. (Supabase sync note: ${error?.message || 'Unable to sync'})`
            : `অ্যাডমিন কর্তৃক নতুন টিউশনি সার্কুলার (${newJob.id}) টিউশনি সার্কুলারে প্রকাশিত হয়েছে।`
        );
      }
    } catch {
      setLastAdminMessage(
        lang === 'en'
          ? `Official Tuition Circular (${newJob.id}) published by Admin to Tuition Circulars.`
          : `অ্যাডমিন কর্তৃক নতুন টিউশনি সার্কুলার (${newJob.id}) টিউশনি সার্কুলারে প্রকাশিত হয়েছে।`
      );
    }
  };

  const mobileDesks = [
    {
      id: 'tutors' as const,
      en: 'Dashboard',
      bn: 'ড্যাশবোর্ড',
      Icon: LayoutDashboard,
    },
    {
      id: 'tutor_upload' as const,
      en: 'Profile',
      bn: 'প্রোফাইল',
      Icon: UserCircle2,
    },
    {
      id: 'job_board' as const,
      en: 'Tuition Circulars',
      bn: 'টিউশনি সার্কুলার',
      Icon: Briefcase,
    },
    {
      id: 'tutor_board' as const,
      en: 'Tutor Board',
      bn: 'টিউটর বোর্ড',
      Icon: Users,
    },
    ...(hasAdminAccess
      ? [
          {
            id: 'admin_review' as const,
            en: 'Admin Review',
            bn: 'অ্যাডমিন রিভিউ',
            Icon: ShieldCheck,
          },
        ]
      : []),
  ];

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-hidden transition-colors ${
        darkMode
          ? 'dark bg-stone-950 text-stone-100'
          : 'bg-[#FAF8F5] text-stone-900'
      } ${lang === 'bn' ? 'font-bangla' : ''}`}
    >
      {/* PREMIUM FROSTED-GLASS TOP NAVBAR WITH PILL NAVIGATION */}
      <header className="sticky top-0 z-40 w-full max-w-full overflow-x-hidden backdrop-blur-md bg-white/95 dark:bg-stone-950/95 shadow-xs border-b border-emerald-500/15 dark:border-stone-800">
        <div className="w-full max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          {/* Zone 1: Modern Tutor Zone 3D Isometric Circuit Cap Logo & Wordmark */}
          <button
            type="button"
            onClick={() => handleProtectedNavigate('tutors')}
            aria-label="Tutor Zone"
            className="order-1 group flex items-center text-left whitespace-nowrap shrink-0 focus:outline-none cursor-pointer active:scale-[0.98] transition-transform max-w-full"
          >
            <BrandLogo size="md" className="gap-1.5 sm:gap-2.5" />
          </button>

          {/* Zone 2: Centered Rounded Pill Navigation Container */}
          <nav
            aria-label="Isolated Desk Navigation"
            className={`hidden md:flex flex-wrap items-center justify-center gap-1 xl:gap-1.5 bg-slate-100/90 dark:bg-stone-900/90 p-1 sm:p-1.5 rounded-2xl lg:rounded-full border border-emerald-500/20 dark:border-stone-800 shadow-2xs max-w-full ${
              hasAdminAccess
                ? 'order-3 xl:order-2 w-full xl:w-auto'
                : 'order-3 lg:order-2 w-full lg:w-auto'
            }`}
          >
            <button
              type="button"
              onClick={() => handleProtectedNavigate('tutors')}
              className={`min-h-[38px] xl:min-h-[40px] text-xs xl:text-sm font-bold px-3 xl:px-4 py-1.5 xl:py-2 rounded-full transition-all duration-200 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer ${
                activeDesk === 'tutors'
                  ? 'bg-gradient-to-r from-[#059669] to-[#047857] text-white shadow-sm'
                  : 'text-slate-800 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-800 hover:text-[#059669] dark:hover:text-emerald-400 hover:shadow-xs'
              }`}
            >
              {lang === 'en' ? 'Dashboard' : 'ড্যাশবোর্ড'}
            </button>

            <button
              type="button"
              onClick={() => handleProtectedNavigate('tutor_upload')}
              className={`min-h-[38px] xl:min-h-[40px] text-xs xl:text-sm font-bold px-3 xl:px-4 py-1.5 xl:py-2 rounded-full transition-all duration-200 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer ${
                activeDesk === 'tutor_upload'
                  ? 'bg-gradient-to-r from-[#059669] to-[#047857] text-white shadow-sm'
                  : 'text-slate-800 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-800 hover:text-[#059669] dark:hover:text-emerald-400 hover:shadow-xs'
              }`}
            >
              {lang === 'en' ? 'Profile' : 'প্রোফাইল'}
            </button>

            <button
              type="button"
              onClick={() => handleProtectedNavigate('job_board')}
              className={`min-h-[38px] xl:min-h-[40px] text-xs xl:text-sm font-bold px-3 xl:px-4 py-1.5 xl:py-2 rounded-full transition-all duration-200 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer ${
                activeDesk === 'job_board'
                  ? 'bg-gradient-to-r from-[#059669] to-[#047857] text-white shadow-sm'
                  : 'text-slate-800 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-800 hover:text-[#059669] dark:hover:text-emerald-400 hover:shadow-xs'
              }`}
            >
              {lang === 'en' ? 'Tuition Circulars' : 'টিউশনি সার্কুলার'}
            </button>

            <button
              type="button"
              onClick={() => handleProtectedNavigate('tutor_board')}
              className={`min-h-[38px] xl:min-h-[40px] text-xs xl:text-sm font-bold px-3 xl:px-4 py-1.5 xl:py-2 rounded-full transition-all duration-200 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer ${
                activeDesk === 'tutor_board'
                  ? 'bg-gradient-to-r from-[#059669] to-[#047857] text-white shadow-sm'
                  : 'text-slate-800 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-800 hover:text-[#059669] dark:hover:text-emerald-400 hover:shadow-xs'
              }`}
            >
              {lang === 'en' ? 'Tutor Board' : 'টিউটর বোর্ড'}
            </button>

            {hasAdminAccess && (
              <button
                type="button"
                onClick={() => handleProtectedNavigate('admin_review')}
                className={`min-h-[38px] xl:min-h-[40px] text-xs xl:text-sm font-bold px-3 xl:px-4 py-1.5 xl:py-2 rounded-full transition-all duration-200 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer ${
                  activeDesk === 'admin_review'
                    ? 'bg-gradient-to-r from-[#059669] to-[#047857] text-white shadow-sm'
                    : 'text-slate-800 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-800 hover:text-[#059669] dark:hover:text-emerald-400 hover:shadow-xs'
                }`}
              >
                {lang === 'en' ? 'Admin Review' : 'অ্যাডমিন রিভিউ'}
              </button>
            )}
          </nav>

          {/* Zone 3: Admin Lock/Unlock (Strictly visible ONLY for logged-in drabirm4@gmail.com / drabirm4) & Primary Account Action */}
          <div
            className={`order-2 ${
              hasAdminAccess ? 'xl:order-3' : 'lg:order-3'
            } flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 min-w-0 max-w-full`}
          >
            {hasAdminAccess && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDesk('admin_review');
                    setIsPostJobOpen(true);
                  }}
                  className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 xl:px-3.5 xl:py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-full shadow-xs transition-all whitespace-nowrap shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {lang === 'en'
                      ? 'Admin: Post Tuition Circular'
                      : 'অ্যাডমিন: সার্কুলার পোস্ট করুন'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleLockAdmin}
                  aria-label={lang === 'en' ? 'Lock Admin' : 'অ্যাডমিন লক'}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-slate-700 dark:text-stone-200 bg-slate-100 dark:bg-stone-800 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/60 dark:hover:text-red-300 rounded-full border border-slate-200/90 dark:border-stone-700 transition-all whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden min-[390px]:inline">
                    {lang === 'en' ? 'Lock Admin' : 'অ্যাডমিন লক'}
                  </span>
                </button>
              </>
            )}

            {isAdminAccount && !isAdminUnlocked && (
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                aria-label={lang === 'en' ? 'Admin Login' : 'অ্যাডমিন লগইন'}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-300 bg-slate-100/80 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-800 rounded-full border border-slate-200/90 dark:border-stone-700 shadow-2xs transition-all whitespace-nowrap shrink-0"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="hidden min-[400px]:inline">
                  {lang === 'en' ? 'Admin Login' : 'অ্যাডমিন লগইন'}
                </span>
                <span className="min-[400px]:hidden">
                  {lang === 'en' ? 'Admin' : 'অ্যাডমিন'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveDesk('account')}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-extrabold tracking-tight rounded-full transition-all duration-200 whitespace-nowrap shrink-0 max-w-[140px] sm:max-w-[190px] ${
                activeDesk === 'account'
                  ? 'bg-gradient-to-b from-[#633CFF] to-[#4E24E6] text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/30'
                  : 'bg-[#5B32EE] hover:bg-[#4B23DC] text-white shadow-sm hover:shadow-md'
              }`}
            >
              {currentUser && <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
              <span className="truncate">
                {currentUser
                  ? currentUser.fullName
                  : lang === 'en'
                  ? 'Create Account'
                  : 'অ্যাকাউন্ট খুলুন'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="w-full max-w-full overflow-x-hidden pb-20 sm:pb-12">
        {/* Clean 2x2 Mobile Navigation Grid (No Blank Gap, Zero Sticky Overlap) */}
        <div className="md:hidden w-full max-w-full bg-white/95 dark:bg-stone-950/95 border-b border-emerald-500/15 dark:border-stone-800">
          <div className="w-full max-w-[1280px] mx-auto px-3 sm:px-6 py-2">
            <nav
              aria-label="Mobile Navigation Bar"
              className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl w-full bg-slate-100/95 dark:bg-stone-900/95 border border-emerald-500/20 dark:border-stone-800 shadow-2xs"
            >
              {mobileDesks.map((d, idx) => {
                const IconComponent = d.Icon;
                const isActive = activeDesk === d.id;
                const spanFullOnOddTail =
                  mobileDesks.length % 2 === 1 && idx === mobileDesks.length - 1;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleProtectedNavigate(d.id)}
                    className={`min-h-[40px] w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-bold rounded-xl tracking-tight transition-all duration-200 active:scale-[0.98] cursor-pointer whitespace-nowrap ${
                      spanFullOnOddTail ? 'col-span-2' : ''
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-[#059669] to-[#047857] text-white shadow-sm'
                        : 'text-slate-800 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-800 hover:text-[#059669]'
                    }`}
                  >
                    <IconComponent
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive
                          ? 'text-emerald-100'
                          : 'text-[#059669] dark:text-emerald-400'
                      }`}
                    />
                    <span className="truncate">
                      {lang === 'en' ? d.en : d.bn}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Compact Single-Row Utility Bar Directly Below Main Nav Bar (All Views) */}
        <div
          aria-label="Display and Quick Utility Controls"
          className="w-full max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-8 pt-1.5"
        >
          <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1.5 px-0.5 text-[11px] sm:text-xs">
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="min-h-[36px] sm:min-h-[38px] inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-[#047857] shadow-2xs active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span aria-hidden="true">🌐</span>
              <span>বাংলা / English</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeDesk !== 'tutors') {
                  handleUpdateFilters({ shortlistedOnly: true });
                  handleProtectedNavigate('tutors');
                } else {
                  handleUpdateFilters({
                    shortlistedOnly: !filters.shortlistedOnly,
                  });
                }
              }}
              aria-pressed={filters.shortlistedOnly}
              className={`min-h-[36px] sm:min-h-[38px] inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold border shadow-2xs active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                filters.shortlistedOnly
                  ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-400 text-amber-900 dark:text-amber-300'
                  : 'bg-white dark:bg-stone-900 border-emerald-500/20 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-[#047857]'
              }`}
            >
              <span aria-hidden="true">
                {filters.shortlistedOnly ? '❤️' : '🤍'}
              </span>
              <span>
                {lang === 'en'
                  ? `Shortlisted (${shortlistedIds.length})`
                  : `পছন্দের তালিকা (${toBanglaNumber(shortlistedIds.length)})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-pressed={darkMode}
              className="min-h-[36px] sm:min-h-[38px] inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-[#047857] shadow-2xs active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span aria-hidden="true">{darkMode ? '☀️' : '🌙'}</span>
              <span>
                {darkMode
                  ? lang === 'en'
                    ? 'Light Mode'
                    : 'লাইট মোড'
                  : lang === 'en'
                  ? 'Dark Mode'
                  : 'ডার্ক মোড'}
              </span>
            </button>
          </div>
        </div>

        {authGuardNotice === ADMIN_REMOVED_PROFILE_NOTICE && (
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-3">
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 px-4 py-3 text-rose-800 dark:text-rose-200 shadow-sm"
            >
              <p className="text-xs sm:text-sm font-bold">
                {ADMIN_REMOVED_PROFILE_NOTICE}
              </p>
              <button
                type="button"
                onClick={() => setAuthGuardNotice(null)}
                className="text-xs font-semibold underline hover:text-rose-950 dark:hover:text-white shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* STRICT DESK ISOLATION: ONLY THE ACTIVE DESK IS RENDERED */}
        {activeDesk === 'account' && (
          <CreateAccountCard
            currentUser={currentUser}
            authMode={authMode}
            onAuthModeChange={setAuthMode}
            authGuardNotice={authGuardNotice}
            onAuthenticated={handleAuthenticated}
            onSignOut={handleSignOut}
            onContinueToApp={() => handleProtectedNavigate('tutors')}
          />
        )}

        {activeDesk === 'tutors' && (
          <div className="space-y-4">
            <BentoHero
              lang={lang}
              filters={filters}
              onUpdateFilters={handleUpdateFilters}
              onResetFilters={() => setFilters(DEFAULT_FILTERS)}
              onOpenTutorUploadDesk={() =>
                handleProtectedNavigate('tutor_upload')
              }
              onOpenGuardianModal={() => setIsGuardianModalOpen(true)}
              onOpenTuitionCircularsDesk={() =>
                handleProtectedNavigate('job_board')
              }
              verifiedTutorsCount={
                tutors.filter((t) => t.nidVerified && t.uniIdVerified).length ||
                tutors.length
              }
              onlineTutorsCount={
                tutors.filter(
                  (t) => Array.isArray(t.modes) && t.modes.includes('Online')
                ).length
              }
              activeCircularsCount={
                jobs.filter((j) => (j.status || 'Active') === 'Active').length ||
                jobs.length
              }
              totalApplicationsCount={circularApplications.length}
              siteSocialSettings={siteSocialSettings}
            />

            <div id="live-tutor-directory" className="scroll-mt-20">
              <TutorDiscoveryConsole
                lang={lang}
                filters={filters}
                onUpdateFilters={handleUpdateFilters}
                onResetFilters={handleResetFilters}
                filteredTutors={filteredTutors}
                totalTutorsCount={tutors.length}
                shortlistedIds={shortlistedIds}
                onToggleShortlist={handleToggleShortlist}
                bookedTutorIds={bookedTrials.map((b) => b.tutorId)}
                onOpenProfileModal={(tutor) => setActiveProfileTutor(tutor)}
                onOpenTrialModal={(tutor) => setActiveTrialTutor(tutor)}
                onDeleteTutor={handleDeleteTutor}
                onClearTutorDesk={handleClearTutorDeskOnly}
                onSwitchToUploadDesk={() =>
                  handleProtectedNavigate('tutor_upload')
                }
                isLoading={isLoadingCirculars}
              />
            </div>
          </div>
        )}

        {activeDesk === 'tutor_board' && (
          <TutorDiscoveryConsole
            lang={lang}
            filters={filters}
            onUpdateFilters={handleUpdateFilters}
            onResetFilters={handleResetFilters}
            filteredTutors={filteredTutors}
            totalTutorsCount={tutors.length}
            shortlistedIds={shortlistedIds}
            onToggleShortlist={handleToggleShortlist}
            bookedTutorIds={bookedTrials.map((b) => b.tutorId)}
            onOpenProfileModal={(tutor) => setActiveProfileTutor(tutor)}
            onOpenTrialModal={(tutor) => setActiveTrialTutor(tutor)}
            onDeleteTutor={handleDeleteTutor}
            onClearTutorDesk={handleClearTutorDeskOnly}
            onSwitchToUploadDesk={() =>
              handleProtectedNavigate('tutor_upload')
            }
            isLoading={isLoadingCirculars}
          />
        )}

        {activeDesk === 'tutor_upload' && (
          <VerificationCenter
            key={
              currentUser
                ? currentUser.email || currentUser.id
                : 'logged-out-visitor'
            }
            lang={lang}
            deskMode="tutor_upload"
            hasAdminAccess={hasAdminAccess}
            requests={myTutorProfile ? [myTutorProfile] : []}
            currentUser={currentUser}
            currentUserEmail={currentUser?.email}
            jobs={jobs}
            applications={circularApplications}
            onOpenInvoiceModal={(data) => {
              setActiveInvoiceData(data);
              setIsInvoiceModalOpen(true);
            }}
            onOpenSignIn={() => {
              setAuthMode('signin');
              setActiveDesk('account');
            }}
            onOpenCreateAccount={() => {
              setAuthMode('signup');
              setActiveDesk('account');
            }}
            onSubmitVerification={handleSubmitVerification}
            onAdminDecision={handleAdminDecision}
            onRefreshApplications={async () => {
              await Promise.all([
                fetchLiveCirculars(),
                fetchMyTutorProfile(currentUser),
                refreshPaymentRequests(),
              ]);
            }}
            onDeleteRequest={handleDeleteVerificationRequest}
            onClearAdminDesk={handleClearAdminDeskOnly}
            siteSocialSettings={siteSocialSettings}
            paymentRequests={paymentRequests}
            onSubmitPaymentRequest={handleSubmitPaymentRequest}
            lastDeskMessage={null}
          />
        )}

        {activeDesk === 'admin_review' && hasAdminAccess && (
          <VerificationCenter
            lang={lang}
            deskMode="admin_review"
            requests={verificationRequests}
            jobs={jobs}
            applications={circularApplications}
            hiddenAdminAppIds={hiddenAdminAppIds}
            hiddenAdminReqIds={hiddenAdminReqIds}
            hiddenAdminJobIds={hiddenAdminJobIds}
            onOpenInvoiceModal={(data) => {
              setActiveInvoiceData(data);
              setIsInvoiceModalOpen(true);
            }}
            onSubmitVerification={handleSubmitVerification}
            onAdminDecision={handleAdminDecision}
            onConfirmCircularApplicant={handleConfirmApplicant}
            onRejectCircularApplicant={handleRejectApplicant}
            onUnblockCircularApplicant={handleUnblockApplicant}
            onHideApplicationFromAdmin={handleHideApplicationFromAdmin}
            onDeleteApplicationEverywhere={handleDeleteApplicationEverywhere}
            onHideRequestFromAdmin={handleHideRequestFromAdmin}
            onDeleteRequestEverywhere={handleDeleteVerificationRequest}
            onHideCircularFromAdmin={handleHideCircularFromAdmin}
            onDeleteCircularEverywhere={handleDeleteCircularEverywhere}
            onAdminEditProfile={handleAdminEditProfile}
            onRefreshApplications={async () => {
              await Promise.all([
                fetchLiveCirculars(),
                lazyLoadAdminVerificationScans(true),
                refreshPaymentRequests(),
                refreshSiteSocialSettings(true),
                refreshSiteNotices(true),
                refreshGuardianRequests(),
              ]);
            }}
            onDeleteRequest={handleDeleteVerificationRequest}
            onClearAdminDesk={handleClearAdminDeskOnly}
            onOpenAdminPostJob={() => setIsPostJobOpen(true)}
            onOpenAdminApplicants={(job) =>
              setActiveAdminApplicantsJobId(job.id)
            }
            siteSocialSettings={siteSocialSettings}
            onSaveSiteSocialSettings={handleSaveSiteSocialSettings}
            liveVerifiedTutorsCount={
              tutors.filter((t) => t.nidVerified && t.uniIdVerified).length ||
              tutors.length
            }
            liveOnlineTutorsCount={
              tutors.filter(
                (t) => Array.isArray(t.modes) && t.modes.includes('Online')
              ).length
            }
            paymentRequests={paymentRequests}
            onSubmitPaymentRequest={handleSubmitPaymentRequest}
            onAdminPaymentDecision={handleAdminPaymentDecision}
            onDeletePaymentRequest={handleDeletePaymentRequest}
            siteNotices={siteNotices}
            onSaveSiteNotice={handleSaveSiteNotice}
            onToggleSiteNoticeActive={handleToggleSiteNoticeActive}
            onDeleteSiteNotice={handleDeleteSiteNotice}
            guardianRequests={guardianRequests}
            onConvertGuardianRequestToCircular={handleConvertGuardianRequestToCircular}
            onUpdateGuardianRequestStatus={handleUpdateGuardianRequestStatus}
            onUpdateGuardianRequestDetails={handleUpdateGuardianRequestDetails}
            onDeleteGuardianRequest={handleDeleteGuardianRequest}
            lastDeskMessage={lastAdminMessage}
          />
        )}

        {activeDesk === 'job_board' && (
          <TuitionJobBoard
            lang={lang}
            jobs={jobs}
            applications={circularApplications}
            paymentRequests={paymentRequests}
            siteSocialSettings={siteSocialSettings}
            currentUser={currentUser}
            myTutorProfile={myTutorProfile}
            isAdminUnlocked={hasAdminAccess}
            isLoadingCirculars={isLoadingCirculars}
            onRefreshCirculars={fetchLiveCirculars}
            onOpenApplyModal={(job) => setActiveApplyJob(job)}
            onNavigateToProfile={() => {
              setActiveDesk('tutor_upload');
              setTimeout(() => {
                document
                  .getElementById('my-applications')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            onOpenAdminApplicants={(job) => {
              if (hasAdminAccess) {
                setActiveAdminApplicantsJobId(job.id);
              }
            }}
            onDeleteJob={handleDeleteJob}
            onClearJobDesk={handleClearJobDeskOnly}
          />
        )}
      </main>

      {/* Professional & Fully Responsive Official Notice & Announcement Section (Above Footer) */}
      <NoticeBoard
        lang={lang}
        notices={siteNotices}
        isAdmin={hasAdminAccess}
        onOpenAdminNoticeManager={() => setActiveDesk('admin_review')}
      />

      {/* CLEAN & PREMIUM EDITORIAL FOOTER */}
      <footer className="w-full max-w-full overflow-x-hidden border-t border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 sm:py-10 sm:pb-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-stone-200/70 dark:border-stone-800/80">
            {/* Brand Logo & Tagline */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1.5">
              <button
                type="button"
                onClick={() => handleProtectedNavigate('tutors')}
                aria-label="Tutor Zone"
                className="group flex items-center whitespace-nowrap focus:outline-none cursor-pointer"
              >
                <BrandLogo size="lg" />
              </button>
              <p className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">
                Trusted &amp; Verified Tutor-Guardian Network
              </p>
            </div>

            {/* Sleek Pill-Shaped Official Social & Live Support Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
              <a
                href={
                  normalizeFacebookUrl(siteSocialSettings.facebookUrl) ||
                  'https://www.facebook.com'
                }
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow on Facebook"
                className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/15 group-hover:bg-white/25 transition-colors shrink-0">
                  <svg
                    className="w-3.5 h-3.5 fill-current"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </span>
                <span>Follow on Facebook</span>
              </a>

              <a
                href={
                  formatWhatsAppDirectLink(
                    siteSocialSettings.whatsappContact
                  ) || 'https://wa.me/8801602393192'
                }
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors shrink-0">
                  <svg
                    className="w-3.5 h-3.5 fill-current"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.359 4.984L2 22l5.188-1.359c1.453.797 3.109 1.219 4.843 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.828 14.125c-.25.703-1.438 1.344-2.016 1.438-.531.094-1.234.141-1.984-.094-.469-.141-1.063-.344-1.828-.672-3.219-1.391-5.313-4.641-5.469-4.859-.156-.219-1.313-1.75-1.313-3.344 0-1.594.828-2.375 1.125-2.703.297-.328.641-.406.859-.406.219 0 .422.016.609.016.203 0 .469-.078.734.563.266.656.906 2.219.984 2.375.078.156.125.344.016.563-.109.219-.156.344-.313.531-.156.188-.328.406-.469.547-.156.156-.328.328-.141.641.188.313.828 1.375 1.781 2.219 1.219 1.094 2.25 1.438 2.563 1.594.313.156.5.125.688-.078.188-.203.797-.938 1.016-1.25.219-.313.422-.266.719-.156.297.109 1.875.891 2.203 1.047.328.156.547.234.625.375.078.141.078.813-.172 1.516z" />
                  </svg>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full bg-white shadow-xs animate-pulse"
                    aria-hidden="true"
                  />
                  <span>Chat on WhatsApp</span>
                </span>
              </a>
            </div>
          </div>

          {/* Clean Bottom Copyright Bar with Official Drabir Mandal Signature Badge */}
          <div className="pt-5 flex flex-col lg:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-center lg:text-left">
              <p className="inline-flex flex-wrap items-center justify-center gap-1.5 font-medium text-stone-600 dark:text-stone-300">
                <span>© 2026 Tutor Zone · Developed &amp; Maintained by</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-tight text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 shadow-2xs">
                  Drabir Mandal
                </span>
                <span>. All Rights Reserved.</span>
              </p>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => {
                  setTermsModalTab('terms');
                  setIsTermsRefundModalOpen(true);
                }}
                className="hover:text-[#047857] dark:hover:text-emerald-400 hover:underline cursor-pointer font-medium transition-colors"
              >
                Terms &amp; Conditions
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => {
                  setTermsModalTab('refund');
                  setIsTermsRefundModalOpen(true);
                }}
                className="hover:text-[#047857] dark:hover:text-emerald-400 hover:underline cursor-pointer font-bold text-[#047857] dark:text-emerald-400 transition-colors"
              >
                Media Fee &amp; Refund Policy
              </button>
            </div>
            <div className="flex flex-col items-center lg:items-end gap-2">
              <div className="md:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs text-[11px] font-bold">
                <span className="bg-gradient-to-r from-emerald-600 to-indigo-600 dark:from-emerald-400 dark:to-indigo-400 bg-clip-text text-transparent font-extrabold">
                  ⚡ Crafted by Drabir Mandal
                </span>
              </div>
              <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 text-center lg:text-right">
                Official Issuer &amp; Platform Architecture · Tutor Zone · Drabir Mandal
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <FullProfileModal
        lang={lang}
        tutor={activeProfileTutor}
        onClose={() => setActiveProfileTutor(null)}
        onBookTrial={(tutor) => setActiveTrialTutor(tutor)}
        onAddReview={handleAddReview}
        onDeleteReview={handleDeleteReview}
      />

      <BookTrialModal
        lang={lang}
        tutor={activeTrialTutor}
        onClose={() => setActiveTrialTutor(null)}
        onConfirmBooking={handleConfirmTrialBooking}
      />

      <ApplyJobModal
        lang={lang}
        job={activeApplyJob}
        applications={circularApplications}
        currentUser={currentUser}
        myTutorProfile={myTutorProfile}
        onOpenSignIn={() => {
          setActiveApplyJob(null);
          setAuthMode('signin');
          setActiveDesk('account');
        }}
        onOpenCreateAccount={() => {
          setActiveApplyJob(null);
          setAuthMode('signup');
          setActiveDesk('account');
        }}
        onClose={() => setActiveApplyJob(null)}
        onConfirmApply={handleConfirmJobApply}
      />

      <AdminApplicantsModal
        lang={lang}
        job={
          hasAdminAccess && activeAdminApplicantsJobId
            ? jobs.find((j) => j.id === activeAdminApplicantsJobId) || null
            : null
        }
        applicants={
          hasAdminAccess && activeAdminApplicantsJobId
            ? filterAdminVisibleApplications(
                getApplicationsForCircular(
                  circularApplications,
                  activeAdminApplicantsJobId
                ),
                hiddenAdminAppIds
              )
            : []
        }
        verificationRequests={verificationRequests}
        onClose={() => setActiveAdminApplicantsJobId(null)}
        onConfirmApplicant={handleConfirmApplicant}
        onRejectApplicant={handleRejectApplicant}
        onUnblockApplicant={handleUnblockApplicant}
        onHideApplicantFromAdmin={handleHideApplicationFromAdmin}
        onDeleteApplicantEverywhere={handleDeleteApplicationEverywhere}
      />

      <PostJobModal
        lang={lang}
        isOpen={
          isPostJobOpen &&
          hasAdminAccess &&
          canPostTuitionCircular(activeDesk, hasAdminAccess, currentUser)
        }
        onClose={() => setIsPostJobOpen(false)}
        onAddJob={handleAddJob}
      />

      <AdminPinModal
        lang={lang}
        isOpen={isAdminModalOpen && isAdminAccount}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleUnlockAdmin}
      />

      {/* Guardian Request Modal (No Sign-In Required) */}
      <GuardianRequestModal
        isOpen={isGuardianModalOpen}
        lang={lang}
        onClose={() => setIsGuardianModalOpen(false)}
        onSubmitRequest={handleSubmitGuardianRequest}
      />

      {/* Official Paid Invoice / Money Receipt Modal */}
      <PaidInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        lang={lang}
        invoiceData={activeInvoiceData}
      />

      {/* Terms & Conditions and Media Fee Refund Policy Modal */}
      <TermsAndRefundModal
        isOpen={isTermsRefundModalOpen}
        onClose={() => setIsTermsRefundModalOpen(false)}
        lang={lang}
        initialTab={termsModalTab}
      />

      {/* Subtle, Non-Intrusive Floating Corner Watermark Badge (Desktop Only to Keep Mobile Cards Clear) */}
      <div
        aria-label="Official Developer Watermark"
        className="no-print print:hidden hidden md:block fixed bottom-4 left-4 z-40 pointer-events-none select-none"
      >
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 dark:bg-stone-900/85 backdrop-blur-md border border-stone-200/80 dark:border-stone-800/80 shadow-xs text-[11px] font-bold text-stone-600 dark:text-stone-300">
          <span className="bg-gradient-to-r from-emerald-600 to-indigo-600 dark:from-emerald-400 dark:to-indigo-400 bg-clip-text text-transparent font-extrabold">
            ⚡ Crafted by Drabir Mandal
          </span>
        </div>
      </div>

      {/* Floating WhatsApp Live Chat Help Button */}
      <FloatingWhatsAppButton
        whatsappContact={siteSocialSettings.whatsappContact}
        lang={lang}
      />
    </div>
  );
}
