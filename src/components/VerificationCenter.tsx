import React, { useEffect, useMemo, useState } from 'react';
import {
  MADARIPUR_UPAZILAS,
  UPAZILA_LABELS,
} from '../data/madaripurData';
import {
  CircularApplicationRow,
  CollegeTag,
  Language,
  MediumCategory,
  PaymentMethod,
  PaymentRequestRecord,
  PaymentRequestStatus,
  SiteNotice,
  GuardianRequestRecord,
  TuitionJob,
  Upazila,
  VerificationRequest,
  VerificationStatus,
} from '../types/madaripur';
import {
  DEFAULT_BKASH_NUMBER,
  DEFAULT_NAGAD_NUMBER,
  DEFAULT_SITE_SOCIAL_SETTINGS,
  DEFAULT_VERIFICATION_FEE_BDT,
  NOTICE_DEFAULT_CATEGORIES,
  NEW_ACCOUNT_HEADER_BADGE,
  NO_FILE_UPLOADED_PLACEHOLDER,
  PROFILE_FIELD_PLACEHOLDER,
  PROTECTED_ADMIN_DELETE_ERROR,
  PaymentSubmissionInput,
  SOCIAL_LINKS_UPDATED_TOAST,
  HOMEPAGE_STATS_UPDATED_TOAST,
  HomepageStatsMode,
  SiteSocialSettings,
  UNSUBMITTED_PROFILE_BANNER_BN,
  UNSUBMITTED_PROFILE_BANNER_EN,
  UserAccount,
  extractCircularDetails,
  filterAdminVisibleApplications,
  filterAdminVisibleCirculars,
  filterAdminVisiblePaymentRequests,
  filterAdminVisibleVerifications,
  findApplicantFullTutorProfile,
  canShowPaymentSectionOnProfile,
  extractAdminNoteFromApplication,
  extractMediaFeeFromApplication,
  getCleanApplicantExperienceNote,
  findTutorVerificationProfile,
  formatBDT,
  formatWhatsAppDirectLink,
  getApplicationsForCircular,
  getCircularClassSubjectLabel,
  getConfirmedApplicationForCircular,
  getNoticeCategoryBadgeStyle,
  getPaymentForCircular,
  getTutorPaymentVerificationSummary,
  getTutorProfileStatusBadge,
  getUserAppliedApplications,
  getUserCircularApplicationStatusBadge,
  getUserPaymentRequests,
  isAuthorizedAdminAccount,
  isPaymentApprovedForCircular,
  isProtectedAdminProfile,
  isSocialChannelActive,
  isTutorProfileSubmitted,
  markTutorProfileSyncedForEmail,
  maskSmartNidNumber,
  matchesAdminTabFilter,
  normalizeFacebookUrl,
  purgeLegacyLocalStorageProfileCache,
  readPaymentRequestsFromStorage,
  readSiteSocialSettingsFromStorage,
  sanitizeUnsubmittedGoogleProfile,
  toBanglaNumber,
  NID_STUDENT_ID_JPG_ONLY_ERROR,
  validateNidOrStudentIdJpgFile,
  validateProfilePhotoFile,
  validateTutorProfileSubmission,
  writeSiteSocialSettingsToStorage,
  AdminSortOrder,
  AdminSectionTab,
  sortAdminPaymentRequests,
  sortAdminVerificationRequests,
  sortAdminCircularApplications,
  sortAdminGuardianRequests,
  ADMIN_REJECTION_QUICK_REASONS,
  isTutorAccountRestricted,
  getTutorAccountRestrictionDetails,
  extractDetailedGuardianRequestFields,
  DetailedGuardianRequestView,
  MADARIPUR_INSTITUTION_CATEGORIES,
  resolveAutoFilledInstitutionName,
  resolveHomepageLiveStats,
} from '../utils/tutorEngine';
import {
  TutorUploadFileBundle,
  compressImageFile,
  readFileAsOptimizedDataUrl,
} from '../utils/supabaseProfileUpload';
import {
  ReceiptInvoiceData,
} from './LegalAndReceiptModals';
import { PaymentModal } from './PaymentModal';
import {
  ArrowUpDown,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  CreditCard,
  Edit3,
  Eye,
  EyeOff,
  FileCheck2,
  FileUp,
  Filter,
  GraduationCap,
  Home,
  Image as ImageIcon,
  Laptop,
  Layers,
  Lock,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  Printer,
  Quote,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  User,
  UserCheck,
  Users,
  XCircle,
  ZoomIn,
  X,
} from 'lucide-react';


interface VerificationCenterProps {
  lang: Language;
  deskMode: 'tutor_upload' | 'admin_review';
  requests: VerificationRequest[];
  currentUser?: UserAccount | null;
  currentUserEmail?: string;
  onOpenSignIn?: () => void;
  onOpenCreateAccount?: () => void;
  jobs?: TuitionJob[];
  applications?: CircularApplicationRow[];
  hiddenAdminAppIds?: string[];
  hiddenAdminReqIds?: string[];
  hiddenAdminJobIds?: string[];
  onOpenInvoiceModal?: (data: ReceiptInvoiceData) => void;
  onSubmitVerification: (
    req: VerificationRequest,
    files?: TutorUploadFileBundle
  ) => Promise<VerificationRequest | void> | void;
  onAdminDecision: (
    requestId: string,
    decision: VerificationStatus,
    adminNote: string
  ) => Promise<void> | void;
  onConfirmCircularApplicant?: (
    circularId: string,
    applicant: CircularApplicationRow,
    options?: {
      status?: 'confirmed' | 'verified_for_tuition' | string;
      mediaFee?: number;
      guardianPhone?: string;
      guardianAddress?: string;
      adminNote?: string;
    }
  ) => Promise<void> | void;
  onRejectCircularApplicant?: (
    circularId: string,
    applicant: CircularApplicationRow,
    rejectionNote?: string,
    restrictAccount?: boolean
  ) => Promise<void> | void;
  onUnblockCircularApplicant?: (
    circularId: string,
    applicant: CircularApplicationRow
  ) => Promise<void> | void;
  onHideApplicationFromAdmin?: (
    applicant: CircularApplicationRow
  ) => Promise<void> | void;
  onDeleteApplicationEverywhere?: (
    applicant: CircularApplicationRow
  ) => Promise<void> | void;
  onHideRequestFromAdmin?: (requestId: string) => Promise<void> | void;
  onDeleteRequestEverywhere?: (requestId: string) => Promise<void> | void;
  onHideCircularFromAdmin?: (circularId: string) => Promise<void> | void;
  onDeleteCircularEverywhere?: (circularId: string) => Promise<void> | void;
  onAdminEditProfile?: (
    updatedReq: VerificationRequest
  ) => Promise<VerificationRequest | void> | void;
  onRefreshApplications?: () => Promise<void> | void;
  onDeleteRequest: (requestId: string) => void;
  onClearAdminDesk: () => void;
  onOpenAdminPostJob?: () => void;
  onOpenAdminApplicants?: (job: TuitionJob) => void;
  siteSocialSettings?: SiteSocialSettings;
  onSaveSiteSocialSettings?: (
    input: Partial<SiteSocialSettings>
  ) => Promise<void> | void;
  liveVerifiedTutorsCount?: number;
  liveOnlineTutorsCount?: number;
  paymentRequests?: PaymentRequestRecord[];
  onSubmitPaymentRequest?: (
    input: PaymentSubmissionInput
  ) => Promise<PaymentRequestRecord | void> | PaymentRequestRecord | void;
  onAdminPaymentDecision?: (
    paymentId: string,
    decision: Exclude<PaymentRequestStatus, 'Pending'>,
    adminNote?: string
  ) => Promise<void> | void;
  onDeletePaymentRequest?: (paymentId: string) => Promise<void> | void;
  siteNotices?: SiteNotice[];
  onSaveSiteNotice?: (input: {
    id?: string;
    title: string;
    content: string;
    badge_text?: string;
    image_url?: string | null;
    is_active?: boolean;
  }) => Promise<SiteNotice | void>;
  onToggleSiteNoticeActive?: (
    id: string,
    nextActive: boolean
  ) => Promise<SiteNotice[] | void>;
  onDeleteSiteNotice?: (id: string) => Promise<SiteNotice[] | void>;
  guardianRequests?: GuardianRequestRecord[];
  onConvertGuardianRequestToCircular?: (
    req: GuardianRequestRecord
  ) => Promise<void> | void;
  onUpdateGuardianRequestStatus?: (
    id: string,
    nextStatus: 'pending' | 'contacted' | 'converted' | string
  ) => Promise<void> | void;
  onUpdateGuardianRequestDetails?: (
    updatedReq: GuardianRequestRecord
  ) => Promise<void> | void;
  onDeleteGuardianRequest?: (id: string) => Promise<void> | void;
  hasAdminAccess?: boolean;
  lastDeskMessage: string | null;
}

const COLLEGES: Exclude<CollegeTag, 'All'>[] = MADARIPUR_INSTITUTION_CATEGORIES;

const MEDIUM_OPTIONS: Exclude<MediumCategory, 'All'>[] = [
  'Bangla Medium',
  'English Version',
  'Admission Test',
  'Madrasah/Quranic',
  'ICT',
];

