import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_EMAIL,
  DEFAULT_ADMIN_PIN,
  EMAIL_CONFIRMATION_MESSAGE,
  addReviewToTutor,
  buildCircularApplicationRow,
  calculateAverageRating,
  canAccessDesk,
  canAccessProtectedRoute,
  canPostTuitionCircular,
  confirmTutorForCircularState,
  deleteApplicationFromEverywhereState,
  deleteCircularFromEverywhereState,
  deleteVerificationFromEverywhereState,
  doesApplicationBelongToUser,
  enrichCircularJobsWithApplications,
  evaluateSignUpOutcome,
  extractCircularDetails,
  extractSupabaseStorageTargets,
  filterAdminVisibleApplications,
  filterAdminVisibleCirculars,
  filterAdminVisibleVerifications,
  filterTutors,
  findApplicantFullTutorProfile,
  findTutorApplicationsByQuery,
  findTutorVerificationProfile,
  formatBDT,
  getApplicationsForCircular,
  getCircularClassSubjectLabel,
  getConfirmedApplicationForCircular,
  getTutorApplicationForCircular,
  getTutorProfileStatusBadge,
  getTutorProfileStorageKeyForUser,
  getUserApplicationForCircular,
  getUserAppliedApplications,
  getUserCircularApplicationStatusBadge,
  hideApplicationFromAdminOnly,
  hideCircularFromAdminOnly,
  hideVerificationFromAdminOnly,
  isActiveVerificationRequest,
  isAdminEmail,
  buildSupabaseStorageObjectPath,
  mapCircularRowToTuitionJob,
  mapSupabaseRowToVerificationRequest,
  mapTuitionJobToCircularRow,
  mapVerificationRequestToProfilesTableRow,
  mapVerificationRequestToSupabaseRow,
  maskSmartNidNumber,
  matchesAdminTabFilter,
  parseSupabaseStorageUrl,
  processVerificationDecision,
  publishAdminTuitionCircular,
  purgeUnusablePlatformData,
  rejectTutorForCircularState,
  removeReviewFromTutor,
  sanitizeStorageFileName,
  sortCircularRowsNewestFirst,
  syncPublicTutorsFromVerifications,
  validateAccountInput,
  validateCircularApplicationInput,
  NID_STUDENT_ID_JPG_ONLY_ERROR,
  validateNIDNumber,
  validateNidOrStudentIdJpgFile,
  validatePhoneBD,
  validateProfilePhotoFile,
  validateTutorProfileSubmission,
  verifyAdminPin,
  buildInitialGoogleTutorProfile,
  isGoogleSessionUser,
  mapSupabaseSessionToUser,
  NEW_ACCOUNT_HEADER_BADGE,
  NO_FILE_UPLOADED_PLACEHOLDER,
  PROFILE_FIELD_PLACEHOLDER,
  UNSUBMITTED_PROFILE_BANNER_EN,
  ADMIN_REMOVED_PROFILE_NOTICE,
  applyAdminProfileEditState,
  formatProfileFieldOrPlaceholder,
  isTutorProfileSubmitted,
  sanitizeUnsubmittedGoogleProfile,
  encodeDepartmentWithMeta,
  decodeDepartmentWithMeta,
  markExplicitLoginIntent,
  markSignUpFlowInProgress,
  isSignUpFlowInProgress,
  hasFreshExplicitLoginIntent,
  clearExplicitLoginIntent,
  markTutorProfileSyncedForEmail,
  hasPriorSyncedTutorProfileForEmail,
  purgeLegacyLocalStorageProfileCache,
  isAuthUserDeletedError,
  shouldForceWipeDeletedUserSession,
  clearAllTutorZoneBrowserStorage,
  PROTECTED_ADMIN_DELETE_ERROR,
  isProtectedAdminProfile,
  isOAuthRedirectCallbackUrl,
  filterStrictLiveSupabaseVerifications,
  syncStrictLiveSupabaseTutors,
  SITE_SOCIAL_SETTINGS_STORAGE_KEY,
  SOCIAL_LINKS_UPDATED_TOAST,
  formatWhatsAppDirectLink,
  normalizeFacebookUrl,
  isSocialChannelActive,
  readSiteSocialSettingsFromStorage,
  writeSiteSocialSettingsToStorage,
  fetchSiteSocialSettingsFromSupabase,
  saveSiteSocialSettingsToSupabase,
  DEFAULT_BKASH_NUMBER,
  DEFAULT_NAGAD_NUMBER,
  DEFAULT_VERIFICATION_FEE_BDT,
  PAYMENT_REQUESTS_STORAGE_KEY,
  validateTransactionId,
  validatePaymentSubmissionInput,
  buildPaymentRequestRow,
  getUserPaymentRequests,
  getTutorPaymentVerificationSummary,
  filterAdminVisiblePaymentRequests,
  fetchPaymentRequestsFromSupabase,
  submitPaymentRequestToSupabase,
  updatePaymentRequestStatusInSupabase,
  deletePaymentRequestFromSupabase,
  canShowPaymentSectionOnProfile,
  extractMediaFeeFromApplication,
  getPaymentForCircular,
  hasUserConfirmedTuition,
  isPaymentApprovedForCircular,
  SITE_NOTICES_STORAGE_KEY,
  NOTICE_DEFAULT_CATEGORIES,
  readSiteNoticesFromStorage,
  writeSiteNoticesToStorage,
  getActiveSiteNotices,
  getNoticeCategoryBadgeStyle,
  fetchSiteNoticesFromSupabase,
  saveSiteNoticeToSupabase,
  toggleSiteNoticeStatusInSupabase,
  deleteSiteNoticeFromSupabase,
  GUARDIAN_REQUESTS_STORAGE_KEY,
  readGuardianRequestsFromStorage,
  writeGuardianRequestsToStorage,
  submitGuardianRequestToSupabase,
  updateGuardianRequestStatusInSupabase,
  deleteGuardianRequestFromSupabase,
  sortAdminPaymentRequests,
  sortAdminVerificationRequests,
  sortAdminCircularApplications,
  sortAdminGuardianRequests,
  extractAdminNoteFromApplication,
  getCleanApplicantExperienceNote,
  formatApplicationNoteWithMetadata,
  ADMIN_REJECTION_QUICK_REASONS,
  DUPLICATE_CIRCULAR_APPLICATION_MESSAGE,
  hasTutorAlreadyAppliedToCircular,
  isTutorAccountRestricted,
  getTutorAccountRestrictionDetails,
  getCircularCardApplyButtonState,
  unblockTutorForCircularState,
  HOMEPAGE_STATS_UPDATED_TOAST,
  DEFAULT_SITE_SOCIAL_SETTINGS,
  resolveHomepageLiveStats,
  MADARIPUR_INSTITUTION_CATEGORIES,
  SPECIFIC_MADARIPUR_COLLEGES,
  isSpecificMadaripurCollege,
  resolveAutoFilledInstitutionName,
  MEMOIZED_ALL_UPAZILAS,
  MEMOIZED_COLLEGE_TAGS,
  MEMOIZED_MEDIUM_CATEGORIES,
  PUBLIC_TUITION_CIRCULAR_COLUMNS,
  PUBLIC_CIRCULAR_APPLICATION_COLUMNS,
  SITE_SETTINGS_SELECT_COLUMNS,
  SITE_NOTICES_SELECT_COLUMNS,
  PAYMENT_REQUESTS_SELECT_COLUMNS,
  GUARDIAN_REQUESTS_SELECT_COLUMNS,
  fetchSiteSocialSettingsOncePerSession,
  fetchSiteNoticesOncePerSession,
} from './tutorEngine';

import {
  dataUrlToBlob,
  ensureGoogleUserProfileSynced,
  executeAdminUpdateProfileInSupabase,
  syncTutorProfileToSupabase,
  uploadDocumentToSupabaseStorage,
} from './supabaseProfileUpload';
import { executeAdminDeleteProfileEverywhere } from './supabaseAdminDelete';
import {
  INITIAL_TUITION_JOBS,
  INITIAL_TUTORS,
  INITIAL_VERIFICATION_REQUESTS,
} from '../data/madaripurData';
import {
  CircularApplicationRow,
  FilterState,
  PaymentRequestRecord,
  SiteNotice,
  GuardianRequestRecord,
  TuitionJob,
  TutorProfile,
  VerificationRequest,
} from '../types/madaripur';

