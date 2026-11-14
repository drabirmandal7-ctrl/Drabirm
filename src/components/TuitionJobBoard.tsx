import React, { useState } from 'react';
import {
  MADARIPUR_UPAZILAS,
  UPAZILA_LABELS,
} from '../data/madaripurData';
import {
  CircularApplicationRow,
  Language,
  PaymentRequestRecord,
  TuitionJob,
  Upazila,
  VerificationRequest,
} from '../types/madaripur';
import {
  SiteSocialSettings,
  UserAccount,
  extractAdminNoteFromApplication,
  extractCircularDetails,
  extractMediaFeeFromApplication,
  formatBDT,
  formatWhatsAppDirectLink,
  getApplicationsForCircular,
  getCircularCardApplyButtonState,
  getConfirmedApplicationForCircular,
  getTutorAccountRestrictionDetails,
  getUserApplicationForCircular,
  getUserAppliedApplications,
  getUserCircularApplicationStatusBadge,
  isPaymentApprovedForCircular,
  toBanglaNumber,
} from '../utils/tutorEngine';
import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Home,
  Laptop,
  Layers,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  Quote,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';

interface TuitionJobBoardProps {
  lang: Language;
  jobs: TuitionJob[];
  applications: CircularApplicationRow[];
  paymentRequests?: PaymentRequestRecord[];
  siteSocialSettings?: SiteSocialSettings;
  currentUser?: UserAccount | null;
  myTutorProfile?: VerificationRequest | null;
  tutorLookupQuery?: string;
  onTutorLookupQueryChange?: (query: string) => void;
  isAdminUnlocked?: boolean;
  isLoadingCirculars?: boolean;
  onRefreshCirculars?: () => void;
  onOpenApplyModal: (job: TuitionJob) => void;
  onNavigateToProfile?: () => void;
  onOpenAdminApplicants?: (job: TuitionJob) => void;
  onDeleteJob: (jobId: string) => void;
  onClearJobDesk: () => void;
}