export const VerificationCenter: React.FC<VerificationCenterProps> = ({
  lang,
  deskMode,
  requests,
  currentUser,
  currentUserEmail,
  onOpenSignIn,
  onOpenCreateAccount,
  jobs = [],
  applications = [],
  hiddenAdminAppIds = [],
  hiddenAdminReqIds = [],
  hiddenAdminJobIds = [],
  onOpenInvoiceModal,
  onSubmitVerification,
  onAdminDecision,
  onConfirmCircularApplicant,
  onRejectCircularApplicant,
  onUnblockCircularApplicant,
  onHideApplicationFromAdmin,
  onDeleteApplicationEverywhere,
  onHideRequestFromAdmin,
  onDeleteRequestEverywhere,
  onHideCircularFromAdmin,
  onDeleteCircularEverywhere,
  onAdminEditProfile,
  onRefreshApplications,
  onDeleteRequest,
  onClearAdminDesk,
  onOpenAdminPostJob,
  onOpenAdminApplicants,
  siteSocialSettings,
  onSaveSiteSocialSettings,
  liveVerifiedTutorsCount,
  liveOnlineTutorsCount,
  paymentRequests,
  onSubmitPaymentRequest,
  onAdminPaymentDecision,
  onDeletePaymentRequest,
  siteNotices = [],
  onSaveSiteNotice,
  onToggleSiteNoticeActive,
  onDeleteSiteNotice,
  guardianRequests = [],
  onConvertGuardianRequestToCircular,
  onUpdateGuardianRequestStatus,
  onUpdateGuardianRequestDetails,
  onDeleteGuardianRequest,
  hasAdminAccess,
  lastDeskMessage,
}) => {
  const resolvedSocialSettings = useMemo(
    () =>
      siteSocialSettings ||
      readSiteSocialSettingsFromStorage() ||
      DEFAULT_SITE_SOCIAL_SETTINGS,
    [siteSocialSettings]
  );
  const resolvedPayments = useMemo(
    () => paymentRequests || readPaymentRequestsFromStorage(),
    [paymentRequests]
  );
  const [socialFacebookInput, setSocialFacebookInput] = useState<string>(
    resolvedSocialSettings.facebookUrl
  );
  const [socialWhatsappInput, setSocialWhatsappInput] = useState<string>(
    resolvedSocialSettings.whatsappContact
  );
  const [bkashNumberInput, setBkashNumberInput] = useState<string>(
    resolvedSocialSettings.bkashNumber || DEFAULT_BKASH_NUMBER
  );
  const [nagadNumberInput, setNagadNumberInput] = useState<string>(
    resolvedSocialSettings.nagadNumber || DEFAULT_NAGAD_NUMBER
  );
  const [verificationFeeInput, setVerificationFeeInput] = useState<string>(
    String(
      resolvedSocialSettings.verificationFee || DEFAULT_VERIFICATION_FEE_BDT
    )
  );
  const [isSavingSocialLinks, setIsSavingSocialLinks] = useState(false);

  // Homepage & Live Stats CMS State (stored in public.site_settings id = 1 + sessionStorage)
  const [cmsStatsMode, setCmsStatsMode] = useState<HomepageStatsMode>(
    resolvedSocialSettings.stats_mode === 'manual' ? 'manual' : 'auto'
  );
  const [cmsManualVerifiedTutors, setCmsManualVerifiedTutors] = useState<string>(
    resolvedSocialSettings.manual_verified_tutors ||
      DEFAULT_SITE_SOCIAL_SETTINGS.manual_verified_tutors ||
      '120+'
  );
  const [cmsManualOnlineTutors, setCmsManualOnlineTutors] = useState<string>(
    resolvedSocialSettings.manual_online_tutors ||
      DEFAULT_SITE_SOCIAL_SETTINGS.manual_online_tutors ||
      '45+'
  );
  const [cmsManualActiveCirculars, setCmsManualActiveCirculars] =
    useState<string>(
      resolvedSocialSettings.manual_active_circulars ||
        DEFAULT_SITE_SOCIAL_SETTINGS.manual_active_circulars ||
        '30+'
    );
  const [cmsManualTotalApplications, setCmsManualTotalApplications] =
    useState<string>(
      resolvedSocialSettings.manual_total_applications ||
        DEFAULT_SITE_SOCIAL_SETTINGS.manual_total_applications ||
        '85'
    );
  const [cmsTrustCard3Value, setCmsTrustCard3Value] = useState<string>(
    resolvedSocialSettings.trust_card_3_value ||
      DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_3_value ||
      '100%'
  );
  const [cmsTrustCard3Label, setCmsTrustCard3Label] = useState<string>(
    resolvedSocialSettings.trust_card_3_label ||
      DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_3_label ||
      '100% Smart NID Verified'
  );
  const [cmsTrustCard4Value, setCmsTrustCard4Value] = useState<string>(
    resolvedSocialSettings.trust_card_4_value ||
      DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_4_value ||
      '< 24h'
  );
  const [cmsTrustCard4Label, setCmsTrustCard4Label] = useState<string>(
    resolvedSocialSettings.trust_card_4_label ||
      DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_4_label ||
      'Fast Guardian Matching'
  );
  const [cmsHeroTopBadge1, setCmsHeroTopBadge1] = useState<string>(
    resolvedSocialSettings.hero_top_badge_1 ||
      DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_1 ||
      '🛡️ Manual NID & University ID Verification Workflow'
  );
  const [cmsHeroTopBadge2, setCmsHeroTopBadge2] = useState<string>(
    resolvedSocialSettings.hero_top_badge_2 ||
      DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_2 ||
      'Verified Guardian Reviews'
  );
  const [cmsHeroTitle, setCmsHeroTitle] = useState<string>(
    resolvedSocialSettings.hero_title ||
      DEFAULT_SITE_SOCIAL_SETTINGS.hero_title ||
      'Verified home & online tutors'
  );
  const [cmsGuardianCardTitle, setCmsGuardianCardTitle] = useState<string>(
    resolvedSocialSettings.guardian_card_title ||
      DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_title ||
      'Need a Verified Home/Online Tutor?'
  );
  const [cmsGuardianCardBadge, setCmsGuardianCardBadge] = useState<string>(
    resolvedSocialSettings.guardian_card_badge ||
      DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_badge ||
      '2 Free Trial Classes'
  );
  const [cmsTutorCardTitle, setCmsTutorCardTitle] = useState<string>(
    resolvedSocialSettings.tutor_card_title ||
      DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_title ||
      'Looking for Tuitions?'
  );
  const [cmsTutorCardDesc, setCmsTutorCardDesc] = useState<string>(
    resolvedSocialSettings.tutor_card_desc ||
      DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_desc ||
      'Verify your Smart NID & Student ID once to get the glowing Verified Tutor badge and apply directly to live guardian circulars across Madaripur.'
  );
  const [isSavingHomepageCms, setIsSavingHomepageCms] = useState(false);

  // PaymentModal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentModalMethod, setPaymentModalMethod] =
    useState<PaymentMethod>('bKash');
  const [paymentAdminNotes, setPaymentAdminNotes] = useState<
    Record<string, string>
  >({});
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (siteSocialSettings) {
      setSocialFacebookInput(siteSocialSettings.facebookUrl);
      setSocialWhatsappInput(siteSocialSettings.whatsappContact);
      setBkashNumberInput(
        siteSocialSettings.bkashNumber || DEFAULT_BKASH_NUMBER
      );
      setNagadNumberInput(
        siteSocialSettings.nagadNumber || DEFAULT_NAGAD_NUMBER
      );
      setVerificationFeeInput(
        String(
          siteSocialSettings.verificationFee || DEFAULT_VERIFICATION_FEE_BDT
        )
      );
      setCmsStatsMode(
        siteSocialSettings.stats_mode === 'manual' ? 'manual' : 'auto'
      );
      setCmsManualVerifiedTutors(
        siteSocialSettings.manual_verified_tutors ||
          DEFAULT_SITE_SOCIAL_SETTINGS.manual_verified_tutors ||
          '120+'
      );
      setCmsManualOnlineTutors(
        siteSocialSettings.manual_online_tutors ||
          DEFAULT_SITE_SOCIAL_SETTINGS.manual_online_tutors ||
          '45+'
      );
      setCmsManualActiveCirculars(
        siteSocialSettings.manual_active_circulars ||
          DEFAULT_SITE_SOCIAL_SETTINGS.manual_active_circulars ||
          '30+'
      );
      setCmsManualTotalApplications(
        siteSocialSettings.manual_total_applications ||
          DEFAULT_SITE_SOCIAL_SETTINGS.manual_total_applications ||
          '85'
      );
      setCmsTrustCard3Value(
        siteSocialSettings.trust_card_3_value ||
          DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_3_value ||
          '100%'
      );
      setCmsTrustCard3Label(
        siteSocialSettings.trust_card_3_label ||
          DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_3_label ||
          '100% Smart NID Verified'
      );
      setCmsTrustCard4Value(
        siteSocialSettings.trust_card_4_value ||
          DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_4_value ||
          '< 24h'
      );
      setCmsTrustCard4Label(
        siteSocialSettings.trust_card_4_label ||
          DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_4_label ||
          'Fast Guardian Matching'
      );
      setCmsHeroTopBadge1(
        siteSocialSettings.hero_top_badge_1 ||
          DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_1 ||
          '🛡️ Manual NID & University ID Verification Workflow'
      );
      setCmsHeroTopBadge2(
        siteSocialSettings.hero_top_badge_2 ||
          DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_2 ||
          'Verified Guardian Reviews'
      );
      setCmsHeroTitle(
        siteSocialSettings.hero_title ||
          DEFAULT_SITE_SOCIAL_SETTINGS.hero_title ||
          'Verified home & online tutors'
      );
      setCmsGuardianCardTitle(
        siteSocialSettings.guardian_card_title ||
          DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_title ||
          'Need a Verified Home/Online Tutor?'
      );
      setCmsGuardianCardBadge(
        siteSocialSettings.guardian_card_badge ||
          DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_badge ||
          '2 Free Trial Classes'
      );
      setCmsTutorCardTitle(
        siteSocialSettings.tutor_card_title ||
          DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_title ||
          'Looking for Tuitions?'
      );
      setCmsTutorCardDesc(
        siteSocialSettings.tutor_card_desc ||
          DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_desc ||
          'Verify your Smart NID & Student ID once to get the glowing Verified Tutor badge and apply directly to live guardian circulars across Madaripur.'
      );
    }
  }, [siteSocialSettings]);

  const [statusFilter, setStatusFilter] = useState<'All' | VerificationStatus>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'All' | VerificationStatus>('All');
  const [guardianStatusFilter, setGuardianStatusFilter] = useState<'All' | 'pending' | 'contacted' | 'converted'>('All');
  const [copiedGuardianPhoneId, setCopiedGuardianPhoneId] = useState<string | null>(null);
  const [editingGuardianRequest, setEditingGuardianRequest] =
    useState<DetailedGuardianRequestView | null>(null);
  const [isSavingGuardianEdit, setIsSavingGuardianEdit] = useState<boolean>(false);
  const [adminSortBy, setAdminSortBy] = useState<AdminSortOrder>('newest');
  const [paymentSortBy, setPaymentSortBy] = useState<AdminSortOrder>('newest');
  const [verificationSortBy, setVerificationSortBy] = useState<AdminSortOrder>('newest');
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminSectionTab>('all_accordion');
  const [openAdminSections, setOpenAdminSections] = useState<
    Record<Exclude<AdminSectionTab, 'all_accordion'>, boolean>
  >({
    homepage_cms: true,
    site_settings: true,
    notice_board: true,
    guardian_requests: true,
    payments: true,
    payments_and_guardians: true,
    verifications: true,
    applications: true,
  });

  const toggleAdminSection = (section: Exclude<AdminSectionTab, 'all_accordion'>) => {
    setOpenAdminSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isSectionVisible = (section: Exclude<AdminSectionTab, 'all_accordion'>): boolean => {
    if (activeAdminTab === 'all_accordion') return true;
    if (
      activeAdminTab === 'payments_and_guardians' &&
      (section === 'payments' || section === 'guardian_requests')
    ) {
      return true;
    }
    return activeAdminTab === section;
  };

  const isSectionExpanded = (section: Exclude<AdminSectionTab, 'all_accordion'>): boolean => {
    if (activeAdminTab === section) return true;
    return openAdminSections[section];
  };

  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [busyAppKey, setBusyAppKey] = useState<string | null>(null);
  const [busyReqId, setBusyReqId] = useState<string | null>(null);
  const [localDeletedReqIds, setLocalDeletedReqIds] = useState<string[]>([]);
  const [adminToast, setAdminToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [expandedAppProfiles, setExpandedAppProfiles] = useState<
    Record<string, boolean>
  >({});
  const [zoomedScan, setZoomedScan] = useState<{
    title: string;
    subtitle: string;
    imageUrl: string;
  } | null>(null);

  // Admin Edit Profile Modal State
  const [adminEditingProfile, setAdminEditingProfile] =
    useState<VerificationRequest | null>(null);
  const [adminEditName, setAdminEditName] = useState('');
  const [adminEditPhone, setAdminEditPhone] = useState('');
  const [adminEditEmail, setAdminEditEmail] = useState('');
  const [adminEditUpazila, setAdminEditUpazila] = useState<
    Exclude<Upazila, 'All'> | ''
  >('');
  const [adminEditGender, setAdminEditGender] = useState<'Male' | 'Female'>(
    'Male'
  );
  const [adminEditInstitution, setAdminEditInstitution] = useState('');
  const [adminEditCollegeTag, setAdminEditCollegeTag] = useState<
    Exclude<CollegeTag, 'All'> | ''
  >('');
  const [adminEditDepartment, setAdminEditDepartment] = useState('');
  const [adminEditMedium, setAdminEditMedium] = useState('');
  const [adminEditExperience, setAdminEditExperience] = useState('');
  const [adminEditMonthlyFee, setAdminEditMonthlyFee] = useState('');
  const [adminEditSubjects, setAdminEditSubjects] = useState('');
  const [adminEditNid, setAdminEditNid] = useState('');
  const [adminEditRegId, setAdminEditRegId] = useState('');
  const [adminEditStatus, setAdminEditStatus] =
    useState<VerificationStatus>('Pending');
  const [adminEditNote, setAdminEditNote] = useState('');
  const [isSavingAdminEdit, setIsSavingAdminEdit] = useState(false);

  // Admin Tuition Confirmation Inline Panel State (Media Fee + Guardian Contact + Custom Note)
  const [adminConfirmModalTarget, setAdminConfirmModalTarget] = useState<{
    circularId: string;
    applicant: CircularApplicationRow;
    matchedJob?: TuitionJob | null;
  } | null>(null);
  const [adminSetMediaFee, setAdminSetMediaFee] = useState<number>(1000);
  const [adminSetGuardianPhone, setAdminSetGuardianPhone] = useState<string>('');
  const [adminSetGuardianAddress, setAdminSetGuardianAddress] = useState<string>('');
  const [adminSetCustomNote, setAdminSetCustomNote] = useState<string>('');
  const [isAdminConfirmingApplicant, setIsAdminConfirmingApplicant] =
    useState<boolean>(false);

  // Executive Admin Rejection Popover State (Circular Applications)
  const [adminRejectModalTarget, setAdminRejectModalTarget] = useState<{
    circularId: string;
    applicant: CircularApplicationRow;
  } | null>(null);
  const [adminRejectionNote, setAdminRejectionNote] = useState<string>(
    'NID/Student ID Unclear'
  );
  const [adminRestrictAccountOnReject, setAdminRestrictAccountOnReject] =
    useState<boolean>(true);
  const [isAdminRejectingApplicant, setIsAdminRejectingApplicant] =
    useState<boolean>(false);

  const showAdminToast = (type: 'success' | 'error', message: string) => {
    setAdminToast({ type, message });
  };

  const isSameAdminAppTarget = (
    target: { circularId: string; applicant: CircularApplicationRow } | null,
    app: CircularApplicationRow
  ): boolean => {
    if (!target || target.circularId !== app.circular_id) return false;
    if (target.applicant.id && app.id) return target.applicant.id === app.id;
    return (
      target.applicant.tutor_id === app.tutor_id &&
      target.applicant.tutor_phone === app.tutor_phone
    );
  };

  const handleDirectConfirmCircularApplicant = async (
    app: CircularApplicationRow
  ) => {
    if (!onConfirmCircularApplicant) return;
    const actionKey =
      app.id || `${app.circular_id}-${app.tutor_id}-${app.tutor_phone}`;
    const matchedJob = jobs.find((j) => j.id === app.circular_id);
    setBusyAppKey(actionKey);
    try {
      await onConfirmCircularApplicant(app.circular_id, app, {
        status: 'confirmed',
        mediaFee: 0,
        guardianPhone:
          app.guardian_phone || matchedJob?.contactPhone || undefined,
        guardianAddress:
          app.guardian_address ||
          [matchedJob?.landmarkEn, matchedJob?.upazila]
            .filter(Boolean)
            .join(', ') ||
          matchedJob?.upazila ||
          undefined,
      });
      if (isSameAdminAppTarget(adminConfirmModalTarget, app)) {
        setAdminConfirmModalTarget(null);
      }
      showAdminToast(
        'success',
        lang === 'en'
          ? 'Tutor directly confirmed for tuition!'
          : 'টিউশনির জন্য শিক্ষক সরাসরি নিশ্চিত করা হয়েছে!'
      );
    } catch {
      showAdminToast(
        'error',
        lang === 'en'
          ? 'Failed to confirm tutor.'
          : 'শিক্ষক নিশ্চিত করতে ব্যর্থ হয়েছে।'
      );
    } finally {
      setBusyAppKey(null);
    }
  };

  const handleExecuteAdminConfirmApplicant = async () => {
    if (!adminConfirmModalTarget || !onConfirmCircularApplicant) return;
    const { circularId, applicant } = adminConfirmModalTarget;
    const actionKey =
      applicant.id || `${circularId}-${applicant.tutor_id}-${applicant.tutor_phone}`;
    setBusyAppKey(actionKey);
    setIsAdminConfirmingApplicant(true);
    try {
      await onConfirmCircularApplicant(circularId, applicant, {
        status: 'verified_for_tuition',
        mediaFee: Number(adminSetMediaFee) || 1000,
        guardianPhone: adminSetGuardianPhone.trim(),
        guardianAddress: adminSetGuardianAddress.trim(),
        adminNote: adminSetCustomNote.trim(),
      });
      showAdminToast(
        'success',
        lang === 'en'
          ? 'Tutor confirmed & verified for tuition!'
          : 'মিডিয়া ফিসহ টিউশনির জন্য শিক্ষক নিশ্চিত ও ভেরিফাই করা হয়েছে!'
      );
      setAdminConfirmModalTarget(null);
    } catch {
      showAdminToast(
        'error',
        lang === 'en' ? 'Failed to confirm tutor.' : 'শিক্ষক নিশ্চিত করতে ব্যর্থ হয়েছে।'
      );
    } finally {
      setIsAdminConfirmingApplicant(false);
      setBusyAppKey(null);
    }
  };

  const [paymentModalTarget, setPaymentModalTarget] = useState<{
    method?: PaymentMethod;
    purpose?: string;
    amount?: number;
    circularId?: string;
    circularTitle?: string;
    guardianPhone?: string;
    guardianAddress?: string;
  } | null>(null);

  const handleOpenPaymentModal = (
    method: PaymentMethod = 'bKash',
    target?: {
      purpose?: string;
      amount?: number;
      circularId?: string;
      circularTitle?: string;
      guardianPhone?: string;
      guardianAddress?: string;
    }
  ) => {
    setPaymentModalMethod(method);
    setPaymentModalTarget(target || null);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmitted = async (input: PaymentSubmissionInput) => {
    const res = await onSubmitPaymentRequest?.(input);
    showAdminToast(
      'success',
      lang === 'en'
        ? `${input.paymentMethod} Payment (TrxID: ${input.transactionId}) submitted and synced with Supabase "payment_requests"!`
        : `${input.paymentMethod} পেমেন্ট (TrxID: ${input.transactionId}) ভেরিফিকেশনের জন্য সুপাবেসে জমা হয়েছে!`
    );
    return res;
  };

  const handleSaveSocialChannels = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSocialLinks(true);
    try {
      const payload = {
        facebookUrl: socialFacebookInput.trim(),
        whatsappContact: socialWhatsappInput.trim(),
        bkashNumber: bkashNumberInput.trim() || DEFAULT_BKASH_NUMBER,
        nagadNumber: nagadNumberInput.trim() || DEFAULT_NAGAD_NUMBER,
        verificationFee:
          Number(verificationFeeInput) || DEFAULT_VERIFICATION_FEE_BDT,
      };
      writeSiteSocialSettingsToStorage(payload);
      if (onSaveSiteSocialSettings) {
        await onSaveSiteSocialSettings(payload);
      }
      showAdminToast('success', SOCIAL_LINKS_UPDATED_TOAST);
    } catch (err) {
      showAdminToast(
        'error',
        err instanceof Error
          ? err.message
          : 'Failed to update social & payment settings. Please try again.'
      );
    } finally {
      setIsSavingSocialLinks(false);
    }
  };

  const buildHomepageCmsPayload = (
    overrideMode?: HomepageStatsMode
  ): Partial<SiteSocialSettings> => ({
    facebookUrl: socialFacebookInput.trim(),
    whatsappContact: socialWhatsappInput.trim(),
    bkashNumber: bkashNumberInput.trim() || DEFAULT_BKASH_NUMBER,
    nagadNumber: nagadNumberInput.trim() || DEFAULT_NAGAD_NUMBER,
    verificationFee:
      Number(verificationFeeInput) || DEFAULT_VERIFICATION_FEE_BDT,
    stats_mode: overrideMode ?? cmsStatsMode,
    manual_verified_tutors:
      cmsManualVerifiedTutors.trim() ||
      DEFAULT_SITE_SOCIAL_SETTINGS.manual_verified_tutors,
    manual_online_tutors:
      cmsManualOnlineTutors.trim() ||
      DEFAULT_SITE_SOCIAL_SETTINGS.manual_online_tutors,
    manual_active_circulars:
      cmsManualActiveCirculars.trim() ||
      DEFAULT_SITE_SOCIAL_SETTINGS.manual_active_circulars,
    manual_total_applications:
      cmsManualTotalApplications.trim() ||
      DEFAULT_SITE_SOCIAL_SETTINGS.manual_total_applications,
    trust_card_3_value:
      cmsTrustCard3Value.trim() ||
      DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_3_value,
    trust_card_3_label:
      cmsTrustCard3Label.trim() ||
      DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_3_label,
    trust_card_4_value:
      cmsTrustCard4Value.trim() ||
      DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_4_value,
    trust_card_4_label:
      cmsTrustCard4Label.trim() ||
      DEFAULT_SITE_SOCIAL_SETTINGS.trust_card_4_label,
    hero_top_badge_1:
      cmsHeroTopBadge1.trim() ||
      DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_1,
    hero_top_badge_2:
      cmsHeroTopBadge2.trim() ||
      DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_2,
    hero_title:
      cmsHeroTitle.trim() || DEFAULT_SITE_SOCIAL_SETTINGS.hero_title,
    guardian_card_title:
      cmsGuardianCardTitle.trim() ||
      DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_title,
    guardian_card_badge:
      cmsGuardianCardBadge.trim() ||
      DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_badge,
    tutor_card_title:
      cmsTutorCardTitle.trim() ||
      DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_title,
    tutor_card_desc:
      cmsTutorCardDesc.trim() ||
      DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_desc,
  });

  const handleToggleCmsStatsMode = async (nextMode: HomepageStatsMode) => {
    setCmsStatsMode(nextMode);
    const payload = buildHomepageCmsPayload(nextMode);
    writeSiteSocialSettingsToStorage(payload);
    if (onSaveSiteSocialSettings) {
      await onSaveSiteSocialSettings(payload);
    }
    showAdminToast('success', HOMEPAGE_STATS_UPDATED_TOAST);
  };

  const handleSaveHomepageCms = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingHomepageCms(true);
    try {
      const payload = buildHomepageCmsPayload();
      writeSiteSocialSettingsToStorage(payload);
      if (onSaveSiteSocialSettings) {
        await onSaveSiteSocialSettings(payload);
      }
      showAdminToast('success', HOMEPAGE_STATS_UPDATED_TOAST);
    } catch (err) {
      showAdminToast(
        'error',
        err instanceof Error
          ? err.message
          : 'Failed to save Homepage & Stats settings.'
      );
    } finally {
      setIsSavingHomepageCms(false);
    }
  };

  // Official Notice Board Manager State (Supabase site_notices)
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<string>('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeImageUrl, setNoticeImageUrl] = useState('');
  const [noticeIsActive, setNoticeIsActive] = useState<boolean>(true);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [isSavingNotice, setIsSavingNotice] = useState<boolean>(false);
  const [isNoticeFormOpen, setIsNoticeFormOpen] = useState<boolean>(false);

  const handleNoticeImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsOptimizedDataUrl(file, 600, 0.55);
      setNoticeImageUrl(dataUrl);
      showAdminToast(
        'success',
        lang === 'en'
          ? 'Image uploaded & preview ready.'
          : 'ছবি সফলভাবে লোড হয়েছে।'
      );
    } catch (err: any) {
      showAdminToast(
        'error',
        err?.message ||
          (lang === 'en'
            ? 'Failed to process image file.'
            : 'ছবি প্রসেস করতে সমস্যা হয়েছে।')
      );
    }
  };

  const handleSaveNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      showAdminToast(
        'error',
        lang === 'en'
          ? 'Please provide both Title and Notice Content.'
          : 'অনুগ্রহ করে নোটিশের শিরোনাম ও বিবরণ উভয়ই পূরণ করুন।'
      );
      return;
    }
    setIsSavingNotice(true);
    try {
      if (onSaveSiteNotice) {
        await onSaveSiteNotice({
          id: editingNoticeId || undefined,
          title: noticeTitle.trim(),
          content: noticeContent.trim(),
          badge_text: noticeCategory.trim() || 'Official Update',
          image_url: noticeImageUrl.trim() || null,
          is_active: noticeIsActive,
        });
      }
      showAdminToast(
        'success',
        editingNoticeId
          ? lang === 'en'
            ? 'Notice updated successfully in Supabase site_notices!'
            : 'সুপাবেস site_notices-এ নোটিশ সফলভাবে আপডেট হয়েছে!'
          : lang === 'en'
          ? 'Notice published live to Supabase site_notices & Official Notice Board!'
          : 'সুপাবেস site_notices ও অফিসিয়াল নোটিশ বোর্ডে নোটিশ প্রকাশিত হয়েছে!'
      );
      setEditingNoticeId(null);
      setNoticeTitle('');
      setNoticeCategory('');
      setNoticeContent('');
      setNoticeImageUrl('');
      setNoticeIsActive(true);
      setIsNoticeFormOpen(false);
    } catch (err: any) {
      showAdminToast(
        'error',
        err?.message || 'Failed to save notice to Supabase.'
      );
    } finally {
      setIsSavingNotice(false);
    }
  };

  const handleStartEditNotice = (n: SiteNotice) => {
    setEditingNoticeId(n.id);
    setNoticeTitle(n.title);
    setNoticeCategory(n.badge_text || 'Official Update');
    setNoticeContent(n.content);
    setNoticeImageUrl(n.image_url || '');
    setNoticeIsActive(n.is_active);
    setIsNoticeFormOpen(true);
    const elem = document.getElementById('admin-notice-manager-card');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCancelNoticeEdit = () => {
    setEditingNoticeId(null);
    setNoticeTitle('');
    setNoticeCategory('Official Update');
    setNoticeContent('');
    setNoticeImageUrl('');
    setNoticeIsActive(true);
    setIsNoticeFormOpen(false);
  };

  const handleToggleNotice = async (n: SiteNotice) => {
    try {
      if (onToggleSiteNoticeActive) {
        await onToggleSiteNoticeActive(n.id, !n.is_active);
      }
      showAdminToast(
        'success',
        n.is_active
          ? lang === 'en'
            ? `Notice "${n.title}" is now hidden from the public Notice Board.`
            : `নোটিশটি এখন পাবলিক নোটিশ বোর্ড থেকে লুকানো হয়েছে।`
          : lang === 'en'
          ? `Notice "${n.title}" is now published and active on the Notice Board.`
          : `নোটিশটি এখন সক্রিয় এবং নোটিশ বোর্ডে প্রকাশিত হয়েছে।`
      );
    } catch (err: any) {
      showAdminToast('error', err?.message || 'Failed to update notice status.');
    }
  };

  const handleDeleteNotice = async (n: SiteNotice) => {
    const confirmed = window.confirm(
      lang === 'en'
        ? `Are you sure you want to permanently delete this notice: "${n.title}" from Supabase site_notices?`
        : `আপনি কি নিশ্চিতভাবে এই নোটিশটি ("${n.title}") সুপাবেস site_notices থেকে স্থায়ীভাবে মুছে ফেলতে চান?`
    );
    if (!confirmed) return;
    try {
      if (onDeleteSiteNotice) {
        await onDeleteSiteNotice(n.id);
      }
      showAdminToast(
        'success',
        lang === 'en'
          ? `Notice "${n.title}" deleted from Supabase site_notices.`
          : `নোটিশটি (${n.title}) মুছে ফেলা হয়েছে।`
      );
      if (editingNoticeId === n.id) {
        handleCancelNoticeEdit();
      }
    } catch (err: any) {
      showAdminToast('error', err?.message || 'Failed to delete notice.');
    }
  };

  const handleOpenAdminEditModal = (req: VerificationRequest) => {
    setAdminEditingProfile(req);
    setAdminEditName(req.tutorNameEn || '');
    setAdminEditPhone(req.phone || '');
    setAdminEditEmail(req.userEmail || req.email || '');
    setAdminEditUpazila(req.upazila || '');
    setAdminEditGender(req.gender || 'Male');
    setAdminEditInstitution(req.institutionFullEn || '');
    setAdminEditCollegeTag(req.collegeTag || '');
    setAdminEditDepartment(req.departmentEn || '');
    setAdminEditMedium(req.medium || '');
    setAdminEditExperience(req.experience || '');
    setAdminEditMonthlyFee(
      req.monthlyFee && req.monthlyFee > 0 ? String(req.monthlyFee) : ''
    );
    setAdminEditSubjects((req.subjectsEn || []).join(', '));
    setAdminEditNid(req.nidNumber || '');
    setAdminEditRegId(req.studentRegId || '');
    setAdminEditStatus(req.status || 'Pending');
    setAdminEditNote(adminNotes[req.id] ?? req.adminNote ?? '');
  };

  const handleSaveAdminEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEditingProfile || isSavingAdminEdit) return;

    const cleanName = adminEditName.trim() || adminEditingProfile.tutorNameEn;
    const cleanEmail = adminEditEmail.trim().toLowerCase();
    const parsedSubjects = adminEditSubjects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedReq: VerificationRequest = {
      ...adminEditingProfile,
      tutorNameEn: cleanName,
      tutorNameBn: cleanName,
      phone: adminEditPhone.trim(),
      email: cleanEmail || undefined,
      userEmail: cleanEmail || adminEditingProfile.userEmail,
      upazila: adminEditUpazila,
      gender: adminEditGender,
      institutionFullEn: adminEditInstitution.trim(),
      collegeTag: adminEditCollegeTag,
      departmentEn: adminEditDepartment.trim(),
      medium: adminEditMedium.trim(),
      experience: adminEditExperience.trim(),
      monthlyFee: Number(adminEditMonthlyFee) || 0,
      subjectsEn: parsedSubjects,
      nidNumber: adminEditNid.trim(),
      studentRegId: adminEditRegId.trim(),
      status: adminEditStatus,
      adminNote: adminEditNote.trim() || undefined,
    };

    setIsSavingAdminEdit(true);
    try {
      await onAdminEditProfile?.(updatedReq);
      setAdminEditingProfile(null);
      showAdminToast(
        'success',
        lang === 'en'
          ? `Profile updated and saved to Supabase (${updatedReq.tutorNameEn} · ${updatedReq.id})`
          : `প্রোফাইল সফলভাবে আপডেট এবং সুপাবেসে সংরক্ষিত হয়েছে (${updatedReq.tutorNameEn})`
      );
    } catch (err) {
      showAdminToast(
        'error',
        err instanceof Error
          ? err.message
          : 'Failed to save profile changes to Supabase'
      );
    } finally {
      setIsSavingAdminEdit(false);
    }
  };

  useEffect(() => {
    if (!adminToast) return;
    const timer = window.setTimeout(() => {
      setAdminToast(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [adminToast]);

  const authenticatedEmail = (
    currentUser?.email ||
    currentUserEmail ||
    ''
  )
    .trim()
    .toLowerCase();
  const isAuthenticated = Boolean(
    authenticatedEmail || currentUser?.id || currentUser?.fullName
  );

  const [isRefreshingStatus, setIsRefreshingStatus] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editingVerificationId, setEditingVerificationId] = useState<
    string | null
  >(null);

  // Isolated Tutor Verification Upload Form State
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoName, setProfilePhotoName] = useState('');
  const [profilePhotoDataUrl, setProfilePhotoDataUrl] = useState<
    string | undefined
  >(undefined);
  const [photoError, setPhotoError] = useState('');
  const [tutorName, setTutorName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [upazila, setUpazila] =
    useState<Exclude<Upazila, 'All'> | ''>('');
  const [phone, setPhone] = useState('');
  const [medium, setMedium] =
    useState<Exclude<MediumCategory, 'All'> | ''>('');
  const [experience, setExperience] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [nidScanFile, setNidScanFile] = useState<File | null>(null);
  const [nidDocumentName, setNidDocumentName] = useState('');
  const [nidScanDataUrl, setNidScanDataUrl] = useState<string | undefined>(
    undefined
  );
  const [collegeTag, setCollegeTag] = useState<Exclude<CollegeTag, 'All'> | ''>(
    ''
  );
  const [institutionFull, setInstitutionFull] = useState('');
  const [department, setDepartment] = useState('');
  const [studentRegId, setStudentRegId] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [uniScanFile, setUniScanFile] = useState<File | null>(null);
  const [uniDocumentName, setUniDocumentName] = useState('');
  const [uniScanDataUrl, setUniScanDataUrl] = useState<string | undefined>(
    undefined
  );
  const [subjectsInput, setSubjectsInput] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Clear all profile & form state immediately when switching accounts, logging out, or when Supabase row is removed
  useEffect(() => {
    purgeLegacyLocalStorageProfileCache();
    setIsEditingProfile(false);
    setEditingVerificationId(null);
    setProfilePhotoFile(null);
    setProfilePhotoName('');
    setProfilePhotoDataUrl(undefined);
    setPhotoError('');
    setTutorName('');
    setEmailInput('');
    setGender('');
    setUpazila('');
    setPhone('');
    setMedium('');
    setExperience('');
    setNidNumber('');
    setNidScanFile(null);
    setNidDocumentName('');
    setNidScanDataUrl(undefined);
    setCollegeTag('');
    setInstitutionFull('');
    setDepartment('');
    setStudentRegId('');
    setAcademicSession('');
    setSubjectsInput('');
    setMonthlyFee('');
    setUniScanFile(null);
    setUniDocumentName('');
    setUniScanDataUrl(undefined);
    setFormError('');
  }, [isAuthenticated, authenticatedEmail, currentUser]);

  // Resolve the active tutor profile strictly from live manually-submitted Supabase records (NEVER fall back to localStorage or auto-fill)
  const activeTutorProfile = useMemo(() => {
    if (!isAuthenticated) return null;

    const liveMatch = findTutorVerificationProfile(
      requests,
      currentUser || authenticatedEmail,
      currentUser?.id
    );
    if (liveMatch) {
      const sanitized = sanitizeUnsubmittedGoogleProfile(liveMatch);
      if (isTutorProfileSubmitted(sanitized)) {
        return sanitized;
      }
    }

    return null;
  }, [isAuthenticated, requests, currentUser, authenticatedEmail]);

  // If the tutor's profile row does not exist in Supabase (requests is empty), reset all form/profile state immediately
  useEffect(() => {
    if (deskMode === 'tutor_upload' && !activeTutorProfile) {
      setIsEditingProfile(false);
      setEditingVerificationId(null);
      setProfilePhotoFile(null);
      setProfilePhotoName('');
      setProfilePhotoDataUrl(undefined);
      setPhotoError('');
      setTutorName('');
      setEmailInput('');
      setPhone('');
      setMedium('');
      setUpazila('');
      setGender('');
      setExperience('');
      setNidNumber('');
      setNidScanFile(null);
      setNidDocumentName('');
      setNidScanDataUrl(undefined);
      setCollegeTag('');
      setInstitutionFull('');
      setDepartment('');
      setStudentRegId('');
      setAcademicSession('');
      setSubjectsInput('');
      setMonthlyFee('');
      setUniScanFile(null);
      setUniDocumentName('');
      setUniScanDataUrl(undefined);
    }
  }, [deskMode, activeTutorProfile]);

  const handleRefreshProfileStatus = async () => {
    if (!isAuthenticated) return;
    setIsRefreshingStatus(true);
    try {
      await onRefreshApplications?.();
      showAdminToast(
        'success',
        lang === 'en'
          ? 'Profile status synced with Supabase!'
          : 'প্রোফাইল স্ট্যাটাস সুপাবেস থেকে আপডেট হয়েছে!'
      );
    } catch {
      showAdminToast(
        'error',
        lang === 'en'
          ? 'Could not refresh status from Supabase. Please check your connection.'
          : 'সুপাবেস থেকে স্ট্যাটাস রিফ্রেশ করা যায়নি।'
      );
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  const handleStartEditAndResubmit = (profile?: VerificationRequest | null) => {
    if (!profile || !isTutorProfileSubmitted(profile)) {
      setProfilePhotoFile(null);
      setProfilePhotoName('');
      setProfilePhotoDataUrl(undefined);
      setPhotoError('');
      setTutorName('');
      setEmailInput('');
      setPhone('');
      setUpazila('');
      setGender('');
      setMedium('');
      setExperience('');
      setMonthlyFee('');
      setNidNumber('');
      setNidScanFile(null);
      setNidDocumentName('');
      setNidScanDataUrl(undefined);
      setCollegeTag('');
      setInstitutionFull('');
      setDepartment('');
      setStudentRegId('');
      setAcademicSession('');
      setUniScanFile(null);
      setUniDocumentName('');
      setUniScanDataUrl(undefined);
      setSubjectsInput('');
      setEditingVerificationId(null);
      setFormError('');
      setIsEditingProfile(true);
      return;
    }

    setProfilePhotoFile(null);
    setProfilePhotoName(profile.profilePhotoName || '');
    setProfilePhotoDataUrl(profile.profilePhotoDataUrl);
    setPhotoError('');
    setTutorName(profile.tutorNameEn || '');
    setEmailInput(profile.email || profile.userEmail || '');
    setPhone(profile.phone || '');
    setUpazila(
      (profile.upazila || 'Madaripur Sadar') as Exclude<Upazila, 'All'>
    );
    setGender(profile.gender || 'Male');
    setMedium(
      (MEDIUM_OPTIONS.find(
        (m) => m.toLowerCase() === (profile.medium || '').toLowerCase()
      ) || 'Bangla Medium') as Exclude<MediumCategory, 'All'>
    );
    setExperience(profile.experience || '');
    setMonthlyFee(
      profile.monthlyFee && profile.monthlyFee > 0
        ? String(profile.monthlyFee)
        : ''
    );
    setNidNumber(profile.nidNumber || '');
    setNidScanFile(null);
    setNidDocumentName(profile.nidDocumentName || '');
    setNidScanDataUrl(profile.nidScanDataUrl);
    const resolvedEditCategory: Exclude<CollegeTag, 'All'> =
      profile.collegeTag &&
      COLLEGES.includes(profile.collegeTag as Exclude<CollegeTag, 'All'>)
        ? (profile.collegeTag as Exclude<CollegeTag, 'All'>)
        : 'Madaripur Govt. College (Govt. Nazimuddin College)';
    setCollegeTag(resolvedEditCategory);
    setInstitutionFull(
      profile.institutionFullEn || resolvedEditCategory
    );
    setDepartment(profile.departmentEn || '');
    setStudentRegId(profile.studentRegId || '');
    setAcademicSession(profile.academicSession || '');
    setUniScanFile(null);
    setUniDocumentName(profile.uniDocumentName || '');
    setUniScanDataUrl(profile.uniScanDataUrl);
    setSubjectsInput((profile.subjectsEn || []).join(', '));
    setEditingVerificationId(profile.id || null);
    setFormError('');
    setIsEditingProfile(true);
  };

  const handleProfilePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateProfilePhotoFile(file.name, file.type);
    if (!validation.valid) {
      const errMsg =
        validation.error || 'Only JPG, JPEG, or PNG photo files are accepted.';
      setPhotoError(errMsg);
      showAdminToast('error', errMsg);
      setProfilePhotoFile(null);
      setProfilePhotoName('');
      setProfilePhotoDataUrl(undefined);
      e.target.value = '';
      return;
    }

    setPhotoError('');
    setProfilePhotoFile(file);
    setProfilePhotoName(file.name);
    try {
      const { file: compressedFile, dataUrl: optimizedDataUrl } =
        await compressImageFile(file, 400, 0.65);
      setProfilePhotoFile(compressedFile);
      setProfilePhotoDataUrl(optimizedDataUrl);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to process profile photo file.';
      setPhotoError(msg);
      showAdminToast('error', msg);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'nid' | 'uni'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateNidOrStudentIdJpgFile(file.name, file.type);
    const isJpgMime =
      !file.type ||
      file.type.toLowerCase() === 'image/jpeg' ||
      file.type.toLowerCase() === 'image/jpg';
    const isJpgExt = /\.(jpg|jpeg)$/i.test(file.name);

    if (!validation.valid || !isJpgMime || !isJpgExt) {
      const errMsg = validation.error || NID_STUDENT_ID_JPG_ONLY_ERROR;
      setFormError(errMsg);
      showAdminToast('error', errMsg);
      if (type === 'nid') {
        setNidScanFile(null);
        setNidDocumentName('');
        setNidScanDataUrl(undefined);
      } else {
        setUniScanFile(null);
        setUniDocumentName('');
        setUniScanDataUrl(undefined);
      }
      e.target.value = '';
      return;
    }

    setFormError('');
    if (type === 'nid') {
      setNidScanFile(file);
      setNidDocumentName(file.name);
    } else {
      setUniScanFile(file);
      setUniDocumentName(file.name);
    }

    try {
      const { file: compressedFile, dataUrl: optimizedDataUrl } =
        await compressImageFile(file, 800, 0.65);
      if (type === 'nid') {
        setNidScanFile(compressedFile);
        setNidScanDataUrl(optimizedDataUrl);
      } else {
        setUniScanFile(compressedFile);
        setUniScanDataUrl(optimizedDataUrl);
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to read document scan file.';
      showAdminToast('error', msg);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingForm) return;

    const resolvedEmail = (emailInput || authenticatedEmail || '')
      .trim()
      .toLowerCase();

    const validation = validateTutorProfileSubmission({
      fullName: tutorName,
      phone,
      email: resolvedEmail,
      nidNumber,
      profilePhotoName,
    });

    if (!validation.valid) {
      const errText =
        (lang === 'en' ? validation.errorEn : validation.errorBn) ||
        validation.errorEn ||
        'Please check the required profile fields.';
      setFormError(errText);
      showAdminToast('error', errText);
      return;
    }

    const receiptId =
      editingVerificationId ||
      activeTutorProfile?.id ||
      `VER-2026-${Math.floor(104 + Math.random() * 890)}`;
    const parsedSubjects = subjectsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const cleanUserId = (
      resolvedEmail.split('@')[0] ||
      currentUser?.id ||
      currentUser?.fullName ||
      ''
    ).trim();

    const resolvedUpazila = (upazila || 'Madaripur Sadar') as Exclude<
      Upazila,
      'All'
    >;
    const resolvedGender = (gender || 'Male') as 'Male' | 'Female';
    const resolvedCollegeTag = (collegeTag ||
      'Madaripur Govt. College (Govt. Nazimuddin College)') as Exclude<
      CollegeTag,
      'All'
    >;

    const cleanName = tutorName.trim();
    const cleanPhone = phone.trim();
    const cleanNid = nidNumber.replace(/[\s-]/g, '');
    const cleanInst = institutionFull.trim() || resolvedCollegeTag;
    const cleanDept = department.trim() || 'Honours / General';
    const cleanRegId = studentRegId.trim().toUpperCase() || 'Pending Reg ID';
    const cleanMedium = medium || 'Bangla Medium';
    const cleanExp = experience.trim() || '2+ Years Experience';

    const newReq: VerificationRequest = {
      id: receiptId,
      email: resolvedEmail || undefined,
      userEmail: authenticatedEmail || resolvedEmail || undefined,
      userId: cleanUserId,
      tutorId: `tutor-ver-${receiptId}`,
      tutorNameEn: cleanName,
      tutorNameBn: cleanName,
      gender: resolvedGender,
      upazila: resolvedUpazila,
      phone: cleanPhone,
      profilePhotoName: profilePhotoDataUrl
        ? profilePhotoName.trim() ||
          `${cleanName.replace(/\s+/g, '_')}_Profile_Photo.jpg`
        : undefined,
      profilePhotoDataUrl,
      nidNumber: cleanNid,
      nidDocumentName: nidScanDataUrl
        ? nidDocumentName.trim() ||
          `${cleanName.replace(/\s+/g, '_')}_Smart_NID.jpg`
        : '',
      nidScanDataUrl,
      collegeTag: resolvedCollegeTag,
      institutionFullEn: cleanInst,
      departmentEn: cleanDept,
      studentRegId: cleanRegId,
      academicSession: academicSession.trim() || '2022–2023',
      uniDocumentName: uniScanDataUrl
        ? uniDocumentName.trim() ||
          `${resolvedCollegeTag.replace(/\s+/g, '_')}_Student_ID.jpg`
        : '',
      uniScanDataUrl,
      subjectsEn:
        parsedSubjects.length > 0
          ? parsedSubjects
          : ['General Science & Math'],
      medium: cleanMedium,
      experience: cleanExp,
      monthlyFee: Number(monthlyFee) || 3500,
      submittedAt: 'Just now',
      status: 'Pending',
      adminNote: undefined,
    };

    setIsSubmittingForm(true);
    setFormError('');
    try {
      const savedResult = await onSubmitVerification(newReq, {
        profilePhotoFile,
        nidScanFile,
        uniScanFile,
      });
      const finalProfile = savedResult || newReq;

      setIsEditingProfile(false);
      setEditingVerificationId(null);
      const storageEmail = authenticatedEmail || resolvedEmail;
      if (storageEmail) {
        markTutorProfileSyncedForEmail(storageEmail);
      }

      showAdminToast(
        'success',
        lang === 'en'
          ? 'Profile & documents uploaded and synced with Supabase!'
          : 'প্রোফাইল ও ডকুমেন্টস সফলভাবে সুপাবেস ডাটাবেসে আপলোড হয়েছে!'
      );

      // Clear form inputs after switching to persistent Tutor Profile Card view
      setProfilePhotoFile(null);
      setProfilePhotoName('');
      setProfilePhotoDataUrl(undefined);
      setPhotoError('');
      setTutorName('');
      setPhone('');
      setNidNumber('');
      setNidScanFile(null);
      setNidDocumentName('');
      setNidScanDataUrl(undefined);
      setInstitutionFull('');
      setDepartment('');
      setStudentRegId('');
      setSubjectsInput('');
      setMonthlyFee('');
      setUniScanFile(null);
      setUniDocumentName('');
      setUniScanDataUrl(undefined);
    } catch (err) {
      const errMessage =
        err instanceof Error
          ? err.message
          : lang === 'en'
          ? 'Failed to upload profile to Supabase. Please check your connection or permissions.'
          : 'সুপাবেসে প্রোফাইল আপলোড ব্যর্থ হয়েছে। আপনার ইন্টারনেট সংযোগ যাচাই করুন।';
      setFormError(errMessage);
      showAdminToast('error', errMessage);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Filter Admin Queue: only display items where hidden_from_admin is NOT true and not locally deleted
  const mergedHiddenReqIds = useMemo(
    () => Array.from(new Set([...hiddenAdminReqIds, ...localDeletedReqIds])),
    [hiddenAdminReqIds, localDeletedReqIds]
  );
  const adminVisibleApplications = filterAdminVisibleApplications(
    applications,
    hiddenAdminAppIds
  );
  const adminVisibleRequests = filterAdminVisibleVerifications(
    requests,
    mergedHiddenReqIds
  );
  const adminVisibleJobs = filterAdminVisibleCirculars(jobs, hiddenAdminJobIds);

  const totalCount =
    adminVisibleApplications.length + adminVisibleRequests.length;
  const pendingCount =
    adminVisibleApplications.filter((a) =>
      matchesAdminTabFilter(a.status, 'Pending')
    ).length +
    adminVisibleRequests.filter((r) =>
      matchesAdminTabFilter(r.status, 'Pending')
    ).length;
  const approvedCount =
    adminVisibleApplications.filter((a) =>
      matchesAdminTabFilter(a.status, 'Approved')
    ).length +
    adminVisibleRequests.filter((r) =>
      matchesAdminTabFilter(r.status, 'Approved')
    ).length;
  const rejectedCount =
    adminVisibleApplications.filter((a) =>
      matchesAdminTabFilter(a.status, 'Rejected')
    ).length +
    adminVisibleRequests.filter((r) =>
      matchesAdminTabFilter(r.status, 'Rejected')
    ).length;

  const cleanAdminQuery = adminSearchQuery.trim().toLowerCase();

  const filteredApplications = useMemo(() => {
    const byStatus = adminVisibleApplications.filter((a) => {
      if (!matchesAdminTabFilter(a.status, statusFilter)) return false;
      if (!cleanAdminQuery) return true;
      return (
        (a.tutor_name || '').toLowerCase().includes(cleanAdminQuery) ||
        (a.tutor_phone || '').toLowerCase().includes(cleanAdminQuery) ||
        (a.circular_id || '').toLowerCase().includes(cleanAdminQuery) ||
        (a.institution_qualification || '').toLowerCase().includes(cleanAdminQuery)
      );
    });
    return sortAdminCircularApplications(byStatus, verificationSortBy);
  }, [adminVisibleApplications, statusFilter, cleanAdminQuery, verificationSortBy]);

  const filteredRequests = useMemo(() => {
    const byStatus = adminVisibleRequests.filter((r) => {
      if (!matchesAdminTabFilter(r.status, statusFilter)) return false;
      if (!cleanAdminQuery) return true;
      return (
        (r.tutorNameEn || '').toLowerCase().includes(cleanAdminQuery) ||
        (r.phone || '').toLowerCase().includes(cleanAdminQuery) ||
        (r.id || '').toLowerCase().includes(cleanAdminQuery) ||
        (r.nidNumber || '').toLowerCase().includes(cleanAdminQuery) ||
        (r.institutionFullEn || '').toLowerCase().includes(cleanAdminQuery) ||
        (r.upazila || '').toLowerCase().includes(cleanAdminQuery)
      );
    });
    return sortAdminVerificationRequests(byStatus, verificationSortBy);
  }, [adminVisibleRequests, statusFilter, cleanAdminQuery, verificationSortBy]);

  const adminVisiblePayments = useMemo(
    () => filterAdminVisiblePaymentRequests(resolvedPayments),
    [resolvedPayments]
  );

  const filteredPayments = useMemo(() => {
    const byStatus = adminVisiblePayments.filter((p) => {
      if (!matchesAdminTabFilter(p.status, paymentStatusFilter)) return false;
      if (!cleanAdminQuery) return true;
      return (
        (p.tutorName || '').toLowerCase().includes(cleanAdminQuery) ||
        (p.transactionId || '').toLowerCase().includes(cleanAdminQuery) ||
        (p.senderNumber || '').toLowerCase().includes(cleanAdminQuery) ||
        (p.circularId || '').toLowerCase().includes(cleanAdminQuery) ||
        (p.paymentMethod || '').toLowerCase().includes(cleanAdminQuery)
      );
    });
    return sortAdminPaymentRequests(byStatus, paymentSortBy);
  }, [adminVisiblePayments, paymentStatusFilter, cleanAdminQuery, paymentSortBy]);

  const filteredGuardianRequests = useMemo(() => {
    const byStatus = guardianRequests.filter((gr) => {
      const normalizedStatus = (gr.status || 'pending').toLowerCase();
      const isConverted =
        normalizedStatus === 'converted' || normalizedStatus === 'contacted';
      if (guardianStatusFilter === 'pending' && normalizedStatus !== 'pending')
        return false;
      if (guardianStatusFilter === 'contacted' && normalizedStatus !== 'contacted')
        return false;
      if (guardianStatusFilter === 'converted' && !isConverted) return false;
      if (!cleanAdminQuery) return true;
      const detailed = extractDetailedGuardianRequestFields(gr);
      return (
        (detailed.guardianName || '').toLowerCase().includes(cleanAdminQuery) ||
        (detailed.guardianPhone || '').toLowerCase().includes(cleanAdminQuery) ||
        (detailed.studentClass || '').toLowerCase().includes(cleanAdminQuery) ||
        (detailed.subjects || '').toLowerCase().includes(cleanAdminQuery) ||
        (detailed.upazilaArea || '').toLowerCase().includes(cleanAdminQuery) ||
        (detailed.fullAddress || '').toLowerCase().includes(cleanAdminQuery) ||
        (detailed.schoolCollegeName || '').toLowerCase().includes(cleanAdminQuery) ||
        (detailed.id || '').toLowerCase().includes(cleanAdminQuery)
      );
    });
    return sortAdminGuardianRequests(byStatus, adminSortBy);
  }, [guardianRequests, guardianStatusFilter, cleanAdminQuery, adminSortBy]);

  if (deskMode === 'tutor_upload') {
    const statusBadgeMeta = activeTutorProfile
      ? getTutorProfileStatusBadge(activeTutorProfile.status, lang)
      : null;
    const myAppliedApplications = isAuthenticated
      ? getUserAppliedApplications(
          applications,
          currentUser,
          activeTutorProfile
        )
      : [];
    const myPaymentRequests = isAuthenticated
      ? getUserPaymentRequests(
          resolvedPayments,
          currentUser,
          activeTutorProfile
        )
      : [];
    const myPaymentSummary = getTutorPaymentVerificationSummary(
      resolvedPayments,
      currentUser,
      activeTutorProfile
    );
    const isCurrentUserAdmin = Boolean(
      typeof hasAdminAccess === 'boolean'
        ? hasAdminAccess && isAuthorizedAdminAccount(currentUser)
        : isAuthorizedAdminAccount(currentUser)
    );
    const showPaymentSectionOnProfile = canShowPaymentSectionOnProfile(
      applications,
      resolvedPayments,
      currentUser,
      activeTutorProfile,
      isCurrentUserAdmin
    );

    /* ========================================================================
       PROFILE TAB: PERSISTENT TUTOR PROFILE CARD + LIVE VERIFICATION STATUS + UPLOAD FORM
       ======================================================================== */
    return (
      <section
        id="tutor-upload-desk"
        aria-label="Tutor Profile and Verification Status"
        className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#047857] dark:text-emerald-400">
              <Lock className="w-3 h-3" />
              <span>
                {lang === 'en'
                  ? 'Tutor Zone · Profile & Live Verification Status'
                  : 'টিউটর জোন · টিউটর প্রোফাইল ও লাইভ ভেরিফিকেশন স্ট্যাটাস'}
              </span>
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-tight">
              {lang === 'en'
                ? 'Tutor Profile & Live Verification Status'
                : 'টিউটর প্রোফাইল ও লাইভ ভেরিফিকেশন স্ট্যাটাস'}
            </h1>
          </div>

          <div className="text-[11px] text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-2.5 py-1 rounded-lg">
            {lang === 'en'
              ? 'Desk Isolation Active: Smart NID & phone are strictly private.'
              : 'ডেস্ক আইসোলেশন সক্রিয়: এনআইডি ও মোবাইল নম্বর গোপন থাকে।'}
          </div>
        </div>

        {adminToast && (
          <div
            role={adminToast.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            className={`mb-3 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-sm transition-all ${
              adminToast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/80 border-red-300 dark:border-red-800 text-red-700 dark:text-red-200'
                : 'bg-emerald-600 text-white border-emerald-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {adminToast.type === 'error' ? (
                <XCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{adminToast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setAdminToast(null)}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg hover:bg-black/10 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {!isAuthenticated ? (
          /* REQUIRE LOGIN FOR PROFILE TAB */
          <div
            role="region"
            aria-label="Account Required for Tutor Profile"
            className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-6 sm:p-8 text-center max-w-2xl mx-auto my-4 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-[#047857]/30 flex items-center justify-center mx-auto mb-3 text-[#047857] dark:text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white mb-1.5">
              Please Sign In or Create an Account to create or view your Tutor Profile
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-4">
              {lang === 'en'
                ? 'Your Tutor Profile, Smart NID number, and verification status are strictly private and bound 1-to-1 to your personal account.'
                : 'আপনার টিউটর প্রোফাইল, স্মার্ট এনআইডি ও ভেরিফিকেশন স্ট্যাটাস সম্পূর্ণ ব্যক্তিগত এবং শুধুমাত্র আপনার লগইনকৃত অ্যাকাউন্টের সাথে যুক্ত।'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onOpenSignIn}
                className="px-4 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Sign In' : 'সাইন ইন করুন'}
              </button>
              <button
                type="button"
                onClick={onOpenCreateAccount}
                className="px-4 py-2 rounded-lg bg-[#FAF8F5] dark:bg-stone-800 hover:border-[#047857] border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Create an Account' : 'অ্যাকাউন্ট খুলুন'}
              </button>
            </div>
          </div>
        ) : !isEditingProfile ? (() => {
          const isProfileSubmitted = Boolean(
            activeTutorProfile && isTutorProfileSubmitted(activeTutorProfile)
          );
          const profileStatusNorm = isProfileSubmitted
            ? (activeTutorProfile?.status || 'Pending').toLowerCase()
            : 'unsubmitted';
          const isVerified =
            isProfileSubmitted &&
            (profileStatusNorm === 'approved' ||
              profileStatusNorm === 'verified');
          const restrictionDetails = getTutorAccountRestrictionDetails(
            activeTutorProfile
          );
          const isRejected =
            (isProfileSubmitted && profileStatusNorm === 'rejected') ||
            restrictionDetails.isRestricted;
          const isPending = isProfileSubmitted && !isVerified && !isRejected;

          const displayFullName =
            isProfileSubmitted && activeTutorProfile?.tutorNameEn
              ? activeTutorProfile.tutorNameEn
              : PROFILE_FIELD_PLACEHOLDER;
          const displayEmail =
            isProfileSubmitted &&
            (activeTutorProfile?.email || activeTutorProfile?.userEmail)
              ? activeTutorProfile.email || activeTutorProfile.userEmail!
              : PROFILE_FIELD_PLACEHOLDER;
          const displayPhone =
            isProfileSubmitted && activeTutorProfile?.phone
              ? activeTutorProfile.phone
              : PROFILE_FIELD_PLACEHOLDER;
          const displayUpazila =
            isProfileSubmitted && activeTutorProfile?.upazila
              ? activeTutorProfile.upazila
              : PROFILE_FIELD_PLACEHOLDER;
          const displayInstitution =
            isProfileSubmitted &&
            (activeTutorProfile?.institutionFullEn ||
              activeTutorProfile?.collegeTag)
              ? `${
                  activeTutorProfile.institutionFullEn ||
                  activeTutorProfile.collegeTag
                }${
                  activeTutorProfile.departmentEn
                    ? ` (${activeTutorProfile.departmentEn})`
                    : ''
                }`
              : PROFILE_FIELD_PLACEHOLDER;
          const displayExperienceParts = isProfileSubmitted
            ? [
                activeTutorProfile?.experience,
                activeTutorProfile?.monthlyFee &&
                activeTutorProfile.monthlyFee > 0
                  ? `Expected ${formatBDT(activeTutorProfile.monthlyFee, lang)} / mo`
                  : '',
              ].filter(Boolean)
            : [];
          const displayExperience =
            displayExperienceParts.length > 0
              ? displayExperienceParts.join(' · ')
              : PROFILE_FIELD_PLACEHOLDER;
          const displayMediumParts = isProfileSubmitted
            ? [
                activeTutorProfile?.medium,
                activeTutorProfile?.collegeTag,
                (activeTutorProfile?.subjectsEn || []).join(', '),
              ].filter(Boolean)
            : [];
          const displayMedium =
            displayMediumParts.length > 0
              ? displayMediumParts.join(' · ')
              : PROFILE_FIELD_PLACEHOLDER;

          const hasVerificationCredentials = Boolean(
            isProfileSubmitted &&
              (activeTutorProfile?.nidNumber ||
                (activeTutorProfile?.studentRegId &&
                  activeTutorProfile.studentRegId.toLowerCase() !==
                    'pending reg id'))
          );
          const displayVerificationStatus = !isProfileSubmitted
            ? PROFILE_FIELD_PLACEHOLDER
            : hasVerificationCredentials
            ? `Smart NID: ${
                activeTutorProfile?.nidNumber
                  ? maskSmartNidNumber(activeTutorProfile.nidNumber)
                  : PROFILE_FIELD_PLACEHOLDER
              } · Reg ID: ${
                activeTutorProfile?.studentRegId &&
                activeTutorProfile.studentRegId.toLowerCase() !==
                  'pending reg id'
                  ? activeTutorProfile.studentRegId
                  : PROFILE_FIELD_PLACEHOLDER
              }`
            : PROFILE_FIELD_PLACEHOLDER;

          const hasUploadedProfilePhoto = Boolean(
            isProfileSubmitted && activeTutorProfile?.profilePhotoDataUrl
          );
          const hasUploadedNidScan = Boolean(
            isProfileSubmitted && activeTutorProfile?.nidScanDataUrl
          );
          const hasUploadedUniScan = Boolean(
            isProfileSubmitted && activeTutorProfile?.uniScanDataUrl
          );

          return (
            /* PERSISTENT ULTRA-COMPACT TUTOR PROFILE SUMMARY CARD (ZERO TRUNCATION & CLEAN EMPTY STATE) */
            <article
              aria-label="Submitted Tutor Profile Summary Card"
              className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-3.5 sm:p-4 shadow-xs"
            >
              {/* 1. Compact Header & Integrated Status Banner (Zero Ellipsis Cutoff) */}
              <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl text-white relative shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 min-w-0 w-full sm:w-auto flex-1">
                  <div className="shrink-0">
                    {hasUploadedProfilePhoto && activeTutorProfile ? (
                      <button
                        type="button"
                        onClick={() =>
                          setZoomedScan({
                            title: `Tutor Profile Photo — ${activeTutorProfile.tutorNameEn}`,
                            subtitle: `Verification ID: ${activeTutorProfile.id} · ${
                              activeTutorProfile.profilePhotoName ||
                              'Passport / Profile Photo'
                            }`,
                            imageUrl: activeTutorProfile.profilePhotoDataUrl!,
                          })
                        }
                        aria-label="Preview uploaded Tutor Profile Photo"
                        className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white/90 shadow-sm bg-stone-900 cursor-pointer shrink-0"
                      >
                        <img
                          src={activeTutorProfile.profilePhotoDataUrl}
                          alt={activeTutorProfile.tutorNameEn}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </button>
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/90 flex items-center justify-center text-white text-base sm:text-lg font-extrabold shadow-sm shrink-0">
                        {isProfileSubmitted && activeTutorProfile?.tutorNameEn ? (
                          activeTutorProfile.tutorNameEn
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        ) : (
                          <User className="w-6 h-6 text-white/90" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {!isProfileSubmitted ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-white/20 backdrop-blur-md border border-white/30 text-emerald-100 leading-snug break-words">
                          {NEW_ACCOUNT_HEADER_BADGE}
                        </span>
                      ) : (
                        <>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-white/20 backdrop-blur-md border border-white/30 text-emerald-100 leading-snug break-words">
                            Tutor / Scholar
                            {activeTutorProfile?.collegeTag
                              ? ` · ${activeTutorProfile.collegeTag}`
                              : ''}
                          </span>
                          {activeTutorProfile?.id && (
                            <span className="font-mono-num text-[11px] font-bold text-emerald-200 bg-black/20 px-2.5 py-0.5 rounded-full leading-snug">
                              {activeTutorProfile.id}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <h2 className="text-base sm:text-lg font-extrabold text-white break-words whitespace-normal leading-tight mb-0.5">
                      {displayFullName}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-emerald-100/95 font-medium break-words whitespace-normal">
                      <span className="break-all sm:break-words">
                        📧 {displayEmail}
                      </span>
                      <span className="font-mono-num break-words">
                        📞 {displayPhone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Glowing Verified / Status Badge (Only shown after manual profile submission) */}
                {isProfileSubmitted && (
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {isVerified ? (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-400/25 border border-emerald-300/50 text-emerald-100 backdrop-blur-md shadow-2xs inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                        <span>✓ Verified Profile</span>
                      </span>
                    ) : isRejected ? (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/30 border border-rose-300/50 text-rose-100 backdrop-blur-md shadow-2xs inline-flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                        <span>⚠️ Verification Rejected</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400/25 border border-amber-300/50 text-amber-100 backdrop-blur-md shadow-2xs inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span>⏳ Verification Pending</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Status Alert Banner (Full Natural Wrapping, Zero Truncation) */}
              {!isProfileSubmitted ? (
                <div
                  role="status"
                  className="py-2 px-3 text-xs my-2 rounded-lg bg-amber-50/90 dark:bg-amber-950/50 border border-amber-400/50 font-semibold text-amber-900 dark:text-amber-300 flex items-start sm:items-center justify-between gap-2 break-words whitespace-normal leading-snug"
                >
                  <span className="break-words whitespace-normal leading-snug">
                    {lang === 'en'
                      ? UNSUBMITTED_PROFILE_BANNER_EN
                      : UNSUBMITTED_PROFILE_BANNER_BN}
                  </span>
                </div>
              ) : (
                isPending && (
                  <div
                    role="status"
                    className="py-2 px-3 text-xs my-2 rounded-lg bg-amber-50/90 dark:bg-amber-950/50 border border-amber-400/50 font-semibold text-amber-900 dark:text-amber-300 flex items-start sm:items-center justify-between gap-2 break-words whitespace-normal leading-snug"
                  >
                    <span className="break-words whitespace-normal leading-snug">
                      {lang === 'en'
                        ? '⏳ Verification Pending — Your profile is submitted and awaiting admin review.'
                        : '⏳ ভেরিফিকেশন পেন্ডিং — আপনার প্রোফাইল জমা হয়েছে এবং অ্যাডমিন পর্যালোচনার অপেক্ষায়।'}
                    </span>
                  </div>
                )
              )}

              {isVerified && (
                <div
                  role="status"
                  className="py-2 px-3 text-xs my-2 rounded-lg bg-emerald-50/90 dark:bg-emerald-950/50 border border-[#047857]/40 font-semibold text-[#047857] dark:text-emerald-300 flex items-start sm:items-center justify-between gap-2 break-words whitespace-normal leading-snug"
                >
                  <span className="break-words whitespace-normal leading-snug">
                    {lang === 'en'
                      ? '✅ Approved & Verified Tutor — Your public profile is live.'
                      : '✅ অনুমোদিত ও ভেরিফাইড টিউটর — আপনার পাবলিক প্রোফাইল সচল আছে।'}
                  </span>
                </div>
              )}

              {isRejected && activeTutorProfile && (
                <div
                  role="alert"
                  aria-label="Account Status & Compliance Notice"
                  className="my-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 border-l-4 border-l-rose-500 p-4 sm:p-5 shadow-xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200/80 dark:border-rose-800/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldAlert className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                            {lang === 'en'
                              ? 'Account Status & Compliance Notice'
                              : 'অ্যাকাউন্ট স্ট্যাটাস ও কমপ্লায়েন্স নোটিশ'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 border border-rose-300/70 dark:border-rose-800/70">
                            <Lock className="w-3 h-3 shrink-0" />
                            <span>
                              {lang === 'en'
                                ? 'Action Required / Application Restricted'
                                : 'অ্যাকশন প্রয়োজন / আবেদন সাময়িকভাবে সীমাবদ্ধ'}
                            </span>
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200 leading-relaxed">
                          {lang === 'en'
                            ? 'Your tutor verification or recent application requires compliance review. New tuition circular applications are temporarily restricted until your credentials are re-verified.'
                            : 'আপনার টিউটর প্রোফাইল বা সাম্প্রতিক আবেদনে কিছু সংশোধন প্রয়োজন। তথ্য যাচাই সম্পন্ন না হওয়া পর্যন্ত নতুন টিউশন সার্কুলারে আবেদন সাময়িকভাবে সীমাবদ্ধ রাখা হয়েছে।'}
                        </p>

                        {/* Admin Review Note Quote Callout Box */}
                        <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/60 flex items-start gap-2.5">
                          <Quote className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1 text-xs">
                            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300 mb-0.5">
                              {lang === 'en'
                                ? 'Official Admin Review Note'
                                : 'অ্যাডমিন রিভিউ নোট'}
                            </span>
                            <p className="font-semibold text-stone-800 dark:text-stone-200 italic break-words">
                              &ldquo;
                              {restrictionDetails.adminNote ||
                                activeTutorProfile.rejection_note ||
                                activeTutorProfile.adminNote ||
                                (lang === 'en'
                                  ? 'Please update your information or upload clearer document scans.'
                                  : 'তথ্য সংশোধন করে পুনরায় জমা দিন।')}
                              &rdquo;
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 lg:self-center">
                      <a
                        href={formatWhatsAppDirectLink(
                          siteSocialSettings?.whatsappContact ||
                            DEFAULT_SITE_SOCIAL_SETTINGS.whatsappContact,
                          `Assalamu Alaikum Admin, I would like to request re-verification for my Tutor Account (${activeTutorProfile.id} - ${activeTutorProfile.tutorNameEn}).`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {lang === 'en'
                            ? 'Contact Admin on WhatsApp for Re-verification'
                            : 'পুনরায় ভেরিফিকেশনের জন্য হোয়াটসঅ্যাপে যোগাযোগ করুন'}
                        </span>
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          handleStartEditAndResubmit(activeTutorProfile)
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {lang === 'en' ? 'Edit & Resubmit' : 'পুনরায় জমা দিন'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. High-Density Mobile-First Info Grid (Zero Text Cutoffs) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 p-2.5 sm:p-3 bg-slate-50/90 dark:bg-stone-800/80 rounded-xl border border-slate-200/80 dark:border-stone-700 my-2">
                {/* Item 1: Full Name (1 col on mobile & desktop) */}
                <div className="col-span-1 p-2 sm:p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 flex items-start gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/70 text-xs shrink-0 flex items-center justify-center mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-stone-400 font-semibold leading-tight">
                      {lang === 'en' ? 'Full Name' : 'পূর্ণ নাম'}
                    </span>
                    <span
                      className={`block text-xs sm:text-[13px] break-words whitespace-normal leading-snug ${
                        displayFullName !== PROFILE_FIELD_PLACEHOLDER
                          ? 'font-bold text-slate-800 dark:text-stone-100'
                          : 'font-medium italic text-slate-400 dark:text-stone-500'
                      }`}
                    >
                      {displayFullName}
                    </span>
                  </div>
                </div>

                {/* Item 2: Phone / Contact (1 col on mobile & desktop) */}
                <div className="col-span-1 p-2 sm:p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 flex items-start gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/70 text-xs shrink-0 flex items-center justify-center mt-0.5">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-stone-400 font-semibold leading-tight">
                      {lang === 'en' ? 'Phone / Contact' : 'মোবাইল নম্বর'}
                    </span>
                    <span
                      className={`block text-xs sm:text-[13px] font-mono-num break-words whitespace-normal leading-snug ${
                        displayPhone !== PROFILE_FIELD_PLACEHOLDER
                          ? 'font-bold text-slate-800 dark:text-stone-100'
                          : 'font-medium italic text-slate-400 dark:text-stone-500'
                      }`}
                    >
                      {displayPhone}
                    </span>
                  </div>
                </div>

                {/* Item 3: Email Address (col-span-2 on mobile, col-span-1 on sm+) */}
                <div className="col-span-2 sm:col-span-1 p-2 sm:p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 flex items-start gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/70 text-xs shrink-0 flex items-center justify-center mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-stone-400 font-semibold leading-tight">
                      {lang === 'en' ? 'Email Address' : 'ইমেইল অ্যাড্রেস'}
                    </span>
                    <span
                      className={`block text-xs sm:text-[13px] break-all sm:break-words whitespace-normal leading-snug ${
                        displayEmail !== PROFILE_FIELD_PLACEHOLDER
                          ? 'font-bold text-slate-800 dark:text-stone-100'
                          : 'font-medium italic text-slate-400 dark:text-stone-500'
                      }`}
                    >
                      {displayEmail}
                    </span>
                  </div>
                </div>

                {/* Item 4: Upazila / Area Hub (col-span-2 on mobile, col-span-1 on sm+) */}
                <div className="col-span-2 sm:col-span-1 p-2 sm:p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 flex items-start gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/70 text-xs shrink-0 flex items-center justify-center mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-stone-400 font-semibold leading-tight">
                      {lang === 'en' ? 'Upazila / Area Hub' : 'উপজেলা / এলাকা'}
                    </span>
                    <span
                      className={`block text-xs sm:text-[13px] break-words whitespace-normal leading-snug ${
                        displayUpazila !== PROFILE_FIELD_PLACEHOLDER
                          ? 'font-bold text-slate-800 dark:text-stone-100'
                          : 'font-medium italic text-slate-400 dark:text-stone-500'
                      }`}
                    >
                      {displayUpazila}
                    </span>
                  </div>
                </div>

                {/* Item 5: Institution / College (col-span-2) */}
                <div className="col-span-2 p-2 sm:p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 flex items-start gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/70 text-xs shrink-0 flex items-center justify-center mt-0.5">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-stone-400 font-semibold leading-tight">
                      {lang === 'en' ? 'Institution / College' : 'কলেজ / বিশ্ববিদ্যালয়'}
                    </span>
                    <span
                      className={`block text-xs sm:text-[13px] break-words whitespace-normal leading-snug ${
                        displayInstitution !== PROFILE_FIELD_PLACEHOLDER
                          ? 'font-bold text-slate-800 dark:text-stone-100'
                          : 'font-medium italic text-slate-400 dark:text-stone-500'
                      }`}
                    >
                      {displayInstitution}
                    </span>
                  </div>
                </div>

                {/* Item 6: Tutoring Experience / Bio (col-span-2) */}
                <div className="col-span-2 p-2 sm:p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 flex items-start gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/70 text-xs shrink-0 flex items-center justify-center mt-0.5">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-stone-400 font-semibold leading-tight">
                      {lang === 'en' ? 'Tutoring Experience / Bio' : 'অভিজ্ঞতা ও প্রত্যাশিত বেতন'}
                    </span>
                    <span
                      className={`block text-xs sm:text-[13px] break-words whitespace-normal leading-snug ${
                        displayExperience !== PROFILE_FIELD_PLACEHOLDER
                          ? 'font-bold text-slate-800 dark:text-stone-100'
                          : 'font-medium italic text-slate-400 dark:text-stone-500'
                      }`}
                    >
                      {displayExperience}
                    </span>
                  </div>
                </div>

                {/* Item 7: Medium / Category (col-span-2) */}
                <div className="col-span-2 p-2 sm:p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 flex items-start gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/70 text-xs shrink-0 flex items-center justify-center mt-0.5">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-stone-400 font-semibold leading-tight">
                      {lang === 'en' ? 'Medium / Category' : 'মাধ্যম ও বিষয়সমূহ'}
                    </span>
                    <span
                      className={`block text-xs sm:text-[13px] break-words whitespace-normal leading-snug ${
                        displayMedium !== PROFILE_FIELD_PLACEHOLDER
                          ? 'font-bold text-slate-800 dark:text-stone-100'
                          : 'font-medium italic text-slate-400 dark:text-stone-500'
                      }`}
                    >
                      {displayMedium}
                    </span>
                  </div>
                </div>

                {/* Item 8: Verification Status (col-span-2) */}
                <div className="col-span-2 p-2 sm:p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 flex items-start gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/70 text-xs shrink-0 flex items-center justify-center mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-stone-400 font-semibold leading-tight">
                      {lang === 'en' ? 'Verification Status' : 'ভেরিফিকেশন স্ট্যাটাস'}
                    </span>
                    <span
                      className={`block text-xs sm:text-[13px] break-words whitespace-normal leading-snug ${
                        displayVerificationStatus !== PROFILE_FIELD_PLACEHOLDER
                          ? 'font-bold text-slate-800 dark:text-stone-100'
                          : 'font-medium italic text-slate-400 dark:text-stone-500'
                      }`}
                    >
                      {displayVerificationStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Compact Action Bar */}
              <div className="flex flex-wrap gap-2.5 items-center my-2.5">
                <button
                  type="button"
                  onClick={() => handleStartEditAndResubmit(activeTutorProfile)}
                  className="min-h-[42px] py-2 px-3.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>
                    {!isProfileSubmitted
                      ? lang === 'en'
                        ? 'Upload Profile'
                        : 'প্রোফাইল আপলোড করুন'
                      : lang === 'en'
                      ? 'Edit Profile Info'
                      : 'প্রোফাইল সম্পাদনা'}
                  </span>
                </button>

                {showPaymentSectionOnProfile && (
                  <button
                    type="button"
                    onClick={() => handleOpenPaymentModal('bKash')}
                    className="min-h-[42px] py-2 px-3.5 text-xs font-bold rounded-lg bg-gradient-to-r from-[#E2136E] to-[#B80D57] hover:opacity-95 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'en'
                        ? 'Verify Payment (bKash / Nagad)'
                        : 'বিকাশ / নগদ পেমেন্ট ভেরিফাই'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRefreshProfileStatus}
                  disabled={isRefreshingStatus}
                  className="min-h-[42px] py-2 px-3.5 text-xs font-bold rounded-lg bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 hover:border-emerald-600 text-slate-800 dark:text-stone-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${
                      isRefreshingStatus ? 'animate-spin' : ''
                    }`}
                  />
                  <span>
                    {lang === 'en' ? 'Update Credentials' : 'স্ট্যাটাস আপডেট'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById('my-applications')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="min-h-[42px] py-2 px-3.5 text-xs font-bold rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-900 dark:text-amber-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>
                    {lang === 'en' ? '🚀 View My Applications' : '🚀 আমার আবেদনসমূহ'}
                  </span>
                </button>
              </div>

              {/* 4. Compact Horizontal Document Thumbnail Strips */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                  {lang === 'en'
                    ? 'Uploaded Verification Documents'
                    : 'আপলোডকৃত ভেরিফিকেশন ডকুমেন্টসমূহ'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 rounded-xl bg-slate-50/70 dark:bg-stone-800/50 border border-slate-200/70 dark:border-stone-700/70">
                  {/* 1. Uploaded Tutor Profile Photo Thumbnail */}
                  <div className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700 flex items-center justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-stone-900 dark:text-white break-words whitespace-normal leading-snug">
                        Passport / Profile Photo
                      </div>
                      <div
                        className={`text-[10px] font-mono-num break-words whitespace-normal leading-snug ${
                          hasUploadedProfilePhoto
                            ? 'text-[#047857] dark:text-emerald-400'
                            : 'italic text-slate-400 dark:text-stone-500'
                        }`}
                      >
                        {hasUploadedProfilePhoto
                          ? activeTutorProfile?.profilePhotoName ||
                            'Synced with Supabase'
                          : NO_FILE_UPLOADED_PLACEHOLDER}
                      </div>
                    </div>

                    {hasUploadedProfilePhoto && activeTutorProfile ? (
                      <button
                        type="button"
                        onClick={() =>
                          setZoomedScan({
                            title: `Passport / Profile Photo — ${activeTutorProfile.tutorNameEn}`,
                            subtitle: `Verification ID: ${activeTutorProfile.id} · ${
                              activeTutorProfile.profilePhotoName || 'Profile Photo'
                            }`,
                            imageUrl: activeTutorProfile.profilePhotoDataUrl!,
                          })
                        }
                        aria-label="Preview uploaded Profile Photo"
                        className="group relative shrink-0 w-10 h-10 rounded-md overflow-hidden border border-[#047857] bg-stone-950/90 cursor-pointer"
                      >
                        <img
                          src={activeTutorProfile.profilePhotoDataUrl}
                          alt="Tutor Profile Photo Thumbnail"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* 2. Uploaded NID Scan Thumbnail */}
                  <div className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700 flex items-center justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-stone-900 dark:text-white break-words whitespace-normal leading-snug">
                        Smart NID Scan
                      </div>
                      <div
                        className={`text-[10px] font-mono-num break-words whitespace-normal leading-snug ${
                          hasUploadedNidScan
                            ? 'text-[#047857] dark:text-emerald-400'
                            : 'italic text-slate-400 dark:text-stone-500'
                        }`}
                      >
                        {hasUploadedNidScan
                          ? activeTutorProfile?.nidDocumentName ||
                            (activeTutorProfile?.nidNumber
                              ? `NID: ${maskSmartNidNumber(
                                  activeTutorProfile.nidNumber
                                )}`
                              : 'Synced with Supabase')
                          : NO_FILE_UPLOADED_PLACEHOLDER}
                      </div>
                    </div>

                    {hasUploadedNidScan && activeTutorProfile ? (
                      <button
                        type="button"
                        onClick={() =>
                          setZoomedScan({
                            title: `Smart NID Scan — ${activeTutorProfile.tutorNameEn}`,
                            subtitle: `Verification ID: ${activeTutorProfile.id}`,
                            imageUrl: activeTutorProfile.nidScanDataUrl!,
                          })
                        }
                        aria-label="Preview uploaded NID scan"
                        className="group relative shrink-0 w-10 h-10 rounded-md overflow-hidden border border-stone-300 dark:border-stone-600 bg-stone-950/90 cursor-pointer"
                      >
                        <img
                          src={activeTutorProfile.nidScanDataUrl}
                          alt="NID Scan Thumbnail"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-[10px] font-bold text-stone-500 shrink-0">
                        NID
                      </div>
                    )}
                  </div>

                  {/* 3. Uploaded Student ID Card Thumbnail */}
                  <div className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700 flex items-center justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-stone-900 dark:text-white break-words whitespace-normal leading-snug">
                        Student ID Card Scan
                      </div>
                      <div
                        className={`text-[10px] font-mono-num break-words whitespace-normal leading-snug ${
                          hasUploadedUniScan
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'italic text-slate-400 dark:text-stone-500'
                        }`}
                      >
                        {hasUploadedUniScan
                          ? activeTutorProfile?.uniDocumentName ||
                            (activeTutorProfile?.studentRegId
                              ? `Reg ID: ${activeTutorProfile.studentRegId}`
                              : 'Synced with Supabase')
                          : NO_FILE_UPLOADED_PLACEHOLDER}
                      </div>
                    </div>

                    {hasUploadedUniScan && activeTutorProfile ? (
                      <button
                        type="button"
                        onClick={() =>
                          setZoomedScan({
                            title: `Student ID Card Scan — ${activeTutorProfile.tutorNameEn}`,
                            subtitle: `${activeTutorProfile.institutionFullEn} · Reg ID: ${activeTutorProfile.studentRegId}`,
                            imageUrl: activeTutorProfile.uniScanDataUrl!,
                          })
                        }
                        aria-label="Preview uploaded Student ID card scan"
                        className="group relative shrink-0 w-10 h-10 rounded-md overflow-hidden border border-stone-300 dark:border-stone-600 bg-stone-950/90 cursor-pointer"
                      >
                        <img
                          src={activeTutorProfile.uniScanDataUrl}
                          alt="Student ID Card Thumbnail"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-[10px] font-bold text-stone-500 shrink-0">
                        ID
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })() : (
          <form
            onSubmit={handleSubmitForm}
            className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-6 sm:p-8"
          >
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                  {editingVerificationId
                    ? lang === 'en'
                      ? `Edit & Resubmit Profile (${editingVerificationId})`
                      : `প্রোফাইল সংশোধন ও পুনরায় জমা দিন (${editingVerificationId})`
                    : lang === 'en'
                    ? 'Submit Your NID Scan & University/College Details'
                    : 'আপনার স্মার্ট এনআইডি ও কলেজ/বিশ্ববিদ্যালয়ের তথ্য জমা দিন'}
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setEditingVerificationId(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                >
                  {lang === 'en'
                    ? '← Back to My Profile Card'
                    : '← আমার প্রোফাইল কার্ডে ফিরুন'}
                </button>
              </div>

              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-6">
                {lang === 'en'
                  ? 'Enter your credentials below. Once submitted, your Tutor Profile Card and live verification status badge synced with Supabase "tutor_verifications" will be displayed.'
                  : 'নিচে আপনার তথ্য প্রদান করুন। সাবমিট করার পর আপনার সম্পূর্ণ টিউটর প্রোফাইল কার্ড এবং লাইভ ভেরিফিকেশন স্ট্যাটাস ব্যাজ প্রদর্শিত হবে।'}
              </p>

              {/* DEDICATED SEPARATE TOP CARD: Upload Your Photo (Passport / Profile Size - JPG or PNG Only) */}
              <div
                role="region"
                aria-label="Upload Your Photo (Passport / Profile Size - JPG or PNG Only)"
                className="mb-6 p-5 rounded-2xl bg-[#FAF8F5] dark:bg-stone-800/80 border-2 border-[#047857]/30 dark:border-emerald-700/50 shadow-2xs"
              >
                <h3 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white mb-1 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0" />
                  <span>
                    Upload Your Photo (Passport / Profile Size - JPG or PNG Only)
                  </span>
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mb-4">
                  {lang === 'en'
                    ? 'Select a clear passport or profile size photograph (.jpg, .jpeg, or .png). This photo will appear on your Tutor Profile Card, in Admin Review, and on your public Dashboard card once approved.'
                    : 'আপনার পাসপোর্ট অথবা প্রোফাইল সাইজের স্পষ্ট ছবি (.jpg, .jpeg, বা .png) নির্বাচন করুন।'}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  {/* Circular Photo Preview Box */}
                  <div className="shrink-0 flex items-center justify-center">
                    <div
                      aria-label="Circular photo preview box"
                      className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#047857] bg-white dark:bg-stone-900 flex items-center justify-center shadow-xs"
                    >
                      {profilePhotoDataUrl ? (
                        <img
                          src={profilePhotoDataUrl}
                          alt="Selected Tutor Profile Photo Preview"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-stone-400 dark:text-stone-500">
                          <User className="w-10 h-10 stroke-[1.6]" />
                          <span className="text-[10px] font-semibold mt-0.5">
                            Photo
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Choose Photo (JPG / PNG) Button + File Name Display + Validation */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <label
                        htmlFor="ver-profile-photo-file"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Choose Photo (JPG / PNG)</span>
                        <input
                          id="ver-profile-photo-file"
                          type="file"
                          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                          onChange={handleProfilePhotoUpload}
                          className="sr-only"
                        />
                      </label>

                      {profilePhotoName ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-[#047857]/30 text-xs font-mono-num font-semibold text-[#047857] dark:text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{profilePhotoName}</span>
                          </span>
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            ⚡ Auto-optimized for fast upload
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-mono-num text-stone-500 dark:text-stone-400">
                          No photo selected (.jpg, .jpeg, .png only)
                        </span>
                      )}
                    </div>

                    {photoError && (
                      <p
                        role="alert"
                        className="text-xs font-semibold text-red-600 dark:text-red-400"
                      >
                        {photoError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="ver-tutor-name"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en'
                      ? 'Full Name (As on Smart NID)'
                      : 'পূর্ণ নাম (এনআইডি অনুযায়ী)'}
                  </label>
                  <input
                    id="ver-tutor-name"
                    type="text"
                    value={tutorName}
                    onChange={(e) => setTutorName(e.target.value)}
                    placeholder="e.g. Rahim Hosen"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ver-phone"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en'
                      ? 'Mobile Number (11 Digits · Confidential)'
                      : 'মোবাইল নম্বর (১১ ডিজিট · গোপনীয়)'}
                  </label>
                  <input
                    id="ver-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01308937770"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ver-email"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en'
                      ? 'Email Address (Account Sync)'
                      : 'ইমেইল অ্যাড্রেস'}
                  </label>
                  <input
                    id="ver-email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={authenticatedEmail || 'tutor@example.com'}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="ver-upazila"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en' ? 'Madaripur Upazila' : 'উপজেলা / এলাকা'}
                  </label>
                  <select
                    id="ver-upazila"
                    required
                    value={upazila}
                    onChange={(e) =>
                      setUpazila(e.target.value as Exclude<Upazila, 'All'> | '')
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  >
                    <option value="">
                      {lang === 'en' ? 'Select Upazila' : 'উপজেলা নির্বাচন করুন'}
                    </option>
                    {MADARIPUR_UPAZILAS.map((u) => (
                      <option key={u} value={u}>
                        {lang === 'en'
                          ? UPAZILA_LABELS[u]?.en || u
                          : UPAZILA_LABELS[u]?.bn || u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="ver-gender"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en' ? 'Gender' : 'লিঙ্গ'}
                  </label>
                  <select
                    id="ver-gender"
                    required
                    value={gender}
                    onChange={(e) =>
                      setGender(e.target.value as 'Male' | 'Female' | '')
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  >
                    <option value="">
                      {lang === 'en' ? 'Select Gender' : 'লিঙ্গ নির্বাচন করুন'}
                    </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="ver-medium"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en' ? 'Medium / Category' : 'মাধ্যম / ক্যাটাগরি'}
                  </label>
                  <select
                    id="ver-medium"
                    value={medium}
                    onChange={(e) =>
                      setMedium(
                        e.target.value as Exclude<MediumCategory, 'All'> | ''
                      )
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  >
                    <option value="">
                      {lang === 'en' ? 'Select Medium' : 'মাধ্যম নির্বাচন করুন'}
                    </option>
                    {MEDIUM_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="ver-experience"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en' ? 'Tutoring Experience' : 'টিউশনির অভিজ্ঞতা'}
                  </label>
                  <input
                    id="ver-experience"
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 2+ Years Experience"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ver-fee"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en'
                      ? 'Expected Monthly Fee (BDT)'
                      : 'প্রত্যাশিত মাসিক বেতন'}
                  </label>
                  <input
                    id="ver-fee"
                    type="number"
                    min={1000}
                    max={50000}
                    step={500}
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                    placeholder="e.g. 3500"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num"
                  />
                </div>
              </div>

              {/* NID Number & NID Scan Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF8F5] dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 mb-4">
                <div>
                  <label
                    htmlFor="ver-nid-number"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en'
                      ? 'Smart NID Number (10 / 13 / 17 Digits · Confidential)'
                      : 'স্মার্ট এনআইডি নম্বর (১০ / ১৩ / ১৭ ডিজিট · গোপনীয়)'}
                  </label>
                  <input
                    id="ver-nid-number"
                    type="text"
                    placeholder="e.g. 1999541548899"
                    value={nidNumber}
                    onChange={(e) => setNidNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ver-nid-file"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en'
                      ? 'Upload NID Scan (JPG Only)'
                      : 'এনআইডি স্ক্যান কপি আপলোড করুন (JPG Only)'}
                  </label>
                  <input
                    id="ver-nid-file"
                    type="file"
                    accept=".jpg,.jpeg,image/jpeg"
                    onChange={(e) => handleFileUpload(e, 'nid')}
                    className="w-full text-xs text-stone-600 dark:text-stone-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#047857] file:text-white hover:file:bg-[#065F46]"
                  />
                  {nidDocumentName && (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-[#047857] font-mono-num">
                        Attached: {nidDocumentName}
                      </span>
                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        ⚡ Auto-optimized for fast upload
                      </span>
                    </div>
                  )}
                  {nidScanDataUrl &&
                    (nidScanDataUrl.startsWith('data:image') ||
                      nidScanDataUrl.startsWith('http')) && (
                      <img
                        src={nidScanDataUrl}
                        alt="NID Scan Preview"
                        referrerPolicy="no-referrer"
                        className="mt-2 h-16 w-auto rounded-lg border border-stone-300 object-cover"
                      />
                    )}
                </div>
              </div>

              {/* University / College Credentials & Scan Upload */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 mb-5 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="ver-college-tag"
                      className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                    >
                      {lang === 'en'
                        ? 'Institution Category'
                        : 'প্রতিষ্ঠানের ক্যাটাগরি'}
                    </label>
                    <select
                      id="ver-college-tag"
                      required
                      value={collegeTag}
                      onChange={(e) => {
                        const rawVal = e.target.value;
                        if (!rawVal) {
                          setCollegeTag('');
                          return;
                        }
                        const nextCategory = rawVal as Exclude<
                          CollegeTag,
                          'All'
                        >;
                        const nextInstFull = resolveAutoFilledInstitutionName(
                          nextCategory,
                          institutionFull,
                          collegeTag || ''
                        );
                        setCollegeTag(nextCategory);
                        setInstitutionFull(nextInstFull);
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                    >
                      <option value="">
                        {lang === 'en'
                          ? 'Select Institution Category'
                          : 'প্রতিষ্ঠানের ক্যাটাগরি নির্বাচন করুন'}
                      </option>
                      {COLLEGES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="ver-inst-full"
                      className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                    >
                      {lang === 'en'
                        ? 'Full University / College Name'
                        : 'কলেজ / বিশ্ববিদ্যালয়ের পূর্ণ নাম'}
                    </label>
                    <input
                      id="ver-inst-full"
                      type="text"
                      placeholder="e.g. Madaripur Govt. College"
                      value={institutionFull}
                      onChange={(e) => setInstitutionFull(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ver-dept"
                      className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                    >
                      {lang === 'en' ? 'Department / Degree' : 'বিভাগ ও বর্ষ'}
                    </label>
                    <input
                      id="ver-dept"
                      type="text"
                      placeholder="e.g. Honours in Mathematics"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="ver-reg-id"
                      className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                    >
                      {lang === 'en'
                        ? 'Student / Registration ID (Confidential)'
                        : 'স্টুডেন্ট / রেজিস্ট্রেশন আইডি (গোপনীয়)'}
                    </label>
                    <input
                      id="ver-reg-id"
                      type="text"
                      placeholder="e.g. REG-2026-101"
                      value={studentRegId}
                      onChange={(e) => setStudentRegId(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ver-subjects"
                      className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                    >
                      {lang === 'en' ? 'Teaching Subjects' : 'পড়ানোর বিষয়সমূহ'}
                    </label>
                    <input
                      id="ver-subjects"
                      type="text"
                      placeholder="e.g. Physics, Math, Chemistry"
                      value={subjectsInput}
                      onChange={(e) => setSubjectsInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ver-uni-file"
                      className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                    >
                      {lang === 'en'
                        ? 'Upload Student ID Card Scan (JPG Only)'
                        : 'স্টুডেন্ট আইডি কার্ড স্ক্যান (JPG Only)'}
                    </label>
                    <input
                      id="ver-uni-file"
                      type="file"
                      accept=".jpg,.jpeg,image/jpeg"
                      onChange={(e) => handleFileUpload(e, 'uni')}
                      className="w-full text-xs text-stone-600 dark:text-stone-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white"
                    />
                    {uniDocumentName && (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-mono-num">
                          Attached: {uniDocumentName}
                        </span>
                        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          ⚡ Auto-optimized for fast upload
                        </span>
                      </div>
                    )}
                    {uniScanDataUrl &&
                      (uniScanDataUrl.startsWith('data:image') ||
                        uniScanDataUrl.startsWith('http')) && (
                        <img
                          src={uniScanDataUrl}
                          alt="Student ID Scan Preview"
                          referrerPolicy="no-referrer"
                          className="mt-2 h-16 w-auto rounded-lg border border-stone-300 object-cover"
                        />
                      )}
                  </div>
                </div>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-red-600 dark:text-red-400 mb-3"
                >
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmittingForm}
                aria-busy={isSubmittingForm}
                className="px-6 py-3 rounded-xl bg-[#047857] hover:bg-[#065F46] disabled:opacity-65 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                {isSubmittingForm ? (
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <FileUp className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {isSubmittingForm
                    ? lang === 'en'
                      ? '⏳ Uploading profile...'
                      : '⏳ প্রোফাইল আপলোড হচ্ছে...'
                    : editingVerificationId
                    ? lang === 'en'
                      ? 'Update & Resubmit Profile for Verification'
                      : 'প্রোফাইল আপডেট ও পুনরায় জমা দিন'
                    : lang === 'en'
                    ? 'Submit NID & University Credentials'
                    : 'ভেরিফিকেশনের জন্য ডকুমেন্ট জমা দিন'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* BKASH & NAGAD PAYMENT VERIFICATION SECTION ON PROFILE PAGE */}
        {isAuthenticated && showPaymentSectionOnProfile && (
          <div
            role="region"
            aria-label="bKash and Nagad Payment Verification"
            className="mt-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-5 sm:p-6 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-200/80 dark:border-stone-800">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#047857] dark:text-emerald-400 mb-0.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'en'
                      ? 'Supabase payment_requests & site_settings Sync'
                      : 'সুপাবেস পেমেন্ট ভেরিফিকেশন'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white">
                  {lang === 'en'
                    ? 'bKash & Nagad Payment Verification'
                    : 'বিকাশ ও নগদ পেমেন্ট ভেরিফিকেশন'}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {lang === 'en'
                    ? `Official bKash: ${resolvedSocialSettings.bkashNumber || DEFAULT_BKASH_NUMBER} · Official Nagad: ${resolvedSocialSettings.nagadNumber || DEFAULT_NAGAD_NUMBER} · Standard Fee: ${formatBDT(resolvedSocialSettings.verificationFee || DEFAULT_VERIFICATION_FEE_BDT, lang)}`
                    : `অফিশিয়াল বিকাশ: ${resolvedSocialSettings.bkashNumber || DEFAULT_BKASH_NUMBER} · নগদ: ${resolvedSocialSettings.nagadNumber || DEFAULT_NAGAD_NUMBER}`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {myPaymentSummary.hasApproved ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-[#047857] dark:text-emerald-300 border border-[#047857]/40">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Payment Verified</span>
                  </span>
                ) : myPaymentSummary.hasPending ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-400/50">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Payment Pending Review</span>
                  </span>
                ) : null}

                <button
                  type="button"
                  onClick={() => handleOpenPaymentModal('bKash')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E2136E] hover:bg-[#C20E5C] text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'en' ? 'Pay via bKash' : 'বিকাশ পেমেন্ট'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPaymentModal('Nagad')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F7941D] to-[#EC1C24] hover:opacity-95 text-white text-xs font-extrabold shadow-xs transition-opacity cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'en' ? 'Pay via Nagad' : 'নগদ পেমেন্ট'}
                  </span>
                </button>
              </div>
            </div>

            {myPaymentRequests.length === 0 ? (
              <div className="py-4 px-4 rounded-xl bg-[#FAF8F5] dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-stone-600 dark:text-stone-300">
                  {lang === 'en'
                    ? 'No bKash or Nagad payment verification submitted yet. Click "Pay via bKash" or "Pay via Nagad" above to submit your Transaction ID (TrxID).'
                    : 'আপনি এখনো কোনো বিকাশ বা নগদ ট্রানজেকশন আইডি (TrxID) জমা দেননি।'}
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenPaymentModal('bKash')}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold whitespace-nowrap cursor-pointer shrink-0"
                >
                  {lang === 'en' ? 'Submit TrxID Now' : 'TrxID জমা দিন'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myPaymentRequests.map((pay) => (
                  <article
                    key={pay.id}
                    className={`rounded-xl p-3.5 border flex flex-col justify-between gap-2 text-xs ${
                      pay.status === 'Approved'
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-[#047857]/50'
                        : pay.status === 'Rejected'
                        ? 'bg-red-50/50 dark:bg-red-950/30 border-red-300 dark:border-red-800/60'
                        : 'bg-[#FAF8F5] dark:bg-stone-800/70 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold text-white ${
                            pay.paymentMethod === 'Nagad'
                              ? 'bg-[#F7941D] text-stone-950'
                              : 'bg-[#E2136E]'
                          }`}
                        >
                          {pay.paymentMethod}
                        </span>
                        <span className="font-mono-num font-bold text-stone-900 dark:text-white">
                          TrxID: {pay.transactionId}
                        </span>
                      </div>

                      {pay.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/90 text-[#047857] dark:text-emerald-300 border border-[#047857]/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved & Verified</span>
                        </span>
                      ) : pay.status === 'Rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 dark:bg-red-950/90 text-red-700 dark:text-red-300 border border-red-400/50">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/90 text-amber-900 dark:text-amber-300 border border-amber-500/40">
                          <Clock className="w-3 h-3" />
                          <span>Pending Admin Review</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-stone-600 dark:text-stone-300 font-mono-num">
                      <span>
                        Sender: <strong>{pay.senderNumber}</strong> ·{' '}
                        {formatBDT(pay.amount, lang)}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {pay.requestCode} · {pay.createdAt}
                      </span>
                    </div>

                    {pay.adminNote && (
                      <div className="pt-1.5 border-t border-stone-200/70 dark:border-stone-700 text-[11px] text-stone-600 dark:text-stone-300">
                        <strong>Admin Note:</strong> {pay.adminNote}
                      </div>
                    )}

                    {pay.status === 'Approved' && (
                      <div className="pt-1.5 border-t border-stone-200/70 dark:border-stone-700 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            onOpenInvoiceModal?.({
                              invoiceId: `INV-2026-${pay.requestCode || pay.id}`,
                              tutorName: pay.tutorName || activeTutorProfile?.tutorNameEn || currentUser?.fullName || 'Verified Tutor',
                              tutorCode: activeTutorProfile?.id,
                              tutorPhone: pay.senderNumber || activeTutorProfile?.phone,
                              tutorEmail: pay.userEmail || currentUser?.email,
                              circularId: pay.circularId || undefined,
                              circularTitle: pay.circularTitle || undefined,
                              paymentMethod: pay.paymentMethod,
                              senderNumber: pay.senderNumber,
                              transactionId: pay.transactionId,
                              amount: Number(pay.amount) || 1000,
                              purpose: pay.purpose || 'Profile Verification Fee',
                              date: pay.createdAt || 'Nov 2026',
                              guardianPhone: pay.guardianPhone,
                              guardianAddress: pay.guardianAddress,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Printer className="w-3 h-3" />
                          <span>{lang === 'en' ? 'Download Money Receipt' : 'মানি রিসিট প্রিন্ট করুন'}</span>
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MY APPLIED TUITIONS SECTION (STRICTLY SCOPED TO LOGGED-IN USER ONLY) */}
        {isAuthenticated && (
          <div
            id="my-applications"
            role="region"
            aria-label="My Applied Tuitions"
            className="mt-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-6 sm:p-7 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-stone-200/80 dark:border-stone-800">
              <div>
                <h2 className="text-lg font-extrabold text-stone-900 dark:text-white">
                  {lang === 'en'
                    ? 'My Applied Tuitions'
                    : 'আমার আবেদনকৃত টিউশনিসমূহ'}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {lang === 'en'
                    ? 'Private to your account: Only your own tuition circular applications and live confirmation statuses are shown here.'
                    : 'শুধুমাত্র আপনার নিজের টিউশনি আবেদন এবং লাইভ স্ট্যাটাস এখানে প্রদর্শিত হচ্ছে।'}
                </p>
              </div>
              <span className="font-mono-num text-xs font-bold text-[#047857] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-[#047857]/30">
                {myAppliedApplications.length}{' '}
                {myAppliedApplications.length === 1
                  ? 'Applied Circular'
                  : 'Applied Circulars'}
              </span>
            </div>

            {myAppliedApplications.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500 dark:text-stone-400">
                {lang === 'en'
                  ? 'You have not applied to any tuition circulars yet. Visit "Tuition Circulars" to apply with your account.'
                  : 'আপনি এখনো কোনো টিউশনি সার্কুলারে আবেদন করেননি।'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myAppliedApplications.map((app, idx) => {
                  const matchedJob = jobs.find((j) => j.id === app.circular_id);
                  const mediaFee = extractMediaFeeFromApplication(app, 1000);
                  const adminNote = extractAdminNoteFromApplication(app);
                  const badge = getUserCircularApplicationStatusBadge(
                    app.status,
                    lang,
                    mediaFee
                  );
                  const classSubjectText = getCircularClassSubjectLabel(
                    jobs,
                    app.circular_id,
                    lang
                  );
                  const isVerifiedForTuition =
                    (app.status || '').trim().toLowerCase() ===
                      'verified_for_tuition' ||
                    (app.status || '').trim().toLowerCase() ===
                      'verified for tuition';
                  const isDirectConfirmed =
                    (app.status || '').trim().toLowerCase() === 'confirmed' ||
                    (app.status || '').trim().toLowerCase() === 'approved';
                  const circularPayment = getPaymentForCircular(
                    myPaymentRequests,
                    app.circular_id
                  );
                  const isPaymentApproved =
                    circularPayment?.status === 'Approved' ||
                    isPaymentApprovedForCircular(
                      myPaymentRequests,
                      app.circular_id,
                      currentUser,
                      activeTutorProfile
                    );
                  const isPaymentPending = circularPayment?.status === 'Pending';
                  const circularTitle = matchedJob
                    ? lang === 'en'
                      ? matchedJob.titleEn
                      : matchedJob.titleBn
                    : classSubjectText;
                  const rawGuardianPhone =
                    app.guardian_phone || matchedJob?.contactPhone || '';
                  const rawGuardianAddress =
                    app.guardian_address ||
                    [matchedJob?.landmarkEn, matchedJob?.upazila]
                      .filter(Boolean)
                      .join(', ') ||
                    matchedJob?.upazila ||
                    'Madaripur Sadar';

                  return (
                    <article
                      key={app.id || `${app.circular_id}-${idx}`}
                      className={`rounded-xl p-4 border flex flex-col justify-between gap-3.5 ${
                        isPaymentApproved || isDirectConfirmed
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-[#047857]/60 shadow-xs'
                          : isVerifiedForTuition
                          ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-400/60'
                          : badge.tone === 'rejected'
                          ? 'bg-red-50/50 dark:bg-red-950/30 border-red-300 dark:border-red-800/60'
                          : 'bg-[#FAF8F5] dark:bg-stone-800/70 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono-num text-xs font-extrabold text-[#047857] dark:text-emerald-400">
                            {app.circular_id}
                            {matchedJob ? ` · ${matchedJob.upazila}` : ''}
                          </span>
                          <span
                            role="status"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              isPaymentApproved || isDirectConfirmed
                                ? 'bg-emerald-100 dark:bg-emerald-950/90 text-[#047857] dark:text-emerald-300 border-[#047857]/50'
                                : isVerifiedForTuition
                                ? 'bg-amber-100 dark:bg-amber-950/90 text-amber-900 dark:text-amber-300 border-amber-500/50'
                                : badge.tone === 'rejected'
                                ? 'bg-red-100 dark:bg-red-950/90 text-red-700 dark:text-red-300 border-red-400/50'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700'
                            }`}
                          >
                            {isPaymentApproved ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] dark:text-emerald-300" />
                                <span>
                                  {lang === 'en'
                                    ? 'Confirmed · Contact Unlocked'
                                    : 'নিশ্চিত · নম্বর আনলকড'}
                                </span>
                              </>
                            ) : (
                              badge.label
                            )}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                          {circularTitle}
                        </h3>

                        <div className="text-xs text-stone-600 dark:text-stone-300">
                          {classSubjectText}
                          {matchedJob
                            ? ` · ${formatBDT(matchedJob.salaryBdt, lang)}/mo`
                            : ''}
                        </div>

                        {/* ========================================================================
                            RULE 2 & 3: CONTACT UNLOCK / PAYMENT VERIFICATION ON APPLIED CARD
                            ======================================================================== */}
                        {isPaymentApproved || isDirectConfirmed ? (
                          /* UNLOCKED: Either Admin approved TrxID payment OR Admin directly confirmed tutor */
                          <div className="mt-2 p-3 rounded-xl bg-white dark:bg-stone-900 border-2 border-emerald-500/70 shadow-xs space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#047857] dark:text-emerald-400">
                                <CheckCircle2 className="w-4 h-4 text-[#047857] dark:text-emerald-400" />
                                <span>
                                  {lang === 'en'
                                    ? 'Guardian Contact Details Unlocked'
                                    : 'অভিভাবকের যোগাযোগের তথ্য আনলক হয়েছে'}
                                </span>
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[#047857] dark:text-emerald-300 font-mono-num">
                                {isPaymentApproved && circularPayment
                                  ? `TrxID: ${circularPayment.transactionId} · Verified`
                                  : 'Directly Confirmed'}
                              </span>
                            </div>

                            {adminNote && (
                              <div className="p-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-900 dark:text-emerald-200">
                                📌 Admin Note: {adminNote}
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                              <div className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                                <span className="block text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 mb-0.5">
                                  {lang === 'en'
                                    ? 'Guardian Phone Number'
                                    : 'অভিভাবকের মোবাইল নম্বর'}
                                </span>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono-num font-extrabold text-stone-900 dark:text-white text-xs sm:text-sm">
                                    {rawGuardianPhone || '01712-345678'}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <a
                                      href={`tel:${(rawGuardianPhone || '01712345678').replace(/[^\d+]/g, '')}`}
                                      className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                                      title={lang === 'en' ? 'Call Guardian' : 'অভিভাবককে কল করুন'}
                                    >
                                      <Phone className="w-3.5 h-3.5" />
                                    </a>
                                    <a
                                      href={formatWhatsAppDirectLink(
                                        rawGuardianPhone || '01712345678'
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-md bg-[#25D366] hover:bg-[#1EBE5D] text-white transition-colors"
                                      title="WhatsApp Guardian"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>
                              </div>

                              <div className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                                <span className="block text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 mb-0.5">
                                  {lang === 'en'
                                    ? 'Tuition Location & Address'
                                    : 'টিউশনির স্থান ও ঠিকানা'}
                                </span>
                                <span className="block font-semibold text-stone-900 dark:text-white text-xs truncate">
                                  {rawGuardianAddress}
                                </span>
                              </div>
                            </div>

                            {/* Download / Print Official Money Receipt Button (when payment approved) */}
                            {isPaymentApproved && (
                              <div className="pt-2 border-t border-stone-200/80 dark:border-stone-800 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenInvoiceModal?.({
                                      invoiceId: `INV-2026-${app.circular_id}`,
                                      tutorName: activeTutorProfile?.tutorNameEn || currentUser?.fullName || 'Verified Tutor',
                                      tutorCode: activeTutorProfile?.id,
                                      tutorPhone: activeTutorProfile?.phone || currentUser?.email,
                                      tutorEmail: currentUser?.email || activeTutorProfile?.userEmail,
                                      circularId: app.circular_id,
                                      circularTitle,
                                      paymentMethod: circularPayment?.paymentMethod || 'bKash',
                                      senderNumber: circularPayment?.senderNumber || '01712345678',
                                      transactionId: circularPayment?.transactionId || 'BK9842X19Q',
                                      amount: circularPayment?.amount || mediaFee || 1000,
                                      purpose: circularPayment?.purpose || `Tuition Media Confirmation Fee (${app.circular_id})`,
                                      date: circularPayment?.createdAt || 'Nov 2026',
                                      guardianPhone: rawGuardianPhone,
                                      guardianAddress: rawGuardianAddress,
                                    })
                                  }
                                  className="w-full sm:w-auto py-2 px-3.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-extrabold shadow-xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>
                                    {lang === 'en'
                                      ? 'Download / Print Money Receipt'
                                      : 'ডাউনলোড / প্রিন্ট মানি রিসিট'}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : isVerifiedForTuition ? (
                          /* RULE 2: VERIFIED FOR TUITION BY ADMIN - MEDIA FEE PAYMENT REQUIRED */
                          <div className="mt-2 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                                <Lock className="w-3.5 h-3.5 shrink-0 text-amber-700 dark:text-amber-400" />
                                <span>
                                  {lang === 'en'
                                    ? 'Guardian Phone & Address Locked'
                                    : 'অভিভাবকের ফোন ও ঠিকানা লক করা'}
                                </span>
                              </span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-mono-num">
                                Media Fee: ৳{mediaFee.toLocaleString()}
                              </span>
                            </div>

                            {adminNote && (
                              <div className="p-2 rounded-lg bg-white/80 dark:bg-stone-900/70 border border-amber-300/80 dark:border-amber-800 text-[11px] font-semibold text-amber-950 dark:text-amber-200">
                                📌 Admin Instructions: {adminNote}
                              </div>
                            )}

                            <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                              {isPaymentPending
                                ? lang === 'en'
                                  ? `Your ${circularPayment?.paymentMethod} payment (TrxID: ${circularPayment?.transactionId}) is pending Admin verification. Contact details will unlock automatically once approved.`
                                  : `আপনার ${circularPayment?.paymentMethod} পেমেন্ট (TrxID: ${circularPayment?.transactionId}) অ্যাডমিন ভেরিফিকেশনে আছে। অনুমোদন হলে স্বয়ংক্রিয়ভাবে অভিভাবকের নম্বর ও ঠিকানা আনলক হবে।`
                                : lang === 'en'
                                ? 'Admin confirmed your application for this tuition! Pay the media fee via bKash or Nagad and submit your TrxID to unlock the Guardian phone number and address.'
                                : 'অ্যাডমিন আপনাকে এই টিউশনির জন্য নিশ্চিত করেছে! অভিভাবকের ফোন নম্বর ও ঠিকানা দেখতে বিকাশ বা নগদে মিডিয়া ফি প্রদান করুন।'}
                            </p>

                            <div className="pt-1 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenPaymentModal('bKash', {
                                    circularId: app.circular_id,
                                    circularTitle,
                                    guardianPhone: rawGuardianPhone,
                                    guardianAddress: rawGuardianAddress,
                                    amount: mediaFee,
                                    purpose: `Tuition Media Confirmation Fee (${app.circular_id})`,
                                  })
                                }
                                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#E2136E] to-[#B80D57] hover:opacity-95 text-white text-xs font-extrabold shadow-xs transition-opacity inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>
                                  {isPaymentPending
                                    ? lang === 'en'
                                      ? 'Update Media Fee TrxID'
                                      : 'মিডিয়া ফি TrxID পরিবর্তন করুন'
                                    : lang === 'en'
                                    ? 'Pay Media Fee (bKash / Nagad)'
                                    : 'মিডিয়া ফি প্রদান করুন (বিকাশ / নগদ)'}
                                </span>
                              </button>

                              {isPaymentPending && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono-num font-semibold text-amber-700 dark:text-amber-300">
                                  <Clock className="w-3 h-3" />
                                  <span>Pending Admin Review</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* RULE 1/2: UNCONFIRMED APPLICATION - NO PAYMENT BUTTON */
                          <div className="mt-1.5 p-2.5 rounded-xl bg-stone-100/70 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/70 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between gap-2">
                            <span>
                              {lang === 'en'
                                ? 'Guardian contact details and media fee payment will unlock once Admin confirms your application.'
                                : 'অ্যাডমিন আপনার আবেদন নিশ্চিত করলে অভিভাবকের তথ্য ও মিডিয়া ফি প্রদানের অপশন চালু হবে।'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-stone-200/70 dark:border-stone-700 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-num text-stone-500 dark:text-stone-400">
                        <span>My Tutor ID: {app.tutor_id}</span>
                        <span>{app.institution_qualification}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PaymentModal on Profile Page */}
        <PaymentModal
          isOpen={isPaymentModalOpen}
          lang={lang}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentModalTarget(null);
          }}
          currentUser={currentUser}
          myTutorProfile={activeTutorProfile}
          siteSettings={resolvedSocialSettings}
          userPayments={myPaymentRequests}
          defaultMethod={paymentModalMethod}
          defaultPurpose={paymentModalTarget?.purpose}
          defaultAmount={paymentModalTarget?.amount}
          circularId={paymentModalTarget?.circularId}
          circularTitle={paymentModalTarget?.circularTitle}
          guardianPhone={paymentModalTarget?.guardianPhone}
          guardianAddress={paymentModalTarget?.guardianAddress}
          onSubmitPayment={handlePaymentSubmitted}
        />

        {/* Full-Screen Document Image Zoom Modal on Profile Tab */}
        {zoomedScan && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={zoomedScan.title}
            onClick={() => setZoomedScan(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl rounded-2xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 pb-3 mb-4 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white">
                    {zoomedScan.title}
                  </h3>
                  <p className="text-xs font-mono-num text-stone-600 dark:text-stone-400 mt-0.5">
                    {zoomedScan.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomedScan(null)}
                  aria-label="Close full-screen document zoom"
                  className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center bg-stone-950/95 rounded-xl p-3 max-h-[78vh] overflow-auto">
                <img
                  src={zoomedScan.imageUrl}
                  alt={zoomedScan.title}
                  referrerPolicy="no-referrer"
                  className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  /* ==========================================================================
     ISOLATED DESK 3: ADMIN VERIFICATION REVIEW DESK (COMPACT TABBED & ACCORDION UI)
     ========================================================================== */
  const pendingPaymentsCount = adminVisiblePayments.filter((p) =>
    matchesAdminTabFilter(p.status, 'Pending')
  ).length;
  const pendingVerificationsCount = adminVisibleRequests.filter((r) =>
    matchesAdminTabFilter(r.status, 'Pending')
  ).length;
  const pendingApplicationsCount = adminVisibleApplications.filter((a) =>
    matchesAdminTabFilter(a.status, 'Pending')
  ).length;
  const pendingGuardiansCount = guardianRequests.filter(
    (g) => (g.status || 'pending').toLowerCase() !== 'converted'
  ).length;

  const handleGlobalSortChange = (nextSort: AdminSortOrder) => {
    setAdminSortBy(nextSort);
    setPaymentSortBy(nextSort);
    setVerificationSortBy(nextSort);
  };

  const handleGlobalStatusChange = (nextStatus: 'All' | VerificationStatus) => {
    setStatusFilter(nextStatus);
    setPaymentStatusFilter(nextStatus);
  };

  const setAllAccordionOpen = (isOpen: boolean) => {
    setOpenAdminSections({
      homepage_cms: isOpen,
      site_settings: isOpen,
      notice_board: isOpen,
      guardian_requests: isOpen,
      payments: isOpen,
      payments_and_guardians: isOpen,
      verifications: isOpen,
      applications: isOpen,
    });
  };

  const autoCalcVerifiedCount =
    typeof liveVerifiedTutorsCount === 'number'
      ? liveVerifiedTutorsCount
      : adminVisibleRequests.filter((r) => r.status === 'Approved').length;
  const autoCalcOnlineCount =
    typeof liveOnlineTutorsCount === 'number'
      ? liveOnlineTutorsCount
      : adminVisibleRequests.filter((r) => r.status === 'Approved').length;
  const autoCalcActiveCircularsCount = adminVisibleJobs.filter(
    (j) => (j.status || 'Active') === 'Active'
  ).length;
  const resolvedAdminCounterDisplay = resolveHomepageLiveStats(
    {
      ...DEFAULT_SITE_SOCIAL_SETTINGS,
      ...(siteSocialSettings || {}),
      stats_mode: cmsStatsMode,
    },
    {
      verifiedTutorsCount: autoCalcVerifiedCount,
      onlineTutorsCount: autoCalcOnlineCount,
      activeCircularsCount: adminVisibleJobs.length,
      totalApplicationsCount: adminVisibleApplications.length,
    },
    'en'
  );
  const displayCircularsCount =
    cmsStatsMode === 'manual'
      ? resolvedAdminCounterDisplay.activeCircularsDisplay
      : String(adminVisibleJobs.length);
  const displayApplicationsCount =
    cmsStatsMode === 'manual'
      ? resolvedAdminCounterDisplay.totalApplicationsDisplay
      : String(adminVisibleApplications.length);

  return (
    <section
      id="admin-review-desk"
      aria-label="Admin Verification Review Desk"
      className="w-full max-w-[1280px] mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-5 space-y-3 overflow-x-hidden"
    >
      {/* Compact Top Header + Quick Action Bar + Tabbed Navigation + Master Sort & Filter */}
      <div className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-3 sm:p-3.5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 border border-[#047857]/30 text-[11px] font-bold text-[#047857] dark:text-emerald-400">
              <Lock className="w-3 h-3" />
              <span>
                {lang === 'en' ? 'Admin Review Desk' : 'অ্যাডমিন রিভিউ ডেস্ক'}
              </span>
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
              {lang === 'en'
                ? 'Admin Verification Review Desk'
                : 'অ্যাডমিন এনআইডি ও আইডি যাচাইকরণ ডেস্ক'}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono-num text-stone-500 dark:text-stone-400 pl-1">
              · {totalCount} {lang === 'en' ? 'Records' : 'রেকর্ড'} ({pendingCount}{' '}
              {lang === 'en' ? 'Pending' : 'পেন্ডিং'})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {onRefreshApplications && (
              <button
                type="button"
                onClick={onRefreshApplications}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-stone-800 hover:border-[#047857] border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#047857] dark:text-emerald-400" />
                <span>
                  {lang === 'en' ? 'Refresh Live Queue' : 'লাইভ রিফ্রেশ'}
                </span>
              </button>
            )}

            {onOpenAdminPostJob && (
              <button
                type="button"
                onClick={onOpenAdminPostJob}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>
                  {lang === 'en'
                    ? 'Post Tuition Circular (Admin Only)'
                    : 'নতুন টিউশনি সার্কুলার পোস্ট করুন (শুধুমাত্র অ্যাডমিন)'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onClearAdminDesk}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-800 hover:bg-red-700 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {lang === 'en'
                  ? 'Clear Admin Desk Only'
                  : 'শুধুমাত্র অ্যাডমিন ডেস্ক মুছুন'}
              </span>
            </button>
          </div>
        </div>

        {/* Two-Row Header Layout: Row 1 (Section Tabs) + Row 2 (Search, Sort, Filter, Expand/Collapse Controls) */}
        <div className="mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-800 flex flex-col gap-3">
          {/* Row 1: Clean Admin Sub-Tabs — 100% visible with flex-wrap gap-2 w-full */}
          <div
            role="tablist"
            aria-label="Admin Dashboard Sections"
            className="flex flex-wrap items-center gap-2 w-full"
          >
            {(
              [
                {
                  id: 'all_accordion' as const,
                  labelEn: 'All Sections',
                  labelBn: 'সকল সেকশন',
                  badge: 7,
                },
                {
                  id: 'verifications' as const,
                  labelEn: '🛡️ Tutor Verifications',
                  labelBn: '🛡️ টিউটর ভেরিফিকেশন',
                  badge: adminVisibleRequests.length,
                  pending: pendingVerificationsCount,
                },
                {
                  id: 'applications' as const,
                  labelEn: '📋 Tuition Circulars & Applications',
                  labelBn: '📋 টিউশনি সার্কুলার ও আবেদন',
                  badge: adminVisibleApplications.length,
                  pending: pendingApplicationsCount,
                },
                {
                  id: 'payments_and_guardians' as const,
                  labelEn: '💳 Payments & Guardian Requests',
                  labelBn: '💳 পেমেন্ট ও অভিভাবক রিকোয়েস্ট',
                  badge: adminVisiblePayments.length + guardianRequests.length,
                  pending: pendingPaymentsCount + pendingGuardiansCount,
                },
                {
                  id: 'homepage_cms' as const,
                  labelEn: '📊 Homepage & Stats CMS',
                  labelBn: '📊 হোমপেজ ও স্ট্যাটাস সিএমএস',
                },
                {
                  id: 'site_settings' as const,
                  labelEn: '🌐 Site Settings',
                  labelBn: '🌐 সাইট ও হোয়াটসঅ্যাপ',
                },
                {
                  id: 'notice_board' as const,
                  labelEn: '📢 Notice Board',
                  labelBn: '📢 নোটিশ বোর্ড',
                  badge: siteNotices.length,
                },
              ]
            ).map((tab) => {
              const isSelected = activeAdminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setActiveAdminTab(tab.id);
                    if (tab.id === 'all_accordion') {
                      setAllAccordionOpen(true);
                    } else if (tab.id === 'payments_and_guardians') {
                      setOpenAdminSections((prev) => ({
                        ...prev,
                        payments: true,
                        guardian_requests: true,
                      }));
                    } else {
                      setOpenAdminSections((prev) => ({
                        ...prev,
                        [tab.id]: true,
                      }));
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#059669] to-[#047857] text-white border-[#047857] shadow-2xs'
                      : 'bg-[#FAF8F5] dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-[#047857]/50'
                  }`}
                >
                  <span>{lang === 'en' ? tab.labelEn : tab.labelBn}</span>
                  {typeof tab.badge === 'number' && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono-num font-extrabold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : tab.pending && tab.pending > 0
                          ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                          : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      ({tab.badge})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Row 2: Search Input, Sort By, Filter Status, Expand All, and Collapse All Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 w-full pt-2 border-t border-stone-200/60 dark:border-stone-800/80">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'en'
                      ? 'Search name, phone, TrxID, NID, class...'
                      : 'নাম, ফোন, TrxID, এনআইডি খুঁজুন...'
                  }
                  aria-label="Search Admin Verification Desk"
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                />
              </div>

              <div className="inline-flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#047857] dark:text-emerald-400 shrink-0" />
                <label
                  htmlFor="admin-global-sort-select"
                  className="text-[11px] font-bold text-stone-600 dark:text-stone-300 whitespace-nowrap"
                >
                  {lang === 'en' ? 'Sort By:' : 'সাজান:'}
                </label>
                <select
                  id="admin-global-sort-select"
                  aria-label="Sort By"
                  value={adminSortBy}
                  onChange={(e) =>
                    handleGlobalSortChange(e.target.value as AdminSortOrder)
                  }
                  className="bg-transparent text-xs font-bold text-stone-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="newest" className="bg-white dark:bg-stone-900">
                    {lang === 'en' ? 'Newest' : 'নতুন'}
                  </option>
                  <option value="oldest" className="bg-white dark:bg-stone-900">
                    {lang === 'en' ? 'Oldest' : 'পুরাতন'}
                  </option>
                  <option
                    value="pending_first"
                    className="bg-white dark:bg-stone-900"
                  >
                    {lang === 'en' ? 'Pending First' : 'পেন্ডিং আগে'}
                  </option>
                </select>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <label
                  htmlFor="admin-global-filter-select"
                  className="text-[11px] font-bold text-stone-600 dark:text-stone-300 whitespace-nowrap"
                >
                  {lang === 'en' ? 'Filter:' : 'ফিল্টার:'}
                </label>
                <select
                  id="admin-global-filter-select"
                  aria-label="Filter Status"
                  value={statusFilter}
                  onChange={(e) =>
                    handleGlobalStatusChange(
                      e.target.value as 'All' | VerificationStatus
                    )
                  }
                  className="bg-transparent text-xs font-bold text-stone-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="All" className="bg-white dark:bg-stone-900">
                    {lang === 'en' ? 'All Status' : 'সকল স্ট্যাটাস'} ({totalCount})
                  </option>
                  <option value="Pending" className="bg-white dark:bg-stone-900">
                    {lang === 'en' ? 'Pending' : 'পেন্ডিং'} ({pendingCount})
                  </option>
                  <option value="Approved" className="bg-white dark:bg-stone-900">
                    {lang === 'en' ? 'Approved' : 'অনুমোদিত'} ({approvedCount})
                  </option>
                  <option value="Rejected" className="bg-white dark:bg-stone-900">
                    {lang === 'en' ? 'Rejected' : 'বাতিল'} ({rejectedCount})
                  </option>
                </select>
              </div>
            </div>

            <div className="inline-flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveAdminTab('all_accordion');
                  setAllAccordionOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-[#047857] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
              >
                {lang === 'en' ? 'Expand All' : 'সব খুলুন'}
              </button>
              <button
                type="button"
                onClick={() => setAllAccordionOpen(false)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 cursor-pointer"
              >
                {lang === 'en' ? 'Collapse All' : 'সব গুটিয়ে রাখুন'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {adminToast && (
        <div
          role={adminToast.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 shadow-sm ${
            adminToast.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/80 border-red-300 dark:border-red-800 text-red-700 dark:text-red-200'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {adminToast.type === 'error' ? (
              <XCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{adminToast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdminToast(null)}
            aria-label="Dismiss notification"
            className="p-1 rounded-lg hover:bg-black/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {lastDeskMessage && (
        <div
          role="status"
          className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-[#047857]/40 text-xs font-semibold text-[#047857] dark:text-emerald-300 flex items-center justify-between"
        >
          <span>{lastDeskMessage}</span>
        </div>
      )}

      {/* ====================================================================
         SECTION 0: HOMEPAGE & LIVE STATS CMS (Auto / Manual Toggle & Hero Copy)
         ==================================================================== */}
      {isSectionVisible('homepage_cms') && (
        <form
          onSubmit={handleSaveHomepageCms}
          data-testid="admin-homepage-stats-cms"
          aria-label="Homepage & Live Stats CMS"
          className="rounded-xl bg-white dark:bg-stone-900 border border-emerald-500/25 dark:border-stone-800 p-3.5 sm:p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => toggleAdminSection('homepage_cms')}
                aria-expanded={isSectionExpanded('homepage_cms')}
                className="inline-flex items-center gap-1.5 text-left cursor-pointer group"
              >
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-stone-900 dark:text-white flex items-center gap-1.5">
                  <span>📊 Homepage & Live Stats CMS (site_settings)</span>
                </h2>
                {isSectionExpanded('homepage_cms') ? (
                  <ChevronUp className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-white" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-white" />
                )}
              </button>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                  cmsStatsMode === 'auto'
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-[#047857] dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-400/50'
                }`}
              >
                <span>
                  {cmsStatsMode === 'auto'
                    ? '⚡ Automatic Mode (Live Counts)'
                    : '✏️ Manual Mode (Custom Strings)'}
                </span>
              </span>
            </div>

            <button
              type="submit"
              disabled={isSavingHomepageCms}
              className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] disabled:opacity-60 text-white text-xs font-extrabold transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isSavingHomepageCms
                  ? 'Saving Homepage & Stats...'
                  : 'Save Homepage & Stats'}
              </span>
            </button>
          </div>

          {isSectionExpanded('homepage_cms') && (
            <div className="mt-3.5 pt-3.5 border-t border-stone-200/80 dark:border-stone-800 space-y-4">
              {/* 1-Click Counter Mode Toggle Bar */}
              <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-stone-800/70 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="block text-xs font-extrabold text-stone-900 dark:text-white">
                    {lang === 'en'
                      ? '1-Click Trust Strip Counter Mode'
                      : 'হোমপেজ ট্রাস্ট স্ট্রিপ কাউন্টার মোড'}
                  </span>
                  <span className="block text-[11px] text-stone-500 dark:text-stone-400">
                    {cmsStatsMode === 'auto'
                      ? `Live memory counts: ${autoCalcVerifiedCount}+ Verified Tutors · ${autoCalcOnlineCount}+ Online Tutors · ${autoCalcActiveCircularsCount} Active Circulars`
                      : 'Custom Manual Mode active — Homepage displays your custom strings below.'}
                  </span>
                </div>

                <div
                  role="group"
                  aria-label="Counter Mode Toggle"
                  className="inline-flex items-center p-1 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shrink-0"
                >
                  <button
                    type="button"
                    aria-pressed={cmsStatsMode === 'auto'}
                    onClick={() => void handleToggleCmsStatsMode('auto')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      cmsStatsMode === 'auto'
                        ? 'bg-gradient-to-r from-[#059669] to-[#047857] text-white shadow-2xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    ⚡ Automatic Mode
                  </button>
                  <button
                    type="button"
                    aria-pressed={cmsStatsMode === 'manual'}
                    onClick={() => void handleToggleCmsStatsMode('manual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      cmsStatsMode === 'manual'
                        ? 'bg-gradient-to-r from-[#059669] to-[#047857] text-white shadow-2xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    ✏️ Manual Mode
                  </button>
                </div>
              </div>

              {/* Manual Counters & Trust Cards Grid */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#047857] dark:text-emerald-400 mb-2">
                  Live Platform Trust Strip Counters & Labels
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div>
                    <label
                      htmlFor="cms-manual-verified-tutors"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                    >
                      1. Verified Tutors (Manual String)
                    </label>
                    <input
                      id="cms-manual-verified-tutors"
                      type="text"
                      value={cmsManualVerifiedTutors}
                      onChange={(e) =>
                        setCmsManualVerifiedTutors(e.target.value)
                      }
                      placeholder="120+"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cms-manual-online-tutors"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                    >
                      2. Online Tutors (Manual String)
                    </label>
                    <input
                      id="cms-manual-online-tutors"
                      type="text"
                      value={cmsManualOnlineTutors}
                      onChange={(e) => setCmsManualOnlineTutors(e.target.value)}
                      placeholder="45+"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cms-manual-active-circulars"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                    >
                      3. Circulars Count (Manual)
                    </label>
                    <input
                      id="cms-manual-active-circulars"
                      type="text"
                      value={cmsManualActiveCirculars}
                      onChange={(e) =>
                        setCmsManualActiveCirculars(e.target.value)
                      }
                      placeholder="30+"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cms-manual-total-applications"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                    >
                      3b. Total Applications (Manual)
                    </label>
                    <input
                      id="cms-manual-total-applications"
                      type="text"
                      value={cmsManualTotalApplications}
                      onChange={(e) =>
                        setCmsManualTotalApplications(e.target.value)
                      }
                      placeholder="85"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cms-trust-card-3-value"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                    >
                      4. Trust Card 3 Value (e.g. 100%)
                    </label>
                    <input
                      id="cms-trust-card-3-value"
                      type="text"
                      value={cmsTrustCard3Value}
                      onChange={(e) => setCmsTrustCard3Value(e.target.value)}
                      placeholder="100%"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="cms-trust-card-3-label"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                    >
                      4b. Trust Card 3 Label
                    </label>
                    <input
                      id="cms-trust-card-3-label"
                      type="text"
                      value={cmsTrustCard3Label}
                      onChange={(e) => setCmsTrustCard3Label(e.target.value)}
                      placeholder="100% Smart NID Verified"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cms-trust-card-4-value"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                    >
                      5. Trust Card 4 Value (e.g. &lt; 24h)
                    </label>
                    <input
                      id="cms-trust-card-4-value"
                      type="text"
                      value={cmsTrustCard4Value}
                      onChange={(e) => setCmsTrustCard4Value(e.target.value)}
                      placeholder="< 24h"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cms-trust-card-4-label"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                    >
                      5b. Trust Card 4 Label
                    </label>
                    <input
                      id="cms-trust-card-4-label"
                      type="text"
                      value={cmsTrustCard4Label}
                      onChange={(e) => setCmsTrustCard4Label(e.target.value)}
                      placeholder="Fast Guardian Matching"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                    />
                  </div>
                </div>
              </div>

              {/* Homepage Hero & Dual Quick-Action Card Texts Editor */}
              <div className="pt-3 border-t border-stone-200/70 dark:border-stone-800">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#047857] dark:text-emerald-400 mb-2">
                  Homepage Hero & Dual Quick-Action Card Texts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  <div>
                    <label
                      htmlFor="cms-hero-top-badge-1"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                    >
                      Hero Top Badge 1 (hero_top_badge_1)
                    </label>
                    <input
                      id="cms-hero-top-badge-1"
                      type="text"
                      value={cmsHeroTopBadge1}
                      onChange={(e) => setCmsHeroTopBadge1(e.target.value)}
                      placeholder="🛡️ Manual NID & University ID Verification Workflow"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cms-hero-top-badge-2"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                    >
                      Hero Top Badge 2 (hero_top_badge_2)
                    </label>
                    <input
                      id="cms-hero-top-badge-2"
                      type="text"
                      value={cmsHeroTopBadge2}
                      onChange={(e) => setCmsHeroTopBadge2(e.target.value)}
                      placeholder="Verified Guardian Reviews"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cms-hero-title"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                    >
                      Main Hero Heading (hero_title)
                    </label>
                    <input
                      id="cms-hero-title"
                      type="text"
                      value={cmsHeroTitle}
                      onChange={(e) => setCmsHeroTitle(e.target.value)}
                      placeholder="Verified home & online tutors"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-extrabold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cms-guardian-card-title"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                    >
                      Guardian Card Title (guardian_card_title)
                    </label>
                    <input
                      id="cms-guardian-card-title"
                      type="text"
                      value={cmsGuardianCardTitle}
                      onChange={(e) => setCmsGuardianCardTitle(e.target.value)}
                      placeholder="Need a Verified Home/Online Tutor?"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cms-guardian-card-badge"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                    >
                      Guardian Trial Badge (guardian_card_badge)
                    </label>
                    <input
                      id="cms-guardian-card-badge"
                      type="text"
                      value={cmsGuardianCardBadge}
                      onChange={(e) => setCmsGuardianCardBadge(e.target.value)}
                      placeholder="2 Free Trial Classes"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cms-tutor-card-title"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                    >
                      Tutor Card Title (tutor_card_title)
                    </label>
                    <input
                      id="cms-tutor-card-title"
                      type="text"
                      value={cmsTutorCardTitle}
                      onChange={(e) => setCmsTutorCardTitle(e.target.value)}
                      placeholder="Looking for Tuitions?"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label
                      htmlFor="cms-tutor-card-desc"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                    >
                      Tutor Card Description (tutor_card_desc)
                    </label>
                    <input
                      id="cms-tutor-card-desc"
                      type="text"
                      value={cmsTutorCardDesc}
                      onChange={(e) => setCmsTutorCardDesc(e.target.value)}
                      placeholder="Verify your Smart NID & Student ID once to get the glowing Verified Tutor badge..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      )}


      {/* ====================================================================
         SECTION 1: SITE SETTINGS & WHATSAPP (Collapsible Card)
         ==================================================================== */}
      {isSectionVisible('site_settings') && (
        <form
          onSubmit={handleSaveSocialChannels}
          aria-label="Official Social & Support Channels"
          className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-3 sm:p-4 shadow-2xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => toggleAdminSection('site_settings')}
                aria-expanded={isSectionExpanded('site_settings')}
                className="inline-flex items-center gap-1.5 text-left cursor-pointer group"
              >
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-stone-900 dark:text-white flex items-center gap-1.5">
                  <span>🌐 Official Social & Support Channels</span>
                </h2>
                {isSectionExpanded('site_settings') ? (
                  <ChevronUp className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-white" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-white" />
                )}
              </button>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isSocialChannelActive(socialFacebookInput)
                    ? 'bg-[#1877F2]/10 text-[#1877F2] dark:text-blue-400 border-[#1877F2]/30'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700'
                }`}
              >
                <span>
                  Facebook:{' '}
                  {isSocialChannelActive(socialFacebookInput)
                    ? 'Active'
                    : 'Inactive'}
                </span>
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isSocialChannelActive(socialWhatsappInput)
                    ? 'bg-[#25D366]/10 text-[#128C7E] dark:text-emerald-400 border-[#25D366]/40'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700'
                }`}
              >
                <span>
                  WhatsApp:{' '}
                  {isSocialChannelActive(socialWhatsappInput)
                    ? 'Active'
                    : 'Inactive'}
                </span>
              </span>
            </div>

            <button
              type="submit"
              disabled={isSavingSocialLinks}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#047857] hover:bg-[#065F46] disabled:opacity-60 text-white text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isSavingSocialLinks
                  ? 'Saving & Publishing...'
                  : 'Save & Publish Live'}
              </span>
            </button>
          </div>

          {isSectionExpanded('site_settings') && (
            <div className="mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label
                      htmlFor="admin-facebook-url-input"
                      className="text-[11px] font-bold text-stone-700 dark:text-stone-200 truncate"
                    >
                      Facebook Page / Profile URL
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      {isSocialChannelActive(socialFacebookInput)
                        ? '● Live'
                        : '○ Off'}
                    </span>
                  </div>
                  <input
                    id="admin-facebook-url-input"
                    type="text"
                    value={socialFacebookInput}
                    onChange={(e) => setSocialFacebookInput(e.target.value)}
                    placeholder="https://www.facebook.com/yourpage"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#1877F2]"
                  />
                  {isSocialChannelActive(socialFacebookInput) && (
                    <div className="text-[10px] font-mono-num text-stone-400 truncate mt-0.5">
                      {normalizeFacebookUrl(socialFacebookInput)}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label
                      htmlFor="admin-whatsapp-contact-input"
                      className="text-[11px] font-bold text-stone-700 dark:text-stone-200 truncate"
                    >
                      WhatsApp Number or Direct Link
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      {isSocialChannelActive(socialWhatsappInput)
                        ? '● Live'
                        : '○ Off'}
                    </span>
                  </div>
                  <input
                    id="admin-whatsapp-contact-input"
                    type="text"
                    value={socialWhatsappInput}
                    onChange={(e) => setSocialWhatsappInput(e.target.value)}
                    placeholder="01308937770 or https://wa.me/..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white font-mono-num focus:outline-none focus:border-[#25D366]"
                  />
                  {isSocialChannelActive(socialWhatsappInput) && (
                    <div className="text-[10px] font-mono-num text-stone-400 truncate mt-0.5">
                      {formatWhatsAppDirectLink(socialWhatsappInput)}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="admin-bkash-number-input"
                    className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1 truncate"
                  >
                    Official bKash Number (site_settings)
                  </label>
                  <input
                    id="admin-bkash-number-input"
                    type="tel"
                    value={bkashNumberInput}
                    onChange={(e) => setBkashNumberInput(e.target.value)}
                    placeholder="01308937770"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#E2136E]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-nagad-number-input"
                    className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1 truncate"
                  >
                    Official Nagad Number (site_settings)
                  </label>
                  <input
                    id="admin-nagad-number-input"
                    type="tel"
                    value={nagadNumberInput}
                    onChange={(e) => setNagadNumberInput(e.target.value)}
                    placeholder="01308937770"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#F7941D]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-verification-fee-input"
                    className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1 truncate"
                  >
                    Verification Fee BDT (site_settings)
                  </label>
                  <input
                    id="admin-verification-fee-input"
                    type="number"
                    min={50}
                    value={verificationFeeInput}
                    onChange={(e) => setVerificationFeeInput(e.target.value)}
                    placeholder="500"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                  />
                </div>
              </div>

              {/* Site Settings Counter Control Bar (Automatic vs Manual) */}
              <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-stone-800/70 border border-emerald-500/20 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <span className="block text-xs font-extrabold text-stone-900 dark:text-white">
                      Counter Mode (Circulars, Applications &amp; Dashboard Stats)
                    </span>
                    <span className="block text-[11px] text-stone-500 dark:text-stone-400">
                      {cmsStatsMode === 'auto'
                        ? `Automatic Live DB Count: ${adminVisibleJobs.length} Circulars · ${adminVisibleApplications.length} Total Applications`
                        : `Manual Custom Digits: ${displayCircularsCount} Circulars · ${displayApplicationsCount} Total Applications`}
                    </span>
                  </div>

                  <div
                    role="group"
                    aria-label="Site Settings Counter Mode Toggle"
                    className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shrink-0"
                  >
                    <button
                      type="button"
                      aria-pressed={cmsStatsMode === 'auto'}
                      onClick={() => void handleToggleCmsStatsMode('auto')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                        cmsStatsMode === 'auto'
                          ? 'bg-gradient-to-r from-[#059669] to-[#047857] text-white shadow-2xs'
                          : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                      }`}
                    >
                      Automatic (Live DB Count)
                    </button>
                    <button
                      type="button"
                      aria-pressed={cmsStatsMode === 'manual'}
                      onClick={() => void handleToggleCmsStatsMode('manual')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                        cmsStatsMode === 'manual'
                          ? 'bg-gradient-to-r from-[#059669] to-[#047857] text-white shadow-2xs'
                          : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                      }`}
                    >
                      Manual (Custom Digits)
                    </button>
                  </div>
                </div>

                {cmsStatsMode === 'manual' && (
                  <div className="pt-2 border-t border-stone-200/70 dark:border-stone-700/70 grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                    <div>
                      <label
                        htmlFor="site-settings-manual-circulars"
                        className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                      >
                        Circulars Count
                      </label>
                      <input
                        id="site-settings-manual-circulars"
                        type="text"
                        value={cmsManualActiveCirculars}
                        onChange={(e) =>
                          setCmsManualActiveCirculars(e.target.value)
                        }
                        placeholder="30+"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="site-settings-manual-applications"
                        className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                      >
                        Total Applications Count
                      </label>
                      <input
                        id="site-settings-manual-applications"
                        type="text"
                        value={cmsManualTotalApplications}
                        onChange={(e) =>
                          setCmsManualTotalApplications(e.target.value)
                        }
                        placeholder="85"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="site-settings-manual-verified"
                        className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                      >
                        Verified Tutors Count
                      </label>
                      <input
                        id="site-settings-manual-verified"
                        type="text"
                        value={cmsManualVerifiedTutors}
                        onChange={(e) =>
                          setCmsManualVerifiedTutors(e.target.value)
                        }
                        placeholder="120+"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="site-settings-manual-online"
                        className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                      >
                        Online Tutors Count
                      </label>
                      <input
                        id="site-settings-manual-online"
                        type="text"
                        value={cmsManualOnlineTutors}
                        onChange={(e) =>
                          setCmsManualOnlineTutors(e.target.value)
                        }
                        placeholder="45+"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isSavingHomepageCms}
                      onClick={() => void handleSaveHomepageCms()}
                      className="col-span-2 sm:col-span-1 min-h-[34px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] disabled:opacity-60 text-white text-xs font-extrabold transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {isSavingHomepageCms
                          ? 'Saving...'
                          : 'Save / Upload Counter'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      )}

      {/* ====================================================================
         SECTION 2: OFFICIAL NOTICE BOARD MANAGER (Collapsible Card)
         ==================================================================== */}
      {isSectionVisible('notice_board') && (
        <div
          id="admin-notice-manager-card"
          role="region"
          aria-label="Official Notice Board Manager"
          className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-3 sm:p-4 shadow-2xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => toggleAdminSection('notice_board')}
                aria-expanded={isSectionExpanded('notice_board')}
                className="inline-flex items-center gap-1.5 text-left cursor-pointer group"
              >
                <Megaphone className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0" />
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-stone-900 dark:text-white">
                  {lang === 'en'
                    ? 'Official Notice Board Manager (site_notices)'
                    : 'অফিসিয়াল নোটিশ বোর্ড ম্যানেজার (site_notices)'}
                </h2>
                {isSectionExpanded('notice_board') ? (
                  <ChevronUp className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-white" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-white" />
                )}
              </button>
              <span className="font-mono-num text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                {siteNotices.filter((n) => n.is_active).length} Active /{' '}
                {siteNotices.length} Total
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (isNoticeFormOpen && editingNoticeId) {
                  handleCancelNoticeEdit();
                } else {
                  setIsNoticeFormOpen(!isNoticeFormOpen);
                  setOpenAdminSections((prev) => ({
                    ...prev,
                    notice_board: true,
                  }));
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {isNoticeFormOpen ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>{editingNoticeId ? 'Cancel Editing' : 'Close Form'}</span>
                </>
              ) : (
                <>
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>+ Post New Notice</span>
                </>
              )}
            </button>
          </div>

          {isSectionExpanded('notice_board') && (
            <div className="mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-800 space-y-3">
              {isNoticeFormOpen && (
                <form
                  id="admin-notice-manager-form"
                  onSubmit={handleSaveNoticeSubmit}
                  className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-emerald-200/80 dark:border-emerald-800/80 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div className="md:col-span-2">
                      <label
                        htmlFor="admin-notice-title-input"
                        className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1"
                      >
                        Notice Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="admin-notice-title-input"
                        type="text"
                        required
                        value={noticeTitle}
                        onChange={(e) => setNoticeTitle(e.target.value)}
                        placeholder={
                          lang === 'en'
                            ? 'e.g. Urgent Tuition Verification Update for Madaripur Sadar'
                            : 'উদাঃ মাদারীপুর সদর ও শিবচরে নতুন টিউটর নীতিমালা ও ভেরিফিকেশন আপডেট'
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="admin-notice-category-input"
                        className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1"
                      >
                        Category Badge
                      </label>
                      <select
                        id="admin-notice-category-input"
                        value={noticeCategory}
                        onChange={(e) => setNoticeCategory(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-750 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">
                          {lang === 'en' ? 'Select Category' : 'ক্যাটাগরি নির্বাচন'}
                        </option>
                        {NOTICE_DEFAULT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        {noticeCategory &&
                          !NOTICE_DEFAULT_CATEGORIES.includes(noticeCategory) && (
                            <option value={noticeCategory}>
                              {noticeCategory}
                            </option>
                          )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-notice-content-input"
                      className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1"
                    >
                      Notice Description / Text Content{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="admin-notice-content-input"
                      rows={3}
                      required
                      value={noticeContent}
                      onChange={(e) => setNoticeContent(e.target.value)}
                      placeholder={
                        lang === 'en'
                          ? 'Write the detailed notice text, guidelines, or instructions here...'
                          : 'বিস্তারিত বিজ্ঞপ্তি, নিয়মাবলী বা প্রয়োজনীয় নির্দেশনা এখানে লিখুন...'
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-center">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="admin-notice-file-upload"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-xs font-bold text-stone-700 dark:text-stone-200 cursor-pointer shrink-0"
                      >
                        <FileUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Upload Poster / Image File</span>
                      </label>
                      <input
                        id="admin-notice-file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleNoticeImageFileUpload}
                        className="sr-only"
                      />
                      <input
                        type="url"
                        value={noticeImageUrl}
                        onChange={(e) => setNoticeImageUrl(e.target.value)}
                        placeholder="https://... or data:image/..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={noticeIsActive}
                          onChange={(e) => setNoticeIsActive(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                        />
                        <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                          {lang === 'en' ? 'Publish as Active' : 'সক্রিয় রাখুন'}
                        </span>
                      </label>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleCancelNoticeEdit}
                          disabled={isSavingNotice}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-750 hover:bg-stone-300 text-stone-700 dark:text-stone-300 text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingNotice}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {isSavingNotice
                              ? 'Saving...'
                              : editingNoticeId
                              ? 'Save Changes'
                              : 'Publish Notice'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {siteNotices.length === 0 ? (
                <div className="px-3 py-2.5 rounded-lg border border-dashed border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400">
                  {lang === 'en'
                    ? 'No official notices published yet. Click "+ Post New Notice" to announce updates on the website Notice Board.'
                    : 'এখনও কোনো নোটিশ প্রকাশিত হয়নি।'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {siteNotices.map((n) => {
                    const bStyle = getNoticeCategoryBadgeStyle(n.badge_text);
                    return (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border flex items-start justify-between gap-2.5 transition-all ${
                          n.is_active
                            ? 'bg-[#FAF8F5] dark:bg-stone-850 border-stone-200 dark:border-stone-800'
                            : 'bg-stone-100/60 dark:bg-stone-900 border-stone-200/60 dark:border-stone-800/60 opacity-80'
                        }`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${bStyle.bg} ${bStyle.text} ${bStyle.border}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${bStyle.dot}`}
                              />
                              <span>{n.badge_text || 'Official Notice'}</span>
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                n.is_active
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                              }`}
                            >
                              {n.is_active ? '● Active' : '○ Hidden'}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-stone-900 dark:text-white truncate">
                            {n.title}
                          </h4>
                          <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-1">
                            {n.content}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditNotice(n)}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-stone-800 hover:bg-stone-100 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 cursor-pointer"
                            title="Edit notice"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleNotice(n)}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 cursor-pointer"
                          >
                            {n.is_active ? 'Hide' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNotice(n)}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
         SECTION 3: GUARDIAN TUITION REQUESTS (Collapsible Card)
         ==================================================================== */}
      {isSectionVisible('guardian_requests') && (
        <div
          id="admin-guardian-requests-card"
          role="region"
          aria-label="Guardian Tuition Requests"
          className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-3 sm:p-4 shadow-2xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => toggleAdminSection('guardian_requests')}
                aria-expanded={isSectionExpanded('guardian_requests')}
                className="inline-flex items-center gap-1.5 text-left cursor-pointer group"
              >
                <UserCheck className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0" />
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-stone-900 dark:text-white">
                  {lang === 'en'
                    ? 'Guardian Tuition Requests (guardian_requests)'
                    : 'অভিভাবক টিউটর রিকোয়েস্টসমূহ (guardian_requests)'}
                </h2>
                {isSectionExpanded('guardian_requests') ? (
                  <ChevronUp className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-white" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-white" />
                )}
              </button>
              <span className="font-mono-num text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                {pendingGuardiansCount} Pending / {guardianRequests.length}{' '}
                Total
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <select
                aria-label="Filter Guardian Requests"
                value={guardianStatusFilter}
                onChange={(e) =>
                  setGuardianStatusFilter(
                    e.target.value as 'All' | 'pending' | 'contacted' | 'converted'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                <option value="All">All Guardian Requests</option>
                <option value="pending">⏳ Pending Only</option>
                <option value="contacted">📞 Contacted Only</option>
                <option value="converted">✅ Converted / Contacted</option>
              </select>
            </div>
          </div>

          {isSectionExpanded('guardian_requests') && (
            <div className="mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-800">
              {filteredGuardianRequests.length === 0 ? (
                <div className="px-3 py-4 rounded-lg border border-dashed border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400">
                  {lang === 'en'
                    ? 'No guardian requests submitted yet.'
                    : 'এখনও কোনো অভিভাবক টিউটর রিকোয়েস্ট করেননি।'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredGuardianRequests.map((rawReq) => {
                    const req = extractDetailedGuardianRequestFields(rawReq);
                    const normalizedStatus = (req.status || 'pending').toLowerCase();
                    const isPending = normalizedStatus === 'pending';
                    const isConverted = normalizedStatus === 'converted';
                    const isContacted = normalizedStatus === 'contacted';
                    const isContactedOrConverted = isConverted || isContacted;

                    const subjectBadges = (req.subjects || '')
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);

                    const cleanDigitsPhone = (req.guardianPhone || '').replace(
                      /[^0-9]/g,
                      ''
                    );
                    const whatsappTargetPhone = cleanDigitsPhone.startsWith('88')
                      ? cleanDigitsPhone
                      : `88${cleanDigitsPhone}`;
                    const whatsappMessage = encodeURIComponent(
                      `আসসালামু আলাইকুম ${req.guardianName}, মাদারীপুর টিউটর জোন (Tutor Zone) থেকে আপনার ${req.studentClass}-এর টিউটর রিকোয়েস্ট (#${req.id}) সম্পর্কে যোগাযোগ করছি।`
                    );

                    const formattedSubmittedAt = (() => {
                      if (!req.createdAt) return 'Recently Submitted';
                      const parsed = new Date(req.createdAt);
                      if (Number.isNaN(parsed.getTime())) return req.createdAt;
                      return parsed.toLocaleString('en-BD', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    })();

                    return (
                      <div
                        key={req.id}
                        data-testid={`guardian-request-card-${req.id}`}
                        className={`p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between gap-3.5 transition-all ${
                          isPending
                            ? 'bg-amber-50/35 dark:bg-amber-950/15 border-amber-200/90 dark:border-amber-800/80'
                            : isContactedOrConverted
                            ? 'bg-emerald-50/35 dark:bg-emerald-950/15 border-emerald-200/90 dark:border-emerald-800/80'
                            : 'bg-[#FAF8F5] dark:bg-stone-850 border-stone-200 dark:border-stone-800'
                        }`}
                      >
                        {/* Top Header Bar: Guardian Name, Request ID, Timestamp, & Interactive Status Toggles */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-stone-200/80 dark:border-stone-800">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#047857]/10 dark:bg-emerald-500/15 text-[#047857] dark:text-emerald-300 font-bold text-xs">
                              👤
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white">
                                  {req.guardianName}
                                </span>
                                <span className="font-mono-num text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-200/75 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                                  ID: {req.id}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                                    isPending
                                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                  }`}
                                >
                                  {isPending
                                    ? '⏳ Pending Review'
                                    : isConverted
                                    ? '✅ Converted to Live Circular'
                                    : '✅ Contacted / Converted'}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mt-0.5">
                                <Clock className="w-3 h-3 text-stone-400" />
                                <span>Submitted: {formattedSubmittedAt}</span>
                              </p>
                            </div>
                          </div>

                          {/* Status Toggle Buttons (⏳ Pending | ✅ Contacted / Converted | ❌ Archive/Delete) */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await onUpdateGuardianRequestStatus?.(
                                    req.id,
                                    'pending'
                                  );
                                  showAdminToast(
                                    'success',
                                    `Request ${req.id} marked as Pending.`
                                  );
                                } catch (err: any) {
                                  showAdminToast(
                                    'error',
                                    err?.message || 'Failed to update status.'
                                  );
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                isPending
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                              }`}
                            >
                              ⏳ Pending
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await onUpdateGuardianRequestStatus?.(
                                    req.id,
                                    'converted'
                                  );
                                  showAdminToast(
                                    'success',
                                    `Request ${req.id} marked as Contacted / Converted.`
                                  );
                                } catch (err: any) {
                                  showAdminToast(
                                    'error',
                                    err?.message || 'Failed to update status.'
                                  );
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                isContactedOrConverted
                                  ? 'bg-[#047857] text-white border-[#047857] shadow-2xs'
                                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-emerald-500'
                              }`}
                            >
                              ✅ Contacted / Converted
                            </button>

                            {onDeleteGuardianRequest && (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await onDeleteGuardianRequest(req.id);
                                    showAdminToast(
                                      'success',
                                      `Guardian request ${req.id} archived & deleted.`
                                    );
                                  } catch (err: any) {
                                    showAdminToast(
                                      'error',
                                      err?.message || 'Failed to delete request.'
                                    );
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 cursor-pointer inline-flex items-center gap-1"
                              >
                                ❌ Archive/Delete
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Structured 3-Column Full-Detail Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                          {/* Cell 1: 👤 Guardian Name, Request ID, & Submission Date/Time */}
                          <div className="p-2.5 rounded-xl bg-white/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                              👤 Guardian Name & Submission Info
                            </span>
                            <div className="space-y-0.5">
                              <p className="font-extrabold text-stone-900 dark:text-white text-xs sm:text-sm">
                                {req.guardianName}
                              </p>
                              <p className="text-[11px] font-mono-num text-stone-600 dark:text-stone-300">
                                Request ID: <span className="font-bold">{req.id}</span>
                              </p>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                                Date & Time: {formattedSubmittedAt}
                              </p>
                            </div>
                          </div>

                          {/* Cell 2: 📞 Phone Number (Copy + Direct Call + WhatsApp Chat) */}
                          <div className="p-2.5 rounded-xl bg-white/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                              📞 Phone (Copy / Call / WhatsApp)
                            </span>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="font-mono-num font-extrabold text-sm text-stone-900 dark:text-white">
                                  {req.guardianPhone}
                                </span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(
                                        req.guardianPhone
                                      );
                                      setCopiedGuardianPhoneId(req.id);
                                      setTimeout(() => {
                                        setCopiedGuardianPhoneId((prev) =>
                                          prev === req.id ? null : prev
                                        );
                                      }, 2000);
                                      showAdminToast(
                                        'success',
                                        `Copied phone number: ${req.guardianPhone}`
                                      );
                                    } catch {
                                      showAdminToast(
                                        'error',
                                        'Could not copy phone number.'
                                      );
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-[10px] font-bold border border-stone-200 dark:border-stone-700 cursor-pointer"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                  <span>
                                    {copiedGuardianPhoneId === req.id
                                      ? 'Copied!'
                                      : 'Copy'}
                                  </span>
                                </button>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <a
                                  href={`tel:${req.guardianPhone}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-[11px] font-bold shadow-2xs"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>Direct Call</span>
                                </a>
                                <a
                                  href={`https://wa.me/${whatsappTargetPhone}?text=${whatsappMessage}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WhatsApp Chat</span>
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Cell 3: 🎓 Class, Medium/Version, School/Institute, & Number of Students */}
                          <div className="p-2.5 rounded-xl bg-white/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                              🎓 Class, Medium & School/Institute
                            </span>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-[#047857] dark:text-emerald-300 font-extrabold text-xs border border-emerald-200 dark:border-emerald-800">
                                  {req.studentClass}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200 dark:border-indigo-800">
                                  {req.mediumVersion || 'Bangla Medium'}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-700 dark:text-stone-300 font-semibold">
                                🏫 School/Institute:{' '}
                                <span className="font-bold text-stone-900 dark:text-white">
                                  {req.schoolCollegeName || 'Not Specified'}
                                </span>
                              </p>
                              <p className="text-[11px] text-stone-600 dark:text-stone-400">
                                👥 Students:{' '}
                                <span className="font-bold text-stone-900 dark:text-white">
                                  {req.numberOfStudents || 1} Student(s)
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Cell 4: 📚 All Requested Subjects (clear readable badges) */}
                          <div className="p-2.5 rounded-xl bg-white/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                              📚 Requested Subjects
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-0.5">
                              {subjectBadges.length > 0 ? (
                                subjectBadges.map((subj, idx) => (
                                  <span
                                    key={`${req.id}-subj-${idx}`}
                                    className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-[11px] border border-stone-200/90 dark:border-stone-700"
                                  >
                                    {subj}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                                  {req.subjects || 'All General Subjects'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Cell 5: 👨‍🏫 Tutor Gender Preference & Preferred University/Qualification */}
                          <div className="p-2.5 rounded-xl bg-white/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                              👨‍🏫 Tutor Gender & Qualification Preference
                            </span>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                                  Gender:
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold text-[11px] border border-amber-200 dark:border-amber-800">
                                  {req.preferredGender || 'Any'} Tutor
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-600 dark:text-stone-300">
                                🎓 Preferred Institute:{' '}
                                <span className="font-bold text-stone-900 dark:text-white">
                                  {req.preferredUniversity ||
                                    'Any Reputed College / University'}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Cell 6: 💰 Salary (BDT), Days/Week, & Preferred Tutoring Time */}
                          <div className="p-2.5 rounded-xl bg-white/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                              💰 Salary, Days/Week & Time
                            </span>
                            <div className="space-y-1">
                              <p className="text-sm sm:text-base font-mono-num font-extrabold text-[#047857] dark:text-emerald-400">
                                ৳{Number(req.offeredSalary || 0).toLocaleString()}{' '}
                                <span className="text-[11px] font-semibold text-stone-500">
                                  BDT / month
                                </span>
                              </p>
                              <p className="text-[11px] font-bold text-stone-800 dark:text-stone-200">
                                📅 Schedule: {req.daysPerWeek} Days / Week
                              </p>
                              <p className="text-[11px] text-stone-600 dark:text-stone-400">
                                ⏰ Time/Duration:{' '}
                                <span className="font-semibold text-stone-900 dark:text-white">
                                  {req.preferredTimeDuration ||
                                    'Flexible (Afternoon / Evening)'}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Row 3 of 3-Column Grid (Full 3-column span): 📍 Upazila + Full Detailed Home Address */}
                          <div className="md:col-span-2 lg:col-span-3 p-2.5 rounded-xl bg-white/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                              📍 Upazila / Area & Full Detailed Home Address
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/80 text-[#047857] dark:text-emerald-300 font-extrabold text-xs shrink-0">
                                <MapPin className="w-3.5 h-3.5" />
                                {req.upazilaArea}
                              </span>
                              <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 whitespace-pre-wrap break-words leading-relaxed">
                                {req.fullAddress}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 📝 Special Requirements / Guardian's Note (Full-Width Highlighted Callout Box) */}
                        <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/80">
                          <div className="flex items-start gap-2">
                            <span className="text-sm shrink-0">📝</span>
                            <div className="space-y-0.5 flex-1">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                                Special Requirements / Guardian&apos;s Note
                              </span>
                              <p className="text-xs font-medium text-stone-800 dark:text-stone-200 whitespace-pre-wrap break-words">
                                {req.specialRequirements &&
                                req.specialRequirements.trim().length > 0
                                  ? req.specialRequirements
                                  : lang === 'en'
                                  ? 'No additional special note provided by guardian. Standard verification & punctual attendance expected.'
                                  : 'অভিভাবক কোনো অতিরিক্ত বিশেষ নির্দেশনা দেননি। নিয়মিত ও সময়নিষ্ঠ টিউশনি প্রত্যাশিত।'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Bar: View & Edit Full Details + 1-Click Convert to Live Circular */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <span className="text-[11px] text-stone-500 dark:text-stone-400">
                            {lang === 'en'
                              ? 'Inspect or edit any field before publishing to the live Tuition Circulars board.'
                              : 'লাইভ টিউশনি সার্কুলার বোর্ডে প্রকাশের আগে যেকোনো তথ্য যাচাই বা সম্পাদনা করুন।'}
                          </span>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingGuardianRequest(req)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 border border-stone-300 dark:border-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#047857] dark:text-emerald-400" />
                              <span>👁️ View & Edit Full Details</span>
                            </button>

                            {onConvertGuardianRequestToCircular && (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await onConvertGuardianRequestToCircular(
                                      req
                                    );
                                    showAdminToast(
                                      'success',
                                      lang === 'en'
                                        ? `Request by ${req.guardianName} published live as Tuition Circular!`
                                        : `${req.guardianName}-এর রিকোয়েস্ট সফলভাবে টিউশনি সার্কুলার হিসেবে লাইভ পোস্ট হয়েছে!`
                                    );
                                  } catch (err: any) {
                                    showAdminToast(
                                      'error',
                                      err?.message ||
                                        'Failed to convert request to circular.'
                                    );
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                                  isConverted
                                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                    : 'bg-[#047857] hover:bg-[#065F46] text-white'
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>
                                  {isConverted
                                    ? '🚀 Re-Publish / Convert Again'
                                    : '🚀 1-Click Convert to Live Circular'}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
         SECTION 4: BKASH & NAGAD PAYMENT APPROVALS (Collapsible Card + Sort/Filter)
         ==================================================================== */}
      {isSectionVisible('payments') && (
        <div
          role="region"
          aria-label="bKash and Nagad Payment Verification Queue"
          className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-3 sm:p-4 shadow-2xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => toggleAdminSection('payments')}
                aria-expanded={isSectionExpanded('payments')}
                className="inline-flex items-center gap-1.5 text-left cursor-pointer group"
              >
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-stone-900 dark:text-white flex items-center gap-1.5">
                  <span>
                    💳 bKash &amp; Nagad Payment Verification Queue
                    (payment_requests)
                  </span>
                </h2>
                {isSectionExpanded('payments') ? (
                  <ChevronUp className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-white" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-white" />
                )}
              </button>
              <span className="font-mono-num text-[11px] font-bold text-[#047857] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-[#047857]/30">
                {adminVisiblePayments.length} Total · {pendingPaymentsCount}{' '}
                Pending
              </span>
            </div>

            {/* Sort By & Status Filter + Open Modal Button */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="inline-flex items-center gap-1 bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2 py-1">
                <ArrowUpDown className="w-3 h-3 text-[#E2136E] shrink-0" />
                <label
                  htmlFor="payment-queue-sort-select"
                  className="text-[11px] font-bold text-stone-600 dark:text-stone-300 whitespace-nowrap"
                >
                  {lang === 'en' ? 'Sort By:' : 'সাজান:'}
                </label>
                <select
                  id="payment-queue-sort-select"
                  aria-label="Sort Payment Requests By"
                  value={paymentSortBy}
                  onChange={(e) =>
                    setPaymentSortBy(e.target.value as AdminSortOrder)
                  }
                  className="bg-transparent text-xs font-bold text-stone-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="newest" className="bg-white dark:bg-stone-900">
                    {lang === 'en' ? 'Newest' : 'নতুন'}
                  </option>
                  <option value="oldest" className="bg-white dark:bg-stone-900">
                    {lang === 'en' ? 'Oldest' : 'পুরাতন'}
                  </option>
                  <option
                    value="pending_first"
                    className="bg-white dark:bg-stone-900"
                  >
                    {lang === 'en' ? 'Pending First' : 'পেন্ডিং আগে'}
                  </option>
                </select>
              </div>

              <select
                id="payment-queue-filter-select"
                aria-label="Filter Payment Requests Status"
                value={paymentStatusFilter}
                onChange={(e) =>
                  setPaymentStatusFilter(
                    e.target.value as 'All' | VerificationStatus
                  )
                }
                className="px-2 py-1 rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                <option value="All">
                  {lang === 'en' ? 'All Payments' : 'সকল পেমেন্ট'} (
                  {adminVisiblePayments.length})
                </option>
                <option value="Pending">
                  {lang === 'en' ? 'Pending Only' : 'পেন্ডিং'} (
                  {pendingPaymentsCount})
                </option>
                <option value="Approved">
                  {lang === 'en' ? 'Approved Only' : 'অনুমোদিত'}
                </option>
                <option value="Rejected">
                  {lang === 'en' ? 'Rejected Only' : 'বাতিল'}
                </option>
              </select>

              <button
                type="button"
                onClick={() => handleOpenPaymentModal('bKash')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#E2136E] to-[#B80D57] hover:opacity-95 text-white text-xs font-extrabold transition-opacity cursor-pointer"
              >
                <CreditCard className="w-3 h-3" />
                <span>
                  {lang === 'en'
                    ? 'Open bKash / Nagad Modal'
                    : 'বিকাশ / নগদ মডাল খুলুন'}
                </span>
              </button>
            </div>
          </div>

          {isSectionExpanded('payments') && (
            <div className="mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-800">
              {filteredPayments.length === 0 ? (
                <div className="px-3 py-2.5 rounded-lg border border-dashed border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400">
                  {lang === 'en'
                    ? 'No bKash or Nagad payment requests in this filter view.'
                    : 'এই ফিল্টারে কোনো বিকাশ বা নগদ পেমেন্ট ভেরিফিকেশন আবেদন নেই।'}
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                  {filteredPayments.map((pay) => {
                    const isPayBusy = busyPaymentId === pay.id;
                    const payNote =
                      paymentAdminNotes[pay.id] ?? pay.adminNote ?? '';

                    return (
                      <article
                        key={pay.id}
                        className={`rounded-xl p-3 border transition-colors flex flex-col justify-between gap-2.5 ${
                          pay.status === 'Approved'
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-[#047857]/60'
                            : pay.status === 'Rejected'
                            ? 'bg-red-50/40 dark:bg-red-950/20 border-red-300 dark:border-red-900/50'
                            : 'bg-[#FAF8F5] dark:bg-stone-800/70 border-stone-200/90 dark:border-stone-700'
                        }`}
                      >
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 mb-2 border-b border-stone-200/70 dark:border-stone-700">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-extrabold text-white ${
                                  pay.paymentMethod === 'Nagad'
                                    ? 'bg-[#F7941D] text-stone-950'
                                    : 'bg-[#E2136E]'
                                }`}
                              >
                                {pay.paymentMethod}
                              </span>
                              <span className="font-mono-num font-bold text-[#047857] dark:text-emerald-400">
                                {pay.requestCode}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-bold text-stone-900 dark:text-white">
                                {pay.tutorName}
                              </span>
                            </div>

                            <div>
                              {pay.status === 'Approved' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#047857] dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approved &amp; Verified</span>
                                </span>
                              ) : pay.status === 'Rejected' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Rejected</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Pending Verification</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="block text-[10px] text-stone-500">
                                TrxID
                              </span>
                              <span className="font-mono-num font-extrabold text-stone-900 dark:text-white">
                                {pay.transactionId}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-stone-500">
                                Sender Mobile
                              </span>
                              <span className="font-mono-num font-bold text-stone-900 dark:text-white">
                                {pay.senderNumber}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-stone-500">
                                Amount
                              </span>
                              <span className="font-mono-num font-extrabold text-[#047857] dark:text-emerald-400">
                                {formatBDT(pay.amount, lang)}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-stone-500">
                                Purpose
                              </span>
                              <span className="font-semibold text-stone-800 dark:text-stone-200 truncate block">
                                {pay.purpose}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-200/70 dark:border-stone-700">
                          <input
                            type="text"
                            aria-label={`Admin note for payment ${pay.requestCode}`}
                            value={payNote}
                            onChange={(e) =>
                              setPaymentAdminNotes((prev) => ({
                                ...prev,
                                [pay.id]: e.target.value,
                              }))
                            }
                            placeholder="Admin verification note..."
                            className="flex-1 min-w-[130px] px-2.5 py-1 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white"
                          />

                          <button
                            type="button"
                            disabled={isPayBusy || pay.status === 'Approved'}
                            onClick={async () => {
                              setBusyPaymentId(pay.id);
                              try {
                                await onAdminPaymentDecision?.(
                                  pay.id,
                                  'Approved',
                                  payNote
                                );
                                showAdminToast(
                                  'success',
                                  `Approved ${pay.paymentMethod} payment (${pay.transactionId}) for ${pay.tutorName}`
                                );
                              } finally {
                                setBusyPaymentId(null);
                              }
                            }}
                            className="py-1 px-2.5 rounded-lg text-[11px] font-bold bg-[#047857] hover:bg-[#065F46] disabled:opacity-50 text-white transition-colors cursor-pointer"
                          >
                            ✅ Approve Payment
                          </button>

                          <button
                            type="button"
                            disabled={isPayBusy || pay.status === 'Rejected'}
                            onClick={async () => {
                              setBusyPaymentId(pay.id);
                              try {
                                await onAdminPaymentDecision?.(
                                  pay.id,
                                  'Rejected',
                                  payNote
                                );
                                showAdminToast(
                                  'error',
                                  `Rejected ${pay.paymentMethod} payment (${pay.transactionId})`
                                );
                              } finally {
                                setBusyPaymentId(null);
                              }
                            }}
                            className="py-1 px-2.5 rounded-lg text-[11px] font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-colors cursor-pointer"
                          >
                            ❌ Reject Payment
                          </button>

                          <button
                            type="button"
                            disabled={isPayBusy}
                            onClick={async () => {
                              setBusyPaymentId(pay.id);
                              try {
                                await onDeletePaymentRequest?.(pay.id);
                                showAdminToast(
                                  'success',
                                  `Deleted payment record ${pay.requestCode}`
                                );
                              } finally {
                                setBusyPaymentId(null);
                              }
                            }}
                            aria-label={`Delete payment ${pay.requestCode}`}
                            className="py-1 px-2.5 rounded-lg text-[11px] font-bold bg-stone-900 dark:bg-stone-700 hover:bg-red-800 text-white transition-colors cursor-pointer"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: TUITION CIRCULAR APPLICATIONS (COLLAPSIBLE & COMPACT) */}
      {isSectionVisible('applications') && (
        <div className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-3.5 sm:p-4 mb-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleAdminSection('applications')}
                aria-expanded={isSectionExpanded('applications')}
                className="inline-flex items-center gap-2 text-left cursor-pointer group"
              >
                <span className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-[#047857] dark:text-emerald-400 flex items-center justify-center">
                  {isSectionExpanded('applications') ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#047857] dark:text-emerald-400">
                    {lang === 'en'
                      ? '5. Tuition Circular Applications'
                      : '৫. টিউশনি সার্কুলার আবেদন'}
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-white group-hover:text-[#047857] transition-colors">
                    {lang === 'en'
                      ? 'Confirm Tutors, Set Media Fee & Inspect Applicant Profiles'
                      : 'টিউটর কনফার্ম, মিডিয়া ফি নির্ধারণ ও প্রোফাইল যাচাই'}
                  </h3>
                </div>
              </button>
              <span className="font-mono-num text-[11px] font-bold text-[#047857] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-[#047857]/30">
                {filteredApplications.length}/{adminVisibleApplications.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <div className="inline-flex items-center gap-1 bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2 py-1">
                <ArrowUpDown className="w-3 h-3 text-[#047857] shrink-0" />
                <label
                  htmlFor="circular-app-sort-select"
                  className="text-[11px] font-bold text-stone-600 dark:text-stone-300 whitespace-nowrap"
                >
                  {lang === 'en' ? 'Sort By:' : 'সাজান:'}
                </label>
                <select
                  id="circular-app-sort-select"
                  aria-label="Sort Circular Applications By"
                  value={verificationSortBy}
                  onChange={(e) =>
                    setVerificationSortBy(e.target.value as AdminSortOrder)
                  }
                  className="bg-transparent text-xs font-bold text-stone-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="newest" className="bg-white dark:bg-stone-900">
                    {lang === 'en' ? 'Newest' : 'নতুন'}
                  </option>
                  <option value="oldest" className="bg-white dark:bg-stone-900">
                    {lang === 'en' ? 'Oldest' : 'পুরাতন'}
                  </option>
                  <option
                    value="pending_first"
                    className="bg-white dark:bg-stone-900"
                  >
                    {lang === 'en' ? 'Pending First' : 'পেন্ডিং আগে'}
                  </option>
                </select>
              </div>

              <select
                id="circular-app-filter-select"
                aria-label="Filter Circular Applications Status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'All' | VerificationStatus)
                }
                className="px-2 py-1 rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                <option value="All">
                  {lang === 'en' ? 'All Applications' : 'সকল আবেদন'} (
                  {adminVisibleApplications.length})
                </option>
                <option value="Pending">
                  {lang === 'en' ? 'Pending Only' : 'পেন্ডিং'}
                </option>
                <option value="Approved">
                  {lang === 'en' ? 'Approved / Confirmed' : 'অনুমোদিত'}
                </option>
                <option value="Rejected">
                  {lang === 'en' ? 'Rejected' : 'বাতিল'}
                </option>
              </select>
            </div>
          </div>

          {isSectionExpanded('applications') && (
            <div className="mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-800">
              {filteredApplications.length === 0 ? (
                <div className="px-3 py-2.5 rounded-lg border border-dashed border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400">
                  {lang === 'en'
                    ? 'No tuition circular applications in this filter view.'
                    : 'এই ফিল্টারে কোনো টিউশনি সার্কুলার আবেদন নেই।'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredApplications.map((app, idx) => {
                    const appStatus = (app.status || 'Pending').trim();
                    const appStatusLower = appStatus.toLowerCase();
                    const isDirectConfirmed =
                      appStatusLower === 'confirmed' ||
                      appStatusLower === 'approved';
                    const isVerifiedForTuition =
                      appStatusLower === 'verified_for_tuition' ||
                      appStatusLower === 'verified for tuition';
                    const isConfirmed =
                      isDirectConfirmed || isVerifiedForTuition;
                    const isRejected = appStatusLower === 'rejected';
                    const appMediaFee = extractMediaFeeFromApplication(
                      app,
                      1000
                    );
                    const appAdminNote = extractAdminNoteFromApplication(app);
                    const cleanExpNote = getCleanApplicantExperienceNote(app);
                    const isFeePanelOpen = isSameAdminAppTarget(
                      adminConfirmModalTarget,
                      app
                    );
                    const classSubjectText = getCircularClassSubjectLabel(
                      jobs,
                      app.circular_id,
                      lang
                    );
                    const rowKey =
                      app.id ||
                      `${app.circular_id}-${app.tutor_id}-${app.tutor_phone}-${idx}`;
                    const actionKey =
                      app.id ||
                      `${app.circular_id}-${app.tutor_id}-${app.tutor_phone}`;
                    const isRowBusy = busyAppKey === actionKey;
                    const fullTutorProfile = findApplicantFullTutorProfile(
                      app,
                      requests
                    );
                    const isProfileExpanded = Boolean(
                      expandedAppProfiles[actionKey]
                    );

                    const handleToggleInlineFeePanel = () => {
                      if (isFeePanelOpen) {
                        setAdminConfirmModalTarget(null);
                        return;
                      }
                      const matchedJob = jobs.find(
                        (j) => j.id === app.circular_id
                      );
                      const parsedFee = extractMediaFeeFromApplication(
                        app,
                        1000
                      );
                      setAdminSetMediaFee(parsedFee > 0 ? parsedFee : 1000);
                      setAdminSetGuardianPhone(
                        app.guardian_phone || matchedJob?.contactPhone || ''
                      );
                      setAdminSetGuardianAddress(
                        app.guardian_address ||
                          [matchedJob?.landmarkEn, matchedJob?.upazila]
                            .filter(Boolean)
                            .join(', ') ||
                          matchedJob?.upazila ||
                          ''
                      );
                      setAdminSetCustomNote(
                        extractAdminNoteFromApplication(app)
                      );
                      setAdminConfirmModalTarget({
                        circularId: app.circular_id,
                        applicant: app,
                        matchedJob,
                      });
                    };

                    const isRejectPanelOpen = isSameAdminAppTarget(
                      adminRejectModalTarget,
                      app
                    );
                    const isTutorRestricted =
                      isRejected ||
                      Boolean(app.is_rejected) ||
                      isTutorAccountRestricted(fullTutorProfile);

                    const handleToggleInlineRejectPanel = () => {
                      if (isRejectPanelOpen) {
                        setAdminRejectModalTarget(null);
                        return;
                      }
                      setAdminConfirmModalTarget(null);
                      const existingReason =
                        app.rejection_note ||
                        appAdminNote ||
                        fullTutorProfile?.rejection_note ||
                        'NID/Student ID Unclear';
                      setAdminRejectionNote(existingReason);
                      setAdminRestrictAccountOnReject(true);
                      setAdminRejectModalTarget({
                        circularId: app.circular_id,
                        applicant: app,
                      });
                    };

                    return (
                      <article
                        key={rowKey}
                        className={`w-full max-w-full overflow-x-hidden rounded-xl p-3.5 sm:p-4 border transition-colors ${
                          isConfirmed
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-[#047857]/60'
                            : isRejected
                            ? 'bg-red-50/40 dark:bg-red-950/20 border-red-300 dark:border-red-900/50'
                            : 'bg-[#FAF8F5] dark:bg-stone-800/70 border-stone-200/90 dark:border-stone-700'
                        }`}
                      >
                        <div className="space-y-3 w-full max-w-full">
                          <div className="space-y-2 min-w-0">
                            {/* Circular ID · Class & Subject · Aligned Status Pill */}
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <span className="font-mono-num font-extrabold text-xs px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 border border-[#047857]/30 text-[#047857] dark:text-emerald-400">
                                  {app.circular_id}
                                </span>
                                <span className="font-bold text-stone-800 dark:text-stone-200 break-words">
                                  {classSubjectText}
                                </span>
                              </div>

                              {isVerifiedForTuition ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/95 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-500/50">
                                  <span>
                                    💳 Verified (Media Fee Required: ৳
                                    {appMediaFee})
                                  </span>
                                </span>
                              ) : isDirectConfirmed ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/95 dark:bg-emerald-950 text-[#047857] dark:text-emerald-300 border border-[#047857]/50">
                                  <span>✅ Confirmed for Tuition</span>
                                </span>
                              ) : isRejected ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100/90 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
                                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Rejected</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/90 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  <span>Pending Review</span>
                                </span>
                              )}
                            </div>

                            {/* Clean 4-Column Tutor Details Strip */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-2.5 rounded-lg bg-white/80 dark:bg-stone-900/70 border border-stone-200/80 dark:border-stone-700/80 text-xs">
                              <div className="min-w-0">
                                <span className="block text-[10px] uppercase tracking-wider font-semibold text-stone-400 dark:text-stone-500">
                                  {lang === 'en'
                                    ? 'Applicant Full Name'
                                    : 'আবেদনকারীর নাম'}
                                </span>
                                <span className="font-bold text-stone-900 dark:text-white break-words block">
                                  {app.tutor_name}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <span className="block text-[10px] uppercase tracking-wider font-semibold text-stone-400 dark:text-stone-500">
                                  {lang === 'en' ? 'Tutor ID' : 'টিউটর আইডি'}
                                </span>
                                <span className="font-mono-num font-bold text-[#047857] dark:text-emerald-400 break-all block">
                                  {app.tutor_id}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <span className="block text-[10px] uppercase tracking-wider font-semibold text-stone-400 dark:text-stone-500">
                                  {lang === 'en'
                                    ? 'Phone (Admin Only)'
                                    : 'মোবাইল নম্বর'}
                                </span>
                                <span className="font-mono-num font-bold text-stone-900 dark:text-white inline-flex items-center gap-1 break-all">
                                  <Phone className="w-3 h-3 text-[#047857] shrink-0" />
                                  <span>{app.tutor_phone}</span>
                                </span>
                              </div>
                              <div className="min-w-0">
                                <span className="block text-[10px] uppercase tracking-wider font-semibold text-stone-400 dark:text-stone-500">
                                  {lang === 'en'
                                    ? 'University / Qualification'
                                    : 'শিক্ষাগত যোগ্যতা'}
                                </span>
                                <span className="font-semibold text-stone-800 dark:text-stone-200 break-words block">
                                  {app.institution_qualification}
                                </span>
                              </div>
                            </div>

                            {cleanExpNote && (
                              <div className="text-xs text-stone-600 dark:text-stone-400 break-words">
                                <span className="font-semibold text-stone-700 dark:text-stone-300">
                                  {lang === 'en' ? 'Note: ' : 'নোট: '}
                                </span>
                                <span>{cleanExpNote}</span>
                              </div>
                            )}

                            {appAdminNote && (
                              <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 break-words">
                                📌 Admin Note: {appAdminNote}
                              </div>
                            )}
                          </div>

                          {/* Responsive Flex-Wrap Action Bar with Two Separate Confirmation Workflows */}
                          <div className="flex flex-wrap gap-2 items-center pt-2.5 border-t border-stone-200/80 dark:border-stone-700/80 w-full max-w-full">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedAppProfiles((prev) => ({
                                  ...prev,
                                  [actionKey]: !prev[actionKey],
                                }))
                              }
                              className="py-1.5 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 bg-white dark:bg-stone-900 hover:border-[#047857] text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 transition-colors cursor-pointer"
                            >
                              <span>
                                {isProfileExpanded
                                  ? '🔼 Hide Full Tutor Profile'
                                  : '👁️ View Full Tutor Profile'}
                              </span>
                            </button>

                            {isDirectConfirmed ? (
                              <>
                                <button
                                  type="button"
                                  disabled={isRowBusy}
                                  onClick={() =>
                                    handleDirectConfirmCircularApplicant(app)
                                  }
                                  className="py-1.5 px-3 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 bg-emerald-100 dark:bg-emerald-950 text-[#047857] dark:text-emerald-300 border-2 border-[#047857] ring-2 ring-[#047857]/20 transition-colors cursor-default"
                                >
                                  <span>✅ Confirmed</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={isRowBusy}
                                  onClick={handleToggleInlineFeePanel}
                                  className={`py-1.5 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                    isFeePanelOpen
                                      ? 'bg-amber-700 text-white border border-amber-800'
                                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                                  }`}
                                >
                                  <span>💳 Set / Edit Fee</span>
                                </button>
                              </>
                            ) : isVerifiedForTuition ? (
                              <>
                                <button
                                  type="button"
                                  disabled={isRowBusy}
                                  onClick={handleToggleInlineFeePanel}
                                  className={`py-1.5 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                    isFeePanelOpen
                                      ? 'bg-amber-700 text-white border border-amber-800'
                                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                                  }`}
                                >
                                  <span>💳 Edit Fee</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={isRowBusy}
                                  onClick={() =>
                                    handleDirectConfirmCircularApplicant(app)
                                  }
                                  className="py-1.5 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 bg-[#047857] hover:bg-[#065F46] text-white transition-colors cursor-pointer"
                                >
                                  <span>✅ Mark as Directly Confirmed</span>
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Button 1: Direct Confirmation */}
                                <button
                                  type="button"
                                  disabled={isRowBusy}
                                  onClick={() =>
                                    handleDirectConfirmCircularApplicant(app)
                                  }
                                  className="py-1.5 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 bg-[#047857] hover:bg-[#065F46] text-white transition-colors cursor-pointer"
                                >
                                  <span>✅ Confirm Tutor</span>
                                </button>

                                {/* Button 2: Set Media Fee & Verify */}
                                <button
                                  type="button"
                                  disabled={isRowBusy}
                                  onClick={handleToggleInlineFeePanel}
                                  className={`py-1.5 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                    isFeePanelOpen
                                      ? 'bg-amber-700 text-white border border-amber-800'
                                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                                  }`}
                                >
                                  <span>💳 Confirm &amp; Set Fee</span>
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={handleToggleInlineRejectPanel}
                              className={`py-1.5 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                isRejectPanelOpen
                                  ? 'bg-rose-800 text-white border border-rose-900'
                                  : isRejected
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-400/50 hover:bg-rose-200/70'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                            >
                              <span>
                                {isRejected
                                  ? '🚫 Rejected (Edit Note)'
                                  : '❌ Reject'}
                              </span>
                            </button>

                            {isTutorRestricted && onUnblockCircularApplicant && (
                              <button
                                type="button"
                                disabled={isRowBusy}
                                onClick={async () => {
                                  setBusyAppKey(actionKey);
                                  try {
                                    await onUnblockCircularApplicant(
                                      app.circular_id,
                                      app
                                    );
                                    setAdminRejectModalTarget(null);
                                    showAdminToast(
                                      'success',
                                      lang === 'en'
                                        ? `Lifted restriction & unblocked ${app.tutor_name}`
                                        : `${app.tutor_name}-এর অ্যাকাউন্ট আনব্লক করা হয়েছে`
                                    );
                                  } finally {
                                    setBusyAppKey(null);
                                  }
                                }}
                                className="py-1.5 px-3 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 text-teal-800 dark:text-teal-300 border border-teal-400/60 transition-colors cursor-pointer"
                              >
                                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                                <span>🔄 Lift Restriction / Unblock Tutor</span>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={async () => {
                                if (!onHideApplicationFromAdmin) return;
                                setBusyAppKey(actionKey);
                                try {
                                  await onHideApplicationFromAdmin(app);
                                  showAdminToast(
                                    'success',
                                    lang === 'en'
                                      ? `Removed application (${app.circular_id}) from Admin Panel`
                                      : `আবেদনটি (${app.circular_id}) অ্যাডমিন প্যানেল থেকে সরানো হয়েছে`
                                  );
                                } catch (err) {
                                  showAdminToast(
                                    'error',
                                    err instanceof Error
                                      ? err.message
                                      : 'Failed to hide application from Admin Panel'
                                  );
                                } finally {
                                  setBusyAppKey(null);
                                }
                              }}
                              aria-label={`Delete application ${app.circular_id} by ${app.tutor_name} from Admin Panel`}
                              className="py-1.5 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 bg-amber-100/90 dark:bg-amber-950/70 hover:bg-amber-200 text-amber-900 dark:text-amber-200 border border-amber-400/60 transition-colors cursor-pointer"
                            >
                              <span>🧹 Delete from Admin Panel</span>
                            </button>

                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={async () => {
                                if (!onDeleteApplicationEverywhere) return;
                                setBusyAppKey(actionKey);
                                try {
                                  await onDeleteApplicationEverywhere(app);
                                  await onRefreshApplications?.();
                                  showAdminToast(
                                    'success',
                                    lang === 'en'
                                      ? `Profile deleted successfully — Removed ${app.tutor_name}'s application (${app.circular_id})`
                                      : `সফলভাবে মুছে ফেলা হয়েছে (${app.tutor_name} · ${app.circular_id})`
                                  );
                                } catch (err) {
                                  showAdminToast(
                                    'error',
                                    err instanceof Error
                                      ? err.message
                                      : 'Failed to delete application from Supabase'
                                  );
                                } finally {
                                  setBusyAppKey(null);
                                }
                              }}
                              aria-label={`Delete application ${app.circular_id} by ${app.tutor_name} from Everywhere`}
                              className="py-1.5 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 bg-red-700 hover:bg-red-800 text-white transition-colors cursor-pointer"
                            >
                              <span>🗑️ Delete from Everywhere</span>
                            </button>
                          </div>

                          {/* INLINE EXPANDABLE PANEL: SET MEDIA FEE & VERIFY */}
                          {isFeePanelOpen && (
                            <div
                              role="region"
                              aria-label={`Set Media Fee and Verify ${app.tutor_name}`}
                              className="mt-2.5 p-3.5 rounded-xl bg-white dark:bg-stone-900 border-2 border-amber-500/60 dark:border-amber-600/60 space-y-3 w-full max-w-full overflow-x-hidden shadow-xs"
                            >
                              <div className="flex items-start justify-between gap-2 pb-2 border-b border-stone-200 dark:border-stone-800">
                                <div>
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                    {lang === 'en'
                                      ? 'Set Media Fee & Verify Tutor'
                                      : 'মিডিয়া ফি নির্ধারণ ও ভেরিফিকেশন'}
                                  </span>
                                  <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-white">
                                    {lang === 'en'
                                      ? `💳 Confirm & Set Fee for ${app.tutor_name} (${app.circular_id})`
                                      : `💳 ${app.tutor_name}-এর জন্য মিডিয়া ফি নির্ধারণ (${app.circular_id})`}
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  disabled={isAdminConfirmingApplicant}
                                  onClick={() =>
                                    setAdminConfirmModalTarget(null)
                                  }
                                  className="p-1 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                                    {lang === 'en'
                                      ? 'Media Fee Amount (BDT ৳)'
                                      : 'মিডিয়া ফি পরিমাণ (টাকা ৳)'}
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="50"
                                    aria-label="Media Fee Amount (BDT)"
                                    value={adminSetMediaFee}
                                    onChange={(e) =>
                                      setAdminSetMediaFee(
                                        Number(e.target.value) || 0
                                      )
                                    }
                                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-bold font-mono-num rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                                    placeholder="1000"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                                    {lang === 'en'
                                      ? 'Guardian Phone Number (Unlocked after payment)'
                                      : 'অভিভাবকের মোবাইল নম্বর'}
                                  </label>
                                  <input
                                    type="tel"
                                    aria-label="Guardian Phone Number"
                                    value={adminSetGuardianPhone}
                                    onChange={(e) =>
                                      setAdminSetGuardianPhone(e.target.value)
                                    }
                                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono-num rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                                    placeholder="01308937770"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                                    {lang === 'en'
                                      ? 'Guardian Full Address (Unlocked after payment)'
                                      : 'টিউশনির স্থান / অভিভাবকের ঠিকানা'}
                                  </label>
                                  <input
                                    type="text"
                                    aria-label="Guardian Full Address"
                                    value={adminSetGuardianAddress}
                                    onChange={(e) =>
                                      setAdminSetGuardianAddress(e.target.value)
                                    }
                                    className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                                    placeholder="E.g. Madaripur Sadar, Near DC Office"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                                    {lang === 'en'
                                      ? 'Custom Admin Note / Instructions'
                                      : 'অ্যাডমিন নোট / নির্দেশনা'}
                                  </label>
                                  <input
                                    type="text"
                                    aria-label="Custom Admin Note / Instructions"
                                    value={adminSetCustomNote}
                                    onChange={(e) =>
                                      setAdminSetCustomNote(e.target.value)
                                    }
                                    className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                                    placeholder="E.g. Pay media fee within 24 hours via bKash/Nagad"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                                <span className="text-[11px] text-amber-800 dark:text-amber-300">
                                  💡 Sets status to{' '}
                                  <strong className="font-mono-num">
                                    verified_for_tuition
                                  </strong>{' '}
                                  and unlocks bKash/Nagad payment on
                                  tutor&apos;s profile.
                                </span>

                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={isAdminConfirmingApplicant}
                                    onClick={() =>
                                      setAdminConfirmModalTarget(null)
                                    }
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer"
                                  >
                                    {lang === 'en' ? 'Cancel' : 'বাতিল'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isAdminConfirmingApplicant}
                                    onClick={handleExecuteAdminConfirmApplicant}
                                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#047857] hover:bg-[#065F46] text-white shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                                  >
                                    {isAdminConfirmingApplicant ? (
                                      <>
                                        <Clock className="w-3.5 h-3.5 animate-spin" />
                                        <span>Saving...</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>
                                          {lang === 'en'
                                            ? `Submit & Verify (৳${adminSetMediaFee})`
                                            : `ভেরিফাই ও ফি সেট করুন (৳${adminSetMediaFee})`}
                                        </span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* EXECUTIVE ADMIN REJECTION POPOVER / GLASSMORPHIC INLINE DRAWER */}
                          {isRejectPanelOpen && (
                            <div
                              role="region"
                              aria-label={`Executive Rejection Review for ${app.tutor_name}`}
                              className="mt-2.5 p-4 rounded-xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-2 border-rose-500/60 dark:border-rose-700/60 space-y-3 w-full max-w-full overflow-x-hidden shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-2 pb-2 border-b border-stone-200 dark:border-stone-800">
                                <div>
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                                    {lang === 'en'
                                      ? 'Executive Compliance & Rejection Desk'
                                      : 'অ্যাডমিন রিজেকশন ও কমপ্লায়েন্স নোট'}
                                  </span>
                                  <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-white">
                                    {lang === 'en'
                                      ? `❌ Assign Rejection Note for ${app.tutor_name} (${app.circular_id})`
                                      : `❌ ${app.tutor_name}-এর জন্য রিজেকশন নোট নির্ধারণ (${app.circular_id})`}
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  disabled={isAdminRejectingApplicant}
                                  onClick={() =>
                                    setAdminRejectModalTarget(null)
                                  }
                                  className="p-1 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              {/* 1-Click Quick Reason Chips */}
                              <div>
                                <span className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                                  {lang === 'en'
                                    ? '1-Click Quick Reason Templates:'
                                    : '১-ক্লিক কুইক রিজন টেমপ্লেট:'}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {ADMIN_REJECTION_QUICK_REASONS.map(
                                    (chipReason) => {
                                      const isSelected =
                                        adminRejectionNote.trim() ===
                                        chipReason;
                                      return (
                                        <button
                                          key={chipReason}
                                          type="button"
                                          onClick={() =>
                                            setAdminRejectionNote(chipReason)
                                          }
                                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                            isSelected
                                              ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                              : 'bg-rose-50/80 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800/70 hover:bg-rose-100'
                                          }`}
                                        >
                                          {chipReason}
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              </div>

                              {/* Custom Rejection Note Input */}
                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                                  {lang === 'en'
                                    ? 'Official Rejection Note (Shown in Tutor Compliance Notice)'
                                    : 'অফিসিয়াল রিজেকশন নোট (টিউটর প্রোফাইলে প্রদর্শিত হবে)'}
                                </label>
                                <input
                                  type="text"
                                  aria-label="Official Rejection Note"
                                  value={adminRejectionNote}
                                  onChange={(e) =>
                                    setAdminRejectionNote(e.target.value)
                                  }
                                  className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                                  placeholder="E.g. NID/Student ID Unclear — Please upload a high-resolution scan"
                                />
                              </div>

                              {/* Restrict Account Checkbox + Submit Bar */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                                <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={adminRestrictAccountOnReject}
                                    onChange={(e) =>
                                      setAdminRestrictAccountOnReject(
                                        e.target.checked
                                      )
                                    }
                                    className="rounded border-stone-300 text-rose-600 focus:ring-rose-500"
                                  />
                                  <span>
                                    {lang === 'en'
                                      ? '🔒 Restrict Tutor Account from new circular applications until re-verified'
                                      : '🔒 পুনরায় ভেরিফাই না হওয়া পর্যন্ত নতুন সার্কুলারে আবেদন লক রাখুন'}
                                  </span>
                                </label>

                                <div className="flex flex-wrap items-center gap-2">
                                  {isTutorRestricted &&
                                    onUnblockCircularApplicant && (
                                      <button
                                        type="button"
                                        disabled={isAdminRejectingApplicant}
                                        onClick={async () => {
                                          setIsAdminRejectingApplicant(true);
                                          try {
                                            await onUnblockCircularApplicant(
                                              app.circular_id,
                                              app
                                            );
                                            setAdminRejectModalTarget(null);
                                          } finally {
                                            setIsAdminRejectingApplicant(false);
                                          }
                                        }}
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>
                                          🔄 Lift Restriction / Unblock Tutor
                                        </span>
                                      </button>
                                    )}

                                  <button
                                    type="button"
                                    disabled={isAdminRejectingApplicant}
                                    onClick={() =>
                                      setAdminRejectModalTarget(null)
                                    }
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer"
                                  >
                                    {lang === 'en' ? 'Cancel' : 'বাতিল'}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isAdminRejectingApplicant}
                                    onClick={async () => {
                                      if (!onRejectCircularApplicant) return;
                                      setIsAdminRejectingApplicant(true);
                                      setBusyAppKey(actionKey);
                                      try {
                                        await onRejectCircularApplicant(
                                          app.circular_id,
                                          app,
                                          adminRejectionNote.trim() ||
                                            'NID/Student ID Unclear',
                                          adminRestrictAccountOnReject
                                        );
                                        setAdminRejectModalTarget(null);
                                      } finally {
                                        setIsAdminRejectingApplicant(false);
                                        setBusyAppKey(null);
                                      }
                                    }}
                                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    <span>
                                      {lang === 'en'
                                        ? 'Confirm Rejection & Save Note'
                                        : 'রিজেক্ট ও নোট সেভ করুন'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* EXPANDABLE FULL TUTOR PROFILE CARD FOR ADMIN INSPECTION */}
                        {isProfileExpanded && (
                          <div
                            role="region"
                            aria-label={`Full Tutor Profile for ${app.tutor_name}`}
                            className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 p-3 border"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#047857] dark:text-emerald-400">
                                Applicant Complete Tutor Profile (Synced with
                                tutor_verifications)
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-mono-num font-semibold text-stone-500 dark:text-stone-400">
                                  {fullTutorProfile
                                    ? `Verification ID: ${fullTutorProfile.id} (${fullTutorProfile.status})`
                                    : `Account: ${
                                        app.user_email ||
                                        app.user_id ||
                                        app.tutor_id
                                      }`}
                                </span>
                                {fullTutorProfile && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenAdminEditModal(
                                          fullTutorProfile
                                        )
                                      }
                                      className="py-1 px-2 rounded-lg text-[11px] font-bold bg-[#047857] hover:bg-[#065F46] text-white inline-flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>✏️ Edit Profile</span>
                                    </button>
                                    {isProtectedAdminProfile(
                                      fullTutorProfile
                                    ) ? (
                                      <span
                                        title={PROTECTED_ADMIN_DELETE_ERROR}
                                        className="py-1 px-2 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-[#047857] dark:text-emerald-300 border border-[#047857]/40"
                                      >
                                        🛡️ Protected Admin Account
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={
                                          busyReqId === fullTutorProfile.id
                                        }
                                        onClick={async () => {
                                          if (
                                            isProtectedAdminProfile(
                                              fullTutorProfile
                                            )
                                          ) {
                                            showAdminToast(
                                              'error',
                                              PROTECTED_ADMIN_DELETE_ERROR
                                            );
                                            return;
                                          }
                                          const targetId = fullTutorProfile.id;
                                          setBusyReqId(targetId);
                                          setLocalDeletedReqIds((prev) =>
                                            prev.includes(targetId)
                                              ? prev
                                              : [...prev, targetId]
                                          );
                                          try {
                                            if (onDeleteRequestEverywhere) {
                                              await onDeleteRequestEverywhere(
                                                targetId
                                              );
                                            } else {
                                              onDeleteRequest(targetId);
                                            }
                                            await onRefreshApplications?.();
                                            showAdminToast(
                                              'success',
                                              lang === 'en'
                                                ? `Profile deleted successfully (${fullTutorProfile.tutorNameEn} · ${targetId})`
                                                : `প্রোফাইল সফলভাবে মুছে ফেলা হয়েছে (${fullTutorProfile.tutorNameEn} · ${targetId})`
                                            );
                                          } catch (err) {
                                            showAdminToast(
                                              'error',
                                              err instanceof Error
                                                ? err.message
                                                : 'Failed to delete profile from Supabase'
                                            );
                                          } finally {
                                            setBusyReqId(null);
                                          }
                                        }}
                                        className="py-1 px-2 rounded-lg text-[11px] font-bold bg-red-700 hover:bg-red-800 text-white transition-colors cursor-pointer"
                                      >
                                        🗑️ Delete Profile
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700 mb-2.5 text-xs">
                              <div>
                                <span className="block text-[10px] text-stone-500">
                                  Full Name
                                </span>
                                <span className="font-bold text-stone-900 dark:text-white">
                                  {fullTutorProfile?.tutorNameEn ||
                                    app.tutor_name}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-stone-500">
                                  Mobile Number
                                </span>
                                <span className="font-mono-num font-bold text-stone-900 dark:text-white">
                                  {fullTutorProfile?.phone || app.tutor_phone}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-stone-500">
                                  Smart NID Number
                                </span>
                                <span className="font-mono-num font-bold text-[#047857] dark:text-emerald-400">
                                  {fullTutorProfile?.nidNumber ||
                                    'Not submitted yet'}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-stone-500">
                                  University / College
                                </span>
                                <span className="font-bold text-stone-900 dark:text-white">
                                  {fullTutorProfile?.institutionFullEn ||
                                    app.institution_qualification}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-stone-500">
                                  Department
                                </span>
                                <span className="font-semibold text-stone-800 dark:text-stone-200">
                                  {fullTutorProfile?.departmentEn ||
                                    app.institution_qualification}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-stone-500">
                                  Registration ID
                                </span>
                                <span className="font-mono-num font-bold text-amber-700 dark:text-amber-400">
                                  {fullTutorProfile?.studentRegId ||
                                    app.tutor_id}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                              <div className="p-2 rounded-lg bg-[#FAF8F5] dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="font-bold text-stone-900 dark:text-white">
                                    1. Profile Photo
                                  </div>
                                  <div className="text-[10px] font-mono-num text-stone-500 truncate">
                                    {fullTutorProfile?.profilePhotoName ||
                                      'Passport Photo'}
                                  </div>
                                </div>
                                {fullTutorProfile?.profilePhotoDataUrl ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setZoomedScan({
                                        title: `Profile Photo — ${fullTutorProfile.tutorNameEn}`,
                                        subtitle: `Verification ${fullTutorProfile.id} · Mobile: ${fullTutorProfile.phone}`,
                                        imageUrl:
                                          fullTutorProfile.profilePhotoDataUrl!,
                                      })
                                    }
                                    className="shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 border-[#047857] bg-stone-950 cursor-pointer"
                                  >
                                    <img
                                      src={fullTutorProfile.profilePhotoDataUrl}
                                      alt={`Profile Photo for ${app.tutor_name}`}
                                      loading="lazy"
                                      decoding="async"
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500 shrink-0">
                                    <User className="w-4 h-4" />
                                  </div>
                                )}
                              </div>

                              <div className="p-2 rounded-lg bg-[#FAF8F5] dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="font-bold text-stone-900 dark:text-white">
                                    2. Smart NID Scan
                                  </div>
                                  <div className="text-[10px] font-mono-num text-[#047857] dark:text-emerald-400 truncate">
                                    NID: {fullTutorProfile?.nidNumber || 'N/A'}
                                  </div>
                                </div>
                                {fullTutorProfile?.nidScanDataUrl ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setZoomedScan({
                                        title: `Smart NID Scan — ${fullTutorProfile.tutorNameEn}`,
                                        subtitle: `Smart NID: ${fullTutorProfile.nidNumber} · Mobile: ${fullTutorProfile.phone}`,
                                        imageUrl:
                                          fullTutorProfile.nidScanDataUrl!,
                                      })
                                    }
                                    className="shrink-0 rounded-md overflow-hidden border border-stone-300 dark:border-stone-600 bg-stone-950 cursor-pointer"
                                  >
                                    <img
                                      src={fullTutorProfile.nidScanDataUrl}
                                      alt={`Smart NID Scan for ${app.tutor_name}`}
                                      referrerPolicy="no-referrer"
                                      className="h-12 w-20 object-cover"
                                    />
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-mono-num text-stone-500 px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shrink-0">
                                    {fullTutorProfile?.nidDocumentName ||
                                      'No Scan'}
                                  </span>
                                )}
                              </div>

                              <div className="p-2 rounded-lg bg-[#FAF8F5] dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="font-bold text-stone-900 dark:text-white">
                                    3. Student ID Scan
                                  </div>
                                  <div className="text-[10px] font-mono-num text-amber-700 dark:text-amber-400 truncate">
                                    Reg:{' '}
                                    {fullTutorProfile?.studentRegId ||
                                      app.tutor_id}
                                  </div>
                                </div>
                                {fullTutorProfile?.uniScanDataUrl ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setZoomedScan({
                                        title: `Student ID Card Scan — ${fullTutorProfile.tutorNameEn}`,
                                        subtitle: `${fullTutorProfile.institutionFullEn} · Reg ID: ${fullTutorProfile.studentRegId}`,
                                        imageUrl:
                                          fullTutorProfile.uniScanDataUrl!,
                                      })
                                    }
                                    className="shrink-0 rounded-md overflow-hidden border border-stone-300 dark:border-stone-600 bg-stone-950 cursor-pointer"
                                  >
                                    <img
                                      src={fullTutorProfile.uniScanDataUrl}
                                      alt={`Student ID Scan for ${app.tutor_name}`}
                                      referrerPolicy="no-referrer"
                                      className="h-12 w-20 object-cover"
                                    />
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-mono-num text-stone-500 px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shrink-0">
                                    {fullTutorProfile?.uniDocumentName ||
                                      'No Scan'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION 6: MANUAL NID & UNIVERSITY ID VERIFICATION (COLLAPSIBLE & COMPACT) */}
      {isSectionVisible('verifications') && (
        <div className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-3.5 sm:p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-200/80 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleAdminSection('verifications')}
                aria-expanded={isSectionExpanded('verifications')}
                className="inline-flex items-center gap-2 text-left cursor-pointer group"
              >
                <span className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-[#047857] dark:text-emerald-400 flex items-center justify-center">
                  {isSectionExpanded('verifications') ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#047857] dark:text-emerald-400">
                    {lang === 'en'
                      ? '6. Manual NID & University ID Verification'
                      : '৬. এনআইডি ও বিশ্ববিদ্যালয় আইডি যাচাই'}
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-white group-hover:text-[#047857] transition-colors">
                    {lang === 'en'
                      ? 'Audit Confidential NID Scans, Student Cards & Activate Verified Badges'
                      : 'গোপনীয় এনআইডি ও স্টুডেন্ট কার্ড যাচাই এবং ভেরিফায়েড ব্যাজ অনুমোদন'}
                  </h3>
                </div>
              </button>
              <span className="font-mono-num text-[11px] font-bold text-[#047857] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-[#047857]/30">
                {filteredRequests.length}/{adminVisibleRequests.length}
              </span>
            </div>

            {/* Sort By & Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="inline-flex items-center gap-1 bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2 py-1">
                <ArrowUpDown className="w-3 h-3 text-[#047857] shrink-0" />
                <label
                  htmlFor="nid-verification-sort-select"
                  className="text-[11px] font-bold text-stone-600 dark:text-stone-300 whitespace-nowrap"
                >
                  {lang === 'en' ? 'Sort By:' : 'সাজান:'}
                </label>
                <select
                  id="nid-verification-sort-select"
                  aria-label="Sort Verification List By"
                  value={verificationSortBy}
                  onChange={(e) =>
                    setVerificationSortBy(e.target.value as AdminSortOrder)
                  }
                  className="bg-transparent text-xs font-bold text-stone-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="newest" className="bg-white dark:bg-stone-900">
                    {lang === 'en' ? 'Newest' : 'নতুন'}
                  </option>
                  <option value="oldest" className="bg-white dark:bg-stone-900">
                    {lang === 'en' ? 'Oldest' : 'পুরাতন'}
                  </option>
                  <option
                    value="pending_first"
                    className="bg-white dark:bg-stone-900"
                  >
                    {lang === 'en' ? 'Pending First' : 'পেন্ডিং আগে'}
                  </option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {(
                  [
                    {
                      id: 'All',
                      labelEn: 'All Requests',
                      labelBn: 'সকল আবেদন',
                      count: totalCount,
                    },
                    {
                      id: 'Pending',
                      labelEn: 'Pending Review',
                      labelBn: 'অপেক্ষমাণ (Pending)',
                      count: pendingCount,
                    },
                    {
                      id: 'Approved',
                      labelEn: 'Approved & Verified',
                      labelBn: 'অনুমোদিত (Verified)',
                      count: approvedCount,
                    },
                    {
                      id: 'Rejected',
                      labelEn: 'Rejected',
                      labelBn: 'বাতিলকৃত',
                      count: rejectedCount,
                    },
                  ] as const
                ).map((tab) => {
                  const active = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                          : 'bg-[#FAF8F5] dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {lang === 'en' ? tab.labelEn : tab.labelBn} (
                      <span className="font-mono-num">
                        {lang === 'bn' ? toBanglaNumber(tab.count) : tab.count}
                      </span>
                      )
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {isSectionExpanded('verifications') && (
            <div className="mt-3">
              {filteredRequests.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-0.5">
                    {lang === 'en'
                      ? 'No verification requests in the Admin Desk (0 records).'
                      : 'অ্যাডমিন ডেস্কে কোনো ভেরিফিকেশন আবেদন নেই (০টি)।'}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    {lang === 'en'
                      ? 'When a tutor submits credentials in Profile, they appear here for Admin review.'
                      : 'প্রোফাইলে কোনো আবেদন জমা হলে তা এখানে যাচাইয়ের জন্য প্রদর্শিত হবে।'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map((req) => {
                    const noteValue =
                      adminNotes[req.id] ?? req.adminNote ?? '';
                    const isBusyReq = busyReqId === req.id;
                    const subjectsLabel =
                      req.subjectsEn && req.subjectsEn.length > 0
                        ? req.subjectsEn.join(', ')
                        : 'General Science & Math';

                    return (
                      <article
                        key={req.id}
                        className="rounded-xl bg-[#FAF8F5] dark:bg-stone-800/70 border border-stone-200/90 dark:border-stone-700 p-3.5"
                      >
                        {/* Top Metadata Line */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-stone-200/70 dark:border-stone-700">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="font-mono-num font-bold text-[#047857] dark:text-emerald-400">
                              {req.id}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-bold text-stone-900 dark:text-white">
                              {lang === 'en'
                                ? req.tutorNameEn
                                : req.tutorNameBn}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="text-stone-600 dark:text-stone-300">
                              {req.upazila}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-num text-stone-600 dark:text-stone-300">
                              {req.phone} (Admin Only)
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {req.status === 'Approved' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#047857] dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>
                                  {lang === 'en'
                                    ? 'Approved (Verified Badge Active)'
                                    : 'অনুমোদিত (ভেরিফায়েড ব্যাজ সক্রিয়)'}
                                </span>
                              </span>
                            )}
                            {req.status === 'Pending' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  {lang === 'en'
                                    ? 'Pending Admin Audit'
                                    : 'অ্যাডমিন যাচাইয়ের অপেক্ষায়'}
                                </span>
                              </span>
                            )}
                            {req.status === 'Rejected' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>
                                  {lang === 'en'
                                    ? 'Rejected (Badge Revoked)'
                                    : 'বাতিলকৃত'}
                                </span>
                              </span>
                            )}

                            <button
                              type="button"
                              disabled={isBusyReq}
                              onClick={() => handleOpenAdminEditModal(req)}
                              aria-label={`Edit profile ${req.id} (${req.tutorNameEn})`}
                              className="py-1 px-2.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 bg-[#047857] hover:bg-[#065F46] text-white transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>✏️ Edit Profile</span>
                            </button>

                            {isProtectedAdminProfile(req) ? (
                              <span
                                title={PROTECTED_ADMIN_DELETE_ERROR}
                                className="py-1 px-2.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 bg-emerald-100/90 dark:bg-emerald-950/70 text-[#047857] dark:text-emerald-300 border border-[#047857]/40 whitespace-nowrap"
                              >
                                <span>🛡️ Protected Admin Account</span>
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  disabled={isBusyReq}
                                  onClick={async () => {
                                    if (isProtectedAdminProfile(req)) {
                                      showAdminToast(
                                        'error',
                                        PROTECTED_ADMIN_DELETE_ERROR
                                      );
                                      return;
                                    }
                                    if (!onHideRequestFromAdmin) return;
                                    setBusyReqId(req.id);
                                    try {
                                      await onHideRequestFromAdmin(req.id);
                                      showAdminToast(
                                        'success',
                                        lang === 'en'
                                          ? `Removed ${req.tutorNameEn} (${req.id}) from Admin Panel only`
                                          : `${req.tutorNameEn} (${req.id}) শুধুমাত্র অ্যাডমিন প্যানেল থেকে সরানো হয়েছে`
                                      );
                                    } catch (err) {
                                      showAdminToast(
                                        'error',
                                        err instanceof Error
                                          ? err.message
                                          : 'Failed to hide profile from Admin Panel'
                                      );
                                    } finally {
                                      setBusyReqId(null);
                                    }
                                  }}
                                  aria-label={`Delete verification ${req.id} from Admin Panel`}
                                  className="py-1 px-2.5 rounded-lg text-[11px] font-bold bg-amber-100/90 dark:bg-amber-950/70 hover:bg-amber-200 text-amber-900 dark:text-amber-200 border border-amber-400/60 transition-colors whitespace-nowrap cursor-pointer"
                                >
                                  <span>🧹 Delete from Admin Panel</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={isBusyReq}
                                  onClick={async () => {
                                    if (isProtectedAdminProfile(req)) {
                                      showAdminToast(
                                        'error',
                                        PROTECTED_ADMIN_DELETE_ERROR
                                      );
                                      return;
                                    }
                                    setBusyReqId(req.id);
                                    setLocalDeletedReqIds((prev) =>
                                      prev.includes(req.id)
                                        ? prev
                                        : [...prev, req.id]
                                    );
                                    try {
                                      if (onDeleteRequestEverywhere) {
                                        await onDeleteRequestEverywhere(req.id);
                                      } else {
                                        onDeleteRequest(req.id);
                                      }
                                      await onRefreshApplications?.();
                                      showAdminToast(
                                        'success',
                                        lang === 'en'
                                          ? `Profile deleted successfully (${req.tutorNameEn} · ${req.id})`
                                          : `প্রোফাইল সফলভাবে মুছে ফেলা হয়েছে (${req.tutorNameEn} · ${req.id})`
                                      );
                                    } catch (err) {
                                      showAdminToast(
                                        'error',
                                        err instanceof Error
                                          ? err.message
                                          : 'Failed to delete profile from Supabase'
                                      );
                                    } finally {
                                      setBusyReqId(null);
                                    }
                                  }}
                                  aria-label={`Delete verification ${req.id} from Everywhere`}
                                  className="py-1 px-2.5 rounded-lg text-[11px] font-bold bg-red-700 hover:bg-red-800 text-white transition-colors whitespace-nowrap cursor-pointer"
                                >
                                  <span>🗑️ Delete from Everywhere</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Compact 6-Column Credentials Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700 p-2.5 mb-2.5 text-xs">
                          <div>
                            <span className="block text-[10px] text-stone-500">
                              Full Name
                            </span>
                            <span className="font-bold text-stone-900 dark:text-white break-words">
                              {req.tutorNameEn || PROFILE_FIELD_PLACEHOLDER}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-stone-500">
                              Mobile Number
                            </span>
                            <span className="font-mono-num font-bold text-stone-900 dark:text-white break-words">
                              {req.phone || PROFILE_FIELD_PLACEHOLDER}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-stone-500">
                              Smart NID Number
                            </span>
                            <span className="font-mono-num font-bold text-[#047857] dark:text-emerald-400 break-words">
                              {req.nidNumber || PROFILE_FIELD_PLACEHOLDER}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-stone-500">
                              University / College
                            </span>
                            <span className="font-bold text-stone-900 dark:text-white break-words">
                              {req.institutionFullEn ||
                                PROFILE_FIELD_PLACEHOLDER}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-stone-500">
                              Department / Reg ID
                            </span>
                            <span className="font-semibold text-stone-800 dark:text-stone-200 break-words">
                              {req.departmentEn || PROFILE_FIELD_PLACEHOLDER} ·{' '}
                              <span className="font-mono-num text-amber-700 dark:text-amber-400">
                                {req.studentRegId || 'N/A'}
                              </span>
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-stone-500">
                              Fee &amp; Subjects
                            </span>
                            <span className="font-semibold text-stone-800 dark:text-stone-200 break-words">
                              {req.monthlyFee && req.monthlyFee > 0
                                ? `${formatBDT(req.monthlyFee, lang)}/mo`
                                : 'Negotiable'}{' '}
                              · {subjectsLabel}
                            </span>
                          </div>
                        </div>

                        {/* Compact 4-Column Document Scan & Action Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2.5 items-stretch">
                          {/* 1. Smart NID Scan (3 cols) */}
                          <div className="lg:col-span-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 p-2.5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1.5">
                                <span className="font-bold text-stone-800 dark:text-stone-200">
                                  1. Smart NID Scan
                                </span>
                                <FileCheck2 className="w-3.5 h-3.5 text-[#047857]" />
                              </div>

                              {req.nidScanDataUrl ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setZoomedScan({
                                      title: `1. National ID (Smart NID) Scan · ${req.tutorNameEn}`,
                                      subtitle: `Verification ${req.id} · Smart NID: ${req.nidNumber} · Mobile: ${req.phone}`,
                                      imageUrl: req.nidScanDataUrl!,
                                    })
                                  }
                                  aria-label={`Zoom National ID scan for ${req.tutorNameEn}`}
                                  className="group relative block w-full overflow-hidden rounded-md border border-stone-200 dark:border-stone-700 cursor-pointer"
                                >
                                  <img
                                    src={req.nidScanDataUrl}
                                    alt={`Uploaded NID scan for ${req.tutorNameEn}`}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-24 object-cover"
                                  />
                                  <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded bg-stone-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                    <ZoomIn className="w-2.5 h-2.5" />
                                    <span>Zoom</span>
                                  </span>
                                </button>
                              ) : (
                                <div className="w-full rounded-md bg-[#ECFDF5] dark:bg-emerald-950/40 border border-[#047857]/30 p-2">
                                  <div className="text-[10px] font-bold text-[#047857] dark:text-emerald-400">
                                    CONFIDENTIAL · ADMIN ONLY
                                  </div>
                                  <div className="text-xs font-mono-num font-bold text-[#047857] dark:text-emerald-300 mt-0.5">
                                    NID: {req.nidNumber}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] font-mono-num text-stone-500 pt-1.5 mt-1.5 border-t border-stone-100 dark:border-stone-800 truncate">
                              {req.nidDocumentName}
                            </div>
                          </div>

                          {/* 2. University / College ID Scan (3 cols) */}
                          <div className="lg:col-span-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 p-2.5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1.5">
                                <span className="font-bold text-stone-800 dark:text-stone-200">
                                  2. Student ID Card
                                </span>
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                              </div>

                              {req.uniScanDataUrl ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setZoomedScan({
                                      title: `2. University / College ID Card · ${req.tutorNameEn}`,
                                      subtitle: `${req.institutionFullEn} (${req.departmentEn}) · Reg ID: ${req.studentRegId}`,
                                      imageUrl: req.uniScanDataUrl!,
                                    })
                                  }
                                  aria-label={`Zoom University ID scan for ${req.tutorNameEn}`}
                                  className="group relative block w-full overflow-hidden rounded-md border border-stone-200 dark:border-stone-700 cursor-pointer"
                                >
                                  <img
                                    src={req.uniScanDataUrl}
                                    alt={`Uploaded University ID scan for ${req.tutorNameEn}`}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-24 object-cover"
                                  />
                                  <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded bg-stone-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                    <ZoomIn className="w-2.5 h-2.5" />
                                    <span>Zoom</span>
                                  </span>
                                </button>
                              ) : (
                                <div className="w-full rounded-md bg-amber-500/10 border border-amber-500/30 p-2">
                                  <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 truncate">
                                    {req.institutionFullEn}
                                  </div>
                                  <div className="text-xs font-mono-num font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                                    Reg: {req.studentRegId}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] font-mono-num text-stone-500 pt-1.5 mt-1.5 border-t border-stone-100 dark:border-stone-800 truncate">
                              {req.uniDocumentName}
                            </div>
                          </div>

                          {/* 3. Tutor Profile Photo (2 cols) */}
                          <div className="lg:col-span-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 p-2.5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1.5">
                                <span className="font-bold text-stone-800 dark:text-stone-200">
                                  3. Photo
                                </span>
                                <Camera className="w-3.5 h-3.5 text-[#047857]" />
                              </div>

                              {req.profilePhotoDataUrl ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setZoomedScan({
                                      title: `3. Tutor Profile Photo · ${req.tutorNameEn}`,
                                      subtitle: `Verification ${req.id}`,
                                      imageUrl: req.profilePhotoDataUrl!,
                                    })
                                  }
                                  aria-label={`Zoom Tutor Profile Photo for ${req.tutorNameEn}`}
                                  className="group relative block w-full overflow-hidden rounded-md border border-stone-200 dark:border-stone-700 cursor-pointer"
                                >
                                  <img
                                    src={req.profilePhotoDataUrl}
                                    alt={`Uploaded Profile Photo for ${req.tutorNameEn}`}
                                    loading="lazy"
                                    decoding="async"
                                    referrerPolicy="no-referrer"
                                    className="w-full h-24 object-cover"
                                  />
                                </button>
                              ) : (
                                <div className="w-full h-20 rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex flex-col items-center justify-center p-2 text-center">
                                  <User className="w-5 h-5 text-stone-400 mb-0.5" />
                                  <div className="text-[10px] text-stone-500 truncate max-w-full">
                                    Default Avatar
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] font-mono-num text-stone-500 pt-1.5 mt-1.5 border-t border-stone-100 dark:border-stone-800 truncate">
                              {req.profilePhotoName || 'Avatar.svg'}
                            </div>
                          </div>

                          {/* 4. Admin Audit Note + Quick Reason Chips + Approve / Reject / Unblock Actions (4 cols) */}
                          <div className="lg:col-span-4 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 p-2.5 flex flex-col justify-between space-y-2">
                            <div>
                              <label
                                htmlFor={`admin-note-${req.id}`}
                                className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1"
                              >
                                {lang === 'en'
                                  ? '4. Official Admin Review / Rejection Note'
                                  : '৪. অ্যাডমিন যাচাই / রিজেকশন নোট'}
                              </label>

                              {/* 1-Click Quick Reason Chips */}
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {ADMIN_REJECTION_QUICK_REASONS.map(
                                  (chipReason) => {
                                    const isChipSelected =
                                      noteValue.trim() === chipReason;
                                    return (
                                      <button
                                        key={chipReason}
                                        type="button"
                                        onClick={() =>
                                          setAdminNotes((prev) => ({
                                            ...prev,
                                            [req.id]: chipReason,
                                          }))
                                        }
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer border ${
                                          isChipSelected
                                            ? 'bg-rose-600 text-white border-rose-700'
                                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-rose-400'
                                        }`}
                                      >
                                        {chipReason}
                                      </button>
                                    );
                                  }
                                )}
                              </div>

                              <input
                                id={`admin-note-${req.id}`}
                                type="text"
                                value={noteValue}
                                onChange={(e) =>
                                  setAdminNotes((prev) => ({
                                    ...prev,
                                    [req.id]: e.target.value,
                                  }))
                                }
                                placeholder="Select a quick reason chip or type custom note..."
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                              />
                            </div>

                            {(() => {
                              const reqStatusNorm = (
                                req.status || 'Pending'
                              ).toLowerCase();
                              const isApprovedReq =
                                reqStatusNorm === 'approved' ||
                                reqStatusNorm === 'verified';
                              const isRejectedReq =
                                reqStatusNorm === 'rejected' ||
                                Boolean(req.is_rejected);

                              return (
                                <div className="space-y-1.5">
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <button
                                      type="button"
                                      disabled={isBusyReq || isApprovedReq}
                                      onClick={async () => {
                                        setBusyReqId(req.id);
                                        try {
                                          await onAdminDecision(
                                            req.id,
                                            'Approved',
                                            noteValue
                                          );
                                        } finally {
                                          setBusyReqId(null);
                                        }
                                      }}
                                      className={`py-2 px-2.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
                                        isApprovedReq
                                          ? 'bg-emerald-100 dark:bg-emerald-950 text-[#047857] dark:text-emerald-300 border border-[#047857]/40 cursor-default'
                                          : 'bg-[#047857] hover:bg-[#065F46] text-white shadow-xs'
                                      }`}
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>
                                        {isApprovedReq
                                          ? lang === 'en'
                                            ? '✓ Verified Profile'
                                            : 'অনুমোদিত'
                                          : lang === 'en'
                                          ? '✅ Verify Profile'
                                          : 'অনুমোদন দিন'}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isBusyReq}
                                      onClick={async () => {
                                        setBusyReqId(req.id);
                                        try {
                                          await onAdminDecision(
                                            req.id,
                                            'Rejected',
                                            noteValue.trim() ||
                                              'NID/Student ID Unclear'
                                          );
                                        } finally {
                                          setBusyReqId(null);
                                        }
                                      }}
                                      className={`py-2 px-2.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
                                        isRejectedReq
                                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-400/50 hover:bg-rose-200/70'
                                          : 'bg-stone-200/80 dark:bg-stone-800 hover:bg-red-600 hover:text-white text-stone-800 dark:text-stone-200 shadow-xs'
                                      }`}
                                    >
                                      <ShieldAlert className="w-3.5 h-3.5" />
                                      <span>
                                        {isRejectedReq
                                          ? lang === 'en'
                                            ? '🚫 Rejected (Update Note)'
                                            : 'বাতিলকৃত'
                                          : lang === 'en'
                                          ? '❌ Reject Profile'
                                          : 'বাতিল করুন'}
                                      </span>
                                    </button>
                                  </div>

                                  {isRejectedReq && (
                                    <button
                                      type="button"
                                      disabled={isBusyReq}
                                      onClick={async () => {
                                        setBusyReqId(req.id);
                                        try {
                                          await onAdminDecision(
                                            req.id,
                                            'Pending',
                                            'Account restriction lifted by Admin. Ready for review.'
                                          );
                                        } finally {
                                          setBusyReqId(null);
                                        }
                                      }}
                                      className="w-full py-1.5 px-2.5 rounded-lg text-xs font-extrabold inline-flex items-center justify-center gap-1.5 bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 text-teal-800 dark:text-teal-300 border border-teal-400/60 transition-colors cursor-pointer"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                                      <span>
                                        {lang === 'en'
                                          ? '🔄 Lift Restriction / Unblock Tutor'
                                          : '🔄 আনব্লক করুন'}
                                      </span>
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Full-Screen Document Image Zoom Modal for Admin Inspection */}
      {zoomedScan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={zoomedScan.title}
          onClick={() => setZoomedScan(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl rounded-2xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 pb-3 mb-4 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white">
                  {zoomedScan.title}
                </h3>
                <p className="text-xs font-mono-num text-stone-600 dark:text-stone-400 mt-0.5">
                  {zoomedScan.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setZoomedScan(null)}
                aria-label="Close full-screen document zoom"
                className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center bg-stone-950/95 rounded-xl p-3 max-h-[78vh] overflow-auto">
              <img
                src={zoomedScan.imageUrl}
                alt={zoomedScan.title}
                referrerPolicy="no-referrer"
                className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit User Profile Modal (Saves directly to Supabase profiles / tutor_verifications) */}
      {adminEditingProfile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Edit Tutor Profile — ${adminEditingProfile.tutorNameEn}`}
          onClick={() => !isSavingAdminEdit && setAdminEditingProfile(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 pb-3.5 mb-4 border-b border-stone-200 dark:border-stone-800">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#047857] dark:text-emerald-400">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Admin Profile Editor · Supabase Sync</span>
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white mt-0.5">
                  Edit User Profile ({adminEditingProfile.id})
                </h3>
              </div>
              <button
                type="button"
                disabled={isSavingAdminEdit}
                onClick={() => setAdminEditingProfile(null)}
                aria-label="Close Admin Edit Profile Modal"
                className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminEditProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label
                    htmlFor="admin-edit-name"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="admin-edit-name"
                    type="text"
                    value={adminEditName}
                    onChange={(e) => setAdminEditName(e.target.value)}
                    placeholder="e.g. Rahim Hosen"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-edit-phone"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    id="admin-edit-phone"
                    type="text"
                    value={adminEditPhone}
                    onChange={(e) => setAdminEditPhone(e.target.value)}
                    placeholder="01308937770"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-edit-email"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="admin-edit-email"
                    type="email"
                    value={adminEditEmail}
                    onChange={(e) => setAdminEditEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label
                    htmlFor="admin-edit-upazila"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Upazila
                  </label>
                  <select
                    id="admin-edit-upazila"
                    value={adminEditUpazila}
                    onChange={(e) =>
                      setAdminEditUpazila(
                        e.target.value as Exclude<Upazila, 'All'> | ''
                      )
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  >
                    <option value="">Not Provided Yet</option>
                    {MADARIPUR_UPAZILAS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="admin-edit-college-tag"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Institution Category
                  </label>
                  <select
                    id="admin-edit-college-tag"
                    value={adminEditCollegeTag}
                    onChange={(e) => {
                      const nextCategory = e.target.value as
                        | Exclude<CollegeTag, 'All'>
                        | '';
                      if (nextCategory) {
                        const nextInstFull = resolveAutoFilledInstitutionName(
                          nextCategory,
                          adminEditInstitution,
                          adminEditCollegeTag
                        );
                        setAdminEditInstitution(nextInstFull);
                      }
                      setAdminEditCollegeTag(nextCategory);
                    }}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  >
                    <option value="">Not Provided Yet</option>
                    {COLLEGES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="admin-edit-institution"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Full University / College Name
                  </label>
                  <input
                    id="admin-edit-institution"
                    type="text"
                    value={adminEditInstitution}
                    onChange={(e) => setAdminEditInstitution(e.target.value)}
                    placeholder="Institution Name"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label
                    htmlFor="admin-edit-department"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Department / Degree
                  </label>
                  <input
                    id="admin-edit-department"
                    type="text"
                    value={adminEditDepartment}
                    onChange={(e) => setAdminEditDepartment(e.target.value)}
                    placeholder="e.g. B.Sc. in Physics"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-edit-medium"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Medium / Category
                  </label>
                  <select
                    id="admin-edit-medium"
                    value={adminEditMedium}
                    onChange={(e) => setAdminEditMedium(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  >
                    <option value="">Not Provided Yet</option>
                    {MEDIUM_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="admin-edit-experience"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Experience
                  </label>
                  <input
                    id="admin-edit-experience"
                    type="text"
                    value={adminEditExperience}
                    onChange={(e) => setAdminEditExperience(e.target.value)}
                    placeholder="e.g. 3+ Years Experience"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label
                    htmlFor="admin-edit-nid"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Smart NID Number
                  </label>
                  <input
                    id="admin-edit-nid"
                    type="text"
                    value={adminEditNid}
                    onChange={(e) => setAdminEditNid(e.target.value)}
                    placeholder="Smart NID Number"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-edit-reg-id"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Student / Registration ID
                  </label>
                  <input
                    id="admin-edit-reg-id"
                    type="text"
                    value={adminEditRegId}
                    onChange={(e) => setAdminEditRegId(e.target.value)}
                    placeholder="Reg ID"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-edit-fee"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Expected Monthly Fee (BDT)
                  </label>
                  <input
                    id="admin-edit-fee"
                    type="number"
                    min={0}
                    step={500}
                    value={adminEditMonthlyFee}
                    onChange={(e) => setAdminEditMonthlyFee(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="admin-edit-subjects"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Teaching Subjects (comma-separated)
                  </label>
                  <input
                    id="admin-edit-subjects"
                    type="text"
                    value={adminEditSubjects}
                    onChange={(e) => setAdminEditSubjects(e.target.value)}
                    placeholder="Physics, Higher Math, Chemistry"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-edit-status"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Verification Status
                  </label>
                  <select
                    id="admin-edit-status"
                    value={adminEditStatus}
                    onChange={(e) =>
                      setAdminEditStatus(e.target.value as VerificationStatus)
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-bold"
                  >
                    <option value="Pending">⏳ Pending</option>
                    <option value="Approved">✅ Approved (Verified)</option>
                    <option value="Rejected">❌ Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-edit-note"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  Admin Audit Note
                </label>
                <input
                  id="admin-edit-note"
                  type="text"
                  value={adminEditNote}
                  onChange={(e) => setAdminEditNote(e.target.value)}
                  placeholder="Optional admin audit note..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  disabled={isSavingAdminEdit}
                  onClick={() => setAdminEditingProfile(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdminEdit}
                  className="px-5 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] disabled:opacity-65 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  {isSavingAdminEdit ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    {isSavingAdminEdit
                      ? 'Saving to Supabase...'
                      : 'Save Changes to Supabase'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Circular Applicants Management Section inside 3. Admin Review Desk */}
      <div className="mt-8 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-200/80 dark:border-stone-800">
          <div>
            <h2 className="text-lg font-extrabold text-stone-900 dark:text-white">
              {lang === 'en'
                ? 'Live Tuition Circulars & Tutor Applications (Supabase)'
                : 'লাইভ টিউশনি সার্কুলার ও আবেদনকারী শিক্ষকদের তালিকা'}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {lang === 'en'
                ? 'Click "View Applicants" on any circular to inspect applied tutors and confirm 1 tutor.'
                : 'যেকোনো সার্কুলারে "View Applicants" ক্লিক করে আবেদনকারীদের দেখুন এবং ১ জন শিক্ষক নিশ্চিত করুন।'}
            </p>
          </div>
          <span
            data-testid="circulars-applications-counter-badge"
            className="text-xs font-mono-num font-bold text-[#047857] dark:text-emerald-400"
          >
            {displayCircularsCount} Circulars · {displayApplicationsCount} Total Applications
          </span>
        </div>

        {/* Counter Mode Control Bar (Automatic vs Manual) directly inside Circulars & Applications */}
        <div
          data-testid="circulars-counter-control-bar"
          className="mb-5 p-3 sm:p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-stone-800/70 border border-emerald-500/20 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="block text-xs font-extrabold text-stone-900 dark:text-white">
                {lang === 'en'
                  ? 'Counter Display Mode (Circulars, Applications & Dashboard Stats)'
                  : 'কাউন্টার ডিসপ্লে মোড (সার্কুলার, আবেদন ও ড্যাশবোর্ড)'}
              </span>
              <span className="block text-[11px] text-stone-500 dark:text-stone-400">
                {cmsStatsMode === 'auto'
                  ? `Live DB Counts active: ${adminVisibleJobs.length} Circulars · ${adminVisibleApplications.length} Total Applications · ${autoCalcVerifiedCount}+ Verified · ${autoCalcOnlineCount}+ Online`
                  : 'Manual Custom Digits active — saved values apply to Circulars badge & Dashboard stats.'}
              </span>
            </div>

            <div
              role="group"
              aria-label="Circulars Counter Mode Toggle"
              className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shrink-0"
            >
              <button
                type="button"
                aria-pressed={cmsStatsMode === 'auto'}
                onClick={() => void handleToggleCmsStatsMode('auto')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  cmsStatsMode === 'auto'
                    ? 'bg-gradient-to-r from-[#059669] to-[#047857] text-white shadow-2xs'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                Automatic (Live DB Count)
              </button>
              <button
                type="button"
                aria-pressed={cmsStatsMode === 'manual'}
                onClick={() => void handleToggleCmsStatsMode('manual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  cmsStatsMode === 'manual'
                    ? 'bg-gradient-to-r from-[#059669] to-[#047857] text-white shadow-2xs'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                Manual (Custom Digits)
              </button>
            </div>
          </div>

          {cmsStatsMode === 'manual' && (
            <div className="pt-2.5 border-t border-stone-200/80 dark:border-stone-700/70 grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end">
              <div>
                <label
                  htmlFor="circulars-ctrl-manual-circulars"
                  className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                >
                  Circulars Count
                </label>
                <input
                  id="circulars-ctrl-manual-circulars"
                  type="text"
                  value={cmsManualActiveCirculars}
                  onChange={(e) => setCmsManualActiveCirculars(e.target.value)}
                  placeholder="30+"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                />
              </div>

              <div>
                <label
                  htmlFor="circulars-ctrl-manual-applications"
                  className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                >
                  Total Applications Count
                </label>
                <input
                  id="circulars-ctrl-manual-applications"
                  type="text"
                  value={cmsManualTotalApplications}
                  onChange={(e) =>
                    setCmsManualTotalApplications(e.target.value)
                  }
                  placeholder="85"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                />
              </div>

              <div>
                <label
                  htmlFor="circulars-ctrl-manual-verified"
                  className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                >
                  Verified Tutors Count
                </label>
                <input
                  id="circulars-ctrl-manual-verified"
                  type="text"
                  value={cmsManualVerifiedTutors}
                  onChange={(e) => setCmsManualVerifiedTutors(e.target.value)}
                  placeholder="120+"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                />
              </div>

              <div>
                <label
                  htmlFor="circulars-ctrl-manual-online"
                  className="block text-[11px] font-bold text-stone-700 dark:text-stone-200 mb-1"
                >
                  Online Tutors Count
                </label>
                <input
                  id="circulars-ctrl-manual-online"
                  type="text"
                  value={cmsManualOnlineTutors}
                  onChange={(e) => setCmsManualOnlineTutors(e.target.value)}
                  placeholder="45+"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-mono-num font-bold text-stone-900 dark:text-white focus:outline-none focus:border-[#047857]"
                />
              </div>

              <button
                type="button"
                disabled={isSavingHomepageCms}
                onClick={() => void handleSaveHomepageCms()}
                className="col-span-2 sm:col-span-1 min-h-[36px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] disabled:opacity-60 text-white text-xs font-extrabold transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isSavingHomepageCms ? 'Saving...' : 'Save / Upload Counter'}
                </span>
              </button>
            </div>
          )}
        </div>

        {adminVisibleJobs.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
            {lang === 'en'
              ? 'No live tuition circulars in Admin Review. Click "Post Tuition Circular (Admin Only)" above to publish one.'
              : 'এখনো কোনো টিউশনি সার্কুলার পোস্ট করা হয়নি।'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminVisibleJobs.map((job) => {
              const circularApps = getApplicationsForCircular(
                adminVisibleApplications,
                job.id
              );
              const confirmedApp = getConfirmedApplicationForCircular(
                applications,
                job.id
              );
              const isConfirmed =
                Boolean(confirmedApp) ||
                (job.status || '').trim().toLowerCase() === 'confirmed';
              const confirmedName =
                confirmedApp?.tutor_name || job.confirmedTutorName;
              const confirmedId =
                confirmedApp?.tutor_id || job.confirmedTutorId;

              const details = extractCircularDetails(job, lang);

              return (
                <div
                  key={job.id}
                  className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-5 flex flex-col justify-between shadow-xs transition-colors"
                >
                  <div>
                    {/* Top Header Bar: ID Pill + Status Badge + Posted Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 font-mono-num">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 shadow-2xs">
                          {job.id}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                            isConfirmed
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 dark:bg-stone-800 dark:text-stone-300 border border-slate-200 dark:border-stone-700'
                          }`}
                        >
                          {isConfirmed
                            ? lang === 'en'
                              ? 'Confirmed'
                              : 'নিশ্চিতকৃত'
                            : job.status === 'Active' || !job.status
                            ? lang === 'en'
                              ? 'Open'
                              : 'উন্মুক্ত'
                            : job.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-stone-400 whitespace-nowrap font-mono-num">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-stone-500 shrink-0" />
                        <span>{lang === 'en' ? job.postedAgoEn : job.postedAgoBn}</span>
                      </div>
                    </div>

                    {/* Circular Headline */}
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-stone-50 mt-1.5 leading-snug line-clamp-2">
                      {lang === 'en' ? job.titleEn : job.titleBn}
                    </h3>

                    {/* Confirmed Tutor Banner if confirmed */}
                    {isConfirmed && confirmedName && (
                      <div className="p-2.5 my-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>
                          {lang === 'en'
                            ? `Confirmed Tutor: ${confirmedName} (${confirmedId || 'Verified'})`
                            : `নিশ্চিতকৃত টিউটর: ${confirmedName} (${confirmedId || 'Verified'})`}
                        </span>
                      </div>
                    )}

                    {/* 2. Structured 2-Column Icon Grid */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 my-3 bg-slate-50/80 dark:bg-stone-800/60 rounded-xl border border-slate-200/80 dark:border-stone-700/80">
                      {/* Item 1: Tuition Type */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                          {job.mode === 'Online' ? (
                            <Laptop className="w-4 h-4" />
                          ) : (
                            <Home className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] text-slate-400 dark:text-stone-400 font-semibold uppercase tracking-wider truncate">
                            {lang === 'en' ? 'Tuition Type' : 'টিউশনির ধরন'}
                          </span>
                          <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-stone-100 leading-snug truncate">
                            {details.tuitionType}
                          </span>
                        </div>
                      </div>

                      {/* Item 2: Category / Medium */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] text-slate-400 dark:text-stone-400 font-semibold uppercase tracking-wider truncate">
                            {lang === 'en' ? 'Category' : 'ক্যাটাগরি'}
                          </span>
                          <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-stone-100 leading-snug truncate">
                            {details.category}
                          </span>
                        </div>
                      </div>

                      {/* Item 3: Class */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] text-slate-400 dark:text-stone-400 font-semibold uppercase tracking-wider truncate">
                            {lang === 'en' ? 'Class' : 'শ্রেণি'}
                          </span>
                          <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-stone-100 leading-snug truncate">
                            {details.studentClass}
                          </span>
                        </div>
                      </div>

                      {/* Item 4: No. of Students */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-violet-100/80 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center shrink-0 mt-0.5">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] text-slate-400 dark:text-stone-400 font-semibold uppercase tracking-wider truncate">
                            {lang === 'en' ? 'No. of Students' : 'শিক্ষার্থীর সংখ্যা'}
                          </span>
                          <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-stone-100 leading-snug font-mono-num truncate">
                            {details.numStudentsText}
                          </span>
                        </div>
                      </div>

                      {/* Item 5: Tutoring Days */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] text-slate-400 dark:text-stone-400 font-semibold uppercase tracking-wider truncate">
                            {lang === 'en' ? 'Tutoring Days' : 'সাপ্তাহিক দিন'}
                          </span>
                          <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-stone-100 leading-snug font-mono-num truncate">
                            {details.tutoringDaysText}
                          </span>
                        </div>
                      </div>

                      {/* Item 6: Preferred Tutor */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-100/80 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] text-slate-400 dark:text-stone-400 font-semibold uppercase tracking-wider truncate">
                            {lang === 'en' ? 'Preferred Tutor' : 'পছন্দের শিক্ষক'}
                          </span>
                          <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-stone-100 leading-snug truncate">
                            {details.preferredTutorText}
                          </span>
                        </div>
                      </div>

                      {/* Item 7: Location (Full Width Row) */}
                      <div className="col-span-2 flex items-start gap-2.5 pt-2 border-t border-slate-200/60 dark:border-stone-700/60">
                        <div className="w-8 h-8 rounded-lg bg-rose-100/80 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] text-slate-400 dark:text-stone-400 font-semibold uppercase tracking-wider">
                            {lang === 'en' ? 'Location' : 'লোকেশন'}
                          </span>
                          <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-stone-100 leading-snug">
                            {details.locationText}
                          </span>
                        </div>
                      </div>

                      {/* Item 8: Subjects (Full Width Row) */}
                      <div className="col-span-2 flex items-start gap-2.5 pt-2 border-t border-slate-200/60 dark:border-stone-700/60">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] text-slate-400 dark:text-stone-400 font-semibold uppercase tracking-wider">
                            {lang === 'en' ? 'Subjects' : 'পাঠদানের বিষয়সমূহ'}
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {details.subjectsList.map((subj, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-700 text-slate-800 dark:text-stone-200 shadow-2xs"
                              >
                                {subj}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guardian Phone Info for Admin */}
                    {job.contactPhone && (
                      <div className="flex items-center justify-between p-2.5 my-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                          <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                            {lang === 'en' ? '📞 Guardian Phone: ' : '📞 অভিভাবকের মোবাইল: '}
                          </span>
                          <span className="font-mono-num font-extrabold text-emerald-800 dark:text-emerald-300">
                            {job.contactPhone}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                          {lang === 'en' ? 'Admin Access' : 'অ্যাডমিন ভিউ'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Bar: Salary + Applicants & Admin Buttons */}
                  <div className="mt-4 pt-3.5 border-t border-slate-200/90 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-stone-400">
                        {lang === 'en' ? 'Monthly Salary' : 'মাসিক বেতন'}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg sm:text-xl font-extrabold text-emerald-800 dark:text-emerald-300 font-mono-num">
                          {formatBDT(job.salaryBdt, lang)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-stone-400">
                          {lang === 'en' ? '/month' : '/মাস'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {onOpenAdminApplicants && (
                        <button
                          type="button"
                          onClick={() => onOpenAdminApplicants(job)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-[#047857] dark:hover:bg-emerald-400 text-white dark:text-stone-900 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>
                            {lang === 'en'
                              ? `View Applicants (${circularApps.length})`
                              : `আবেদনকারী দেখুন (${toBanglaNumber(
                                  circularApps.length
                                )})`}
                          </span>
                        </button>
                      )}

                      {/* Button 1: 🧹 Delete from Admin Panel */}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await onHideCircularFromAdmin?.(job.id);
                            showAdminToast(
                              'success',
                              lang === 'en'
                                ? `Circular ${job.id} hidden from Admin Panel.`
                                : `সার্কুলার (${job.id}) অ্যাডমিন প্যানেল থেকে সরানো হয়েছে।`
                            );
                          } catch (err: any) {
                            console.error(
                              'Error hiding circular from Admin Panel:',
                              err
                            );
                            showAdminToast(
                              'error',
                              err?.message ||
                                'Failed to hide circular from Admin Panel.'
                            );
                          }
                        }}
                        aria-label={`Delete circular ${job.id} from Admin Panel`}
                        className="py-1.5 px-2.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 bg-amber-100/90 dark:bg-amber-950/70 hover:bg-amber-200 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-400/60 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <span>🧹 Delete from Admin Panel</span>
                      </button>

                      {/* Button 2: 🗑️ Delete from Everywhere */}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await onDeleteCircularEverywhere?.(job.id);
                            showAdminToast(
                              'success',
                              lang === 'en'
                                ? `Circular ${job.id} deleted everywhere.`
                                : `সার্কুলার (${job.id}) সম্পূর্ণ মুছে ফেলা হয়েছে।`
                            );
                          } catch (err: any) {
                            console.error(
                              'Error deleting circular everywhere:',
                              err
                            );
                            showAdminToast(
                              'error',
                              err?.message ||
                                'Failed to delete circular everywhere.'
                            );
                          }
                        }}
                        aria-label={`Delete circular ${job.id} from Everywhere`}
                        className="py-1.5 px-2.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 bg-red-700 hover:bg-red-800 text-white border border-red-800/40 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <span>🗑️ Delete from Everywhere</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View & Edit Guardian Request Full Details Modal */}
      {editingGuardianRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="View and Edit Guardian Tuition Request"
        >
          <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="px-5 py-4 bg-gradient-to-r from-[#047857] to-[#065F46] text-white flex items-center justify-between gap-3 shrink-0">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  👁️ Guardian Request Inspector · ID: {editingGuardianRequest.id}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold">
                  {lang === 'en'
                    ? 'View & Edit Guardian Tuition Request Details'
                    : 'অভিভাবক টিউটর রিকোয়েস্টের সম্পূর্ণ তথ্য দেখুন ও সম্পাদনা করুন'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingGuardianRequest(null)}
                aria-label="Close modal"
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    👤 Guardian Full Name
                  </label>
                  <input
                    type="text"
                    value={editingGuardianRequest.guardianName}
                    onChange={(e) =>
                      setEditingGuardianRequest({
                        ...editingGuardianRequest,
                        guardianName: e.target.value,
                      })
                    }
                    placeholder="e.g. Rahim Hosen"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    📞 Guardian Phone Number
                  </label>
                  <input
                    type="text"
                    value={editingGuardianRequest.guardianPhone}
                    onChange={(e) =>
                      setEditingGuardianRequest({
                        ...editingGuardianRequest,
                        guardianPhone: e.target.value,
                      })
                    }
                    placeholder="01308937770"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    🔖 Request Status
                  </label>
                  <select
                    value={editingGuardianRequest.status}
                    onChange={(e) =>
                      setEditingGuardianRequest({
                        ...editingGuardianRequest,
                        status: e.target.value as
                          | 'pending'
                          | 'contacted'
                          | 'converted',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-bold"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="contacted">📞 Contacted</option>
                    <option value="converted">✅ Converted to Circular</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    🎓 Student Class
                  </label>
                  <input
                    type="text"
                    value={editingGuardianRequest.studentClass}
                    onChange={(e) =>
                      setEditingGuardianRequest({
                        ...editingGuardianRequest,
                        studentClass: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    📘 Medium / Version
                  </label>
                  <select
                    value={editingGuardianRequest.mediumVersion}
                    onChange={(e) =>
                      setEditingGuardianRequest({
                        ...editingGuardianRequest,
                        mediumVersion: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-semibold"
                  >
                    <option value="Bangla Medium">Bangla Medium</option>
                    <option value="English Version">English Version</option>
                    <option value="Madrasa / Alim">Madrasa / Alim</option>
                    <option value="English Medium">English Medium</option>
                    <option value="Admission Coaching">
                      Admission Coaching
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    🏫 School / College Name
                  </label>
                  <input
                    type="text"
                    value={editingGuardianRequest.schoolCollegeName}
                    onChange={(e) =>
                      setEditingGuardianRequest({
                        ...editingGuardianRequest,
                        schoolCollegeName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    👥 Number of Students
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editingGuardianRequest.numberOfStudents}
                    onChange={(e) =>
                      setEditingGuardianRequest({
                        ...editingGuardianRequest,
                        numberOfStudents: Math.max(
                          1,
                          Number(e.target.value) || 1
                        ),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    📚 Requested Subjects (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editingGuardianRequest.subjects}
                    onChange={(e) =>
                      setEditingGuardianRequest({
                        ...editingGuardianRequest,
                        subjects: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    👨‍🏫 Preferred Tutor Gender
                  </label>
                  <select
                    value={editingGuardianRequest.preferredGender}
                    onChange={(e) =>
                      setEditingGuardianRequest({
                        ...editingGuardianRequest,
                        preferredGender: e.target.value as
                          | 'Male'
                          | 'Female'
                          | 'Any',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-semibold"
                  >
                    <option value="Any">Any Gender</option>
                    <option value="Male">Male Tutor</option>
                    <option value="Female">Female Tutor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    💰 Monthly Salary (BDT)
                  </label>
                  <input
                    type="number"
                    min={500}
                    step={500}
                    value={editingGuardianRequest.offeredSalary}
                    onChange={(e) =>
                      setEditingGuardianRequest({
                        ...editingGuardianRequest,
                        offeredSalary: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    📅 Days per Week
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={editingGuardianRequest.daysPerWeek}
                    onChange={(e) =>
                      setEditingGuardianRequest({
                        ...editingGuardianRequest,
                        daysPerWeek: Math.min(
                          7,
                          Math.max(1, Number(e.target.value) || 1)
                        ),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    ⏰ Tutoring Time / Duration
                  </label>
                  <input
                    type="text"
                    value={editingGuardianRequest.preferredTimeDuration}
                    onChange={(e) =>
                      setEditingGuardianRequest({
                        ...editingGuardianRequest,
                        preferredTimeDuration: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    🏛️ Preferred University / Qualification
                  </label>
                  <input
                    type="text"
                    value={editingGuardianRequest.preferredUniversity}
                    onChange={(e) =>
                      setEditingGuardianRequest({
                        ...editingGuardianRequest,
                        preferredUniversity: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    📍 Upazila / Area
                  </label>
                  <select
                    value={editingGuardianRequest.upazilaArea}
                    onChange={(e) =>
                      setEditingGuardianRequest({
                        ...editingGuardianRequest,
                        upazilaArea: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-semibold"
                  >
                    <option value="Madaripur Sadar">Madaripur Sadar</option>
                    <option value="Shibchar">Shibchar</option>
                    <option value="Kalkini">Kalkini</option>
                    <option value="Rajoir">Rajoir</option>
                    <option value="Dasar">Dasar</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    🏠 Complete Detailed Home Address
                  </label>
                  <input
                    type="text"
                    value={editingGuardianRequest.fullAddress}
                    onChange={(e) =>
                      setEditingGuardianRequest({
                        ...editingGuardianRequest,
                        fullAddress: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                  📝 Special Requirements / Guardian&apos;s Note
                </label>
                <textarea
                  rows={2}
                  value={editingGuardianRequest.specialRequirements || ''}
                  onChange={(e) =>
                    setEditingGuardianRequest({
                      ...editingGuardianRequest,
                      specialRequirements: e.target.value,
                    })
                  }
                  placeholder="Any special instructions or tutor requirements..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-medium resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingGuardianRequest(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSavingGuardianEdit}
                onClick={async () => {
                  setIsSavingGuardianEdit(true);
                  try {
                    await onUpdateGuardianRequestDetails?.(
                      editingGuardianRequest
                    );
                    showAdminToast(
                      'success',
                      `Saved updated details for ${editingGuardianRequest.guardianName}.`
                    );
                    setEditingGuardianRequest(null);
                  } catch (err: any) {
                    showAdminToast(
                      'error',
                      err?.message || 'Failed to save guardian request changes.'
                    );
                  } finally {
                    setIsSavingGuardianEdit(false);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 cursor-pointer"
              >
                💾 Save Changes Only
              </button>

              {onConvertGuardianRequestToCircular && (
                <button
                  type="button"
                  disabled={isSavingGuardianEdit}
                  onClick={async () => {
                    setIsSavingGuardianEdit(true);
                    try {
                      await onUpdateGuardianRequestDetails?.(
                        editingGuardianRequest
                      );
                      await onConvertGuardianRequestToCircular(
                        editingGuardianRequest
                      );
                      showAdminToast(
                        'success',
                        `Updated & published ${editingGuardianRequest.guardianName}'s request as a live Tuition Circular!`
                      );
                      setEditingGuardianRequest(null);
                    } catch (err: any) {
                      showAdminToast(
                        'error',
                        err?.message ||
                          'Failed to save & convert guardian request.'
                      );
                    } finally {
                      setIsSavingGuardianEdit(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#047857] hover:bg-[#065F46] text-white inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>🚀 Save & Convert to Live Circular</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PaymentModal on Admin Review Desk */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        lang={lang}
        onClose={() => setIsPaymentModalOpen(false)}
        currentUser={currentUser}
        siteSettings={resolvedSocialSettings}
        userPayments={adminVisiblePayments}
        defaultMethod={paymentModalMethod}
        onSubmitPayment={handlePaymentSubmitted}
      />
    </section>
  );
};