const defaultFilters: FilterState = {
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

const TEST_TUTORS: TutorProfile[] = [
  {
    id: 'tutor-mdp-01',
    nameEn: 'Md. Rakibul Hasan',
    nameBn: 'মোঃ রাকিবুল হাসান',
    gender: 'Male',
    collegeTag: 'DU',
    institutionFullEn: 'University of Dhaka (DU)',
    institutionFullBn: 'ঢাকা বিশ্ববিদ্যালয় (ঢাবি)',
    departmentEn: 'B.Sc. (Hons) in Physics',
    departmentBn: 'পদার্থবিজ্ঞান বিভাগ (অনার্স)',
    upazila: 'Madaripur Sadar',
    coveredAreasEn: ['Lake Par', 'Chowrasta'],
    coveredAreasBn: ['লেক পাড়', 'চৌরাস্তা'],
    modes: ['Home', 'Online'],
    mediums: ['Bangla Medium', 'Admission Test'],
    subjectsEn: ['Physics', 'Higher Math'],
    subjectsBn: ['পদার্থবিজ্ঞান', 'উচ্চতর গণিত'],
    preferredClassesEn: 'Class 9–10 (SSC) & HSC',
    preferredClassesBn: 'নবম–দশম ও এইচএসসি',
    monthlyFee: 5000,
    experienceYears: 4,
    responseTimeEn: '15 mins',
    responseTimeBn: '১৫ মিনিট',
    nidVerified: true,
    uniIdVerified: true,
    verificationStatus: 'Approved',
    verificationCode: 'MDP-VER-01',
    rating: 5.0,
    totalReviews: 2,
    studentsTaught: 18,
    bioEn: 'Experienced physics and math tutor in Madaripur Sadar.',
    bioBn: 'মাদারীপুর সদরে পদার্থবিজ্ঞান ও গণিতের অভিজ্ঞ গৃহশিক্ষক।',
    hscGpa: '5.00',
    sscGpa: '5.00',
    availableDaysEn: '4 Days / Week',
    availableDaysBn: 'সপ্তাহে ৪ দিন',
    portraitVariant: 'rakib',
    reviews: [
      {
        id: 'rev-1',
        guardianName: 'Adv. Kamrul Islam',
        guardianArea: 'Lake Par, Madaripur Sadar',
        studentClass: 'HSC 2nd Year',
        rating: 5,
        date: 'January 2026',
        commentEn: 'Excellent Physics mentor.',
        commentBn: 'অসাধারণ শিক্ষক।',
      },
      {
        id: 'rev-2',
        guardianName: 'Mrs. Nasrin Akter',
        guardianArea: 'DC Bridge, Sadar',
        studentClass: 'SSC Candidate',
        rating: 5,
        date: 'December 2025',
        commentEn: 'Very punctual.',
        commentBn: 'খুবই সময়নিষ্ঠ।',
      },
    ],
  },
  {
    id: 'tutor-mdp-02',
    nameEn: 'Farhana Yeasmin Tithi',
    nameBn: 'ফারহানা ইয়াসমিন তিথি',
    gender: 'Female',
    collegeTag: 'Govt. Nazimuddin College',
    institutionFullEn: 'Govt. Nazimuddin College, Madaripur',
    institutionFullBn: 'সরকারি নাজিমউদ্দিন কলেজ',
    departmentEn: 'B.Sc. (Hons) in Mathematics',
    departmentBn: 'গণিত বিভাগ (অনার্স)',
    upazila: 'Shibchar',
    coveredAreasEn: ['Shibchar 71 Road', 'Pachchar'],
    coveredAreasBn: ['শিবচর ৭১ সড়ক', 'পাচ্চর'],
    modes: ['Home', 'Group'],
    mediums: ['Bangla Medium', 'English Version'],
    subjectsEn: ['General Math', 'English'],
    subjectsBn: ['সাধারণ গণিত', 'ইংরেজি'],
    preferredClassesEn: 'Class 5–10',
    preferredClassesBn: 'পঞ্চম–দশম শ্রেণি',
    monthlyFee: 3500,
    experienceYears: 3,
    responseTimeEn: '10 mins',
    responseTimeBn: '১০ মিনিট',
    nidVerified: true,
    uniIdVerified: true,
    verificationStatus: 'Approved',
    verificationCode: 'MDP-VER-02',
    rating: 4.9,
    totalReviews: 1,
    studentsTaught: 14,
    bioEn: 'Dedicated female tutor in Shibchar.',
    bioBn: 'শিবচরের দক্ষ নারী গৃহশিক্ষিকা।',
    hscGpa: '5.00',
    sscGpa: '5.00',
    availableDaysEn: '4 Days / Week',
    availableDaysBn: 'সপ্তাহে ৪ দিন',
    portraitVariant: 'farhana',
    reviews: [],
  },
  {
    id: 'tutor-mdp-05',
    nameEn: 'Hafez Mawlana Abdullah Al Mamun',
    nameBn: 'হাফেজ মাওলানা আব্দুল্লাহ আল মামুন',
    gender: 'Male',
    collegeTag: 'Madaripur Govt. College',
    institutionFullEn: 'Madaripur Govt. College',
    institutionFullBn: 'মাদারীপুর সরকারি কলেজ',
    departmentEn: 'B.A. (Hons) in Islamic Studies',
    departmentBn: 'ইসলামিক স্টাডিজ বিভাগ',
    upazila: 'Kalkini',
    coveredAreasEn: ['Kalkini Thana Mor', 'Bhurghata'],
    coveredAreasBn: ['কালকিনি থানা মোড়', 'ভুরঘাটা'],
    modes: ['Home', 'Online'],
    mediums: ['Madrasah/Quranic', 'Bangla Medium'],
    subjectsEn: ['Holy Quran & Tajweed', 'Arabic 1st & 2nd'],
    subjectsBn: ['কুরআন ও তাজবীদ', 'আরবি'],
    preferredClassesEn: 'All Ages',
    preferredClassesBn: 'সকল বয়স',
    monthlyFee: 2500,
    experienceYears: 6,
    responseTimeEn: '15 mins',
    responseTimeBn: '১৫ মিনিট',
    nidVerified: true,
    uniIdVerified: true,
    verificationStatus: 'Approved',
    verificationCode: 'MDP-VER-05',
    rating: 5.0,
    totalReviews: 1,
    studentsTaught: 40,
    bioEn: 'Tajweed and Arabic specialist in Kalkini.',
    bioBn: 'কালকিনিতে কুরআন ও আরবি শিক্ষক।',
    hscGpa: '5.00',
    sscGpa: '5.00',
    availableDaysEn: '5 Days / Week',
    availableDaysBn: 'সপ্তাহে ৫ দিন',
    portraitVariant: 'mahmud',
    reviews: [],
  },
  {
    id: 'tutor-mdp-06',
    nameEn: 'Sadia Afrin Mim',
    nameBn: 'সাদিয়া আফরিন মিম',
    gender: 'Female',
    collegeTag: 'Govt. Nazimuddin College',
    institutionFullEn: 'Govt. Nazimuddin College',
    institutionFullBn: 'সরকারি নাজিমউদ্দিন কলেজ',
    departmentEn: 'B.Sc. (Hons) in Chemistry',
    departmentBn: 'রসায়ন বিভাগ',
    upazila: 'Rajoir',
    coveredAreasEn: ['Tekerhat Port', 'Rajoir Bazar'],
    coveredAreasBn: ['টেকেরহাট বন্দর', 'রাজৈর বাজার'],
    modes: ['Home'],
    mediums: ['Bangla Medium'],
    subjectsEn: ['Chemistry', 'Biology'],
    subjectsBn: ['রসায়ন', 'জীববিজ্ঞান'],
    preferredClassesEn: 'Class 6–10',
    preferredClassesBn: 'ষষ্ঠ–দশম শ্রেণি',
    monthlyFee: 3000,
    experienceYears: 2,
    responseTimeEn: '25 mins',
    responseTimeBn: '২৫ মিনিট',
    nidVerified: false,
    uniIdVerified: false,
    verificationStatus: 'Pending',
    verificationCode: 'MDP-VER-06',
    rating: 4.8,
    totalReviews: 1,
    studentsTaught: 9,
    bioEn: 'Rajoir & Tekerhat science tutor.',
    bioBn: 'রাজৈর ও টেকেরহাটের বিজ্ঞান শিক্ষিকা।',
    hscGpa: '5.00',
    sscGpa: '5.00',
    availableDaysEn: '4 Days / Week',
    availableDaysBn: 'সপ্তাহে ৪ দিন',
    portraitVariant: 'sadia',
    reviews: [],
  },
];

const TEST_REQUESTS: VerificationRequest[] = [
  {
    id: 'VER-2026-101',
    tutorId: 'tutor-mdp-06',
    tutorNameEn: 'Sadia Afrin Mim',
    tutorNameBn: 'সাদিয়া আফরিন মিম',
    gender: 'Female',
    upazila: 'Rajoir',
    phone: '01715-883421',
    nidNumber: '6419284756102',
    nidDocumentName: 'Smart_NID_Sadia_Afrin_Rajoir.jpg',
    collegeTag: 'Govt. Nazimuddin College',
    institutionFullEn: 'Govt. Nazimuddin College',
    departmentEn: 'B.Sc. (Hons) in Chemistry',
    studentRegId: 'NU-CHEM-2022-88412',
    academicSession: '2021-2022',
    uniDocumentName: 'Nazimuddin_College_ID_Sadia.jpg',
    subjectsEn: ['Chemistry', 'Biology'],
    monthlyFee: 3000,
    submittedAt: '14 Oct 2026',
    status: 'Pending',
  },
  {
    id: 'VER-2026-102',
    tutorId: 'tutor-mdp-01',
    tutorNameEn: 'Md. Rakibul Hasan',
    tutorNameBn: 'মোঃ রাকিবুল হাসান',
    gender: 'Male',
    upazila: 'Madaripur Sadar',
    phone: '01711-223344',
    nidNumber: '5519203948812',
    nidDocumentName: 'Smart_NID_Rakibul_Sadar.jpg',
    collegeTag: 'DU',
    institutionFullEn: 'University of Dhaka (DU)',
    departmentEn: 'B.Sc. (Hons) in Physics',
    studentRegId: 'DU-PHY-2021-409',
    academicSession: '2020-2021',
    uniDocumentName: 'DU_Hall_ID_Rakibul.jpg',
    subjectsEn: ['Physics', 'Higher Math'],
    monthlyFee: 5000,
    submittedAt: '12 Oct 2026',
    status: 'Pending',
  },
];

const TEST_JOBS: TuitionJob[] = [];

test('initial platform seed data is completely empty after Delete All Data request', () => {
  assert.equal(INITIAL_TUTORS.length, 0);
  assert.equal(INITIAL_VERIFICATION_REQUESTS.length, 0);
  assert.equal(INITIAL_TUITION_JOBS.length, 0);
});

test('filterTutors filters by Upazila, College, Medium, Budget, and Verified status accurately', () => {
  const shibcharTutors = filterTutors(TEST_TUTORS, {
    ...defaultFilters,
    upazila: 'Shibchar',
  });
  assert.equal(shibcharTutors.length, 1);
  assert.equal(shibcharTutors[0].nameEn, 'Farhana Yeasmin Tithi');

  const verifiedOnlyTutors = filterTutors(TEST_TUTORS, {
    ...defaultFilters,
    verifiedOnly: true,
  });
  assert.equal(verifiedOnlyTutors.length, 3);
  assert.ok(verifiedOnlyTutors.every((t) => t.nidVerified && t.uniIdVerified));
});

test('validatePhoneBD and validateNIDNumber validate Bangladesh phone and NID formats', () => {
  assert.equal(validatePhoneBD('01712345678'), true);
  assert.equal(validatePhoneBD('+8801812-345678'), true);
  assert.equal(validatePhoneBD('01212345678'), false);

  assert.equal(validateNIDNumber('5519284710'), true);
  assert.equal(validateNIDNumber('9102837465192'), true);
  assert.equal(validateNIDNumber('19995415412345678'), true);
  assert.equal(validateNIDNumber('12345'), false);
});

test('calculateAverageRating, addReviewToTutor, and removeReviewFromTutor recalculate average star rating', () => {
  const tutor = TEST_TUTORS[0];
  const updated = addReviewToTutor(tutor, {
    id: 'rev-test-99',
    guardianName: 'Test Guardian',
    guardianArea: 'Madaripur Sadar',
    studentClass: 'Class 10',
    rating: 4,
    date: 'October 2026',
    commentEn: 'Good tutor',
    commentBn: 'ভালো শিক্ষক',
  });

  assert.equal(updated.totalReviews, 3);
  assert.equal(updated.rating, 4.67);
  assert.equal(calculateAverageRating(updated.reviews), 4.67);

  const afterRemove = removeReviewFromTutor(updated, 'rev-test-99');
  assert.equal(afterRemove.totalReviews, 2);
  assert.equal(afterRemove.rating, 5.0);
});

test('processVerificationDecision approves or rejects a pending tutor and purgeUnusablePlatformData cleans rejected records', () => {
  const { tutors: afterTutors, requests: afterReqs } =
    processVerificationDecision(
      TEST_TUTORS,
      TEST_REQUESTS,
      'VER-2026-101',
      'Approved',
      'Verified original Chemistry Dept ID card.'
    );

  const afterSadia = afterTutors.find((t) => t.id === 'tutor-mdp-06')!;
  assert.equal(afterSadia.nidVerified, true);
  assert.equal(afterSadia.verificationStatus, 'Approved');

  // Now reject VER-2026-102 and purge unusable/rejected data
  const { tutors: rejectedTutors, requests: rejectedReqs } =
    processVerificationDecision(
      afterTutors,
      afterReqs,
      'VER-2026-102',
      'Rejected',
      'Blurry scan'
    );

  const purged = purgeUnusablePlatformData(
    rejectedTutors,
    rejectedReqs,
    TEST_JOBS
  );
  assert.ok(purged.removedCount >= 2);
  assert.ok(purged.requests.every((r) => r.status !== 'Rejected'));
  assert.ok(purged.tutors.every((t) => t.verificationStatus !== 'Rejected'));
});

test('formatBDT formats English and Bangla numerals accurately', () => {
  assert.equal(formatBDT(5500, 'en'), '৳5,500');
  assert.equal(formatBDT(5500, 'bn'), '৳৫,৫০০');
});

test('desk isolation: approving a new tutor in Admin Desk does not leak NID digits, Student Reg ID, or fake reviews into Tutor Desk', () => {
  const newReq: VerificationRequest = {
    id: 'VER-2026-999',
    tutorId: 'tutor-new-999',
    tutorNameEn: 'Naimul Islam',
    tutorNameBn: 'নাইমুল ইসলাম',
    gender: 'Male',
    upazila: 'Madaripur Sadar',
    phone: '01799887766',
    nidNumber: '9876543210123',
    nidDocumentName: 'NID_Naimul.jpg',
    collegeTag: 'DU',
    institutionFullEn: 'University of Dhaka',
    departmentEn: 'Physics',
    studentRegId: 'DU-SECRET-999',
    academicSession: '2022-2023',
    uniDocumentName: 'DU_ID.jpg',
    subjectsEn: ['Physics'],
    monthlyFee: 4500,
    submittedAt: 'Just now',
    status: 'Pending',
  };

  const { tutors } = processVerificationDecision(
    [],
    [newReq],
    'VER-2026-999',
    'Approved',
    'Internal admin note'
  );

  assert.equal(tutors.length, 1);
  const created = tutors[0];
  assert.equal(created.nidVerified, true);
  assert.equal(created.uniIdVerified, true);
  assert.equal(created.verificationCode, 'MDP-VERIFIED');
  assert.equal(created.verificationCode.includes('98765'), false);
  assert.equal(created.verificationCode.includes('DU-SECRET-999'), false);
  assert.equal(created.reviews.length, 0);
  assert.equal(created.totalReviews, 0);
  assert.equal(created.rating, 0);
});

test('only admin can post tutor circular: non-admin desks are blocked from posting circulars', () => {
  const sampleJob: TuitionJob = {
    id: 'MDP-2900',
    titleEn: 'SSC Physics Tutor Needed',
    titleBn: 'এসএসসি পদার্থবিজ্ঞান টিউটর প্রয়োজন',
    studentClassEn: 'Class 10',
    studentClassBn: 'দশম শ্রেণি',
    upazila: 'Madaripur Sadar',
    landmarkEn: 'Lake Par, Sadar',
    landmarkBn: 'লেক পাড়, সদর',
    medium: 'Bangla Medium',
    mode: 'Home',
    subjectsEn: ['Physics'],
    subjectsBn: ['পদার্থবিজ্ঞান'],
    daysPerWeek: 4,
    salaryBdt: 4000,
    preferredGender: 'Any',
    preferredInstitutionEn: 'Verified Madaripur Tutor',
    preferredInstitutionBn: 'যাচাইকৃত মাদারীপুর টিউটর',
    postedAgoEn: 'Just now',
    postedAgoBn: 'এইমাত্র',
    guardianName: 'Admin Posted',
    applicantsCount: 0,
    urgent: true,
  };

  assert.equal(canPostTuitionCircular('tutors'), false);
  assert.equal(canPostTuitionCircular('tutor_upload'), false);
  assert.equal(canPostTuitionCircular('job_board'), false);
  assert.equal(canPostTuitionCircular('admin_review'), true);

  const blockedFromPublic = publishAdminTuitionCircular('job_board', [], sampleJob);
  assert.equal(blockedFromPublic.allowed, false);
  assert.equal(blockedFromPublic.jobs.length, 0);

  const allowedFromAdmin = publishAdminTuitionCircular('admin_review', [], sampleJob);
  assert.equal(allowedFromAdmin.allowed, true);
  assert.equal(allowedFromAdmin.jobs.length, 1);
  assert.equal(allowedFromAdmin.jobs[0].id, 'MDP-2900');
});

test('validateAccountInput validates Full Name, Email, and Password for Create Account and Sign In', () => {
  assert.equal(
    validateAccountInput('signup', '', 'user@example.com', 'secret123').valid,
    false
  );
  assert.equal(
    validateAccountInput('signup', 'Abir Mandal', 'invalid-email', 'secret123').valid,
    false
  );
  assert.equal(
    validateAccountInput('signup', 'Abir Mandal', 'user@example.com', '123').valid,
    false
  );
  assert.equal(
    validateAccountInput('signup', 'Abir Mandal', 'user@example.com', 'secret123').valid,
    true
  );
  assert.equal(
    validateAccountInput('signin', '', 'user@example.com', 'secret123').valid,
    true
  );
});

test('evaluateSignUpOutcome and canAccessProtectedRoute enforce signup-to-signin redirect with prefilled email and private route session guards', () => {
  // When signUp() succeeds without session, do NOT auto-login, redirect to Sign In, pre-fill email, and show confirmation message
  const noSessionOutcome = evaluateSignUpOutcome(
    false,
    null,
    '  student@madaripur.edu.bd  '
  );
  assert.equal(noSessionOutcome.shouldRedirect, false);
  assert.equal(noSessionOutcome.redirectToSignIn, true);
  assert.equal(noSessionOutcome.shouldSignOutTempSession, false);
  assert.equal(noSessionOutcome.prefilledEmail, 'student@madaripur.edu.bd');
  assert.equal(noSessionOutcome.infoMessage, EMAIL_CONFIRMATION_MESSAGE);

  // Even when signUp() returns a session, do NOT auto-login; sign out temp session, redirect to Sign In, and keep email pre-filled
  const activeSessionOutcome = evaluateSignUpOutcome(
    true,
    null,
    'tutor@madaripur.edu.bd'
  );
  assert.equal(activeSessionOutcome.shouldRedirect, false);
  assert.equal(activeSessionOutcome.redirectToSignIn, true);
  assert.equal(activeSessionOutcome.shouldSignOutTempSession, true);
  assert.equal(activeSessionOutcome.prefilledEmail, 'tutor@madaripur.edu.bd');
  assert.equal(activeSessionOutcome.infoMessage, EMAIL_CONFIRMATION_MESSAGE);

  // Desks 1 (tutors), Tutor Board (tutor_board), 2 (tutor_upload), and 4 (job_board) are public for everyone
  assert.equal(canAccessProtectedRoute(false, 'tutors', false).allowed, true);
  assert.equal(
    canAccessProtectedRoute(false, 'tutor_board', false).allowed,
    true
  );
  assert.equal(
    canAccessProtectedRoute(false, 'tutor_upload', false).allowed,
    true
  );
  assert.equal(
    canAccessProtectedRoute(false, 'job_board', false).allowed,
    true
  );

  // Desk 3 (admin_review) is strictly locked until Admin PIN (153800) unlocks it
  assert.equal(
    canAccessProtectedRoute(true, 'admin_review', false).allowed,
    false
  );
  assert.equal(
    canAccessProtectedRoute(false, 'admin_review', true).allowed,
    true
  );
});

test('verifyAdminPin, isAdminEmail, isAuthorizedAdminAccount, and canAccessDesk enforce strict two-factor Admin security (logged-in drabirm4@gmail.com / drabirm4 + PIN 153800)', () => {
  assert.equal(DEFAULT_ADMIN_PIN, '153800');
  assert.equal(ADMIN_EMAIL, 'drabirm4@gmail.com');
  assert.equal(isAdminEmail('drabirm4@gmail.com'), true);
  assert.equal(isAdminEmail('  DRABIRM4@GMAIL.COM '), true);
  assert.equal(isAdminEmail('drabirm4'), true);
  assert.equal(isAdminEmail('visitor@example.com'), false);

  // PIN verification strictly requires '153800'
  assert.equal(verifyAdminPin('').valid, false);
  assert.equal(verifyAdminPin('000000').valid, false);
  assert.equal(verifyAdminPin('drabirm4@gmail.com').valid, false);
  assert.equal(verifyAdminPin('153800').valid, true);
  assert.equal(verifyAdminPin(' 153800 ').valid, true);

  // Desks 1, Tutor Board, 2, and 4 are public even when Admin is locked or visitor is logged out
  assert.equal(canAccessDesk('tutors', false, null), true);
  assert.equal(canAccessDesk('tutor_board', false, null), true);
  assert.equal(canAccessDesk('tutor_upload', false, null), true);
  assert.equal(canAccessDesk('job_board', false, null), true);

  // Desk 3 and Post Tuition Circular require BOTH logged-in drabirm4@gmail.com / drabirm4 account AND isAdminUnlocked === true
  const adminUser = { email: 'drabirm4@gmail.com', fullName: 'drabirm4' };
  const otherUser = { email: 'student@example.com', fullName: 'Student' };

  assert.equal(canAccessDesk('admin_review', false, null), false);
  assert.equal(canAccessDesk('admin_review', true, null), false);
  assert.equal(canAccessDesk('admin_review', true, otherUser), false);
  assert.equal(canAccessDesk('admin_review', false, adminUser), false);
  assert.equal(canAccessDesk('admin_review', true, adminUser), true);

  assert.equal(canPostTuitionCircular('admin_review', false, adminUser), false);
  assert.equal(canPostTuitionCircular('admin_review', true, null), false);
  assert.equal(canPostTuitionCircular('admin_review', true, otherUser), false);
  assert.equal(canPostTuitionCircular('admin_review', true, adminUser), true);
});

test('mapTuitionJobToCircularRow, mapCircularRowToTuitionJob, and sortCircularRowsNewestFirst map all 11 Supabase tuition_circulars columns accurately', () => {
  const sampleJob: TuitionJob = {
    id: 'MDP-2901',
    titleEn: 'Need Experienced HSC Physics & Higher Math Tutor near Lake Par',
    titleBn: 'Need Experienced HSC Physics & Higher Math Tutor near Lake Par',
    studentClassEn: 'HSC 1st Year',
    studentClassBn: 'HSC 1st Year',
    upazila: 'Madaripur Sadar',
    landmarkEn: 'Lake Par South Bank',
    landmarkBn: 'Lake Par South Bank',
    medium: 'Bangla Medium',
    mode: 'Home',
    subjectsEn: ['Physics', 'Higher Math'],
    subjectsBn: ['Physics', 'Higher Math'],
    daysPerWeek: 4,
    salaryBdt: 6500,
    preferredGender: 'Male',
    preferredInstitutionEn: 'Verified Madaripur Tutor',
    preferredInstitutionBn: 'যাচাইকৃত মাদারীপুর টিউটর',
    postedAgoEn: 'Just now',
    postedAgoBn: 'এইমাত্র',
    guardianName: 'Engr. Mahbub Alam',
    contactPhone: '01711223344',
    requirements:
      'Need Experienced HSC Physics & Higher Math Tutor near Lake Par',
    tutoringFormat: 'Home · Bangla Medium',
    tutorPreference: 'Male',
    status: 'Active',
    createdAt: '2026-10-31T10:00:00.000Z',
    applicantsCount: 0,
    urgent: true,
  };

  const row = mapTuitionJobToCircularRow(sampleJob);
  assert.deepEqual(row, {
    circular_id: 'MDP-2901',
    title: 'Need Experienced HSC Physics & Higher Math Tutor near Lake Par',
    class_subject: 'HSC 1st Year · Physics, Higher Math',
    upazila: 'Madaripur Sadar',
    location_details: 'Lake Par South Bank',
    tutoring_format: 'Home · Bangla Medium',
    salary: 6500,
    days_per_week: 4,
    tutor_preference: 'Male',
    guardian_phone: '01711223344',
    status: 'Active',
    num_students: 1,
  });

  const olderRow = {
    ...row,
    circular_id: 'MDP-2800',
    created_at: '2026-10-30T08:00:00.000Z',
  };
  const middleRow = {
    ...row,
    circular_id: 'MDP-2901',
    created_at: '2026-10-31T10:00:00.000Z',
  };
  const newerRow = {
    ...row,
    circular_id: 'MDP-2950',
    upazila: 'Shibchar',
    location_details: '71 Road',
    tutor_preference: 'Female',
    num_students: 2,
    created_at: '2026-10-31T12:00:00.000Z',
  };

  const sorted = sortCircularRowsNewestFirst([olderRow, middleRow, newerRow]);
  assert.deepEqual(
    sorted.map((r) => r.circular_id),
    ['MDP-2950', 'MDP-2901', 'MDP-2800']
  );

  const mappedBack = mapCircularRowToTuitionJob(newerRow);
  assert.equal(mappedBack.id, 'MDP-2950');
  assert.equal(mappedBack.upazila, 'Shibchar');
  assert.equal(mappedBack.landmarkEn, '71 Road');
  assert.equal(mappedBack.studentClassEn, 'HSC 1st Year');
  assert.deepEqual(mappedBack.subjectsEn, ['Physics', 'Higher Math']);
  assert.equal(mappedBack.salaryBdt, 6500);
  assert.equal(mappedBack.daysPerWeek, 4);
  assert.equal(mappedBack.numStudents, 2);
  assert.equal(mappedBack.preferredGender, 'Female');
  assert.equal(mappedBack.contactPhone, '01711223344');
  assert.equal(mappedBack.status, 'Active');
  assert.equal(
    mappedBack.titleEn,
    'Need Experienced HSC Physics & Higher Math Tutor near Lake Par'
  );

  // Test default to 1 when num_students is omitted
  const mappedDefault = mapCircularRowToTuitionJob(olderRow);
  assert.equal(mappedDefault.numStudents, 1);
});

test('Multi-Tutor Application & Admin Confirmation System: multiple applications per circular, tutor status lookup, and Confirm 1 Tutor flow', () => {
  const sampleJob: TuitionJob = {
    id: 'MDP-3100',
    titleEn: 'Need HSC Physics Tutor in Madaripur Sadar',
    titleBn: 'Need HSC Physics Tutor in Madaripur Sadar',
    studentClassEn: 'HSC 1st Year',
    studentClassBn: 'HSC 1st Year',
    upazila: 'Madaripur Sadar',
    landmarkEn: 'Lake Par',
    landmarkBn: 'Lake Par',
    medium: 'Bangla Medium',
    mode: 'Home',
    subjectsEn: ['Physics'],
    subjectsBn: ['Physics'],
    daysPerWeek: 4,
    salaryBdt: 5000,
    preferredGender: 'Any',
    preferredInstitutionEn: 'Verified Madaripur Tutor',
    preferredInstitutionBn: 'যাচাইকৃত মাদারীপুর টিউটর',
    postedAgoEn: 'Just now',
    postedAgoBn: 'এইমাত্র',
    guardianName: 'Verified Guardian',
    contactPhone: '01711000000',
    status: 'Active',
    applicantsCount: 0,
  };

  // Validate inputs
  assert.equal(
    validateCircularApplicationInput({
      tutorId: 'TUT-101',
      tutorName: '',
      tutorPhone: '01711223344',
      qualification: 'DU - Physics',
    }).valid,
    false
  );
  assert.equal(
    validateCircularApplicationInput({
      tutorId: 'TUT-101',
      tutorName: 'Md. Rakibul Hasan',
      tutorPhone: '012000',
      qualification: 'DU - Physics',
    }).valid,
    false
  );
  assert.equal(
    validateCircularApplicationInput({
      tutorId: 'TUT-101',
      tutorName: 'Md. Rakibul Hasan',
      tutorPhone: '01711223344',
      qualification: 'DU - Physics',
      experienceNote: '4 years HSC experience',
    }).valid,
    true
  );

  // Build 2 applications for the same circular
  const app1: CircularApplicationRow = {
    ...buildCircularApplicationRow('MDP-3100', {
      tutorId: 'TUT-101',
      tutorName: 'Md. Rakibul Hasan',
      tutorPhone: '01711-223344',
      qualification: 'University of Dhaka (Physics)',
      experienceNote: '4 years experience',
    }),
    id: 'app-uuid-1',
  };
  const app2: CircularApplicationRow = {
    ...buildCircularApplicationRow('MDP-3100', {
      tutorId: 'TUT-202',
      tutorName: 'Farhana Yeasmin',
      tutorPhone: '01819-556677',
      qualification: 'Govt. Nazimuddin College (Math)',
      experienceNote: '3 years experience',
    }),
    id: 'app-uuid-2',
  };

  const applications = [app1, app2];
  assert.equal(app1.status, 'Pending');
  assert.equal(app2.status, 'Pending');
  assert.equal(getApplicationsForCircular(applications, 'MDP-3100').length, 2);

  // Enrich job with live applicant count
  const enrichedBefore = enrichCircularJobsWithApplications(
    [sampleJob],
    applications
  );
  assert.equal(enrichedBefore[0].applicantsCount, 2);
  assert.equal(enrichedBefore[0].status, 'Active');

  // Check Tutor 1 status by Tutor ID or Phone before Admin confirmation -> Pending
  const tutor1ById = getTutorApplicationForCircular(
    applications,
    'MDP-3100',
    'tut-101'
  );
  const tutor1ByPhone = getTutorApplicationForCircular(
    applications,
    'MDP-3100',
    '01711223344'
  );
  assert.equal(tutor1ById?.status, 'Pending');
  assert.equal(tutor1ByPhone?.tutor_name, 'Md. Rakibul Hasan');
  assert.equal(findTutorApplicationsByQuery(applications, 'TUT-101').length, 1);

  // Admin confirms Tutor 1 (app1)
  const confirmedState = confirmTutorForCircularState(
    enrichedBefore,
    applications,
    'MDP-3100',
    app1
  );

  // Verify circular status is 'Confirmed' and displays confirmed Tutor's Name & ID
  assert.equal(confirmedState.jobs[0].status, 'Confirmed');
  assert.equal(confirmedState.jobs[0].confirmedTutorId, 'TUT-101');
  assert.equal(confirmedState.jobs[0].confirmedTutorName, 'Md. Rakibul Hasan');

  // Verify Tutor 1 status is now 'Confirmed' while Tutor 2 remains 'Pending'
  const confirmedApp = getConfirmedApplicationForCircular(
    confirmedState.applications,
    'MDP-3100'
  );
  assert.equal(confirmedApp?.tutor_id, 'TUT-101');
  assert.equal(
    getTutorApplicationForCircular(
      confirmedState.applications,
      'MDP-3100',
      '01711223344'
    )?.status,
    'verified_for_tuition'
  );
  assert.equal(
    getTutorApplicationForCircular(
      confirmedState.applications,
      'MDP-3100',
      'TUT-202'
    )?.status,
    'Pending'
  );

  // Verify 3. Admin Review Desk 4 filter tabs ("All", "Pending", "Approved", "Rejected") and Reject action
  assert.equal(matchesAdminTabFilter('Pending', 'Pending'), true);
  assert.equal(matchesAdminTabFilter('Confirmed', 'Approved'), true);
  assert.equal(matchesAdminTabFilter('Approved', 'Approved'), true);
  assert.equal(matchesAdminTabFilter('Rejected', 'Rejected'), true);
  assert.equal(
    getCircularClassSubjectLabel(confirmedState.jobs, 'MDP-3100', 'en'),
    'HSC 1st Year · Physics'
  );

  const afterRejectState = rejectTutorForCircularState(
    confirmedState.jobs,
    confirmedState.applications,
    'MDP-3100',
    app2
  );
  assert.equal(
    getTutorApplicationForCircular(
      afterRejectState.applications,
      'MDP-3100',
      'TUT-202'
    )?.status,
    'Rejected'
  );
});

test('Supabase tutor_verifications mapping: preserves Base64 scans in Admin Review Desk and syncs Approved tutors to Find Tutors Desk without confidential fields', () => {
  const sampleBase64Nid = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const sampleBase64Uni = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  const submittedReq: VerificationRequest = {
    id: 'VER-2026-991',
    tutorId: 'tutor-ver-VER-2026-991',
    tutorNameEn: 'Tanvir Ahmed Shuvo',
    tutorNameBn: 'Tanvir Ahmed Shuvo',
    gender: 'Male',
    phone: '01755667788',
    upazila: 'Madaripur Sadar',
    collegeTag: 'BUET',
    institutionFullEn: 'Bangladesh University of Engineering and Technology (BUET)',
    departmentEn: 'B.Sc. in EEE',
    studentRegId: 'BUET-EEE-2022-045',
    academicSession: 'Verified Session',
    nidNumber: '1999541548899',
    subjectsEn: ['Physics', 'Higher Math', 'ICT'],
    monthlyFee: 6000,
    nidDocumentName: 'tanvir_nid.png',
    uniDocumentName: 'tanvir_buet_id.jpg',
    nidScanDataUrl: sampleBase64Nid,
    uniScanDataUrl: sampleBase64Uni,
    submittedAt: '2026-03-30 10:00',
    status: 'Pending',
    adminNote: '',
  };

  const supabasePayload = mapVerificationRequestToSupabaseRow(submittedReq);
  assert.equal(supabasePayload.verification_code, 'VER-2026-991');
  assert.equal(supabasePayload.full_name, 'Tanvir Ahmed Shuvo');
  assert.equal(supabasePayload.mobile_number, '01755667788');
  assert.equal(supabasePayload.smart_nid_number, '1999541548899');
  assert.equal(supabasePayload.nid_scan_url, sampleBase64Nid);
  assert.equal(supabasePayload.student_id_scan_url, sampleBase64Uni);
  assert.equal(supabasePayload.status, 'Pending');

  const roundTripReq = mapSupabaseRowToVerificationRequest({
    ...supabasePayload,
    id: 'uuid-991',
  });
  assert.equal(roundTripReq.id, 'VER-2026-991');
  assert.equal(roundTripReq.nidScanDataUrl, sampleBase64Nid);
  assert.equal(roundTripReq.uniScanDataUrl, sampleBase64Uni);
  assert.equal(roundTripReq.studentRegId, 'BUET-EEE-2022-045');

  // While Pending, tutor must NOT appear in 1. Find Tutors Desk
  const publicBeforeApproval = syncPublicTutorsFromVerifications(
    [roundTripReq],
    TEST_TUTORS
  );
  assert.equal(
    publicBeforeApproval.some((t) => t.id === 'tutor-ver-VER-2026-991'),
    false
  );

  // When Approved in 3. Admin Review Desk, tutor automatically appears in 1. Find Tutors Desk with Verified badge and zero confidential fields
  const approvedReq: VerificationRequest = {
    ...roundTripReq,
    status: 'Approved',
  };
  const publicAfterApproval = syncPublicTutorsFromVerifications(
    [approvedReq],
    TEST_TUTORS
  );
  const publicTanvir = publicAfterApproval.find(
    (t) => t.id === 'tutor-ver-VER-2026-991'
  );
  assert.ok(publicTanvir);
  assert.equal(publicTanvir.nameEn, 'Tanvir Ahmed Shuvo');
  assert.equal(publicTanvir.verificationStatus, 'Approved');
  assert.equal(publicTanvir.nidVerified, true);
  assert.equal(publicTanvir.uniIdVerified, true);
  assert.equal('nidNumber' in publicTanvir, false);
  assert.equal('phone' in publicTanvir, false);
  assert.equal('nidScanDataUrl' in publicTanvir, false);
  assert.equal('uniScanDataUrl' in publicTanvir, false);
});

test('Strict 1-to-1 Account Binding & Profile Privacy: maskSmartNidNumber, getTutorProfileStorageKeyForUser, findTutorVerificationProfile, and user_email/user_id mapping', () => {
  assert.equal(maskSmartNidNumber('1998541547766'), '199••••••7766');
  assert.equal(maskSmartNidNumber('5519284710'), '551••••4710');

  const pendingBadge = getTutorProfileStatusBadge('Pending', 'en');
  assert.equal(
    pendingBadge.label,
    '⏳ Verification Pending (Under Admin Review)'
  );
  assert.equal(pendingBadge.tone, 'pending');

  const approvedBadge = getTutorProfileStatusBadge('Approved', 'en');
  assert.equal(
    approvedBadge.label,
    '✅ Approved & Verified Tutor (Public Badge Active)'
  );
  assert.equal(approvedBadge.tone, 'approved');

  const rejectedBadge = getTutorProfileStatusBadge('Rejected', 'en');
  assert.equal(rejectedBadge.label, '❌ Verification Rejected');
  assert.equal(rejectedBadge.tone, 'rejected');

  // Storage key is strictly bound to logged-in user; returns null when logged out
  assert.equal(getTutorProfileStorageKeyForUser(null), null);
  assert.equal(getTutorProfileStorageKeyForUser(''), null);
  assert.equal(
    getTutorProfileStorageKeyForUser({
      email: 'DrAbirMandal7@gmail.com',
      id: 'user-1',
      fullName: 'drabirmandal7',
    }),
    'tutor_profile_drabirmandal7@gmail.com'
  );

  // Supabase row mapper saves and restores user_email and user_id
  const accountBoundReq: VerificationRequest = {
    ...TEST_REQUESTS[0],
    userEmail: 'drabirmandal7@gmail.com',
    userId: 'drabirmandal7',
  };
  const rowPayload = mapVerificationRequestToSupabaseRow(accountBoundReq);
  assert.equal(rowPayload.user_email, 'drabirmandal7@gmail.com');
  assert.equal(rowPayload.user_id, 'drabirmandal7');

  const roundTrip = mapSupabaseRowToVerificationRequest(rowPayload);
  assert.equal(roundTrip.userEmail, 'drabirmandal7@gmail.com');
  assert.equal(roundTrip.userId, 'drabirmandal7');

  const accountRequests: VerificationRequest[] = [
    roundTrip,
    {
      ...TEST_REQUESTS[1],
      userEmail: 'rakib@madaripur.edu.bd',
      userId: 'rakib',
    },
  ];

  // Logged-out visitor never sees any profile
  assert.equal(findTutorVerificationProfile(accountRequests, null), null);

  // Account with a profile sees ONLY their own profile
  const abirProfile = findTutorVerificationProfile(accountRequests, {
    email: 'drabirmandal7@gmail.com',
    id: 'drabirmandal7',
    fullName: 'drabirmandal7',
  });
  assert.equal(abirProfile?.id, 'VER-2026-101');

  // Another logged-in account that has NOT created a profile gets null (never sees a previous user's profile)
  const newAccountProfile = findTutorVerificationProfile(accountRequests, {
    email: 'newtutor@gmail.com',
    id: 'newtutor',
    fullName: 'New Tutor',
  });
  assert.equal(newAccountProfile, null);
});

test('validateProfilePhotoFile and profile_photo_url / profile_photo_name Supabase tutor_verifications mapping', () => {
  assert.equal(validateProfilePhotoFile('passport.jpg', 'image/jpeg').valid, true);
  assert.equal(validateProfilePhotoFile('portrait.JPEG', 'image/jpeg').valid, true);
  assert.equal(validateProfilePhotoFile('avatar.png', 'image/png').valid, true);
  assert.equal(validateProfilePhotoFile('resume.pdf', 'application/pdf').valid, false);
  assert.equal(validateProfilePhotoFile('anim.gif', 'image/gif').valid, false);
  assert.equal(validateProfilePhotoFile('', '').valid, false);

  const samplePhotoDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/';
  const reqWithPhoto: VerificationRequest = {
    ...TEST_REQUESTS[0],
    id: 'VER-2026-777',
    tutorId: 'tutor-ver-VER-2026-777',
    profilePhotoName: 'passport_photo.jpg',
    profilePhotoDataUrl: samplePhotoDataUrl,
    status: 'Approved',
  };

  const supabaseRow = mapVerificationRequestToSupabaseRow(reqWithPhoto);
  assert.equal(supabaseRow.profile_photo_url, samplePhotoDataUrl);
  assert.equal(supabaseRow.profile_photo_name, 'passport_photo.jpg');

  const roundTripReq = mapSupabaseRowToVerificationRequest(supabaseRow);
  assert.equal(roundTripReq.profilePhotoDataUrl, samplePhotoDataUrl);
  assert.equal(roundTripReq.profilePhotoName, 'passport_photo.jpg');

  const publicTutors = syncPublicTutorsFromVerifications(
    [roundTripReq],
    TEST_TUTORS
  );
  const approvedPublicTutor = publicTutors.find(
    (t) => t.id === 'tutor-ver-VER-2026-777'
  );
  assert.ok(approvedPublicTutor);
  assert.equal(approvedPublicTutor.profilePhotoUrl, samplePhotoDataUrl);
});

test('Account-Bound Circular Applications & Admin Full Tutor Profile Inspection: user sees ONLY their own application and Admin links application to tutor_verifications', () => {
  const abirUser = {
    id: 'user-abir-7',
    fullName: 'drabirmandal7',
    email: 'drabirmandal7@gmail.com',
    provider: 'email' as const,
    createdAt: 'Nov 1, 2026',
  };
  const otherUser = {
    id: 'user-rakib-9',
    fullName: 'rakib99',
    email: 'rakib99@gmail.com',
    provider: 'email' as const,
    createdAt: 'Nov 1, 2026',
  };

  const abirTutorProfile: VerificationRequest = {
    ...TEST_REQUESTS[0],
    id: 'VER-2026-501',
    userEmail: 'drabirmandal7@gmail.com',
    userId: 'drabirmandal7',
    tutorNameEn: 'Dr. Abir Mandal',
    phone: '01711998877',
    nidNumber: '1997541541122',
    institutionFullEn: 'Dhaka Medical College',
    departmentEn: 'MBBS',
    studentRegId: 'DMC-2020-07',
    profilePhotoDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    nidScanDataUrl: 'data:image/png;base64,iVBORw0KGgo=',
    uniScanDataUrl: 'data:image/png;base64,iVBORw0KGgo=',
  };

  const abirApp = buildCircularApplicationRow(
    'MDP-2409',
    {
      tutorId: '',
      tutorName: '',
      tutorPhone: '',
      qualification: '',
      experienceNote: 'Ready to start this week',
    },
    abirUser,
    abirTutorProfile
  );

  // Automatically bound to logged-in user account and saved tutor_verifications profile
  assert.equal(abirApp.user_email, 'drabirmandal7@gmail.com');
  assert.equal(abirApp.user_id, 'drabirmandal7');
  assert.equal(abirApp.tutor_id, 'VER-2026-501');
  assert.equal(abirApp.tutor_name, 'Dr. Abir Mandal');
  assert.equal(abirApp.tutor_phone, '01711998877');
  assert.equal(
    abirApp.institution_qualification,
    'Dhaka Medical College · MBBS'
  );
  assert.equal(abirApp.status, 'Pending');

  const otherApp = buildCircularApplicationRow(
    'MDP-2409',
    {
      tutorId: 'VER-2026-888',
      tutorName: 'Rakib Hasan',
      tutorPhone: '01812334455',
      qualification: 'Govt. Nazimuddin College · Physics',
      experienceNote: '3 yrs experience',
    },
    otherUser,
    null
  );

  const allApps: CircularApplicationRow[] = [abirApp, otherApp];

  // Logged-out visitor sees NO application status
  assert.equal(doesApplicationBelongToUser(abirApp, null, null), false);
  assert.equal(
    getUserApplicationForCircular(allApps, 'MDP-2409', null, null),
    undefined
  );
  assert.equal(getUserAppliedApplications(allApps, null, null).length, 0);

  // Abir sees ONLY his own application
  const abirOwnApp = getUserApplicationForCircular(
    allApps,
    'MDP-2409',
    abirUser,
    abirTutorProfile
  );
  assert.ok(abirOwnApp);
  assert.equal(abirOwnApp.tutor_name, 'Dr. Abir Mandal');
  assert.equal(
    getUserAppliedApplications(allApps, abirUser, abirTutorProfile).length,
    1
  );

  // Another user who hasn't applied to MDP-2410 sees undefined on MDP-2410
  assert.equal(
    getUserApplicationForCircular(
      allApps,
      'MDP-2410',
      abirUser,
      abirTutorProfile
    ),
    undefined
  );

  // Status badge labels match exact specifications
  assert.equal(
    getUserCircularApplicationStatusBadge('Pending', 'en').label,
    '⏳ Applied - Pending'
  );
  assert.equal(
    getUserCircularApplicationStatusBadge('Confirmed', 'en').label,
    '✅ Confirmed for Tuition'
  );
  assert.equal(
    getUserCircularApplicationStatusBadge('Rejected', 'en').label,
    '❌ Rejected'
  );

  // Admin links application to applicant's full tutor_verifications profile
  const matchedFullProfile = findApplicantFullTutorProfile(abirApp, [
    abirTutorProfile,
    ...TEST_REQUESTS,
  ]);
  assert.ok(matchedFullProfile);
  assert.equal(matchedFullProfile.id, 'VER-2026-501');
  assert.equal(matchedFullProfile.nidNumber, '1997541541122');
  assert.equal(matchedFullProfile.studentRegId, 'DMC-2020-07');
  assert.equal(
    matchedFullProfile.profilePhotoDataUrl,
    'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
  );
});

test('Two-Mode Admin Deletion: "Delete from Admin Panel" hides items ONLY from Admin Review while keeping user Profile, Dashboard, and Tuition Circulars intact; "Delete from Everywhere" removes items across all views', () => {
  const abirUser = {
    id: 'user-abir-7',
    fullName: 'drabirmandal7',
    email: 'drabirmandal7@gmail.com',
    provider: 'email' as const,
    createdAt: 'Nov 1, 2026',
  };

  // 1. Circular Applications: Delete from Admin Panel vs Delete from Everywhere
  const app1: CircularApplicationRow = {
    id: 'app-2790',
    circular_id: 'MDP-2409',
    tutor_id: 'VER-2026-501',
    user_email: 'drabirmandal7@gmail.com',
    user_id: 'drabirmandal7',
    tutor_name: 'Dr. Abir Mandal',
    tutor_phone: '01711998877',
    institution_qualification: 'Dhaka Medical College · MBBS',
    experience_note: 'Confirmed tutor',
    status: 'Confirmed',
    hidden_from_admin: false,
  };
  const app2: CircularApplicationRow = {
    id: 'app-2142',
    circular_id: 'MDP-2410',
    tutor_id: 'VER-2026-888',
    user_email: 'rakib99@gmail.com',
    user_id: 'rakib99',
    tutor_name: 'Rakib Hasan',
    tutor_phone: '01812334455',
    institution_qualification: 'Govt. Nazimuddin College · Physics',
    experience_note: 'Pending review',
    status: 'Pending',
    hidden_from_admin: false,
  };

  // Mode 1: "🧹 Delete from Admin Panel" on app1
  const appsAfterHideAdmin = hideApplicationFromAdminOnly([app1, app2], app1);
  const adminQueueApps = filterAdminVisibleApplications(appsAfterHideAdmin);
  assert.equal(adminQueueApps.length, 1);
  assert.equal(adminQueueApps[0].id, 'app-2142');

  // Yet Abir STILL sees his own Confirmed application in "Tuition Circulars" and "Profile"!
  const abirStillSeesApp = getUserApplicationForCircular(
    appsAfterHideAdmin,
    'MDP-2409',
    abirUser,
    null
  );
  assert.ok(abirStillSeesApp);
  assert.equal(abirStillSeesApp.status, 'Confirmed');

  // Mode 2: "🗑️ Delete from Everywhere" on app1
  const afterDeleteEverywhere = deleteApplicationFromEverywhereState(
    TEST_JOBS,
    appsAfterHideAdmin,
    app1
  );
  assert.equal(afterDeleteEverywhere.applications.length, 1);
  assert.equal(
    getUserApplicationForCircular(
      afterDeleteEverywhere.applications,
      'MDP-2409',
      abirUser,
      null
    ),
    undefined
  );

  // 2. Tutor Verification Profiles: Delete from Admin Panel vs Delete from Everywhere
  const approvedReq: VerificationRequest = {
    ...TEST_REQUESTS[0],
    id: 'VER-2026-901',
    tutorId: 'tutor-ver-VER-2026-901',
    status: 'Approved',
    hiddenFromAdmin: false,
  };
  const syncedTutorsBefore = syncPublicTutorsFromVerifications(
    [approvedReq],
    TEST_TUTORS
  );
  assert.ok(
    syncedTutorsBefore.some((t) => t.id === 'tutor-ver-VER-2026-901')
  );

  // Mode 1: "🧹 Delete from Admin Panel" on approvedReq
  const reqsAfterHideAdmin = hideVerificationFromAdminOnly(
    [approvedReq],
    'VER-2026-901'
  );
  assert.equal(filterAdminVisibleVerifications(reqsAfterHideAdmin).length, 0);
  // Public Dashboard STILL has the verified tutor card!
  const syncedTutorsAfterHideAdmin = syncPublicTutorsFromVerifications(
    reqsAfterHideAdmin,
    TEST_TUTORS
  );
  assert.ok(
    syncedTutorsAfterHideAdmin.some(
      (t) => t.id === 'tutor-ver-VER-2026-901'
    )
  );

  // Mode 2: "🗑️ Delete from Everywhere" on approvedReq
  const deletedVerEverywhere = deleteVerificationFromEverywhereState(
    syncedTutorsAfterHideAdmin,
    reqsAfterHideAdmin,
    'VER-2026-901'
  );
  assert.equal(deletedVerEverywhere.requests.length, 0);
  assert.equal(
    deletedVerEverywhere.tutors.some(
      (t) => t.id === 'tutor-ver-VER-2026-901'
    ),
    false
  );

  // 3. Tuition Circulars: Delete from Admin Panel vs Delete from Everywhere
  const sampleJobs: TuitionJob[] = [
    mapCircularRowToTuitionJob({
      circular_id: 'MDP-2409',
      title: 'HSC Physics & Math Tutor Needed',
      class_subject: 'HSC 1st Year · Physics, Higher Math',
      upazila: 'Madaripur Sadar',
      location_details: 'Lake Par, Madaripur Sadar',
      tutoring_format: 'Home · Bangla Medium',
      salary: 5000,
      days_per_week: 4,
      tutor_preference: 'Any · DU / Govt. Nazimuddin College',
      guardian_phone: '01711-889900',
      status: 'Active',
      hidden_from_admin: false,
    }),
  ];
  const jobsAfterHideAdmin = hideCircularFromAdminOnly(sampleJobs, 'MDP-2409');
  // Hidden from Admin Review circular management list:
  assert.equal(
    filterAdminVisibleCirculars(jobsAfterHideAdmin).some(
      (j) => j.id === 'MDP-2409'
    ),
    false
  );
  // Still present in public "Tuition Circulars" list:
  assert.equal(
    jobsAfterHideAdmin.some((j) => j.id === 'MDP-2409'),
    true
  );

  // Mode 2: "🗑️ Delete from Everywhere" on circular MDP-2409
  const jobsAfterDeleteEverywhere = deleteCircularFromEverywhereState(
    jobsAfterHideAdmin,
    [app1, app2],
    'MDP-2409'
  );
  assert.equal(
    jobsAfterDeleteEverywhere.jobs.some((j) => j.id === 'MDP-2409'),
    false
  );
  assert.equal(
    jobsAfterDeleteEverywhere.applications.some(
      (a) => a.circular_id === 'MDP-2409'
    ),
    false
  );
});

test('extractCircularDetails parses circular fields accurately into 8 grid items', () => {
  const sampleJob: TuitionJob = {
    id: 'MDP-2559',
    titleEn: 'Class 9 Physics & Math Tutor Needed',
    titleBn: 'নবম শ্রেণির পদার্থ ও গণিত টিউটর আবশ্যক',
    studentClassEn: 'Class 9',
    studentClassBn: 'নবম শ্রেণি',
    classSubject: 'Class 9 (Science) · Physics, Chemistry, Higher Math',
    upazila: 'Madaripur Sadar',
    landmarkEn: 'College Road, Near Govt Nazimuddin College',
    landmarkBn: 'কলেজ রোড',
    medium: 'Bangla Medium',
    mode: 'Home',
    subjectsEn: ['Physics', 'Chemistry', 'Higher Math'],
    subjectsBn: ['পদার্থবিজ্ঞান', 'রসায়ন', 'উচ্চতর গণিত'],
    daysPerWeek: 5,
    salaryBdt: 5000,
    numStudents: 2,
    preferredGender: 'Male',
    tutorPreference: 'Male Tutor',
    preferredInstitutionEn: 'Govt. Nazimuddin College',
    preferredInstitutionBn: 'সরকারি নাজিমউদ্দিন কলেজ',
    postedAgoEn: 'Nov 2, 01:27 AM',
    postedAgoBn: '২ নভেম্বর',
    guardianName: 'Guardian',
    contactPhone: '01712-345678',
    requirements: 'Experienced Male Tutor',
    tutoringFormat: 'Home · Bangla Medium',
    status: 'Active',
    createdAt: new Date().toISOString(),
    applicantsCount: 3,
    urgent: true,
  };

  const detailsEn = extractCircularDetails(sampleJob, 'en');
  assert.equal(detailsEn.tuitionType, 'Home Tuition');
  assert.equal(detailsEn.category, 'Bangla Medium');
  assert.equal(detailsEn.studentClass, 'Class 9 (Science)');
  assert.equal(detailsEn.numStudentsText, '2 Students');
  assert.equal(detailsEn.tutoringDaysText, '5 days/week');
  assert.equal(detailsEn.preferredTutorText, 'Male Tutor');
  assert.equal(
    detailsEn.locationText,
    'Madaripur Sadar: College Road, Near Govt Nazimuddin College'
  );
  assert.deepEqual(detailsEn.subjectsList, [
    'Physics',
    'Chemistry',
    'Higher Math',
  ]);

  const detailsBn = extractCircularDetails(sampleJob, 'bn');
  assert.equal(detailsBn.tuitionType, 'হোম টিউশনি');
  assert.equal(detailsBn.numStudentsText, '২ জন শিক্ষার্থী');
  assert.equal(detailsBn.tutoringDaysText, 'সপ্তাহে ৫ দিন');
});

test('parseSupabaseStorageUrl and extractSupabaseStorageTargets extract uploaded photo, NID, and Student ID storage paths', () => {
  const publicUrl =
    'https://bhyhefgmsnxdeqyrdsre.supabase.co/storage/v1/object/public/tutor-documents/verifications/VER-2026-888/nid_scan.jpg?t=123';
  const parsed = parseSupabaseStorageUrl(publicUrl);
  assert.deepEqual(parsed, {
    bucket: 'tutor-documents',
    path: 'verifications/VER-2026-888/nid_scan.jpg',
  });

  // Inline data URLs should return null (not a remote storage object)
  assert.equal(parseSupabaseStorageUrl('data:image/png;base64,iVBORw0KGgo='), null);

  const targets = extractSupabaseStorageTargets({
    profilePhotoDataUrl:
      'https://bhyhefgmsnxdeqyrdsre.supabase.co/storage/v1/object/public/avatars/users/u1/avatar.png',
    nidScanDataUrl: publicUrl,
    uniScanDataUrl:
      'https://bhyhefgmsnxdeqyrdsre.supabase.co/storage/v1/object/authenticated/tutor-documents/verifications/VER-2026-888/uni_id.png',
  });

  assert.deepEqual(targets.avatars, ['users/u1/avatar.png']);
  assert.deepEqual(targets['tutor-documents'], [
    'verifications/VER-2026-888/nid_scan.jpg',
    'verifications/VER-2026-888/uni_id.png',
  ]);
});

test('deleteVerificationFromEverywhereState cascades deletion across requests, tutors, circular applications, and confirmed jobs, and excludes archived rows', () => {
  const tutorReq: VerificationRequest = {
    id: 'VER-2026-888',
    supabaseRowId: 'row-uuid-888',
    tutorId: 'tutor-mdp-888',
    tutorNameEn: 'Drabir Mandal',
    tutorNameBn: 'দ্রাবিড় মন্ডল',
    userEmail: 'drabirmandal7@gmail.com',
    gender: 'Male',
    upazila: 'Madaripur Sadar',
    phone: '01602393192',
    nidNumber: '1234567890',
    nidDocumentName: 'NID.jpg',
    collegeTag: 'Govt. Nazimuddin College',
    institutionFullEn: 'Govt. Nazimuddin College',
    departmentEn: 'HSC Science',
    studentRegId: 'REG-888',
    academicSession: '2024-2025',
    uniDocumentName: 'StudentID.jpg',
    subjectsEn: ['Physics', 'Math'],
    monthlyFee: 3500,
    submittedAt: 'Nov 3, 2026',
    status: 'Approved',
  };

  const archivedReq: VerificationRequest = {
    ...tutorReq,
    id: 'ARCHIVED-TEST',
    tutorNameEn: 'Archived Test Row',
    status: 'Rejected',
  };

  assert.equal(isActiveVerificationRequest(tutorReq), true);
  assert.equal(isActiveVerificationRequest(archivedReq), false);
  assert.equal(
    filterAdminVisibleVerifications([tutorReq, archivedReq]).length,
    1
  );

  const syncedTutors = syncPublicTutorsFromVerifications(
    [tutorReq, archivedReq],
    []
  );
  assert.equal(syncedTutors.length, 1);

  const relatedApp: CircularApplicationRow = {
    id: 'app-888',
    circular_id: 'MDP-2559',
    tutor_id: 'VER-2026-888',
    tutor_name: 'Drabir Mandal',
    tutor_phone: '01602393192',
    user_email: 'drabirmandal7@gmail.com',
    institution_qualification: 'Govt. Nazimuddin College',
    experience_note: '2 years experience',
    status: 'Confirmed',
  };

  const otherApp: CircularApplicationRow = {
    id: 'app-999',
    circular_id: 'MDP-2559',
    tutor_id: 'VER-2026-999',
    tutor_name: 'Another Tutor',
    tutor_phone: '01711223344',
    user_email: 'other@example.com',
    institution_qualification: 'University of Dhaka',
    experience_note: '3 years experience',
    status: 'Pending',
  };

  const confirmedJob: TuitionJob = {
    ...TEST_JOBS[0],
    id: 'MDP-2559',
    status: 'Confirmed',
    confirmedTutorId: 'VER-2026-888',
    confirmedTutorName: 'Drabir Mandal',
  };

  const cascaded = deleteVerificationFromEverywhereState(
    syncedTutors,
    [tutorReq],
    'VER-2026-888',
    [relatedApp, otherApp],
    [confirmedJob]
  );

  assert.equal(cascaded.requests.length, 0);
  assert.equal(cascaded.tutors.length, 0);
  assert.equal(cascaded.applications.length, 1);
  assert.equal(cascaded.applications[0].id, 'app-999');
  // Confirmed job should automatically reset to Active when its confirmed tutor is deleted everywhere
  assert.equal(cascaded.jobs[0].status, 'Active');
  assert.equal(cascaded.jobs[0].confirmedTutorId, undefined);
  assert.equal(cascaded.jobs[0].confirmedTutorName, undefined);
});

test('validateTutorProfileSubmission and mapVerificationRequestToProfilesTableRow handle optional/null fields gracefully and align with Supabase profiles/tutors schema', () => {
  // Missing required fullName or phone fails cleanly
  assert.equal(
    validateTutorProfileSubmission({ fullName: '', phone: '01712345678' }).valid,
    false
  );
  assert.equal(
    validateTutorProfileSubmission({ fullName: 'Drabir Mandal', phone: '123' })
      .valid,
    false
  );

  // Leaving non-critical fields blank (nidNumber, institution, department, studentRegId, medium, experience) succeeds gracefully!
  const minimalValid = validateTutorProfileSubmission({
    fullName: 'Drabir Mandal',
    phone: '01602393192',
    email: 'drabirmandal7@gmail.com',
    nidNumber: '',
    institution: null,
    department: undefined,
    studentRegId: '',
    medium: null,
    experience: null,
  });
  assert.equal(minimalValid.valid, true);

  // If nidNumber is entered with invalid digits, it still catches the format error
  assert.equal(
    validateTutorProfileSubmission({
      fullName: 'Drabir Mandal',
      phone: '01602393192',
      nidNumber: '12345',
    }).valid,
    false
  );

  // Schema mapping fills safe non-null defaults for NOT NULL columns while keeping optional scan URLs null
  const partialReq: Partial<VerificationRequest> & { id: string } = {
    id: 'VER-2026-888',
    tutorNameEn: 'Drabir Mandal',
    phone: '01602393192',
    email: 'DrabirMandal7@gmail.com',
    upazila: 'Madaripur Sadar',
    gender: 'Male',
    collegeTag: 'Govt. Nazimuddin College',
    institutionFullEn: '',
    departmentEn: '',
    studentRegId: '',
    nidNumber: '',
    medium: 'English Version',
    experience: '3+ Years Experience',
    subjectsEn: [],
  };

  const profileTableRow = mapVerificationRequestToProfilesTableRow(partialReq);
  assert.equal(profileTableRow.full_name, 'Drabir Mandal');
  assert.equal(profileTableRow.phone, '01602393192');
  assert.equal(profileTableRow.mobile_number, '01602393192');
  assert.equal(profileTableRow.email, 'drabirmandal7@gmail.com');
  assert.equal(profileTableRow.user_email, 'drabirmandal7@gmail.com');
  assert.equal(profileTableRow.upazila, 'Madaripur Sadar');
  assert.equal(profileTableRow.institution, 'Govt. Nazimuddin College');
  assert.equal(profileTableRow.medium, 'English Version');
  assert.equal(profileTableRow.experience, '3+ Years Experience');
  // smart_nid_number must never be null (empty string satisfies PostgreSQL NOT NULL constraint)
  assert.equal(profileTableRow.smart_nid_number, '');
  assert.equal(profileTableRow.department_degree, 'Honours / General');
  assert.equal(profileTableRow.teaching_subjects, 'General Science & Math');
  assert.equal(profileTableRow.profile_photo_url, null);
  assert.equal(profileTableRow.nid_scan_url, null);
  assert.equal(profileTableRow.student_id_scan_url, null);
});

test('uploadDocumentToSupabaseStorage and syncTutorProfileToSupabase upload documents to Supabase Storage and sync profile row with schema fallback', async () => {
  assert.equal(
    sanitizeStorageFileName('My Smart NID (2026) নতুন.jpg'),
    'My_Smart_NID_2026_.jpg'
  );
  assert.equal(
    buildSupabaseStorageObjectPath(
      'VER-2026-888',
      'profile_photo',
      'Passport Photo.png'
    ),
    'verifications/VER-2026-888/profile_photo_Passport_Photo.png'
  );

  const sampleDataUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const convertedBlob = dataUrlToBlob(sampleDataUrl);
  assert.ok(convertedBlob);
  assert.equal(convertedBlob.mimeType, 'image/png');

  const uploadedPaths: string[] = [];
  let insertedRows: Record<string, unknown>[] = [];

  const mockSupabase: any = {
    storage: {
      listBuckets: async () => ({
        data: [{ id: 'tutor-documents', name: 'tutor-documents' }],
        error: null,
      }),
      from: (bucket: string) => ({
        upload: async (path: string) => {
          uploadedPaths.push(`${bucket}/${path}`);
          return { data: { path }, error: null };
        },
        getPublicUrl: (path: string) => ({
          data: {
            publicUrl: `https://jpgtzxqtksdgzjgntfvp.supabase.co/storage/v1/object/public/${bucket}/${path}`,
          },
        }),
      }),
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          limit: async () => ({ data: [], error: null }),
          order: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
        }),
      }),
      insert: (rows: Record<string, unknown>[]) => ({
        select: async () => {
          insertedRows = rows;
          return {
            data: rows.map((r) => ({ ...r, id: `row-${table}-1` })),
            error: null,
          };
        },
      }),
    }),
  };

  const reqToSync: VerificationRequest = {
    id: 'VER-2026-888',
    userEmail: 'drabirmandal7@gmail.com',
    email: 'drabirmandal7@gmail.com',
    userId: 'drabirmandal7',
    tutorId: 'tutor-ver-VER-2026-888',
    tutorNameEn: 'Drabir Mandal',
    tutorNameBn: 'Drabir Mandal',
    gender: 'Male',
    upazila: 'Madaripur Sadar',
    phone: '01602393192',
    profilePhotoName: 'drabir_photo.png',
    profilePhotoDataUrl: sampleDataUrl,
    nidNumber: '1999541548899',
    nidDocumentName: 'drabir_nid.png',
    nidScanDataUrl: sampleDataUrl,
    collegeTag: 'Govt. Nazimuddin College',
    institutionFullEn: 'Govt. Nazimuddin College',
    departmentEn: 'HSC Science',
    studentRegId: 'REG-2026-888',
    academicSession: '2024-2025',
    uniDocumentName: 'drabir_student_id.png',
    uniScanDataUrl: sampleDataUrl,
    subjectsEn: ['Physics', 'Higher Math'],
    medium: 'English Version',
    experience: '3+ Years Experience',
    monthlyFee: 4000,
    submittedAt: 'Just now',
    status: 'Pending',
  };

  const syncResult = await syncTutorProfileToSupabase(mockSupabase, reqToSync);
  assert.equal(syncResult.ok, true);
  assert.deepEqual(syncResult.uploadedBuckets, ['tutor-documents']);
  assert.equal(uploadedPaths.length, 3);
  assert.ok(
    syncResult.savedRequest.profilePhotoDataUrl?.startsWith(
      'https://jpgtzxqtksdgzjgntfvp.supabase.co/storage/v1/object/public/tutor-documents/'
    )
  );
  assert.ok(
    syncResult.savedRequest.nidScanDataUrl?.startsWith(
      'https://jpgtzxqtksdgzjgntfvp.supabase.co/storage/v1/object/public/tutor-documents/'
    )
  );
  assert.ok(
    syncResult.savedRequest.uniScanDataUrl?.startsWith(
      'https://jpgtzxqtksdgzjgntfvp.supabase.co/storage/v1/object/public/tutor-documents/'
    )
  );
  assert.equal(syncResult.savedRequest.medium, 'English Version');
  assert.equal(syncResult.savedRequest.experience, '3+ Years Experience');
  assert.equal(insertedRows.length, 1);
  assert.equal(insertedRows[0].full_name, 'Drabir Mandal');
});