export const TuitionJobBoard: React.FC<TuitionJobBoardProps> = ({
  lang,
  jobs,
  applications,
  paymentRequests = [],
  siteSocialSettings,
  currentUser,
  myTutorProfile,
  isAdminUnlocked = false,
  isLoadingCirculars = false,
  onRefreshCirculars,
  onOpenApplyModal,
  onNavigateToProfile,
  onOpenAdminApplicants,
  onDeleteJob,
  onClearJobDesk,
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobUpazilaFilter, setJobUpazilaFilter] = useState<Upazila>('All');
  const [mediumOrModeFilter, setMediumOrModeFilter] = useState<string>('All');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [minSalaryFilter, setMinSalaryFilter] = useState<number>(1000);

  const visibleJobs = jobs.filter((job) => {
    // 1. Upazila
    if (jobUpazilaFilter !== 'All' && job.upazila !== jobUpazilaFilter) {
      return false;
    }

    // 2. Search Query (Class, Subject, Code, Upazila, Landmark)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const idMatch = job.id.toLowerCase().includes(q);
      const titleMatch =
        job.titleEn.toLowerCase().includes(q) ||
        job.titleBn.toLowerCase().includes(q);
      const classMatch =
        job.studentClassEn.toLowerCase().includes(q) ||
        job.studentClassBn.toLowerCase().includes(q) ||
        Boolean(job.classSubject && job.classSubject.toLowerCase().includes(q));
      const subjectMatch =
        job.subjectsEn.some((s) => s.toLowerCase().includes(q)) ||
        job.subjectsBn.some((s) => s.toLowerCase().includes(q));
      const areaMatch =
        job.upazila.toLowerCase().includes(q) ||
        job.landmarkEn.toLowerCase().includes(q) ||
        job.landmarkBn.toLowerCase().includes(q);

      if (!idMatch && !titleMatch && !classMatch && !subjectMatch && !areaMatch) {
        return false;
      }
    }

    // 3. Medium / Mode
    if (mediumOrModeFilter !== 'All') {
      const filterKey = mediumOrModeFilter.toLowerCase();
      const jobMedium = (job.medium || '').toLowerCase();
      const jobMode = (job.mode || '').toLowerCase();
      const jobFormat = (job.tutoringFormat || '').toLowerCase();
      const jobReq = (job.requirements || '').toLowerCase();

      if (
        !jobMedium.includes(filterKey) &&
        !jobMode.includes(filterKey) &&
        !jobFormat.includes(filterKey) &&
        !jobReq.includes(filterKey)
      ) {
        return false;
      }
    }

    // 4. Preferred Tutor Gender
    if (genderFilter !== 'All') {
      const pref = (job.preferredGender || '').toLowerCase();
      const prefText = (job.tutorPreference || '').toLowerCase();
      if (genderFilter === 'Male') {
        if (pref === 'female' || (prefText.includes('female') && !prefText.includes('male tutor preferred'))) {
          return false;
        }
      } else if (genderFilter === 'Female') {
        if (pref === 'male' || (prefText.includes('male') && !prefText.includes('female'))) {
          return false;
        }
      }
    }

    // 5. Min Monthly Salary
    if (minSalaryFilter > 1000) {
      if (job.salaryBdt > 0 && job.salaryBdt < minSalaryFilter) {
        return false;
      }
    }

    return true;
  });

  const allUpazilas: Upazila[] = ['All', ...MADARIPUR_UPAZILAS];

  const handleResetFilters = () => {
    setSearchQuery('');
    setJobUpazilaFilter('All');
    setMediumOrModeFilter('All');
    setGenderFilter('All');
    setMinSalaryFilter(1000);
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    jobUpazilaFilter !== 'All' ||
    mediumOrModeFilter !== 'All' ||
    genderFilter !== 'All' ||
    minSalaryFilter > 1000;

  const userApplications = getUserAppliedApplications(
    applications,
    currentUser,
    myTutorProfile
  );
  const restrictionDetails = getTutorAccountRestrictionDetails(
    myTutorProfile,
    userApplications
  );

  return (
    <section
      id="job-board"
      aria-label="Live Madaripur Tuition Job Board"
      className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-t border-stone-200/80 dark:border-stone-800"
    >
      {/* Enterprise-Grade Account Status & Compliance Notice (For Rejected / Restricted Tutors) */}
      {restrictionDetails.isRestricted && (
        <div
          role="alert"
          aria-label="Account Status and Compliance Notice"
          className="mb-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 border-l-4 border-l-rose-500 p-4 sm:p-5 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white">
                    {lang === 'en'
                      ? 'Account Status & Compliance Notice'
                      : 'অ্যাকাউন্ট স্ট্যাটাস ও কমপ্লায়েন্স বিজ্ঞপ্তি'}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>{restrictionDetails.badgeText}</span>
                  </span>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {lang === 'en'
                    ? 'New tuition circular applications are temporarily paused on your account until verification credentials are reviewed.'
                    : 'আপনার ভেরিফিকেশন তথ্য পুনরায় যাচাই না হওয়া পর্যন্ত নতুন টিউশনি সার্কুলারে আবেদন সাময়িকভাবে সীমাবদ্ধ রয়েছে।'}
                </p>

                {/* Admin Review Note Quote Callout Box */}
                <div className="rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 p-3 flex items-start gap-2.5">
                  <Quote className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300 mb-0.5">
                      {lang === 'en' ? 'Admin Review Note' : 'অ্যাডমিন রিভিউ নোট'}
                    </span>
                    <p className="text-xs sm:text-[13px] font-semibold text-stone-800 dark:text-stone-200 break-words leading-snug">
                      “{restrictionDetails.adminNote}”
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-stretch sm:items-end justify-end gap-2 shrink-0">
              <a
                href={
                  formatWhatsAppDirectLink(
                    siteSocialSettings?.whatsappContact,
                    `Hello Admin, I would like to request re-verification for my Tutor Zone account (${myTutorProfile?.id || currentUser?.email || 'Tutor'}).`
                  ) || 'https://wa.me/8801602393192'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>
                  {lang === 'en'
                    ? 'Contact Admin on WhatsApp for Re-verification'
                    : 'পুনরায় ভেরিফিকেশনের জন্য হোয়াটসঅ্যাপে যোগাযোগ করুন'}
                </span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 1. Ultra-Compact Header & Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
        <div>
          <span className="text-xs font-semibold text-[#047857] dark:text-emerald-400 block mb-0.5">
            {lang === 'en'
              ? 'Tutor Zone · Live Tuition Job Board'
              : 'টিউটর জোন · লাইভ টিউশনি সার্কুলার জব বোর্ড'}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
            {lang === 'en'
              ? 'Official Admin-Verified Tuition Circulars'
              : 'অ্যাডমিন কর্তৃক প্রকাশিত চলমান টিউশনি সার্কুলারসমূহ'}
          </h2>
        </div>

        {/* Side-by-Side Slim Action Row */}
        <div className="flex items-center gap-2 my-1.5 flex-wrap">
          {onRefreshCirculars && (
            <button
              type="button"
              onClick={onRefreshCirculars}
              disabled={isLoadingCirculars}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 hover:border-[#047857] border border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#047857] dark:text-emerald-400 ${
                  isLoadingCirculars ? 'animate-spin' : ''
                }`}
              />
              <span>{lang === 'en' ? 'Refresh' : 'রিফ্রেশ'}</span>
            </button>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-stone-900 border border-slate-200 dark:border-stone-800 text-xs font-bold text-slate-700 dark:text-stone-300 whitespace-nowrap shrink-0">
            <Lock className="w-3.5 h-3.5 text-[#047857] dark:text-emerald-400 shrink-0" />
            <span>
              {lang === 'en' ? 'Admin Post' : 'অ্যাডমিন পোস্ট'}
            </span>
          </div>

          {isAdminUnlocked && jobs.length > 0 && (
            <button
              type="button"
              onClick={onClearJobDesk}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-800 hover:bg-red-700 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {lang === 'en'
                  ? 'Clear Desk'
                  : 'ডেস্ক মুছুন'}
              </span>
            </button>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#047857] dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              {lang === 'en' ? 'Reset' : 'রিসেট'}
            </button>
          )}
        </div>
      </div>

      {/* 2. Compact Search + "⚙️ Filters" Toggle Bar */}
      <div className="flex items-center gap-2 my-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={
              lang === 'en'
                ? 'Search by Class, Subject, Code, or Area...'
                : 'ক্লাস, বিষয়, কোড বা এলাকা দিয়ে খুঁজুন...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-[#047857]"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsFiltersOpen((prev) => !prev)}
          aria-expanded={isFiltersOpen}
          className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shrink-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
        >
          <span>⚙️</span>
          <span>{lang === 'en' ? 'Filters' : 'ফিল্টার'}</span>
          <span className="text-[10px] ml-0.5">{isFiltersOpen ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Collapsible 2-Column Filter Panel */}
      {isFiltersOpen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-800 shadow-xs my-2">
          {/* Upazila / Area Hub */}
          <div className="col-span-1">
            <label
              htmlFor="circular-upazila-select"
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-1"
            >
              {lang === 'en' ? 'Upazila / Area Hub' : 'উপজেলা / এলাকা'}
            </label>
            <select
              id="circular-upazila-select"
              value={jobUpazilaFilter}
              onChange={(e) => setJobUpazilaFilter(e.target.value as Upazila)}
              className="w-full py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#047857]"
            >
              {allUpazilas.map((u) => (
                <option key={u} value={u}>
                  {lang === 'en' ? UPAZILA_LABELS[u].en : UPAZILA_LABELS[u].bn}
                </option>
              ))}
            </select>
          </div>

          {/* Medium / Mode */}
          <div className="col-span-1">
            <label
              htmlFor="circular-medium-mode-select"
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-1"
            >
              {lang === 'en' ? 'Medium / Mode' : 'মিডিয়াম / মোড'}
            </label>
            <select
              id="circular-medium-mode-select"
              value={mediumOrModeFilter}
              onChange={(e) => setMediumOrModeFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#047857]"
            >
              <option value="All">{lang === 'en' ? 'All Formats' : 'সকল ফরম্যাট'}</option>
              <option value="Bangla Medium">{lang === 'en' ? 'Bangla Medium' : 'বাংলা মিডিয়াম'}</option>
              <option value="English Version">{lang === 'en' ? 'English Version' : 'ইংলিশ ভার্সন'}</option>
              <option value="Home">{lang === 'en' ? 'Home' : 'হোম'}</option>
              <option value="Online">{lang === 'en' ? 'Online' : 'অনলাইন'}</option>
            </select>
          </div>

          {/* Preferred Tutor Gender Pills */}
          <div className="col-span-1">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-1">
              {lang === 'en' ? 'Tutor Gender' : 'টিউটর লিঙ্গ'}
            </span>
            <div
              role="group"
              aria-label="Filter circulars by tutor gender"
              className="grid grid-cols-3 p-0.5 rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            >
              {(['All', 'Male', 'Female'] as const).map((g) => {
                const active = genderFilter === g;
                const label =
                  lang === 'en'
                    ? g
                    : g === 'All'
                    ? 'সব'
                    : g === 'Male'
                    ? 'পুরুষ'
                    : 'মহিলা';
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenderFilter(g)}
                    className={`py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap text-center ${
                      active
                        ? 'bg-[#047857] text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Min Monthly Salary Slider */}
          <div className="col-span-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-stone-400 mb-1">
              <span>{lang === 'en' ? 'Min Salary' : 'নূন্যতম বেতন'}</span>
              <span className="font-mono-num font-bold text-emerald-700 dark:text-emerald-400">
                {formatBDT(minSalaryFilter, lang)}
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={10000}
              step={500}
              value={minSalaryFilter}
              onChange={(e) => setMinSalaryFilter(Number(e.target.value))}
              className="w-full cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg accent-[#047857]"
            />
          </div>
        </div>
      )}

      {/* 3. Single-Line Horizontal Scrollable Area Chips (No 3-Row Wrapping) */}
      <div className="relative mb-4">
        <div
          role="group"
          aria-label="Filter tuition jobs by Upazila"
          className="flex items-center overflow-x-auto no-scrollbar flex-nowrap gap-2 pb-1 pr-4 whitespace-nowrap"
        >
          {allUpazilas.map((upz) => {
            const active = jobUpazilaFilter === upz;
            return (
              <button
                key={upz}
                type="button"
                onClick={() => setJobUpazilaFilter(upz)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full shrink-0 transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100/90 dark:bg-stone-800/90 text-slate-700 dark:text-stone-200 border border-slate-200/80 dark:border-stone-700 hover:border-emerald-300'
                }`}
              >
                {lang === 'en' ? UPAZILA_LABELS[upz].en : UPAZILA_LABELS[upz].bn}
              </button>
            );
          })}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-[#FAF8F5] dark:from-stone-950 to-transparent"
        />
      </div>

      {/* Circular Cards Grid */}
      {visibleJobs.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-10 text-center">
          <p className="text-base font-bold text-stone-900 dark:text-white mb-1.5">
            {lang === 'en'
              ? 'No tuition circulars currently listed (0 circulars).'
              : 'বর্তমানে কোনো টিউশনি সার্কুলার নেই (০টি সার্কুলার)।'}
          </p>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            {lang === 'en'
              ? 'Only the Admin can post new tuition circulars from Admin Review.'
              : 'শুধুমাত্র অ্যাডমিন "অ্যাডমিন রিভিউ" থেকে নতুন টিউশনি সার্কুলার প্রকাশ করতে পারবেন।'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleJobs.map((job) => {
            const circularApps = getApplicationsForCircular(
              applications,
              job.id
            );
            const liveApplicantCount =
              circularApps.length > 0
                ? circularApps.length
                : job.applicantsCount;
            const confirmedApp = getConfirmedApplicationForCircular(
              applications,
              job.id
            );
            const myTutorApp = getUserApplicationForCircular(
              applications,
              job.id,
              currentUser,
              myTutorProfile
            );
            const appMediaFee = myTutorApp
              ? extractMediaFeeFromApplication(myTutorApp, 1000)
              : 0;
            const myBadge = myTutorApp
              ? getUserCircularApplicationStatusBadge(
                  myTutorApp.status,
                  lang,
                  appMediaFee
                )
              : null;
            const myAppAdminNote = myTutorApp
              ? extractAdminNoteFromApplication(myTutorApp)
              : '';
            const isPaymentApproved = isPaymentApprovedForCircular(
              paymentRequests,
              job.id,
              currentUser,
              myTutorProfile
            );
            const buttonState = getCircularCardApplyButtonState(myTutorApp, {
              isTutorRestricted: restrictionDetails.isRestricted,
              isPaymentApproved,
              lang,
            });
            const isCircularConfirmed =
              Boolean(confirmedApp) ||
              (job.status || '').trim().toLowerCase() === 'confirmed';
            const confirmedName =
              confirmedApp?.tutor_name || job.confirmedTutorName;
            const confirmedId =
              confirmedApp?.tutor_id || job.confirmedTutorId;

            const subjects =
              lang === 'en' ? job.subjectsEn : job.subjectsBn;

            const isUserConfirmedTutor = Boolean(
              (myTutorApp &&
                (myTutorApp.status === 'Confirmed' ||
                  myTutorApp.status?.toLowerCase() === 'confirmed' ||
                  isPaymentApproved)) ||
              (currentUser &&
                confirmedId &&
                (currentUser.email === confirmedId ||
                  currentUser.id === confirmedId))
            );
            const canSeeGuardianPhone = Boolean(
              isAdminUnlocked || isUserConfirmedTutor
            );
            const details = extractCircularDetails(job, lang);

            return (
              <article
                key={job.id}
                className="rounded-2xl bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 p-5 flex flex-col justify-between hover:border-[#047857]/50 shadow-xs transition-colors"
              >
                <div>
                  {/* 1. Top Header Bar: ID Pill + Status Badge + Posted Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 font-mono-num">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 shadow-2xs">
                        {job.id}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                          isCircularConfirmed
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 dark:bg-stone-800 dark:text-stone-300 border border-slate-200 dark:border-stone-700'
                        }`}
                      >
                        {isCircularConfirmed
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
                      {isAdminUnlocked && (
                        <button
                          type="button"
                          onClick={() => onDeleteJob(job.id)}
                          aria-label={`Delete circular ${job.id}`}
                          className="p-1 rounded text-stone-400 hover:text-red-600 transition-colors ml-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Circular Headline */}
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-stone-50 mt-1.5 leading-snug line-clamp-2">
                    {lang === 'en' ? job.titleEn : job.titleBn}
                  </h3>

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

                  {/* 3. Guardian Phone Privacy: strictly ONLY when Admin is unlocked or logged-in tutor is Confirmed */}
                  {canSeeGuardianPhone && job.contactPhone && (
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
                        {isAdminUnlocked
                          ? lang === 'en'
                            ? 'Admin Access'
                            : 'অ্যাডমিন ভিউ'
                          : lang === 'en'
                          ? 'Confirmed Tutor'
                          : 'নিশ্চিত শিক্ষক'}
                      </span>
                    </div>
                  )}

                  {/* Admin-Only Confirmed Tutor Summary */}
                  {isAdminUnlocked && isCircularConfirmed && confirmedName && (
                    <div className="p-2.5 my-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        {lang === 'en'
                          ? `Admin View · Confirmed Tutor: ${confirmedName} (${confirmedId || 'Verified'})`
                          : `অ্যাডমিন ভিউ · নিশ্চিতকৃত টিউটর: ${confirmedName} (${confirmedId || 'Verified'})`}
                      </span>
                    </div>
                  )}

                  {/* Strictly Account-Bound Tutor Status Badge & Admin Note */}
                  {myTutorApp && myBadge && (
                    <div className="my-2 space-y-1.5">
                      <div
                        role="status"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                          myBadge.tone === 'confirmed'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : myBadge.tone === 'rejected'
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-900'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        <span>{myBadge.label}</span>
                      </div>
                      {myAppAdminNote && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-stone-800/80 border border-slate-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300">
                          <span className="font-bold text-stone-900 dark:text-white mr-1">
                            {lang === 'en' ? '📌 Admin Note:' : '📌 অ্যাডমিন নোট:'}
                          </span>
                          <span>{myAppAdminNote}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Bottom Action Bar: Monthly Salary + Applicants Badge + Sleek Status Pill / Apply */}
                <div className="mt-4 pt-3.5 border-t border-slate-200/90 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-slate-400 dark:text-stone-400 font-bold">
                      {lang === 'en' ? 'Monthly Salary' : 'মাসিক বেতন'}
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold font-mono-num text-emerald-700 dark:text-emerald-400">
                      {formatBDT(job.salaryBdt, lang)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      title="Total Applicants"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-stone-800 text-xs text-slate-700 dark:text-stone-300 inline-flex items-center gap-1.5 font-mono-num font-bold border border-slate-200 dark:border-stone-700"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      <span>
                        {lang === 'bn'
                          ? `${toBanglaNumber(liveApplicantCount)} জন আবেদনকারী`
                          : `${liveApplicantCount} ${
                              liveApplicantCount === 1
                                ? 'Applicant'
                                : 'Applicants'
                            }`}
                      </span>
                    </span>

                    {isAdminUnlocked && onOpenAdminApplicants && (
                      <button
                        type="button"
                        onClick={() => onOpenAdminApplicants(job)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'en'
                            ? `View Applicants (${liveApplicantCount})`
                            : `আবেদনকারী দেখুন (${toBanglaNumber(liveApplicantCount)})`}
                        </span>
                      </button>
                    )}

                    {/* Sleek 1-Application-Per-Circular Status Pill / Action Button */}
                    {buttonState.state === 'pending' ? (
                      <span
                        role="status"
                        aria-label={buttonState.label}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-amber-50 to-slate-100 dark:from-amber-950/60 dark:to-stone-800 text-amber-800 dark:text-amber-300 border border-amber-300/70 dark:border-amber-800/70 shadow-2xs select-none whitespace-nowrap"
                      >
                        <span>{buttonState.label}</span>
                      </span>
                    ) : buttonState.state === 'confirmed' ? (
                      <span
                        role="status"
                        aria-label={buttonState.label}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/80 dark:to-teal-950/80 text-[#047857] dark:text-emerald-300 border border-emerald-400/70 dark:border-emerald-700 shadow-2xs select-none whitespace-nowrap"
                      >
                        <span>{buttonState.label}</span>
                      </span>
                    ) : buttonState.state === 'media_fee' ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateToProfile) {
                            onNavigateToProfile();
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white shadow-sm transition-all whitespace-nowrap cursor-pointer"
                      >
                        <span>{buttonState.label}</span>
                      </button>
                    ) : buttonState.state === 'rejected' ? (
                      <span
                        role="status"
                        aria-label={buttonState.label}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-rose-50 to-slate-100 dark:from-rose-950/60 dark:to-stone-800 text-rose-700 dark:text-rose-300 border border-rose-300/70 dark:border-rose-800/70 shadow-2xs select-none whitespace-nowrap"
                      >
                        <span>{buttonState.label}</span>
                      </span>
                    ) : buttonState.state === 'restricted' ? (
                      <button
                        type="button"
                        disabled
                        title={restrictionDetails.adminNote}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-300 dark:border-stone-700 cursor-not-allowed opacity-85 whitespace-nowrap"
                      >
                        <span>{buttonState.label}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenApplyModal(job)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs whitespace-nowrap cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white"
                      >
                        <span>{buttonState.label}</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