test('Zero Auto-Fill on New Account / Google Sign-In: buildInitialGoogleTutorProfile & ensureGoogleUserProfileSynced never insert rows or auto-fill metadata before manual submission', async () => {
  const googleSessionUser = {
    id: '9f8e7d6c-1122-3344-5566-778899aabbcc',
    email: 'scholar.madaripur@gmail.com',
    created_at: '2026-11-03T08:00:00Z',
    user_metadata: {
      full_name: 'Nusrat Jahan',
      avatar_url: 'https://lh3.googleusercontent.com/a/nusrat-avatar=s96-c',
    },
    app_metadata: {
      provider: 'google',
      providers: ['google'],
    },
  };

  assert.equal(isGoogleSessionUser(googleSessionUser), true);
  const mappedUser = mapSupabaseSessionToUser(googleSessionUser);
  assert.equal(mappedUser.provider, 'google');
  assert.equal(mappedUser.fullName, 'Nusrat Jahan');
  assert.equal(mappedUser.email, 'scholar.madaripur@gmail.com');

  // Zero auto-fill in initial profile state: full_name, email, avatar_url, profilePhotoName, and VER-2026-... are NOT auto-filled
  const initialProfile = buildInitialGoogleTutorProfile(googleSessionUser);
  assert.equal(initialProfile.id, '');
  assert.equal(initialProfile.tutorId, '');
  assert.equal(initialProfile.tutorNameEn, '');
  assert.equal(initialProfile.tutorNameBn, '');
  assert.equal(initialProfile.userEmail, undefined);
  assert.equal(initialProfile.email, undefined);
  assert.equal(initialProfile.profilePhotoDataUrl, undefined);
  assert.equal(initialProfile.profilePhotoName, undefined);
  assert.equal(initialProfile.phone, '');
  assert.equal(initialProfile.upazila, '');
  assert.equal(initialProfile.collegeTag, '');
  assert.equal(initialProfile.institutionFullEn, '');
  assert.equal(initialProfile.departmentEn, '');
  assert.equal(initialProfile.experience, '');
  assert.equal(initialProfile.medium, '');
  assert.equal(initialProfile.nidNumber, '');
  assert.equal(initialProfile.studentRegId, '');
  assert.equal(initialProfile.nidDocumentName, '');
  assert.equal(initialProfile.uniDocumentName, '');
  assert.deepEqual(initialProfile.subjectsEn, []);
  assert.equal(initialProfile.monthlyFee, 0);
  assert.equal(initialProfile.status, 'Pending');

  // Unsubmitted profile detection, header badge, banner, and placeholder helpers
  assert.equal(isTutorProfileSubmitted(initialProfile), false);
  assert.equal(
    NEW_ACCOUNT_HEADER_BADGE,
    'New Account · Profile Not Submitted'
  );
  assert.equal(NO_FILE_UPLOADED_PLACEHOLDER, 'No file uploaded yet');
  assert.equal(PROFILE_FIELD_PLACEHOLDER, 'Not Provided Yet');
  assert.equal(
    UNSUBMITTED_PROFILE_BANNER_EN,
    'Complete Your Profile — Please click Upload Profile to submit your details for verification.'
  );
  assert.equal(
    formatProfileFieldOrPlaceholder(initialProfile.tutorNameEn),
    'Not Provided Yet'
  );
  assert.equal(
    formatProfileFieldOrPlaceholder(initialProfile.phone),
    'Not Provided Yet'
  );
  assert.equal(
    formatProfileFieldOrPlaceholder(initialProfile.institutionFullEn),
    'Not Provided Yet'
  );

  // Also test that legacy auto-populated Google rows from Supabase are sanitized to 100% blank
  const legacyGoogleRow = sanitizeUnsubmittedGoogleProfile({
    ...initialProfile,
    id: 'VER-2026-G9F8E',
    tutorNameEn: 'Arup Mandal',
    email: 'arup@gmail.com',
    userEmail: 'arup@gmail.com',
    profilePhotoName: 'arup_Mandal_Google_Avatar.jpg',
    profilePhotoDataUrl: 'https://lh3.googleusercontent.com/a/arup=s96-c',
    upazila: 'Madaripur Sadar',
    collegeTag: 'Govt. Nazimuddin College',
    institutionFullEn: 'Govt. Nazimuddin College',
    departmentEn: 'Honours / General',
    studentRegId: 'Pending Reg ID',
    medium: 'Bangla Medium',
    experience: '2+ Years Experience',
    monthlyFee: 3500,
    subjectsEn: ['General Science & Math'],
  });
  assert.equal(isTutorProfileSubmitted(legacyGoogleRow), false);
  assert.equal(legacyGoogleRow.id, '');
  assert.equal(legacyGoogleRow.tutorNameEn, '');
  assert.equal(legacyGoogleRow.email, undefined);
  assert.equal(legacyGoogleRow.userEmail, undefined);
  assert.equal(legacyGoogleRow.profilePhotoName, undefined);
  assert.equal(legacyGoogleRow.profilePhotoDataUrl, undefined);
  assert.equal(legacyGoogleRow.upazila, '');
  assert.equal(legacyGoogleRow.collegeTag, '');
  assert.equal(legacyGoogleRow.institutionFullEn, '');
  assert.equal(legacyGoogleRow.medium, '');
  assert.equal(legacyGoogleRow.experience, '');
  assert.equal(legacyGoogleRow.monthlyFee, 0);
  assert.equal(legacyGoogleRow.studentRegId, '');
  assert.deepEqual(legacyGoogleRow.subjectsEn, []);

  // Unsubmitted profiles must NEVER appear in the Admin Verification Review Desk
  assert.equal(filterAdminVisibleVerifications([legacyGoogleRow]).length, 0);

  const storedRowsByTable: Record<string, Record<string, unknown>[]> = {
    tutor_verifications: [],
    profiles: [],
    tutors: [],
  };

  const mockSupabaseForGoogle: any = {
    from: (table: string) => ({
      select: () => ({
        eq: (col: string, val: string) => ({
          order: () => ({
            limit: async () => {
              const rows = storedRowsByTable[table] || [];
              const found = rows.filter(
                (r) =>
                  String(r[col] || '').toLowerCase() ===
                  String(val || '').toLowerCase()
              );
              return { data: found.slice(0, 1), error: null };
            },
          }),
        }),
      }),
      insert: (rows: Record<string, unknown>[]) => ({
        select: async () => {
          const inserted = rows.map((r, idx) => ({
            ...r,
            id: `${table}-row-${idx + 1}`,
          }));
          storedRowsByTable[table] = [
            ...(storedRowsByTable[table] || []),
            ...inserted,
          ];
          return { data: inserted, error: null };
        },
      }),
    }),
  };

  // Sign-in via Google: no row exists -> does NOT auto-insert into Supabase or Admin Review Desk
  const firstSync = await ensureGoogleUserProfileSynced(
    mockSupabaseForGoogle,
    googleSessionUser,
    { syncSecondaryTables: true }
  );
  assert.equal(firstSync.created, false);
  assert.equal(isTutorProfileSubmitted(firstSync.profile), false);
  assert.equal(firstSync.profile.id, '');
  assert.equal(firstSync.profile.tutorNameEn, '');
  assert.equal(firstSync.profile.userEmail, undefined);
  assert.equal(firstSync.profile.profilePhotoDataUrl, undefined);
  assert.equal(storedRowsByTable.tutor_verifications.length, 0);
  assert.equal(storedRowsByTable.profiles.length, 0);
  assert.equal(storedRowsByTable.tutors.length, 0);
});

test('Admin Panel Edit & Delete from Everywhere: applyAdminProfileEditState, executeAdminUpdateProfileInSupabase, and executeAdminDeleteProfileEverywhere', async () => {
  const initialReq: VerificationRequest = {
    id: 'VER-2026-888',
    supabaseRowId: 'uuid-profile-888',
    userId: 'drabirmandal7',
    userEmail: 'drabirmandal7@gmail.com',
    email: 'drabirmandal7@gmail.com',
    tutorId: 'tutor-ver-VER-2026-888',
    tutorNameEn: 'Drabir Mandal',
    tutorNameBn: 'Drabir Mandal',
    gender: 'Male',
    upazila: 'Madaripur Sadar',
    phone: '01602393192',
    profilePhotoName: 'avatar.jpg',
    profilePhotoDataUrl:
      'https://jpgtzxqtksdgzjgntfvp.supabase.co/storage/v1/object/public/tutor-documents/verifications/VER-2026-888/profile_photo_avatar.jpg',
    nidNumber: '1999541548899',
    nidDocumentName: 'nid.jpg',
    nidScanDataUrl:
      'https://jpgtzxqtksdgzjgntfvp.supabase.co/storage/v1/object/public/tutor-documents/verifications/VER-2026-888/nid_scan_nid.jpg',
    collegeTag: 'Govt. Nazimuddin College',
    institutionFullEn: 'Govt. Nazimuddin College',
    departmentEn: 'B.Sc. in Physics',
    studentRegId: 'REG-888',
    academicSession: '2023-2024',
    uniDocumentName: 'student_id.jpg',
    uniScanDataUrl:
      'https://jpgtzxqtksdgzjgntfvp.supabase.co/storage/v1/object/public/tutor-documents/verifications/VER-2026-888/student_id_scan_student_id.jpg',
    subjectsEn: ['Physics', 'Math'],
    medium: 'Bangla Medium',
    experience: '2+ Years Experience',
    monthlyFee: 3500,
    submittedAt: 'Nov 3, 2026',
    status: 'Pending',
  };

  const sampleApp: CircularApplicationRow = {
    id: 'app-888',
    circular_id: 'MDP-2409',
    tutor_id: 'VER-2026-888',
    user_id: 'drabirmandal7',
    user_email: 'drabirmandal7@gmail.com',
    tutor_name: 'Drabir Mandal',
    tutor_phone: '01602393192',
    institution_qualification: 'Govt. Nazimuddin College',
    experience_note: '2+ Years Experience',
    status: 'Pending',
  };

  // 1. Admin Edits Profile Fields & Approves Status
  const editedReq: VerificationRequest = {
    ...initialReq,
    tutorNameEn: 'Dr. Abir Mandal (Updated)',
    tutorNameBn: 'Dr. Abir Mandal (Updated)',
    phone: '01711998877',
    upazila: 'Shibchar',
    collegeTag: 'DU',
    institutionFullEn: 'University of Dhaka (DU)',
    departmentEn: 'M.Sc. in Physics',
    medium: 'English Version',
    experience: '5+ Years Experience',
    nidNumber: '1997541541122',
    studentRegId: 'DU-PHY-999',
    monthlyFee: 6000,
    status: 'Approved',
  };

  const editState = applyAdminProfileEditState(
    [],
    [initialReq],
    [sampleApp],
    [],
    editedReq
  );
  assert.equal(editState.requests[0].tutorNameEn, 'Dr. Abir Mandal (Updated)');
  assert.equal(editState.requests[0].upazila, 'Shibchar');
  assert.equal(editState.requests[0].status, 'Approved');
  // Synced into public tutors board because status is Approved
  assert.equal(editState.tutors.length, 1);
  assert.equal(editState.tutors[0].nameEn, 'Dr. Abir Mandal (Updated)');
  assert.equal(editState.tutors[0].upazila, 'Shibchar');
  // Synced into circular applications
  assert.equal(editState.applications[0].tutor_name, 'Dr. Abir Mandal (Updated)');
  assert.equal(editState.applications[0].tutor_phone, '01711998877');

  const updatedTables: string[] = [];
  const deletedTables: string[] = [];
  const removedStoragePaths: string[] = [];

  const mockSupabaseAdmin: any = {
    storage: {
      from: (bucket: string) => ({
        list: async (folder: string) => ({
          data: [{ name: 'profile_photo_avatar.jpg' }],
          error: null,
        }),
        remove: async (paths: string[]) => {
          removedStoragePaths.push(...paths.map((p) => `${bucket}/${p}`));
          return { data: paths, error: null };
        },
      }),
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          limit: async () => ({
            data: [{ id: `row-${table}-888`, verification_code: 'VER-2026-888' }],
            error: null,
          }),
        }),
      }),
      update: (payload: Record<string, unknown>) => ({
        eq: () => {
          updatedTables.push(table);
          const chain: any = {
            select: async () => ({
              data: [{ ...payload, id: `row-${table}-888` }],
              error: null,
            }),
            then: (resolve: any) => resolve({ data: [payload], error: null }),
          };
          return chain;
        },
      }),
      delete: () => ({
        eq: () => {
          deletedTables.push(table);
          const chain: any = {
            select: async () => ({
              data: [{ id: `row-${table}-888` }],
              error: null,
            }),
            then: (resolve: any) => resolve({ data: [], error: null }),
          };
          return chain;
        },
      }),
    }),
  };

  const updateRes = await executeAdminUpdateProfileInSupabase(
    mockSupabaseAdmin,
    editedReq
  );
  assert.equal(updateRes.ok, true);
  assert.ok(updatedTables.includes('profiles'));
  assert.ok(updatedTables.includes('tutor_verifications'));

  // 2. Admin Deletes Profile from Everywhere
  const rpcCalls: Array<{ fnName: string; args: Record<string, unknown> }> = [];
  mockSupabaseAdmin.rpc = async (fnName: string, args: Record<string, unknown>) => {
    rpcCalls.push({ fnName, args });
    return { data: null, error: null };
  };

  const deleteRes = await executeAdminDeleteProfileEverywhere(
    mockSupabaseAdmin,
    {
      requestId: 'VER-2026-888',
      targetProfile: editedReq,
      affectedCircularIds: ['MDP-2409'],
    }
  );
  assert.equal(deleteRes.ok, true);
  assert.ok(
    rpcCalls.some(
      (c) =>
        c.fnName === 'delete_user_everywhere' &&
        c.args.target_email === 'drabirmandal7@gmail.com'
    )
  );
  assert.ok(deletedTables.includes('profiles'));
  assert.ok(deletedTables.includes('tutors'));
  assert.ok(deletedTables.includes('tutor_verifications'));
  assert.ok(deletedTables.includes('circular_applications'));
  assert.ok(
    removedStoragePaths.some((p) =>
      p.includes('verifications/VER-2026-888/profile_photo_avatar.jpg')
    )
  );
});

test('Cross-Device Delete from Everywhere Sync & Auto-Wipe: zero localStorage profile fallback, department metadata encoding, and force sign-out detection', () => {
  assert.equal(
    ADMIN_REMOVED_PROFILE_NOTICE,
    'Your profile has been removed by the Administrator.'
  );

  // 1. Medium and Experience round-trip directly in tutor_verifications without relying on localStorage
  const encodedDept = encodeDepartmentWithMeta(
    'B.Sc. in Physics',
    'English Version',
    '3+ Years Experience'
  );
  const decodedDept = decodeDepartmentWithMeta(encodedDept);
  assert.equal(decodedDept.department, 'B.Sc. in Physics');
  assert.equal(decodedDept.medium, 'English Version');
  assert.equal(decodedDept.experience, '3+ Years Experience');

  // Verify mapVerificationRequestToSupabaseRow & mapSupabaseRowToVerificationRequest preserve medium & experience
  const reqWithMeta: VerificationRequest = {
    ...TEST_REQUESTS[0],
    id: 'VER-2026-909',
    userEmail: 'ukhunter34@gmail.com',
    departmentEn: 'BBA in Finance',
    medium: 'Bangla Medium',
    experience: '2 Years Experience',
  };
  const supRow = mapVerificationRequestToSupabaseRow(reqWithMeta);
  const restoredReq = mapSupabaseRowToVerificationRequest(supRow);
  assert.equal(restoredReq.departmentEn, 'BBA in Finance');
  assert.equal(restoredReq.medium, 'Bangla Medium');
  assert.equal(restoredReq.experience, '2 Years Experience');

  // 2. Auth user deleted error detection
  assert.equal(
    isAuthUserDeletedError({ message: 'User from sub claim in JWT does not exist' }),
    true
  );
  assert.equal(
    isAuthUserDeletedError({ status: 403, message: 'User not found' }),
    true
  );
  assert.equal(isAuthUserDeletedError(null), false);

  // 3. Mock browser storage to verify legacy localStorage cache purge & force wipe decision
  const mockLocalStore = new Map<string, string>([
    [
      'tutor_profile_ukhunter34@gmail.com',
      JSON.stringify({
        id: 'VER-2026-733',
        userEmail: 'ukhunter34@gmail.com',
        experience: 'Cached Stale Experience',
        medium: 'Cached Stale Medium',
      }),
    ],
    ['sb-jpgtzxqtksdgzjgntfvp-auth-token', 'cached-jwt-token'],
  ]);
  const mockSessionStore = new Map<string, string>();

  const createMockStorage = (store: Map<string, string>) => ({
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  });

  const localStorageMock = createMockStorage(mockLocalStore);
  const sessionStorageMock = createMockStorage(mockSessionStore);
  const storageBundle = {
    localStorage: localStorageMock,
    sessionStorage: sessionStorageMock,
  };

  // Purging legacy localStorage profile cache deletes tutor_profile_<email> and marks synced history
  const removedKeys = purgeLegacyLocalStorageProfileCache(storageBundle);
  assert.ok(removedKeys.includes('tutor_profile_ukhunter34@gmail.com'));
  assert.equal(
    localStorageMock.getItem('tutor_profile_ukhunter34@gmail.com'),
    null
  );
  assert.equal(
    hasPriorSyncedTutorProfileForEmail('ukhunter34@gmail.com', storageBundle),
    true
  );

  // When Supabase returns 0 rows for ukhunter34@gmail.com on another browser/device (hadPriorSyncedProfile = true), shouldForceWipeDeletedUserSession returns true
  assert.equal(
    shouldForceWipeDeletedUserSession({
      isAdmin: false,
      authUserDeleted: false,
      hasActiveSupabaseRow: false,
      hasTombstoneRow: false,
      hasExplicitLoginIntent: false,
      hadPriorSyncedProfile: true,
    }),
    true
  );

  // A newly registered user who has NOT manually submitted a profile yet (hadPriorSyncedProfile = false, authUserDeleted = false) stays logged in with an empty profile state
  assert.equal(
    shouldForceWipeDeletedUserSession({
      isAdmin: false,
      authUserDeleted: false,
      hasActiveSupabaseRow: false,
      hasTombstoneRow: false,
      hasExplicitLoginIntent: false,
      hadPriorSyncedProfile: false,
    }),
    false
  );

  // A brand-new user who just clicked "Continue with Google" (fresh login intent, no prior profile) is allowed to create an empty profile
  markExplicitLoginIntent(storageBundle);
  assert.equal(hasFreshExplicitLoginIntent(storageBundle), true);
  assert.equal(
    shouldForceWipeDeletedUserSession({
      isAdmin: false,
      authUserDeleted: false,
      hasActiveSupabaseRow: false,
      hasTombstoneRow: false,
      hasExplicitLoginIntent: true,
      hadPriorSyncedProfile: false,
    }),
    false
  );
  clearExplicitLoginIntent(storageBundle);
  assert.equal(hasFreshExplicitLoginIntent(storageBundle), false);

  // 4. clearAllTutorZoneBrowserStorage wipes all Tutor Zone and Supabase auth keys from localStorage and sessionStorage
  markTutorProfileSyncedForEmail('ukhunter34@gmail.com', storageBundle);
  markExplicitLoginIntent(storageBundle);
  clearAllTutorZoneBrowserStorage(storageBundle);
  assert.equal(localStorageMock.length, 0);
  assert.equal(sessionStorageMock.length, 0);
});

test('Clean State Sync & Admin Account Protection: protect drabirm4@gmail.com from deletion and filter out stale local fallback entries', async () => {
  // 1. Protect Admin account drabirm4@gmail.com from accidental deletion or startup wipe
  assert.equal(isProtectedAdminProfile('drabirm4@gmail.com'), true);
  assert.equal(isProtectedAdminProfile('  DRABIRM4@GMAIL.COM '), true);
  assert.equal(isProtectedAdminProfile('drabirm4'), true);
  assert.equal(isProtectedAdminProfile('admin-drabirm4'), true);
  assert.equal(isProtectedAdminProfile('ukhunter34@gmail.com'), false);

  const adminReq: VerificationRequest = {
    ...TEST_REQUESTS[0],
    id: 'VER-ADMIN-001',
    tutorId: 'tutor-ver-VER-ADMIN-001',
    userEmail: 'drabirm4@gmail.com',
    email: 'drabirm4@gmail.com',
    userId: 'drabirm4',
    tutorNameEn: 'Dr. Abir Mandal (Admin)',
    status: 'Approved',
  };
  const normalReq: VerificationRequest = {
    ...TEST_REQUESTS[1],
    id: 'VER-USER-002',
    tutorId: 'tutor-ver-VER-USER-002',
    userEmail: 'testuser@gmail.com',
    email: 'testuser@gmail.com',
    userId: 'testuser',
    tutorNameEn: 'Test User',
    status: 'Approved',
  };

  assert.equal(isProtectedAdminProfile(adminReq), true);
  assert.equal(isProtectedAdminProfile(normalReq), false);

  // Attempting to delete drabirm4@gmail.com in state leaves it untouched
  const afterAttemptDeleteAdmin = deleteVerificationFromEverywhereState(
    [],
    [adminReq, normalReq],
    'VER-ADMIN-001'
  );
  assert.equal(afterAttemptDeleteAdmin.requests.length, 2);
  assert.equal(afterAttemptDeleteAdmin.requests[0].id, 'VER-ADMIN-001');

  // Attempting to hide drabirm4@gmail.com from Admin Panel leaves hiddenFromAdmin false
  const afterAttemptHideAdmin = hideVerificationFromAdminOnly(
    [adminReq, normalReq],
    'VER-ADMIN-001'
  );
  assert.equal(Boolean(afterAttemptHideAdmin[0].hiddenFromAdmin), false);

  // Attempting to delete drabirm4@gmail.com via executeAdminDeleteProfileEverywhere is blocked before any DB/RPC call
  let dbTouched = false;
  const mockSupabaseProtected: any = {
    rpc: async () => {
      dbTouched = true;
      return { data: null, error: null };
    },
    from: () => {
      dbTouched = true;
      return {};
    },
  };
  const blockedDeleteRes = await executeAdminDeleteProfileEverywhere(
    mockSupabaseProtected,
    {
      requestId: 'VER-ADMIN-001',
      targetProfile: adminReq,
    }
  );
  assert.equal(blockedDeleteRes.ok, false);
  assert.equal(blockedDeleteRes.errorMessage, PROTECTED_ADMIN_DELETE_ERROR);
  assert.equal(dbTouched, false);

  // Admin account drabirm4@gmail.com is NEVER force-wiped on startup even if no tutor_verifications row exists
  assert.equal(
    shouldForceWipeDeletedUserSession({
      email: 'drabirm4@gmail.com',
      isAdmin: false,
      authUserDeleted: true,
      hasActiveSupabaseRow: false,
      hasTombstoneRow: true,
      hasExplicitLoginIntent: false,
      hadPriorSyncedProfile: true,
    }),
    false
  );

  // 2. Strict Live Supabase Tutor & Verification Filtering (no stale local fallback entries)
  const liveSupabaseRows = [mapVerificationRequestToSupabaseRow(normalReq)];
  const strictVerifications = filterStrictLiveSupabaseVerifications(
    liveSupabaseRows,
    []
  );
  assert.equal(strictVerifications.length, 1);
  assert.equal(strictVerifications[0].id, 'VER-USER-002');

  // Stale local fallback tutors (TEST_TUTORS) that are NOT in live Supabase are filtered out
  const strictTutors = syncStrictLiveSupabaseTutors(
    strictVerifications,
    TEST_TUTORS
  );
  assert.equal(strictTutors.length, 1);
  assert.equal(strictTutors[0].id, 'tutor-ver-VER-USER-002');

  // When live Supabase has 0 rows, both Admin Panel verifications and Tutor Board tutors are empty (0 stale entries)
  const emptyVerifications = filterStrictLiveSupabaseVerifications([], []);
  const emptyTutors = syncStrictLiveSupabaseTutors(
    emptyVerifications,
    TEST_TUTORS
  );
  assert.equal(emptyVerifications.length, 0);
  assert.equal(emptyTutors.length, 0);

  // 3. OAuth Redirect Callback detection
  assert.equal(isOAuthRedirectCallbackUrl('', '#access_token=abc123'), true);
  assert.equal(isOAuthRedirectCallbackUrl('?code=xyz987', ''), true);
  assert.equal(isOAuthRedirectCallbackUrl('', ''), false);
});

test('Official Social & Support Channels: formatWhatsAppDirectLink, normalizeFacebookUrl, and Supabase site_settings (id = 1) sync', async () => {
  // 1. Bangladeshi phone number to direct WhatsApp link conversion
  assert.equal(
    formatWhatsAppDirectLink('01712345678'),
    'https://wa.me/8801712345678'
  );
  assert.equal(
    formatWhatsAppDirectLink('+8801712345678'),
    'https://wa.me/8801712345678'
  );
  assert.equal(
    formatWhatsAppDirectLink('8801712345678'),
    'https://wa.me/8801712345678'
  );
  assert.equal(
    formatWhatsAppDirectLink('01712-345678'),
    'https://wa.me/8801712345678'
  );
  assert.equal(
    formatWhatsAppDirectLink('https://wa.me/01712345678'),
    'https://wa.me/8801712345678'
  );
  assert.equal(
    formatWhatsAppDirectLink('https://wa.me/8801911223344'),
    'https://wa.me/8801911223344'
  );
  assert.equal(formatWhatsAppDirectLink(''), '');

  // 2. Facebook URL normalization
  assert.equal(
    normalizeFacebookUrl('facebook.com/tutorzonebd'),
    'https://facebook.com/tutorzonebd'
  );
  assert.equal(
    normalizeFacebookUrl('https://www.facebook.com/tutorzonebd'),
    'https://www.facebook.com/tutorzonebd'
  );
  assert.equal(normalizeFacebookUrl('   '), '');

  // 3. Active channel check
  assert.equal(isSocialChannelActive('https://facebook.com/page'), true);
  assert.equal(isSocialChannelActive('01712345678'), true);
  assert.equal(isSocialChannelActive('   '), false);

  // 4. LocalStorage & Supabase public.site_settings (id = 1) persistence
  const storeMap = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => (storeMap.has(k) ? storeMap.get(k)! : null),
    setItem: (k: string, v: string) => {
      storeMap.set(k, v);
    },
    removeItem: (k: string) => {
      storeMap.delete(k);
    },
  };

  let upsertedPayloads: Array<{
    table: string;
    values: Record<string, unknown>;
    options?: { onConflict?: string };
  }> = [];

  const mockSupabaseSiteSettings = {
    from: (table: string) => ({
      select: () => ({
        eq: (col: string, val: unknown) => ({
          maybeSingle: async () => ({
            data:
              table === 'site_settings' && col === 'id' && val === 1
                ? {
                    id: 1,
                    facebook_url: 'https://www.facebook.com/officialtutorzone',
                    whatsapp_number: '01819876543',
                  }
                : null,
            error: null,
          }),
          limit: async () => ({
            data: [],
            error: null,
          }),
        }),
      }),
      upsert: async (
        values: Record<string, unknown>,
        options?: { onConflict?: string }
      ) => {
        upsertedPayloads.push({ table, values, options });
        return { data: [values], error: null };
      },
    }),
  };

  const fetched = await fetchSiteSocialSettingsFromSupabase(
    mockSupabaseSiteSettings,
    mockStorage
  );
  assert.equal(fetched.id, 1);
  assert.equal(
    fetched.facebookUrl,
    'https://www.facebook.com/officialtutorzone'
  );
  assert.equal(fetched.whatsappContact, '01819876543');

  const saveRes = await saveSiteSocialSettingsToSupabase(
    mockSupabaseSiteSettings,
    {
      facebookUrl: 'https://www.facebook.com/tutorzone.live',
      whatsappContact: '01799887766',
    },
    mockStorage
  );
  assert.equal(saveRes.success, true);
  assert.equal(saveRes.syncedToSupabase, true);
  assert.equal(saveRes.message, SOCIAL_LINKS_UPDATED_TOAST);
  assert.equal(upsertedPayloads.length, 1);
  assert.equal(upsertedPayloads[0].table, 'site_settings');
  assert.equal(upsertedPayloads[0].values.id, 1);
  assert.equal(
    upsertedPayloads[0].values.facebook_url,
    'https://www.facebook.com/tutorzone.live'
  );
  assert.equal(
    upsertedPayloads[0].values.whatsapp_url,
    'https://wa.me/8801799887766'
  );

  const storedAfterSave = readSiteSocialSettingsFromStorage(mockStorage);
  assert.equal(
    storedAfterSave.facebookUrl,
    'https://www.facebook.com/tutorzone.live'
  );
  assert.equal(storedAfterSave.whatsappContact, '01799887766');
  assert.ok(storeMap.has(SITE_SOCIAL_SETTINGS_STORAGE_KEY));
});

test('bKash and Nagad payment verification: validates TrxID, submits to payment_requests, and updates status between Profile and Admin Review', async () => {
  // 1. Transaction ID & submission validation
  assert.equal(validateTransactionId('8N7A6B5C4D'), true);
  assert.equal(validateTransactionId('trx-123456'), true);
  assert.equal(validateTransactionId('123'), false);
  assert.equal(validateTransactionId('bad space id'), false);

  const validBkash = validatePaymentSubmissionInput({
    tutorName: 'Tanvir Ahmed',
    tutorId: 'VER-2026-101',
    userEmail: 'tanvir@example.com',
    paymentMethod: 'bKash',
    senderNumber: '+880 1712-345678',
    transactionId: 'bkx9876543',
    amount: 500,
  });
  assert.equal(validBkash.valid, true);
  assert.equal(validBkash.cleanSenderNumber, '01712345678');
  assert.equal(validBkash.cleanTransactionId, 'BKX9876543');
  assert.equal(validBkash.cleanAmount, 500);

  const invalidSender = validatePaymentSubmissionInput({
    tutorName: 'Tanvir Ahmed',
    paymentMethod: 'Nagad',
    senderNumber: '01234',
    transactionId: 'NGD9876543',
    amount: 500,
  });
  assert.equal(invalidSender.valid, false);
  assert.match(invalidSender.errorMessage || '', /11-digit/i);

  // 2. Build payment_requests row and verify site_settings bKash/Nagad persistence
  const storeMap = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => storeMap.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storeMap.set(key, value);
    },
  };

  const remotePaymentRows: Array<Record<string, unknown>> = [];
  const mockSupabasePayment = {
    from: (table: string) => ({
      select: () => ({
        order: async () => ({
          data: table === 'payment_requests' ? [...remotePaymentRows] : [],
          error: null,
        }),
        eq: (col: string, val: unknown) => ({
          maybeSingle: async () => ({
            data:
              table === 'site_settings' && col === 'id' && val === 1
                ? {
                    id: 1,
                    facebook_url: 'https://www.facebook.com/tutorzone',
                    whatsapp_number: '01602393192',
                    bkash_number: '01711223344',
                    nagad_number: '01855667788',
                    verification_fee: 600,
                  }
                : null,
            error: null,
          }),
        }),
      }),
      insert: (rows: Array<Record<string, unknown>>) => ({
        select: () => ({
          maybeSingle: async () => {
            const inserted = {
              ...rows[0],
              created_at: '2026-11-05T10:00:00.000Z',
            };
            remotePaymentRows.unshift(inserted);
            return { data: inserted, error: null };
          },
        }),
      }),
      update: (patch: Record<string, unknown>) => ({
        eq: async (_col: string, val: unknown) => {
          for (let i = 0; i < remotePaymentRows.length; i += 1) {
            if (
              remotePaymentRows[i].payment_code === val ||
              remotePaymentRows[i].id === val
            ) {
              remotePaymentRows[i] = { ...remotePaymentRows[i], ...patch };
            }
          }
          return { data: null, error: null };
        },
      }),
      delete: () => ({
        eq: async (_col: string, val: unknown) => {
          const idx = remotePaymentRows.findIndex(
            (r) => r.payment_code === val || r.id === val
          );
          if (idx >= 0) remotePaymentRows.splice(idx, 1);
          return { data: null, error: null };
        },
      }),
      upsert: async (values: Record<string, unknown>) => ({
        data: [values],
        error: null,
      }),
    }),
  };

  const fetchedSettings = await fetchSiteSocialSettingsFromSupabase(
    mockSupabasePayment,
    mockStorage
  );
  assert.equal(fetchedSettings.bkashNumber, '01711223344');
  assert.equal(fetchedSettings.nagadNumber, '01855667788');
  assert.equal(fetchedSettings.verificationFee, 600);

  // Submit a bKash payment from tutor Profile
  const submitRes = await submitPaymentRequestToSupabase(
    mockSupabasePayment,
    {
      tutorName: 'Tanvir Ahmed',
      tutorId: 'VER-2026-101',
      userEmail: 'tanvir@example.com',
      userId: 'tanvir',
      paymentMethod: 'bKash',
      senderNumber: '01712345678',
      transactionId: 'trx99887766',
      amount: 600,
    },
    {
      id: 'tanvir',
      fullName: 'Tanvir Ahmed',
      email: 'tanvir@example.com',
      provider: 'email',
      createdAt: '2026-11-05',
    },
    null,
    mockStorage
  );

  assert.equal(submitRes.ok, true);
  assert.equal(submitRes.syncedToSupabase, true);
  assert.equal(submitRes.payment.paymentMethod, 'bKash');
  assert.equal(submitRes.payment.transactionId, 'TRX99887766');
  assert.equal(submitRes.payment.status, 'Pending');
  assert.ok(storeMap.has(PAYMENT_REQUESTS_STORAGE_KEY));

  // Verify tutor Profile payment summary shows Pending
  const allFetched = await fetchPaymentRequestsFromSupabase(
    mockSupabasePayment,
    mockStorage
  );
  assert.equal(allFetched.length, 1);

  const userPayments = getUserPaymentRequests(
    allFetched,
    { email: 'tanvir@example.com', id: 'tanvir' },
    null
  );
  assert.equal(userPayments.length, 1);
  const pendingSummary = getTutorPaymentVerificationSummary(
    allFetched,
    { email: 'tanvir@example.com', id: 'tanvir' },
    null
  );
  assert.equal(pendingSummary.hasVerifiedPayment, false);
  assert.equal(pendingSummary.hasPendingPayment, true);

  // Admin approves the payment in Admin Review
  const approvedRequests = await updatePaymentRequestStatusInSupabase(
    mockSupabasePayment,
    submitRes.payment.id,
    'Approved',
    'Matched bKash statement TrxID TRX99887766',
    mockStorage
  );
  assert.equal(approvedRequests[0].status, 'Approved');
  assert.equal(
    approvedRequests[0].adminNote,
    'Matched bKash statement TrxID TRX99887766'
  );

  const verifiedSummary = getTutorPaymentVerificationSummary(
    approvedRequests,
    { email: 'tanvir@example.com', id: 'tanvir' },
    null
  );
  assert.equal(verifiedSummary.hasApproved, true);
  assert.equal(verifiedSummary.hasVerifiedPayment, true);
  assert.equal(verifiedSummary.latestPayment?.status, 'Approved');

  // Admin deletes the payment record
  const remainingRequests = await deletePaymentRequestFromSupabase(
    mockSupabasePayment,
    submitRes.payment.id,
    mockStorage
  );
  assert.equal(
    filterAdminVisiblePaymentRequests(remainingRequests).length,
    0
  );
  assert.ok(DEFAULT_BKASH_NUMBER.length === 11);
  assert.ok(DEFAULT_NAGAD_NUMBER.length === 11);
  assert.ok(DEFAULT_VERIFICATION_FEE_BDT > 0);
});

test('Payment Rules: Rule 1 hides payment on Profile for unconfirmed users, Rule 2 checks confirmed tuition, Rule 3 verifies approval & circular linkage', () => {
  const regularUser = {
    id: 'user-tutor-99',
    fullName: 'Mohammad Faruk',
    email: 'faruk@example.com',
    provider: 'google' as const,
    createdAt: '2026-11-01',
  };

  const pendingApps: CircularApplicationRow[] = [
    {
      id: 'app-1',
      circular_id: 'MDP-3001',
      tutor_id: 'MDP-TUT-99',
      tutor_name: 'Mohammad Faruk',
      tutor_phone: '01719999999',
      institution_qualification: 'Govt. Nazimuddin College',
      experience_note: '2 years HSC experience',
      status: 'Pending',
      user_email: 'faruk@example.com',
    },
  ];

  const emptyPayments: PaymentRequestRecord[] = [];

  // Rule 1: Regular/unconfirmed user with no confirmed circular and no payment -> payment section is hidden
  assert.equal(
    hasUserConfirmedTuition(pendingApps, regularUser, null),
    false,
    'Pending applications are not confirmed'
  );
  assert.equal(
    canShowPaymentSectionOnProfile(pendingApps, emptyPayments, regularUser, null, false),
    false,
    'Unconfirmed user with no payments must not see payment section on profile'
  );

  // Admin always sees payment section
  assert.equal(
    canShowPaymentSectionOnProfile(pendingApps, emptyPayments, regularUser, null, true),
    true,
    'Admin always sees payment section'
  );

  // Rule 1: Hide general payment section from Profile for regular users regardless of confirmation
  const confirmedApps: CircularApplicationRow[] = [
    {
      ...pendingApps[0],
      status: 'verified_for_tuition',
      media_fee: 1200,
      experience_note: 'Teaching HSC students [Media Fee: ৳1200]',
    },
  ];

  assert.equal(
    hasUserConfirmedTuition(confirmedApps, regularUser, null),
    true,
    'Verified for tuition is recognized as confirmed tuition'
  );
  assert.equal(
    canShowPaymentSectionOnProfile(confirmedApps, emptyPayments, regularUser, null, false),
    false,
    'Rule 1: General payment section on Profile is strictly hidden for regular users'
  );
  assert.equal(
    canShowPaymentSectionOnProfile(confirmedApps, emptyPayments, regularUser, null, true),
    true,
    'Rule 1: Admin can still access payment section on Profile'
  );

  // Status badge for 'verified_for_tuition'
  const verifiedBadge = getUserCircularApplicationStatusBadge('verified_for_tuition');
  assert.equal(verifiedBadge.tone, 'confirmed');
  assert.ok(verifiedBadge.label.includes('Verified for Tuition'));

  // Custom media fee extraction
  assert.equal(extractMediaFeeFromApplication(confirmedApps[0], 1000), 1200);
  assert.equal(extractMediaFeeFromApplication({ experience_note: 'Some note [Media Fee: ৳1500]' }, 1000), 1500);
  assert.equal(extractMediaFeeFromApplication(undefined, 1000), 1000);

  // Building payment request for that specific verified circular with custom fee
  const paymentRow = buildPaymentRequestRow({
    paymentMethod: 'bKash',
    senderNumber: '01719999999',
    transactionId: 'BK99X412KL',
    amount: 1200,
    purpose: 'Tuition Media Confirmation Fee (MDP-3001)',
    circularId: 'MDP-3001',
    circularTitle: 'HSC Physics & Math in Lake Par',
    guardianPhone: '01712345678',
    guardianAddress: 'Lake Par, Madaripur Sadar',
    tutorName: 'Mohammad Faruk',
    userEmail: 'faruk@example.com',
  });

  assert.equal(paymentRow.circular_id, 'MDP-3001');
  assert.equal(paymentRow.circular_title, 'HSC Physics & Math in Lake Par');
  assert.equal(paymentRow.guardian_phone, '01712345678');
  assert.equal(paymentRow.guardian_address, 'Lake Par, Madaripur Sadar');
  assert.equal(paymentRow.status, 'Pending');

  const submittedPaymentRecord: PaymentRequestRecord = {
    id: 'pay-record-1',
    requestCode: 'PAY-BK99X412KL',
    tutorName: 'Mohammad Faruk',
    userEmail: 'faruk@example.com',
    paymentMethod: 'bKash',
    senderNumber: '01719999999',
    transactionId: 'BK99X412KL',
    amount: 1000,
    purpose: 'Tuition Media Confirmation Fee (MDP-3001)',
    circularId: 'MDP-3001',
    circularTitle: 'HSC Physics & Math in Lake Par',
    guardianPhone: '01712345678',
    guardianAddress: 'Lake Par, Madaripur Sadar',
    status: 'Pending',
    createdAt: 'Just now',
  };

  // Rule 2 & 3: Finding payment for circular MDP-3001
  const matchedPayment = getPaymentForCircular([submittedPaymentRecord], 'MDP-3001');
  assert.ok(matchedPayment, 'Found payment matching MDP-3001');
  assert.equal(matchedPayment?.transactionId, 'BK99X412KL');

  // Contact is locked while payment is Pending
  assert.equal(
    isPaymentApprovedForCircular([submittedPaymentRecord], 'MDP-3001', regularUser, null),
    false,
    'Payment is pending so contact details remain locked'
  );

  // Non-existent circular returns undefined
  assert.equal(
    getPaymentForCircular([submittedPaymentRecord], 'MDP-9999'),
    undefined,
    'Non-existent circular has no payment'
  );

  // Rule 3: Admin approves payment for that circular
  const approvedPaymentRecord: PaymentRequestRecord = {
    ...submittedPaymentRecord,
    status: 'Approved',
  };

  assert.equal(
    isPaymentApprovedForCircular([approvedPaymentRecord], 'MDP-3001', regularUser, null),
    true,
    'Approved payment automatically unlocks guardian contact details'
  );
});

test('NoticeBoard engine: readSiteNoticesFromStorage and writeSiteNoticesToStorage work with storage', () => {
  const memoryStore: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => memoryStore[key] ?? null,
    setItem: (key: string, val: string) => {
      memoryStore[key] = val;
    },
    removeItem: (key: string) => {
      delete memoryStore[key];
    },
  };

  // Initially empty returns []
  const initial = readSiteNoticesFromStorage(mockStorage);
  assert.deepEqual(initial, []);

  // Write notices
  const testNotices: SiteNotice[] = [
    {
      id: 'notice-1',
      title: 'Urgent Madaripur Sadar Update',
      content: 'All tutors must complete ID verification.',
      badge_text: 'Urgent',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'notice-2',
      title: 'Shibchar New Circulars',
      content: 'Multiple physics and math tuition circulars posted.',
      badge_text: 'Tuition Notice',
      is_active: false,
    },
  ];

  writeSiteNoticesToStorage(testNotices, mockStorage);
  const readBack = readSiteNoticesFromStorage(mockStorage);
  assert.equal(readBack.length, 2);
  assert.equal(readBack[0].id, 'notice-1');
  assert.equal(readBack[0].title, 'Urgent Madaripur Sadar Update');
  assert.equal(readBack[1].is_active, false);

  // Corrupted JSON gracefully falls back to empty array
  mockStorage.setItem(SITE_NOTICES_STORAGE_KEY, '{invalid json');
  assert.deepEqual(readSiteNoticesFromStorage(mockStorage), []);
});

test('getActiveSiteNotices filters out inactive/hidden notices', () => {
  const notices: SiteNotice[] = [
    { id: '1', title: 'Active 1', content: '...', is_active: true },
    { id: '2', title: 'Hidden 1', content: '...', is_active: false },
    { id: '3', title: 'Active 2', content: '...', is_active: true },
  ];

  const active = getActiveSiteNotices(notices);
  assert.equal(active.length, 2);
  assert.equal(active[0].id, '1');
  assert.equal(active[1].id, '3');
});

test('getNoticeCategoryBadgeStyle returns distinct colored styles by category', () => {
  const urgentStyle = getNoticeCategoryBadgeStyle('Urgent');
  assert.ok(urgentStyle.bg.includes('rose'));
  assert.ok(urgentStyle.dot.includes('rose'));

  const tuitionStyle = getNoticeCategoryBadgeStyle('Tuition Notice');
  assert.ok(tuitionStyle.bg.includes('blue'));
  assert.ok(tuitionStyle.dot.includes('blue'));

  const securityStyle = getNoticeCategoryBadgeStyle('Security / Verification');
  assert.ok(securityStyle.bg.includes('amber'));
  assert.ok(securityStyle.dot.includes('amber'));

  const officialStyle = getNoticeCategoryBadgeStyle('Official Update');
  assert.ok(officialStyle.bg.includes('emerald'));
  assert.ok(officialStyle.dot.includes('emerald'));
});

test('saveSiteNoticeToSupabase, toggleSiteNoticeStatusInSupabase, deleteSiteNoticeFromSupabase sync with client and storage', async () => {
  const memoryStore: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => memoryStore[key] ?? null,
    setItem: (key: string, val: string) => {
      memoryStore[key] = val;
    },
    removeItem: (key: string) => {
      delete memoryStore[key];
    },
  };

  const dbRows: any[] = [];
  const mockSupabase = {
    from: (table: string) => {
      assert.equal(table, 'site_notices');
      return {
        select: () => ({
          order: () => Promise.resolve({ data: dbRows, error: null }),
        }),
        insert: (payload: any) => {
          const inserted = {
            id: 'mock-uuid-1',
            ...(Array.isArray(payload) ? payload[0] : payload),
            created_at: new Date().toISOString(),
          };
          dbRows.push(inserted);
          return {
            select: () => Promise.resolve({ data: [inserted], error: null }),
          };
        },
        update: (payload: any) => ({
          eq: (col: string, val: string) => {
            const row = dbRows.find((r) => r[col] === val);
            if (row) Object.assign(row, payload);
            return {
              select: () => Promise.resolve({ data: row ? [row] : [], error: null }),
            };
          },
        }),
        delete: () => ({
          eq: (col: string, val: string) => {
            const idx = dbRows.findIndex((r) => r[col] === val);
            if (idx >= 0) dbRows.splice(idx, 1);
            return Promise.resolve({ error: null });
          },
        }),
      };
    },
  };

  // 1. Create new notice
  const created = await saveSiteNoticeToSupabase(
    {
      title: 'HSC Examination Circular',
      content: 'Special guidelines for HSC teachers.',
      badge_text: 'Tuition Notice',
      is_active: true,
    },
    mockSupabase,
    mockStorage
  );

  assert.equal(created.id, 'mock-uuid-1');
  assert.equal(created.title, 'HSC Examination Circular');
  assert.equal(created.is_active, true);

  // Storage should also have the notice
  const storedAfterCreate = readSiteNoticesFromStorage(mockStorage);
  assert.equal(storedAfterCreate.length, 1);
  assert.equal(storedAfterCreate[0].title, 'HSC Examination Circular');

  // 2. Toggle status
  const afterToggle = await toggleSiteNoticeStatusInSupabase(
    'mock-uuid-1',
    false,
    mockSupabase,
    mockStorage
  );
  assert.equal(afterToggle[0].is_active, false);

  // 3. Delete notice
  const afterDelete = await deleteSiteNoticeFromSupabase(
    'mock-uuid-1',
    mockSupabase,
    mockStorage
  );
  assert.equal(afterDelete.length, 0);
  assert.equal(readSiteNoticesFromStorage(mockStorage).length, 0);
});

test('Guardian Requests System: read/write storage, submit to guardian_requests, update status, and delete', async () => {
  const memoryStore: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => memoryStore[key] ?? null,
    setItem: (key: string, val: string) => {
      memoryStore[key] = val;
    },
    removeItem: (key: string) => {
      delete memoryStore[key];
    },
  };

  // 1. Storage initially empty
  assert.deepEqual(readGuardianRequestsFromStorage(mockStorage), []);

  const dbRows: any[] = [];
  const mockSupabase = {
    from: (table: string) => {
      assert.equal(table, 'guardian_requests');
      return {
        select: () => ({
          order: () => Promise.resolve({ data: dbRows, error: null }),
        }),
        insert: (payload: any) => {
          const row = Array.isArray(payload) ? payload[0] : payload;
          const inserted = {
            id: 'gr-uuid-101',
            ...row,
            created_at: new Date().toISOString(),
          };
          dbRows.push(inserted);
          return {
            select: () => Promise.resolve({ data: [inserted], error: null }),
          };
        },
        update: (payload: any) => ({
          eq: (col: string, val: string) => {
            const r = dbRows.find((item) => item[col] === val);
            if (r) Object.assign(r, payload);
            return Promise.resolve({ error: null });
          },
        }),
        delete: () => ({
          eq: (col: string, val: string) => {
            const idx = dbRows.findIndex((item) => item[col] === val);
            if (idx >= 0) dbRows.splice(idx, 1);
            return Promise.resolve({ error: null });
          },
        }),
      };
    },
  };

  // 2. Submit Guardian Request
  const submitted = await submitGuardianRequestToSupabase(
    {
      guardianName: 'Hafizur Rahman',
      guardianPhone: '01712345678',
      studentClass: 'Class 10 (Bangla Medium)',
      subjects: 'Physics, Higher Math',
      upazilaArea: 'Madaripur Sadar',
      fullAddress: 'Lake Par, Sadar',
      offeredSalary: 6000,
      daysPerWeek: 4,
      preferredGender: 'Male',
      additionalNotes: 'Urgent hiring',
    },
    mockSupabase,
    mockStorage
  );

  assert.equal(submitted.id, 'gr-uuid-101');
  assert.equal(submitted.guardianName, 'Hafizur Rahman');
  assert.equal(submitted.studentClass, 'Class 10 (Bangla Medium)');
  assert.equal(submitted.status, 'pending');

  // Verify stored in storage
  const stored = readGuardianRequestsFromStorage(mockStorage);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].guardianName, 'Hafizur Rahman');

  // 3. Update status to 'converted'
  const afterUpdate = await updateGuardianRequestStatusInSupabase(
    'gr-uuid-101',
    'converted',
    mockSupabase,
    mockStorage
  );
  assert.equal(afterUpdate[0].status, 'converted');

  // 4. Delete request
  const afterDelete = await deleteGuardianRequestFromSupabase(
    'gr-uuid-101',
    mockSupabase,
    mockStorage
  );
  assert.equal(afterDelete.length, 0);
  assert.equal(readGuardianRequestsFromStorage(mockStorage).length, 0);
});

test('Admin Sort Controls: sortAdminPaymentRequests, sortAdminVerificationRequests, sortAdminCircularApplications, and sortAdminGuardianRequests support newest, oldest, and pending_first', () => {
  const payments: PaymentRequestRecord[] = [
    {
      id: 'PAY-1',
      requestCode: 'PAY-1',
      tutorName: 'Approved Old',
      userEmail: 'a@test.com',
      senderNumber: '01711111111',
      transactionId: 'TRX111111',
      paymentMethod: 'bKash',
      amount: 500,
      purpose: 'Tuition Media Fee',
      status: 'Approved',
      createdAt: '2026-10-01T10:00:00Z',
    },
    {
      id: 'PAY-2',
      requestCode: 'PAY-2',
      tutorName: 'Pending Mid',
      userEmail: 'b@test.com',
      senderNumber: '01722222222',
      transactionId: 'TRX222222',
      paymentMethod: 'Nagad',
      amount: 1000,
      purpose: 'Tuition Media Fee',
      status: 'Pending',
      createdAt: '2026-10-05T10:00:00Z',
    },
    {
      id: 'PAY-3',
      requestCode: 'PAY-3',
      tutorName: 'Approved New',
      userEmail: 'c@test.com',
      senderNumber: '01733333333',
      transactionId: 'TRX333333',
      paymentMethod: 'bKash',
      amount: 1200,
      purpose: 'Tuition Media Fee',
      status: 'Approved',
      createdAt: '2026-10-10T10:00:00Z',
    },
  ];

  assert.deepEqual(
    sortAdminPaymentRequests(payments, 'newest').map((p) => p.id),
    ['PAY-3', 'PAY-2', 'PAY-1']
  );
  assert.deepEqual(
    sortAdminPaymentRequests(payments, 'oldest').map((p) => p.id),
    ['PAY-1', 'PAY-2', 'PAY-3']
  );
  assert.deepEqual(
    sortAdminPaymentRequests(payments, 'pending_first').map((p) => p.id),
    ['PAY-2', 'PAY-3', 'PAY-1']
  );

  const verifications: VerificationRequest[] = [
    {
      ...TEST_REQUESTS[0],
      id: 'VER-OLD-APPROVED',
      status: 'Approved',
      submittedAt: '10 Oct 2026',
    },
    {
      ...TEST_REQUESTS[1],
      id: 'VER-MID-PENDING',
      status: 'Pending',
      submittedAt: '12 Oct 2026',
    },
    {
      ...TEST_REQUESTS[0],
      id: 'VER-NEW-REJECTED',
      status: 'Rejected',
      submittedAt: '15 Oct 2026',
    },
  ];

  assert.deepEqual(
    sortAdminVerificationRequests(verifications, 'newest').map((v) => v.id),
    ['VER-NEW-REJECTED', 'VER-MID-PENDING', 'VER-OLD-APPROVED']
  );
  assert.deepEqual(
    sortAdminVerificationRequests(verifications, 'oldest').map((v) => v.id),
    ['VER-OLD-APPROVED', 'VER-MID-PENDING', 'VER-NEW-REJECTED']
  );
  assert.deepEqual(
    sortAdminVerificationRequests(verifications, 'pending_first').map(
      (v) => v.id
    ),
    ['VER-MID-PENDING', 'VER-NEW-REJECTED', 'VER-OLD-APPROVED']
  );

  const apps: CircularApplicationRow[] = [
    {
      id: 'APP-1',
      circular_id: 'CIR-1',
      tutor_id: 'T-1',
      tutor_name: 'Tutor 1',
      tutor_phone: '01711000001',
      institution_qualification: 'DU',
      experience_note: '2 years',
      status: 'Confirmed',
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'APP-2',
      circular_id: 'CIR-2',
      tutor_id: 'T-2',
      tutor_name: 'Tutor 2',
      tutor_phone: '01711000002',
      institution_qualification: 'BUET',
      experience_note: '3 years',
      status: 'Pending',
      created_at: '2026-10-03T00:00:00Z',
    },
  ];

  assert.deepEqual(
    sortAdminCircularApplications(apps, 'pending_first').map((a) => a.id),
    ['APP-2', 'APP-1']
  );
  assert.deepEqual(
    sortAdminCircularApplications(apps, 'oldest').map((a) => a.id),
    ['APP-1', 'APP-2']
  );

  const guardians: GuardianRequestRecord[] = [
    {
      id: 'GR-1',
      guardianName: 'G1',
      guardianPhone: '01700000001',
      studentClass: 'Class 8',
      subjects: 'Math',
      upazilaArea: 'Sadar',
      fullAddress: 'Lake Par',
      offeredSalary: 4000,
      daysPerWeek: 4,
      preferredGender: 'Any',
      status: 'converted',
      createdAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'GR-2',
      guardianName: 'G2',
      guardianPhone: '01700000002',
      studentClass: 'Class 10',
      subjects: 'Physics',
      upazilaArea: 'Shibchar',
      fullAddress: '71 Road',
      offeredSalary: 6000,
      daysPerWeek: 4,
      preferredGender: 'Male',
      status: 'pending',
      createdAt: '2026-10-04T00:00:00Z',
    },
  ];

  assert.deepEqual(
    sortAdminGuardianRequests(guardians, 'pending_first').map((g) => g.id),
    ['GR-2', 'GR-1']
  );
  assert.deepEqual(
    sortAdminGuardianRequests(guardians, 'oldest').map((g) => g.id),
    ['GR-1', 'GR-2']
  );
});

test('Direct Confirm vs Confirm & Set Fee workflows and transitions', () => {
  const sampleJob: TuitionJob = {
    id: 'MDP-3100',
    titleEn: 'Need HSC Physics Tutor in Madaripur Sadar',
    titleBn: 'Need HSC Physics Tutor in Madaripur Sadar',
    studentClassEn: 'HSC 1st Year',
    studentClassBn: 'HSC 1st Year',
    upazila: 'Madaripur Sadar',
    landmarkEn: 'Lake Par',
    landmarkBn: 'Lake Par',
    medium: 'Bangla Medium',
    mode: 'Home',
    subjectsEn: ['Physics'],
    subjectsBn: ['Physics'],
    daysPerWeek: 4,
    salaryBdt: 5000,
    preferredGender: 'Any',
    preferredInstitutionEn: 'Verified Madaripur Tutor',
    preferredInstitutionBn: 'যাচাইকৃত মাদারীপুর টিউটর',
    postedAgoEn: 'Just now',
    postedAgoBn: 'এইমাত্র',
    guardianName: 'Verified Guardian',
    contactPhone: '01711000000',
    status: 'Active',
    applicantsCount: 1,
  };
  const initialApp: CircularApplicationRow = {
    id: 'APP-WORKFLOW-1',
    circular_id: sampleJob.id,
    tutor_id: 'TUT-900',
    tutor_name: 'Dr. Abir',
    tutor_phone: '01711223344',
    institution_qualification: 'DMC · MBBS',
    experience_note: '4 years SSC/HSC Physics experience',
    status: 'Pending',
  };

  // 1. Direct Confirmation ("✅ Confirm Tutor") -> status: 'confirmed'
  const directConfirmed = confirmTutorForCircularState(
    [sampleJob],
    [initialApp],
    sampleJob.id,
    initialApp,
    { status: 'confirmed' }
  );

  assert.equal(directConfirmed.applications[0].status, 'confirmed');
  assert.equal(directConfirmed.applications[0].media_fee, 0);
  assert.equal(
    getUserCircularApplicationStatusBadge(
      directConfirmed.applications[0].status,
      'en'
    ).label,
    '✅ Confirmed for Tuition'
  );

  // 2. Transition from 'confirmed' to 'verified_for_tuition' ("💳 Set / Edit Fee")
  const feeVerified = confirmTutorForCircularState(
    directConfirmed.jobs,
    directConfirmed.applications,
    sampleJob.id,
    directConfirmed.applications[0],
    {
      status: 'verified_for_tuition',
      mediaFee: 1500,
      guardianPhone: '01799887766',
      guardianAddress: 'College Road, Madaripur Sadar',
      adminNote: 'Pay media fee within 24 hours via bKash to unlock contact.',
    }
  );

  const verifiedApp = feeVerified.applications[0];
  assert.equal(verifiedApp.status, 'verified_for_tuition');
  assert.equal(extractMediaFeeFromApplication(verifiedApp), 1500);
  assert.equal(
    extractAdminNoteFromApplication(verifiedApp),
    'Pay media fee within 24 hours via bKash to unlock contact.'
  );
  assert.equal(
    getCleanApplicantExperienceNote(verifiedApp),
    '4 years SSC/HSC Physics experience'
  );
  assert.equal(
    getUserCircularApplicationStatusBadge(verifiedApp.status, 'en', 1500).label,
    '💳 Verified (Media Fee Required: ৳1500)'
  );

  // 3. Transition back from 'verified_for_tuition' to 'confirmed' ("✅ Mark as Directly Confirmed")
  const markedDirectAgain = confirmTutorForCircularState(
    feeVerified.jobs,
    feeVerified.applications,
    sampleJob.id,
    verifiedApp,
    { status: 'confirmed' }
  );

  assert.equal(markedDirectAgain.applications[0].status, 'confirmed');
  assert.equal(markedDirectAgain.applications[0].media_fee, 0);
  assert.ok(
    !markedDirectAgain.applications[0].experience_note.includes('[Media Fee:')
  );
  assert.equal(
    formatApplicationNoteWithMetadata('Base note [Media Fee: ৳1000]', {
      isDirectConfirmed: false,
      mediaFee: 1200,
      adminNote: 'Call before 8 PM',
    }),
    'Base note [Admin Note: Call before 8 PM] [Media Fee: ৳1200]'
  );
});

test('1-Application-Per-Circular Limit, Rejection Notes, Unblock Tutor & Account Restriction State', () => {
  assert.deepEqual(ADMIN_REJECTION_QUICK_REASONS, [
    'NID/Student ID Unclear',
    'Subject/Class Mismatch',
    'Location Too Far',
    'Incomplete Profile',
  ]);

  const sampleJob = {
    id: 'MDP-2088',
    titleEn: 'HSC Math Tutor Needed',
    titleBn: 'এইচএসসি গণিত টিউটর প্রয়োজন',
    studentClassEn: 'Class 11-12',
    studentClassBn: 'একাদশ-দ্বাদশ শ্রেণি',
    upazila: 'Madaripur Sadar' as const,
    landmarkEn: 'College Road',
    landmarkBn: 'কলেজ রোড',
    medium: 'Bangla Medium' as const,
    mode: 'Home' as const,
    subjectsEn: ['Higher Math'],
    subjectsBn: ['উচ্চতর গণিত'],
    daysPerWeek: 3,
    salaryBdt: 5000,
    preferredGender: 'Any' as const,
    preferredInstitutionEn: 'Any',
    preferredInstitutionBn: 'যেকোনো',
    postedAgoEn: 'Just now',
    postedAgoBn: 'এইমাত্র',
    guardianName: 'Guardian',
    contactPhone: '01711223344',
    applicantsCount: 1,
    status: 'Active',
  };

  const tutorProfile: VerificationRequest = {
    id: 'VER-2026-991',
    tutorId: 'tutor-ver-VER-2026-991',
    userEmail: 'rafiq@example.com',
    tutorNameEn: 'Rafiq Hasan',
    tutorNameBn: 'রফিক হাসান',
    gender: 'Male',
    upazila: 'Madaripur Sadar',
    phone: '01755667788',
    nidNumber: '1999123456789',
    nidDocumentName: 'nid.jpg',
    collegeTag: 'Govt. Nazimuddin College',
    institutionFullEn: 'Govt. Nazimuddin College',
    departmentEn: 'Mathematics',
    studentRegId: 'REG-991',
    academicSession: '2023-24',
    uniDocumentName: 'id.jpg',
    subjectsEn: ['Higher Math'],
    monthlyFee: 5000,
    submittedAt: 'Just now',
    status: 'Pending',
  };

  const pendingApp = buildCircularApplicationRow(sampleJob.id, {
    tutorId: 'VER-2026-991',
    tutorName: 'Rafiq Hasan',
    tutorPhone: '01755667788',
    qualification: 'Govt. Nazimuddin College · Mathematics',
    experienceNote: '3 years teaching HSC Math',
    userEmail: 'rafiq@example.com',
  });

  // Duplicate apply check by email (case-insensitive), user_id, tutor ID, or phone
  assert.equal(
    DUPLICATE_CIRCULAR_APPLICATION_MESSAGE,
    'You have already applied to this tuition circular. You can apply once per circular.'
  );
  assert.ok(
    hasTutorAlreadyAppliedToCircular(
      [pendingApp],
      sampleJob.id,
      {
        id: 'u1',
        fullName: 'Rafiq Hasan',
        email: 'RAFIQ@EXAMPLE.COM',
        provider: 'email',
        createdAt: 'Now',
      },
      tutorProfile
    )
  );
  assert.ok(
    hasTutorAlreadyAppliedToCircular([pendingApp], sampleJob.id, null, null, {
      tutorPhone: '01755667788',
    })
  );
  // Same user CAN apply to a DIFFERENT circular (1 application per circular)
  assert.equal(
    hasTutorAlreadyAppliedToCircular(
      [pendingApp],
      'MDP-2499-OTHER',
      {
        id: 'u1',
        fullName: 'Rafiq Hasan',
        email: 'rafiq@example.com',
        provider: 'email',
        createdAt: 'Now',
      },
      tutorProfile
    ),
    undefined
  );

  // Circular Apply button states
  assert.deepEqual(getCircularCardApplyButtonState(null, { lang: 'en' }), {
    state: 'can_apply',
    label: '🚀 Apply Now',
    interactive: true,
  });
  assert.deepEqual(
    getCircularCardApplyButtonState(null, {
      isTutorRestricted: true,
      lang: 'en',
    }),
    {
      state: 'restricted',
      label: '🔒 Account Restricted',
      interactive: false,
    }
  );
  assert.deepEqual(
    getCircularCardApplyButtonState(pendingApp, { lang: 'en' }),
    {
      state: 'pending',
      label: 'Already Applied ✓',
      interactive: false,
    }
  );

  const confirmedState = confirmTutorForCircularState(
    [sampleJob],
    [pendingApp],
    sampleJob.id,
    pendingApp,
    { status: 'confirmed' }
  );
  assert.deepEqual(
    getCircularCardApplyButtonState(confirmedState.applications[0], {
      lang: 'en',
    }),
    {
      state: 'confirmed',
      label: '✅ Selected for Tuition',
      interactive: false,
    }
  );

  const mediaFeeState = confirmTutorForCircularState(
    [sampleJob],
    [pendingApp],
    sampleJob.id,
    pendingApp,
    { status: 'verified_for_tuition', mediaFee: 1000 }
  );
  assert.deepEqual(
    getCircularCardApplyButtonState(mediaFeeState.applications[0], {
      lang: 'en',
    }),
    {
      state: 'media_fee',
      label: '💳 Verified · Pay Media Fee',
      interactive: true,
    }
  );

  // Reject applicant with custom rejection note
  const rejectedState = rejectTutorForCircularState(
    [sampleJob],
    [pendingApp],
    sampleJob.id,
    pendingApp,
    'Subject/Class Mismatch'
  );
  const rejectedApp = rejectedState.applications[0];
  assert.equal(rejectedApp.status, 'Rejected');
  assert.equal(rejectedApp.is_rejected, true);
  assert.equal(
    extractAdminNoteFromApplication(rejectedApp),
    'Subject/Class Mismatch'
  );
  assert.deepEqual(
    getCircularCardApplyButtonState(rejectedApp, { lang: 'en' }),
    {
      state: 'rejected',
      label: '🚫 Not Selected',
      interactive: false,
    }
  );

  // Unblock / Lift restriction for circular applicant
  const unblockedState = unblockTutorForCircularState(
    rejectedState.jobs,
    rejectedState.applications,
    sampleJob.id,
    rejectedApp
  );
  assert.equal(unblockedState.applications[0].status, 'Pending');
  assert.equal(unblockedState.applications[0].is_rejected, false);
  assert.equal(
    extractAdminNoteFromApplication(unblockedState.applications[0]),
    ''
  );

  // Account restriction details for rejected profile
  const decisionRejected = processVerificationDecision(
    [],
    [tutorProfile],
    tutorProfile.id,
    'Rejected',
    'NID/Student ID Unclear'
  );
  const rejectedProfile = decisionRejected.requests[0];
  assert.equal(isTutorAccountRestricted(rejectedProfile), true);
  const restrictionDetails = getTutorAccountRestrictionDetails(
    rejectedProfile,
    [rejectedApp]
  );
  assert.equal(restrictionDetails.isRestricted, true);
  assert.equal(
    restrictionDetails.badgeText,
    'Action Required / Application Restricted'
  );
  assert.equal(restrictionDetails.adminNote, 'NID/Student ID Unclear');

  // Unblock profile via Pending decision
  const decisionUnblocked = processVerificationDecision(
    decisionRejected.tutors,
    decisionRejected.requests,
    tutorProfile.id,
    'Pending',
    ''
  );
  assert.equal(
    isTutorAccountRestricted(decisionUnblocked.requests[0]),
    false
  );
});

test('Official Drabir Mandal Branding & Watermark Constants are strictly enforced', async () => {
  const engine = await import('./tutorEngine');
  assert.equal(engine.OFFICIAL_DEVELOPER_NAME, 'Drabir Mandal');
  assert.equal(engine.OFFICIAL_ISSUER_WATERMARK, 'Tutor Zone · Drabir Mandal');
  assert.equal(engine.OFFICIAL_CRAFTED_BY_BADGE, '⚡ Crafted by Drabir Mandal');
  assert.equal(
    engine.OFFICIAL_COPYRIGHT_NOTICE,
    '© 2026 Tutor Zone · Developed & Maintained by Drabir Mandal. All Rights Reserved.'
  );
});

test('Guardian Tuition Requests: extended fields encoding, extraction, and full-detail update', async () => {
  const engine = await import('./tutorEngine');
  const encoded = engine.encodeGuardianExtendedNotes({
    mediumVersion: 'English Version',
    schoolCollegeName: 'Donovan Govt. Girls High School',
    numberOfStudents: 2,
    preferredTimeDuration: 'Evening (6:00 PM - 7:30 PM)',
    preferredUniversity: 'BUET / DU Experienced',
    specialRequirements: 'Must be punctual and provide weekly tests.',
  });

  const decoded = engine.decodeGuardianExtendedNotes(encoded);
  assert.equal(decoded.mediumVersion, 'English Version');
  assert.equal(
    decoded.schoolCollegeName,
    'Donovan Govt. Girls High School'
  );
  assert.equal(decoded.numberOfStudents, 2);
  assert.equal(
    decoded.preferredTimeDuration,
    'Evening (6:00 PM - 7:30 PM)'
  );
  assert.equal(decoded.preferredUniversity, 'BUET / DU Experienced');
  assert.equal(
    decoded.specialRequirements,
    'Must be punctual and provide weekly tests.'
  );

  const detailed = engine.extractDetailedGuardianRequestFields({
    id: 'GR-9901',
    guardianName: 'Advocate Mahbubur Rahman',
    guardianPhone: '01711223344',
    studentClass: 'Class 9 (Science)',
    subjects: 'Physics, Chemistry, Higher Math',
    preferredGender: 'Male',
    daysPerWeek: 4,
    offeredSalary: 5500,
    upazilaArea: 'Madaripur Sadar',
    fullAddress: 'House 12, Road 3, New Town, Madaripur Sadar',
    specialRequirements: encoded || undefined,
    status: 'pending',
    createdAt: '2026-03-31T10:00:00.000Z',
  });

  assert.equal(detailed.mediumVersion, 'English Version');
  assert.equal(
    detailed.schoolCollegeName,
    'Donovan Govt. Girls High School'
  );
  assert.equal(detailed.numberOfStudents, 2);
  assert.equal(
    detailed.preferredTimeDuration,
    'Evening (6:00 PM - 7:30 PM)'
  );
  assert.equal(detailed.preferredUniversity, 'BUET / DU Experienced');
  assert.equal(
    detailed.specialRequirements,
    'Must be punctual and provide weekly tests.'
  );
  assert.equal(
    detailed.fullAddress,
    'House 12, Road 3, New Town, Madaripur Sadar'
  );
});

test('Supabase Egress Optimization: 400px/800px @ 0.65 JPEG image compression, public summary columns excluding document scans, and 2-minute sessionStorage caching', async () => {
  const {
    PROFILE_PHOTO_MAX_DIMENSION,
    ID_SCAN_MAX_DIMENSION,
    DEFAULT_IMAGE_MAX_DIMENSION,
    DEFAULT_IMAGE_COMPRESSION_QUALITY,
    calculateCompressedDimensions,
    compressImageFile,
  } = await import('./supabaseProfileUpload');
  const {
    PUBLIC_TUTOR_SUMMARY_COLUMNS,
    PUBLIC_TUTOR_VERIFICATION_SELECT_COLUMNS,
    ADMIN_VERIFICATION_DOCUMENT_COLUMNS,
    LIVE_SESSION_CACHE_TTL_MS,
    isLiveSessionCacheFresh,
    mergeVerificationDocumentScans,
    readLiveSessionCacheFromStorage,
    writeLiveSessionCacheToStorage,
  } = await import('./tutorEngine');

  assert.equal(PROFILE_PHOTO_MAX_DIMENSION, 400);
  assert.equal(ID_SCAN_MAX_DIMENSION, 800);
  assert.equal(DEFAULT_IMAGE_MAX_DIMENSION, 800);
  assert.equal(DEFAULT_IMAGE_COMPRESSION_QUALITY, 0.65);

  // Profile photo compression (4000x3000 -> 400x300 at maxDimension=400)
  assert.deepEqual(calculateCompressedDimensions(4000, 3000, 400), {
    width: 400,
    height: 300,
  });

  // Landscape camera scan (4000x3000 -> 800x600 by default 800px)
  assert.deepEqual(calculateCompressedDimensions(4000, 3000), {
    width: 800,
    height: 600,
  });

  // Portrait phone scan (1500x3000 -> 400x800 by default 800px)
  assert.deepEqual(calculateCompressedDimensions(1500, 3000), {
    width: 400,
    height: 800,
  });

  // Already within 800px (500x400 -> 500x400)
  assert.deepEqual(calculateCompressedDimensions(500, 400), {
    width: 500,
    height: 400,
  });

  // Verify compressImageFile works cleanly with a File object at 400px / 800px and 0.65 quality
  const sampleBytes = new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70]);
  const sampleFile = new File([sampleBytes], 'nid_camera_scan.jpg', {
    type: 'image/jpeg',
  });
  const result = await compressImageFile(sampleFile, 800, 0.65);
  assert.equal(result.file.name, 'nid_camera_scan.jpg');
  assert.equal(result.dataUrl.startsWith('data:image/jpeg;base64,'), true);

  // Public summary and select columns must include summary fields and MUST NOT include nid_scan_url or student_id_scan_url
  assert.equal(
    PUBLIC_TUTOR_SUMMARY_COLUMNS,
    'id,full_name,upazila,institution,teaching_subjects,expected_fee,profile_photo_url,status,gender,medium,experience'
  );
  assert.equal(PUBLIC_TUTOR_SUMMARY_COLUMNS.includes('nid_scan_url'), false);
  assert.equal(PUBLIC_TUTOR_SUMMARY_COLUMNS.includes('student_id_scan_url'), false);
  assert.equal(
    PUBLIC_TUTOR_VERIFICATION_SELECT_COLUMNS.includes('nid_scan_url'),
    false
  );
  assert.equal(
    PUBLIC_TUTOR_VERIFICATION_SELECT_COLUMNS.includes('student_id_scan_url'),
    false
  );
  assert.equal(
    ADMIN_VERIFICATION_DOCUMENT_COLUMNS.includes('nid_scan_url'),
    true
  );
  assert.equal(
    ADMIN_VERIFICATION_DOCUMENT_COLUMNS.includes('student_id_scan_url'),
    true
  );

  // Lazy-loading merges NID & Student ID scans into VerificationRequest records
  const merged = mergeVerificationDocumentScans(
    [
      {
        ...TEST_REQUESTS[0],
        id: 'VER-2026-101',
        nidScanDataUrl: undefined,
        uniScanDataUrl: undefined,
      },
    ],
    [
      {
        verification_code: 'VER-2026-101',
        nid_scan_url: 'data:image/jpeg;base64,LAZY_NID',
        student_id_scan_url: 'data:image/jpeg;base64,LAZY_UNI',
      },
    ]
  );
  assert.equal(merged[0].nidScanDataUrl, 'data:image/jpeg;base64,LAZY_NID');
  assert.equal(merged[0].uniScanDataUrl, 'data:image/jpeg;base64,LAZY_UNI');

  // Session cache strips heavy Base64 scans while preserving jobs, applications, verifications, and tutors with 2-minute TTL
  assert.equal(LIVE_SESSION_CACHE_TTL_MS, 120000);
  const mockStore = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => mockStore.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mockStore.set(k, v);
    },
    removeItem: (k: string) => {
      mockStore.delete(k);
    },
  };
  const freshTs = Date.now() - 30_000; // 30 seconds ago (fresh within 2 minutes)
  writeLiveSessionCacheToStorage(
    {
      jobs: TEST_JOBS,
      applications: [],
      verifications: merged,
      tutors: TEST_TUTORS,
      updatedAt: freshTs,
    },
    mockStorage
  );
  const cached = readLiveSessionCacheFromStorage(mockStorage);
  assert.ok(cached);
  assert.equal(cached.jobs?.length, TEST_JOBS.length);
  assert.equal(cached.tutors?.length, TEST_TUTORS.length);
  assert.equal(cached.verifications?.[0]?.id, 'VER-2026-101');
  assert.equal(cached.verifications?.[0]?.nidScanDataUrl, undefined);
  assert.equal(cached.verifications?.[0]?.uniScanDataUrl, undefined);
  assert.equal(isLiveSessionCacheFresh(cached), true);
  assert.equal(
    isLiveSessionCacheFresh({ ...cached, updatedAt: Date.now() - 125_000 }),
    false
  );
});

test('Supabase Client Hardcoded Credentials & Direct Tuition Circulars Sync: verifies primary credentials and schema-safe circular insert/mapping', async () => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('../supabaseClient');
  assert.equal(SUPABASE_URL, 'https://lqlumszqxnzmowfpioxf.supabase.co');
  assert.equal(
    SUPABASE_ANON_KEY,
    'sb_publishable_OWl0EbdYM5n2HUzWElzilg_NpfxQkO0'
  );

  const {
    buildLiveSupabaseCircularInsertPayload,
    insertTuitionCircularToSupabase,
    mapCircularRowToTuitionJob,
  } = await import('./tutorEngine');

  const sampleJob: TuitionJob = {
    id: 'MDP-4050',
    titleEn: 'Need Verified Class 10 Science Tutor in Madaripur Sadar',
    titleBn: 'Need Verified Class 10 Science Tutor in Madaripur Sadar',
    studentClassEn: 'Class 10',
    studentClassBn: 'Class 10',
    upazila: 'Madaripur Sadar',
    landmarkEn: 'College Road, Madaripur Sadar',
    landmarkBn: 'College Road, Madaripur Sadar',
    medium: 'Bangla Medium',
    mode: 'Home',
    subjectsEn: ['Physics', 'Chemistry', 'Higher Math'],
    subjectsBn: ['Physics', 'Chemistry', 'Higher Math'],
    daysPerWeek: 4,
    salaryBdt: 5500,
    numStudents: 2,
    preferredGender: 'Any',
    preferredInstitutionEn: 'Verified Madaripur Tutor',
    preferredInstitutionBn: 'যাচাইকৃত মাদারীপুর টিউটর',
    postedAgoEn: 'Just now',
    postedAgoBn: 'এইমাত্র',
    guardianName: 'Rahim Hosen',
    contactPhone: '01308937770',
    status: 'Active',
    applicantsCount: 0,
    urgent: true,
    hiddenFromAdmin: false,
  };

  const livePayload = buildLiveSupabaseCircularInsertPayload(sampleJob);
  assert.equal(livePayload.id, 'MDP-4050');
  assert.equal(livePayload.status, 'Active');
  assert.equal(livePayload.raw_data.status, 'Active');
  assert.equal(livePayload.raw_data.hidden_from_admin, false);
  assert.equal(livePayload.guardian_phone, '01308937770');

  const mappedFromLiveRow = mapCircularRowToTuitionJob(livePayload as any);
  assert.equal(mappedFromLiveRow.id, 'MDP-4050');
  assert.equal(mappedFromLiveRow.status, 'Active');
  assert.equal(mappedFromLiveRow.hiddenFromAdmin, false);
  assert.equal(mappedFromLiveRow.salaryBdt, 5500);
  assert.equal(mappedFromLiveRow.daysPerWeek, 4);
  assert.equal(mappedFromLiveRow.numStudents, 2);
  assert.equal(mappedFromLiveRow.contactPhone, '01308937770');
  assert.deepEqual(mappedFromLiveRow.subjectsEn, [
    'Physics',
    'Chemistry',
    'Higher Math',
  ]);

  const insertedPayloads: any[] = [];
  const mockSupabaseLive = {
    from: (table: string) => {
      assert.equal(table, 'tuition_circulars');
      return {
        insert: async (rows: any[]) => {
          insertedPayloads.push(rows[0]);
          return { data: rows, error: null };
        },
      };
    },
  };

  const insertRes = await insertTuitionCircularToSupabase(
    mockSupabaseLive,
    sampleJob
  );
  assert.equal(insertRes.ok, true);
  assert.equal(insertRes.error, null);
  assert.equal(insertedPayloads.length, 1);
  assert.equal(insertedPayloads[0].id, 'MDP-4050');
  assert.equal(insertedPayloads[0].status, 'Active');
  assert.equal(insertedPayloads[0].raw_data.hidden_from_admin, false);
});

// ============================================================================
// 43. STRICT JPG-ONLY NID & STUDENT ID SCAN VALIDATION + SIGNUP FLOW GUARD
// ============================================================================
test('validateNidOrStudentIdJpgFile strictly accepts JPG/JPEG and rejects PNG/PDF, while keeping Passport Photo JPG/PNG', () => {
  assert.equal(validateNidOrStudentIdJpgFile('smart_nid.jpg', 'image/jpeg').valid, true);
  assert.equal(validateNidOrStudentIdJpgFile('student_id.jpeg', 'image/jpeg').valid, true);
  assert.equal(validateNidOrStudentIdJpgFile('SCAN.JPG', 'image/jpg').valid, true);

  const pngRes = validateNidOrStudentIdJpgFile('nid_scan.png', 'image/png');
  assert.equal(pngRes.valid, false);
  assert.equal(pngRes.error, NID_STUDENT_ID_JPG_ONLY_ERROR);

  const pdfRes = validateNidOrStudentIdJpgFile('student_id.pdf', 'application/pdf');
  assert.equal(pdfRes.valid, false);
  assert.equal(pdfRes.error, NID_STUDENT_ID_JPG_ONLY_ERROR);

  // Passport photo continues to accept both JPG and PNG
  assert.equal(validateProfilePhotoFile('passport.png', 'image/png').valid, true);
  assert.equal(validateProfilePhotoFile('passport.jpg', 'image/jpeg').valid, true);

  // Sign-up flow in-progress guard
  assert.equal(isSignUpFlowInProgress(), false);
  markSignUpFlowInProgress(true);
  assert.equal(isSignUpFlowInProgress(), true);
  markSignUpFlowInProgress(false);
  assert.equal(isSignUpFlowInProgress(), false);
});

// ============================================================================
// 44. HOMEPAGE & LIVE STATS CMS (AUTO vs MANUAL MODE + SINGLE-ROW CACHING)
// ============================================================================
test('resolveHomepageLiveStats and saveSiteSocialSettingsToSupabase support Auto and Manual Counter Mode and Hero CMS texts', async () => {
  // 1. Automatic mode uses live loaded counts
  const autoStats = resolveHomepageLiveStats(
    {
      ...DEFAULT_SITE_SOCIAL_SETTINGS,
      stats_mode: 'auto',
    },
    {
      verifiedTutorsCount: 18,
      onlineTutorsCount: 7,
      activeCircularsCount: 12,
    },
    'en'
  );
  assert.equal(autoStats.statsMode, 'auto');
  assert.equal(autoStats.verifiedTutorsDisplay, '18+');
  assert.equal(autoStats.onlineTutorsDisplay, '7+');
  assert.equal(autoStats.activeCircularsDisplay, '12');
  assert.equal(autoStats.trustCard3Value, '100%');
  assert.equal(autoStats.trustCard3Label, '100% Smart NID Verified');
  assert.equal(autoStats.trustCard4Value, '< 24h');
  assert.equal(autoStats.trustCard4Label, 'Fast Guardian Matching');
  assert.equal(autoStats.heroTitle, 'Verified home & online tutors');

  // 2. Manual mode uses custom Admin strings and custom Hero/Card texts
  const manualStats = resolveHomepageLiveStats(
    {
      ...DEFAULT_SITE_SOCIAL_SETTINGS,
      stats_mode: 'manual',
      manual_verified_tutors: '120+',
      manual_online_tutors: '45+',
      manual_active_circulars: '30+',
      trust_card_3_value: '100%',
      trust_card_3_label: '100% Smart NID Verified',
      trust_card_4_value: '< 12h',
      trust_card_4_label: 'Express Guardian Matching',
      hero_top_badge_1: 'Madaripur No.1 Academic Hub',
      hero_top_badge_2: '100% NID & ID Verified',
      hero_title: 'Top Verified Home & Online Tutors in Madaripur',
      guardian_card_title: 'Hire a Verified Home/Online Tutor',
      guardian_card_badge: '100% Free Trial Class',
      tutor_card_title: 'Apply for Verified Tuitions',
      tutor_card_desc: 'Browse active guardian circulars and apply in 1 tap.',
    },
    {
      verifiedTutorsCount: 18,
      onlineTutorsCount: 7,
      activeCircularsCount: 12,
    },
    'en'
  );
  assert.equal(manualStats.statsMode, 'manual');
  assert.equal(manualStats.verifiedTutorsDisplay, '120+');
  assert.equal(manualStats.onlineTutorsDisplay, '45+');
  assert.equal(manualStats.activeCircularsDisplay, '30+');
  assert.equal(manualStats.trustCard4Value, '< 12h');
  assert.equal(manualStats.trustCard4Label, 'Express Guardian Matching');
  assert.equal(manualStats.heroTopBadge1, 'Madaripur No.1 Academic Hub');
  assert.equal(
    manualStats.heroTitle,
    'Top Verified Home & Online Tutors in Madaripur'
  );
  assert.equal(
    manualStats.guardianCardTitle,
    'Hire a Verified Home/Online Tutor'
  );
  assert.equal(manualStats.guardianCardBadge, '100% Free Trial Class');
  assert.equal(manualStats.tutorCardTitle, 'Apply for Verified Tuitions');

  // 3. Saving Homepage & Stats CMS fields returns HOMEPAGE_STATS_UPDATED_TOAST and caches in storage
  const saveRes = await saveSiteSocialSettingsToSupabase(null, {
    stats_mode: 'manual',
    manual_verified_tutors: '150+',
    manual_online_tutors: '60+',
    manual_active_circulars: '35+',
    hero_title: 'Verified home & online tutors',
  });
  assert.equal(saveRes.message, HOMEPAGE_STATS_UPDATED_TOAST);
  assert.equal(saveRes.settings.stats_mode, 'manual');
  assert.equal(saveRes.settings.manual_verified_tutors, '150+');
  assert.equal(saveRes.settings.manual_online_tutors, '60+');
  assert.equal(saveRes.settings.manual_active_circulars, '35+');
});

// ============================================================================
// 45. COMPLETE RANKED MADARIPUR COLLEGES (23 OPTIONS) & AUTO-FILL CONVENIENCE
// ============================================================================
test('MADARIPUR_INSTITUTION_CATEGORIES has all 23 ranked institutions and resolveAutoFilledInstitutionName auto-fills specific Madaripur colleges while preserving custom input', () => {
  assert.equal(MADARIPUR_INSTITUTION_CATEGORIES.length, 23);
  assert.equal(SPECIFIC_MADARIPUR_COLLEGES.length, 19);

  // Verify exact priority ranking order
  assert.equal(
    MADARIPUR_INSTITUTION_CATEGORIES[0],
    'Madaripur Govt. College (Govt. Nazimuddin College)'
  );
  assert.equal(
    MADARIPUR_INSTITUTION_CATEGORIES[1],
    'Govt. Sufia Mohila College, Madaripur'
  );
  assert.equal(
    MADARIPUR_INSTITUTION_CATEGORIES[2],
    'Govt. Barhamganj College, Shibchar'
  );
  assert.equal(
    MADARIPUR_INSTITUTION_CATEGORIES[3],
    'Kalkini Syed Abul Hossain College (Govt.)'
  );
  assert.equal(
    MADARIPUR_INSTITUTION_CATEGORIES[4],
    "Govt. Sheikh Hasina Academy & Women's College, Dasar"
  );
  assert.equal(
    MADARIPUR_INSTITUTION_CATEGORIES[18],
    'Madaripur Technical School & College (TSC)'
  );
  assert.equal(
    MADARIPUR_INSTITUTION_CATEGORIES[19],
    'Public University (DU / BUET / JU / RU / JNU)'
  );
  assert.equal(MADARIPUR_INSTITUTION_CATEGORIES[20], 'Medical College');
  assert.equal(
    MADARIPUR_INSTITUTION_CATEGORIES[21],
    'National University (NU) Affiliated College'
  );
  assert.equal(
    MADARIPUR_INSTITUTION_CATEGORIES[22],
    'Private University / Other Institution'
  );

  // 1. Selecting a specific Madaripur college when Full Name is empty auto-fills it
  assert.equal(
    resolveAutoFilledInstitutionName(
      'Govt. Sufia Mohila College, Madaripur',
      '',
      'Madaripur Govt. College (Govt. Nazimuddin College)'
    ),
    'Govt. Sufia Mohila College, Madaripur'
  );

  // 2. Selecting another specific Madaripur college when Full Name holds a default value replaces it
  assert.equal(
    resolveAutoFilledInstitutionName(
      'Govt. Barhamganj College, Shibchar',
      'Govt. Sufia Mohila College, Madaripur',
      'Govt. Sufia Mohila College, Madaripur'
    ),
    'Govt. Barhamganj College, Shibchar'
  );

  // 3. If the user customized Full University / College Name, selecting a category preserves custom text
  assert.equal(
    resolveAutoFilledInstitutionName(
      'Kalkini Syed Abul Hossain College (Govt.)',
      'University of Dhaka - Department of Physics',
      'Public University (DU / BUET / JU / RU / JNU)'
    ),
    'University of Dhaka - Department of Physics'
  );

  // 4. General university category identification
  assert.equal(
    isSpecificMadaripurCollege('Govt. Barhamganj College, Shibchar'),
    true
  );
  assert.equal(
    isSpecificMadaripurCollege('Public University (DU / BUET / JU / RU / JNU)'),
    false
  );
});

// ============================================================================
// 46. AUTOMATIC VS MANUAL COUNTER CONTROL FOR CIRCULARS, APPLICATIONS & DASHBOARD
// ============================================================================
test('Automatic vs Manual Counter Control: resolveHomepageLiveStats supports totalApplicationsDisplay and saveSiteSocialSettingsToSupabase round-trips counters via Supabase site_settings', async () => {
  // 1. Automatic (Live DB Count) resolves real circulars & total applications counts
  const autoCounts = resolveHomepageLiveStats(
    {
      ...DEFAULT_SITE_SOCIAL_SETTINGS,
      stats_mode: 'auto',
      manual_active_circulars: '30+',
      manual_total_applications: '140+',
    },
    {
      verifiedTutorsCount: 24,
      onlineTutorsCount: 11,
      activeCircularsCount: 8,
      totalApplicationsCount: 19,
    },
    'en'
  );
  assert.equal(autoCounts.statsMode, 'auto');
  assert.equal(autoCounts.activeCircularsDisplay, '8');
  assert.equal(autoCounts.totalApplicationsDisplay, '19');
  assert.equal(autoCounts.verifiedTutorsDisplay, '24+');
  assert.equal(autoCounts.onlineTutorsDisplay, '11+');

  // 2. Manual (Custom Digits) replaces Circulars, Total Applications, Verified & Online Tutors counts
  const manualCounts = resolveHomepageLiveStats(
    {
      ...DEFAULT_SITE_SOCIAL_SETTINGS,
      stats_mode: 'manual',
      manual_verified_tutors: '180+',
      manual_online_tutors: '65+',
      manual_active_circulars: '42',
      manual_total_applications: '310',
    },
    {
      verifiedTutorsCount: 24,
      onlineTutorsCount: 11,
      activeCircularsCount: 8,
      totalApplicationsCount: 19,
    },
    'en'
  );
  assert.equal(manualCounts.statsMode, 'manual');
  assert.equal(manualCounts.activeCircularsDisplay, '42');
  assert.equal(manualCounts.totalApplicationsDisplay, '310');
  assert.equal(manualCounts.verifiedTutorsDisplay, '180+');
  assert.equal(manualCounts.onlineTutorsDisplay, '65+');

  // 3. Supabase `public.site_settings` (`id = 1`) schema-fallback persistence (when custom CMS columns don't exist yet)
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };

  let storedSupabaseRow: Record<string, unknown> | null = null;
  const mockMinimalSchemaSupabase = {
    from: (table: string) => {
      assert.equal(table, 'site_settings');
      return {
        upsert: async (values: Record<string, unknown>) => {
          // Simulate a strict minimal Supabase `site_settings` schema having only id, facebook_url, whatsapp_url
          const allowed = new Set(['id', 'facebook_url', 'whatsapp_url']);
          const extraKey = Object.keys(values).find((k) => !allowed.has(k));
          if (extraKey) {
            return {
              data: null,
              error: { message: `column "${extraKey}" does not exist` },
            };
          }
          storedSupabaseRow = { ...values };
          return { data: [storedSupabaseRow], error: null };
        },
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: storedSupabaseRow,
              error: null,
            }),
          }),
        }),
      };
    },
  };

  const saveResult = await saveSiteSocialSettingsToSupabase(
    mockMinimalSchemaSupabase,
    {
      facebookUrl: 'https://www.facebook.com/tutorzone.madaripur',
      whatsappContact: '01308937770',
      stats_mode: 'manual',
      manual_verified_tutors: '180+',
      manual_online_tutors: '65+',
      manual_active_circulars: '42',
      manual_total_applications: '310',
    },
    mockStorage
  );
  assert.equal(saveResult.success, true);
  assert.equal(saveResult.syncedToSupabase, true);
  assert.equal(saveResult.message, HOMEPAGE_STATS_UPDATED_TOAST);
  assert.ok(storedSupabaseRow);

  // Simulate another device fetching fresh from Supabase (with clean local storage)
  const remoteHydrated = await fetchSiteSocialSettingsFromSupabase(
    mockMinimalSchemaSupabase,
    null
  );
  assert.equal(
    remoteHydrated.facebookUrl,
    'https://www.facebook.com/tutorzone.madaripur'
  );
  assert.equal(remoteHydrated.stats_mode, 'manual');
  assert.equal(remoteHydrated.manual_active_circulars, '42');
  assert.equal(remoteHydrated.manual_total_applications, '310');
  assert.equal(remoteHydrated.manual_verified_tutors, '180+');
  assert.equal(remoteHydrated.manual_online_tutors, '65+');
});

test('Supabase Free-Tier Optimization: explicit column projections, memoized dropdowns, and once-per-session settings/notices caching', async () => {
  // 1. All public & semi-static query column lists must explicitly list columns (never *)
  const columnLists = [
    PUBLIC_TUITION_CIRCULAR_COLUMNS,
    PUBLIC_CIRCULAR_APPLICATION_COLUMNS,
    SITE_SETTINGS_SELECT_COLUMNS,
    SITE_NOTICES_SELECT_COLUMNS,
    PAYMENT_REQUESTS_SELECT_COLUMNS,
    GUARDIAN_REQUESTS_SELECT_COLUMNS,
  ];
  for (const cols of columnLists) {
    assert.ok(cols.includes(','));
    assert.equal(cols.includes('*'), false);
  }

  // 2. Static dropdown lists are frozen & memoized
  assert.equal(Object.isFrozen(MEMOIZED_ALL_UPAZILAS), true);
  assert.equal(Object.isFrozen(MEMOIZED_COLLEGE_TAGS), true);
  assert.equal(Object.isFrozen(MEMOIZED_MEDIUM_CATEGORIES), true);
  assert.equal(MEMOIZED_ALL_UPAZILAS[0], 'All');
  assert.equal(MEMOIZED_COLLEGE_TAGS[0], 'All');
  assert.equal(MEMOIZED_MEDIUM_CATEGORIES[0], 'All');

  // 3. Session-once caching for site_settings & site_notices avoids repeat Supabase hits in a single session
  const sessionMap = new Map<string, string>();
  const localMap = new Map<string, string>();
  const mockSessionStorage = {
    getItem: (k: string) => sessionMap.get(k) ?? null,
    setItem: (k: string, v: string) => {
      sessionMap.set(k, v);
    },
    removeItem: (k: string) => {
      sessionMap.delete(k);
    },
  };
  const mockLocalStorage = {
    getItem: (k: string) => localMap.get(k) ?? null,
    setItem: (k: string, v: string) => {
      localMap.set(k, v);
    },
    removeItem: (k: string) => {
      localMap.delete(k);
    },
  };
  const prevWindow = (globalThis as any).window;
  (globalThis as any).window = {
    sessionStorage: mockSessionStorage,
    localStorage: mockLocalStorage,
  };

  try {
    let settingsSelectCalls = 0;
    let noticesSelectCalls = 0;

    const mockSupabase = {
      from: (table: string) => ({
        select: (cols: string) => {
          assert.equal(cols.includes('*'), false);
          if (table === 'site_settings') {
            settingsSelectCalls += 1;
            return {
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: 1,
                    facebook_url: 'https://www.facebook.com/tutorzone',
                    whatsapp_url: 'https://wa.me/8801715380022',
                  },
                  error: null,
                }),
              }),
            };
          }
          if (table === 'site_notices') {
            noticesSelectCalls += 1;
            return {
              order: async () => ({
                data: [
                  {
                    id: 'notice-1',
                    title: 'Eid Break Notice',
                    content: 'Classes resume Saturday.',
                    is_active: true,
                    created_at: '2026-11-15T00:00:00Z',
                  },
                ],
                error: null,
              }),
            };
          }
          return {
            order: async () => ({ data: [], error: null }),
          };
        },
      }),
    };

    const s1 = await fetchSiteSocialSettingsOncePerSession(
      mockSupabase,
      false,
      mockLocalStorage
    );
    const s2 = await fetchSiteSocialSettingsOncePerSession(
      mockSupabase,
      false,
      mockLocalStorage
    );
    assert.equal(settingsSelectCalls, 1);
    assert.equal(s1.facebookUrl, s2.facebookUrl);

    const n1 = await fetchSiteNoticesOncePerSession(
      mockSupabase,
      false,
      mockLocalStorage
    );
    const n2 = await fetchSiteNoticesOncePerSession(
      mockSupabase,
      false,
      mockLocalStorage
    );
    assert.equal(noticesSelectCalls, 1);
    assert.equal(n1.length, 1);
    assert.equal(n2.length, 1);

    // forceRefresh = true explicitly re-fetches from Supabase
    await fetchSiteSocialSettingsOncePerSession(
      mockSupabase,
      true,
      mockLocalStorage
    );
    await fetchSiteNoticesOncePerSession(
      mockSupabase,
      true,
      mockLocalStorage
    );
    assert.equal(settingsSelectCalls, 2);
    assert.equal(noticesSelectCalls, 2);
  } finally {
    if (prevWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = prevWindow;
    }
  }
});


