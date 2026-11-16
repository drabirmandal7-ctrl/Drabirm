import React from 'react';
import {
  MADARIPUR_UPAZILAS,
  UPAZILA_LABELS,
} from '../data/madaripurData';
import {
  CollegeTag,
  FilterState,
  Language,
  MediumCategory,
  TutorGender,
  TutorProfile,
  Upazila,
} from '../types/madaripur';
import {
  MADARIPUR_COLLEGE_LABELS_BN,
  MEMOIZED_ALL_UPAZILAS,
  MEMOIZED_COLLEGE_TAGS,
  MEMOIZED_MEDIUM_CATEGORIES,
  formatBDT,
  toBanglaNumber,
} from '../utils/tutorEngine';
import { TutorPortraitSvg } from './TutorPortraitSvg';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  MapPin,
  MessageSquarePlus,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Trash2,
} from 'lucide-react';

interface TutorDiscoveryConsoleProps {
  lang: Language;
  filters: FilterState;
  onUpdateFilters: (partial: Partial<FilterState>) => void;
  onResetFilters: () => void;
  filteredTutors: TutorProfile[];
  totalTutorsCount: number;
  shortlistedIds: string[];
  onToggleShortlist: (tutorId: string) => void;
  bookedTutorIds: string[];
  onOpenProfileModal: (tutor: TutorProfile) => void;
  onOpenTrialModal: (tutor: TutorProfile) => void;
  onDeleteTutor: (tutorId: string) => void;
  onClearTutorDesk: () => void;
  onSwitchToUploadDesk: () => void;
  isLoading?: boolean;
}

const COLLEGE_TAGS = MEMOIZED_COLLEGE_TAGS;

const COLLEGE_LABELS_BN: Record<CollegeTag, string> = MADARIPUR_COLLEGE_LABELS_BN;

const MEDIUM_CATEGORIES = MEMOIZED_MEDIUM_CATEGORIES;

const MEDIUM_LABELS_BN: Record<MediumCategory, string> = {
  All: 'সকল মিডিয়াম',
  'Bangla Medium': 'বাংলা মিডিয়াম',
  'English Version': 'ইংলিশ ভার্সন',
  'Admission Test': 'ভর্তি পরীক্ষা',
  'Madrasah/Quranic': 'মাদ্রাসা / কুরআন',
  ICT: 'আইসিটি স্পেশাল',
};

export const TutorDiscoveryConsole: React.FC<TutorDiscoveryConsoleProps> = ({
  lang,
  filters,
  onUpdateFilters,
  onResetFilters,
  filteredTutors,
  totalTutorsCount,
  shortlistedIds,
  onToggleShortlist,
  bookedTutorIds,
  onOpenProfileModal,
  onOpenTrialModal,
  onDeleteTutor,
  onClearTutorDesk,
  onSwitchToUploadDesk,
  isLoading = false,
}) => {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const allUpazilas = MEMOIZED_ALL_UPAZILAS;

  const activeFiltersCount =
    (filters.upazila !== 'All' ? 1 : 0) +
    (filters.medium !== 'All' ? 1 : 0) +
    (filters.gender !== 'All' ? 1 : 0) +
    (filters.college !== 'All' ? 1 : 0) +
    (filters.maxBudget < 10000 ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0);

  return (
    <section
      id="tutor-console"
      aria-label="Tutor Board"
      className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9 overflow-x-hidden"
    >
      {/* Editorial Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold text-[#047857] dark:text-emerald-400 block mb-1">
            {lang === 'en'
              ? 'Tutor Zone · Verified Educators Directory · Institution, Hub & Budget Filters'
              : 'টিউটর জোন · যাচাইকৃত শিক্ষক ডিরেক্টরি · প্রতিষ্ঠান, এলাকা ও বাজেট ফিল্টার'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
            {lang === 'en' ? 'Tutor Board' : 'টিউটর বোর্ড (Tutor Board)'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 dark:text-stone-400">
          <span>
            {lang === 'en' ? 'Showing' : 'প্রদর্শিত হচ্ছে'}{' '}
            <strong className="font-mono-num text-stone-900 dark:text-white">
              {lang === 'bn'
                ? toBanglaNumber(filteredTutors.length)
                : filteredTutors.length}
            </strong>{' '}
            {lang === 'en' ? 'tutors' : 'জন টিউটর'}
          </span>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 font-semibold text-[#047857] dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0 active:scale-[0.98] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Reset All Filters' : 'ফিল্টার রিসেট'}</span>
          </button>
          {totalTutorsCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={onClearTutorDesk}
                className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400 hover:underline whitespace-nowrap shrink-0 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {lang === 'en'
                    ? 'Clear Tutor Desk Only'
                    : 'শুধু টিউটর ডেস্ক মুছুন'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sleek Ultra-Compact Tutor Filter Deck */}
      <div className="p-3 bg-white dark:bg-stone-900 rounded-2xl border border-emerald-500/20 dark:border-stone-800 shadow-sm mb-6 sm:mb-8 w-full max-w-full overflow-hidden">
        {/* 1. Default Ultra-Compact Top Bar (Single Slim Row) */}
        <div className="flex items-center flex-nowrap gap-2 w-full">
          {/* Slim Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="tutor-search-input"
              type="text"
              placeholder={
                lang === 'en'
                  ? 'Search Subject, College, Area...'
                  : 'বিষয়, কলেজ বা এলাকা খুঁজুন...'
              }
              value={filters.searchQuery}
              onChange={(e) =>
                onUpdateFilters({ searchQuery: e.target.value })
              }
              className="w-full min-h-[44px] pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-[#047857]"
            />
          </div>

          {/* Reset Button (Visible when filters are active) */}
          {(activeFiltersCount > 0 || Boolean(filters.searchQuery.trim())) && (
            <button
              type="button"
              onClick={onResetFilters}
              className="hidden sm:inline-flex min-h-[44px] items-center text-xs font-bold text-[#047857] dark:text-emerald-400 hover:underline px-2 py-1 whitespace-nowrap shrink-0 active:scale-[0.98] transition-all cursor-pointer"
            >
              {lang === 'en' ? 'Reset' : 'রিসেট'}
            </button>
          )}

          {/* Bold, Modern "⚙️ Filter" Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            aria-expanded={isFilterOpen}
            className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-[0.98] transition-all shadow-xs cursor-pointer"
          >
            <span>⚙️</span>
            <span>{lang === 'en' ? 'Filter' : 'ফিল্টার'}</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-emerald-800 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                {activeFiltersCount}
              </span>
            )}
            <span className="text-[10px] ml-0.5">
              {isFilterOpen ? '▲' : '▼'}
            </span>
          </button>
        </div>

        {/* 1-Click Area & Hub Filter Smooth Horizontal Swipeable Row */}
        <div className="relative mt-2.5 pt-2 border-t border-slate-100 dark:border-stone-800 w-full max-w-full overflow-hidden">
          <div
            role="group"
            aria-label="Filter tutors by Upazila"
            className="flex items-center overflow-x-auto no-scrollbar flex-nowrap gap-2 pb-1 pr-4 w-full"
          >
            {allUpazilas.map((upz) => {
              const active = filters.upazila === upz;
              return (
                <button
                  key={upz}
                  type="button"
                  onClick={() => onUpdateFilters({ upazila: upz })}
                  className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold rounded-full shrink-0 whitespace-nowrap active:scale-[0.98] transition-all duration-200 cursor-pointer border ${
                    active
                      ? 'bg-gradient-to-r from-[#059669] to-[#047857] text-white border-[#047857] shadow-xs'
                      : 'bg-slate-50 dark:bg-stone-800 text-slate-700 dark:text-stone-200 border-slate-200 dark:border-stone-700 hover:border-[#047857]'
                  }`}
                >
                  {lang === 'en' ? UPAZILA_LABELS[upz].en : UPAZILA_LABELS[upz].bn}
                </button>
              );
            })}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-2 bottom-1 w-8 bg-gradient-to-l from-white dark:from-stone-900 to-transparent"
          />
        </div>

        {/* 2. Collapsible Compact Filter Drawer */}
        {isFilterOpen && (
          <div className="mt-2.5 p-3 bg-slate-50/80 dark:bg-stone-800/80 rounded-xl border border-slate-200/80 dark:border-stone-700/80 space-y-2.5">
            {/* Row 1 (Compact Grid): Upazila / Area Hub, Medium / Category, Tutor Gender */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Upazila / Area Hub */}
              <div>
                <label
                  htmlFor="upazila-select"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-1"
                >
                  {lang === 'en' ? 'Upazila / Area Hub' : 'উপজেলা / এলাকা'}
                </label>
                <select
                  id="upazila-select"
                  value={filters.upazila}
                  onChange={(e) =>
                    onUpdateFilters({ upazila: e.target.value as Upazila })
                  }
                  className="w-full min-h-[42px] py-1.5 px-2.5 text-base sm:text-xs font-semibold rounded-lg bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#047857]"
                >
                  {allUpazilas.map((u) => (
                    <option key={u} value={u}>
                      {lang === 'en' ? UPAZILA_LABELS[u].en : UPAZILA_LABELS[u].bn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Medium / Category */}
              <div>
                <label
                  htmlFor="medium-select"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-1"
                >
                  {lang === 'en' ? 'Medium / Category' : 'মিডিয়াম / বিভাগ'}
                </label>
                <select
                  id="medium-select"
                  value={filters.medium}
                  onChange={(e) =>
                    onUpdateFilters({ medium: e.target.value as MediumCategory })
                  }
                  className="w-full min-h-[42px] py-1.5 px-2.5 text-base sm:text-xs font-semibold rounded-lg bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#047857]"
                >
                  {MEDIUM_CATEGORIES.map((m) => (
                    <option key={m} value={m}>
                      {lang === 'en' ? m : MEDIUM_LABELS_BN[m]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tutor Gender */}
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-1">
                  {lang === 'en' ? 'Tutor Gender' : 'শিক্ষকের লিঙ্গ'}
                </span>
                <div
                  role="group"
                  aria-label="Tutor gender filter"
                  className="grid grid-cols-3 p-0.5 rounded-lg bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700"
                >
                  {(['All', 'Male', 'Female'] as TutorGender[]).map((g) => {
                    const active = filters.gender === g;
                    const label =
                      lang === 'en'
                        ? g
                        : g === 'All'
                        ? 'সবাই'
                        : g === 'Male'
                        ? 'পুরুষ'
                        : 'মহিলা';
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => onUpdateFilters({ gender: g })}
                        className={`min-h-[38px] py-1 text-xs font-semibold rounded-md active:scale-[0.98] transition-all whitespace-nowrap text-center cursor-pointer ${
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
            </div>

            {/* Row 2: Single-Line Institution Chips & Slim Fee Slider */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-200/80 dark:border-stone-700/80 items-center">
              {/* Institution / College Filter */}
              <div className="md:col-span-7">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400">
                    {lang === 'en'
                      ? 'Institution / College Filter'
                      : 'প্রতিষ্ঠান / কলেজ ফিল্টার'}
                  </span>
                </div>
                <div
                  role="group"
                  aria-label="Filter by College or University"
                  className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap"
                >
                  {COLLEGE_TAGS.map((col) => {
                    const active = filters.college === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => onUpdateFilters({ college: col })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-[#047857] text-white border-[#047857] shadow-xs'
                            : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-slate-200 dark:border-stone-700 hover:border-[#047857]/50'
                        }`}
                      >
                        {lang === 'en' ? col : COLLEGE_LABELS_BN[col]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Max Monthly Fee Slider + Verified Badge */}
              <div className="md:col-span-5 flex flex-col justify-center">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3 text-[#047857]" />
                    <span>
                      {lang === 'en' ? 'Max Monthly Fee' : 'সর্বোচ্চ মাসিক ফি'}
                    </span>
                  </span>
                  <span className="font-mono-num font-bold text-[#047857] dark:text-emerald-400 text-xs">
                    {formatBDT(filters.maxBudget, lang)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    id="budget-slider"
                    type="range"
                    min={2000}
                    max={10000}
                    step={500}
                    value={filters.maxBudget}
                    onChange={(e) =>
                      onUpdateFilters({ maxBudget: Number(e.target.value) })
                    }
                    className="w-full cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg accent-[#047857]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateFilters({ verifiedOnly: !filters.verifiedOnly })
                    }
                    aria-pressed={filters.verifiedOnly}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      filters.verifiedOnly
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-[#047857] text-[#047857] dark:text-emerald-300 font-bold'
                        : 'bg-white dark:bg-stone-800 border-slate-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#047857] dark:text-emerald-400 shrink-0" />
                    <span>{lang === 'en' ? 'Verified' : 'ভেরিফায়েড'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skeleton Shimmer State While Loading */}
      {isLoading && filteredTutors.length === 0 ? (
        <div
          aria-label="Loading verified tutors"
          className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5"
        >
          {[1, 2, 3, 4].map((skeletonIdx) => (
            <div
              key={skeletonIdx}
              className="rounded-2xl bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 p-4 sm:p-5 shadow-sm animate-pulse space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="h-5 w-40 rounded-full bg-emerald-100 dark:bg-emerald-950/60" />
                <div className="h-7 w-16 rounded-lg bg-stone-100 dark:bg-stone-800" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-stone-200 dark:bg-stone-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-44 rounded-lg bg-stone-200 dark:bg-stone-800" />
                  <div className="h-3.5 w-56 rounded-lg bg-stone-100 dark:bg-stone-800" />
                </div>
              </div>
              <div className="h-8 w-full rounded-xl bg-slate-100 dark:bg-stone-800" />
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-stone-800">
                <div className="h-9 w-28 rounded-xl bg-emerald-50 dark:bg-emerald-950/50" />
                <div className="h-9 w-40 rounded-xl bg-stone-200 dark:bg-stone-800" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTutors.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 p-10 sm:p-12 text-center shadow-sm">
          <p className="text-base font-bold text-stone-900 dark:text-white mb-2">
            {totalTutorsCount === 0
              ? lang === 'en'
                ? 'All tutor records have been cleared (0 tutors in directory).'
                : 'সকল টিউটর ডাটা মুছে ফেলা হয়েছে (তালিকায় ০ জন টিউটর)।'
              : lang === 'en'
              ? 'No Madaripur tutors match your exact filter combination.'
              : 'আপনার নির্বাচিত ফিল্টারে কোনো টিউটর পাওয়া যায়নি।'}
          </p>
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-5">
            {totalTutorsCount === 0
              ? lang === 'en'
                ? 'Submit a new tutor profile with NID & University credentials in Profile and approve it in Admin Review to list a verified tutor.'
                : 'প্রোফাইলে নতুন টিউটরের এনআইডি ও কলেজের তথ্য জমা দিয়ে অ্যাডমিন রিভিউতে অনুমোদন করলে এখানে প্রদর্শিত হবে।'
              : lang === 'en'
              ? 'Try increasing the maximum monthly fee slider or clearing the Upazila/College filter.'
              : 'মাসিক বাজেট স্লাইডার বাড়িয়ে অথবা ফিল্টার রিসেট করে আবার চেষ্টা করুন।'}
          </p>
          {totalTutorsCount === 0 ? (
            <button
              type="button"
              onClick={onSwitchToUploadDesk}
              className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] text-white text-xs sm:text-sm font-extrabold hover:from-[#047857] hover:to-[#065F46] active:scale-[0.98] transition-all cursor-pointer"
            >
              {lang === 'en' ? 'Profile →' : 'প্রোফাইল →'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onResetFilters}
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] text-white text-xs sm:text-sm font-extrabold hover:from-[#047857] hover:to-[#065F46] active:scale-[0.98] transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'en' ? 'Reset All Filters' : 'সকল ফিল্টার রিসেট করুন'}
              </span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredTutors.map((tutor) => {
            const isShortlisted = shortlistedIds.includes(tutor.id);
            const isTrialBooked = bookedTutorIds.includes(tutor.id);
            const isVerified = tutor.nidVerified && tutor.uniIdVerified;
            const subjects =
              lang === 'en' ? tutor.subjectsEn : tutor.subjectsBn;
            const areas =
              lang === 'en' ? tutor.coveredAreasEn : tutor.coveredAreasBn;
            const rawBio = (lang === 'en' ? tutor.bioEn : tutor.bioBn) || '';
            const isAutoGeneratedBio =
              rawBio.startsWith('Verified educator from ') ||
              rawBio.startsWith('যাচাইকৃত শিক্ষক') ||
              rawBio.trim() === '';
            const compactResponseTime =
              lang === 'en'
                ? tutor.responseTimeEn.replace(/\bmins?\b/i, 'm')
                : tutor.responseTimeBn;

            return (
              <article
                key={tutor.id}
                data-testid="compact-tutor-card"
                className="rounded-2xl bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 p-3.5 sm:p-4 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 hover:border-[#047857]/50 overflow-hidden"
              >
                <div>
                  {/* 1. Compact Top Header Row: Verification & Location Pills Left, Action Icons Right */}
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex flex-wrap items-center gap-1 min-w-0">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-500/30 text-[#047857] dark:text-emerald-300 text-[11px] font-extrabold whitespace-nowrap">
                          <ShieldCheck className="w-3 h-3 shrink-0" />
                          <span>
                            {lang === 'en'
                              ? 'Smart NID Verified'
                              : 'স্মার্ট এনআইডি ভেরিফায়েড'}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-400/40 text-amber-700 dark:text-amber-300 text-[11px] font-bold whitespace-nowrap">
                          <ShieldAlert className="w-3 h-3 shrink-0" />
                          <span>
                            {lang === 'en'
                              ? 'Pending Verification'
                              : 'পেন্ডিং ভেরিফিকেশন'}
                          </span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-stone-800 border border-emerald-500/20 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-bold whitespace-nowrap">
                        <MapPin className="w-3 h-3 text-[#059669] dark:text-emerald-400 shrink-0" />
                        <span>
                          {lang === 'en'
                            ? tutor.upazila
                            : UPAZILA_LABELS[tutor.upazila]?.bn || tutor.upazila}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleShortlist(tutor.id)}
                        aria-label={
                          isShortlisted
                            ? `Remove ${tutor.nameEn} from shortlist`
                            : `Save ${tutor.nameEn} to shortlist`
                        }
                        aria-pressed={isShortlisted}
                        className={`w-7 h-7 sm:w-8 sm:h-8 p-1 rounded-lg border active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer ${
                          isShortlisted
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-600 dark:text-amber-400'
                            : 'bg-[#FAF8F5] dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400 hover:text-stone-700'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isShortlisted ? 'fill-amber-500 text-amber-500' : ''
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteTutor(tutor.id)}
                        aria-label={`Delete tutor profile ${tutor.nameEn}`}
                        className="w-7 h-7 sm:w-8 sm:h-8 p-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-[#FAF8F5] dark:bg-stone-800 text-stone-400 hover:text-red-600 hover:border-red-300 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 2. Profile Identity Row: Avatar Left + Full Remaining Width for Name & College */}
                  <div className="flex items-start gap-3">
                    {tutor.profilePhotoUrl ? (
                      <img
                        src={tutor.profilePhotoUrl}
                        alt={`Verified photo of ${tutor.nameEn}`}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shrink-0 object-cover border-2 border-emerald-500/30 shadow-xs"
                      />
                    ) : (
                      <TutorPortraitSvg
                        variant={tutor.portraitVariant}
                        className="w-14 h-14 sm:w-16 sm:h-16 shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-stone-50 leading-snug truncate">
                        {lang === 'en' ? tutor.nameEn : tutor.nameBn}
                      </h3>
                      <p className="text-xs sm:text-sm font-medium text-emerald-800 dark:text-emerald-300 leading-snug mt-0.5 line-clamp-2">
                        {lang === 'en'
                          ? tutor.institutionFullEn
                          : tutor.institutionFullBn}
                      </p>
                    </div>
                  </div>

                  {/* 3. Compact Stats & Rating Strip */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 bg-slate-50 dark:bg-stone-800/80 border border-slate-100 dark:border-stone-700/70 px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs my-2 text-stone-600 dark:text-stone-300">
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenProfileModal(tutor)}
                        className="inline-flex items-center gap-0.5 font-bold text-stone-900 dark:text-white font-mono-num hover:text-[#047857] dark:hover:text-emerald-400 cursor-pointer"
                      >
                        <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        <span>
                          {lang === 'bn'
                            ? toBanglaNumber(tutor.rating.toFixed(2))
                            : tutor.rating.toFixed(2)}
                        </span>
                        <span className="font-normal text-stone-500 dark:text-stone-400">
                          (
                          {lang === 'bn'
                            ? toBanglaNumber(tutor.totalReviews)
                            : tutor.totalReviews}
                          )
                        </span>
                      </button>

                      <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">
                        ·
                      </span>
                      <span className="font-mono-num whitespace-nowrap">
                        {lang === 'en' ? (
                          <>
                            {tutor.experienceYears} yrs
                            <span className="hidden min-[380px]:inline"> exp</span>
                          </>
                        ) : (
                          `${toBanglaNumber(tutor.experienceYears)} বছর`
                        )}
                      </span>

                      <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">
                        ·
                      </span>
                      <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                        <Clock className="w-3 h-3 text-[#047857] dark:text-emerald-400 shrink-0" />
                        <span>{compactResponseTime}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenProfileModal(tutor)}
                      className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-[#047857] dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <MessageSquarePlus className="w-3 h-3 shrink-0" />
                      <span>
                        {lang === 'en' ? 'Rate & Review' : 'রিভিউ দিন'}
                      </span>
                    </button>
                  </div>

                  {/* 4. Optional Non-Redundant Bio (1 Line Max) + Compact 2-Column Info Grid */}
                  {!isAutoGeneratedBio && (
                    <p className="line-clamp-1 text-xs text-slate-500 dark:text-stone-400 mb-1.5">
                      {rawBio}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 text-xs mb-2">
                    <div className="px-2 py-1 rounded-lg bg-[#FAF8F5] dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 min-w-0">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 leading-tight">
                        {lang === 'en' ? 'Subjects' : 'বিষয়সমূহ'}
                      </span>
                      <span className="block text-[11px] sm:text-xs font-medium text-stone-800 dark:text-stone-200 truncate">
                        {subjects.join(' · ')}
                      </span>
                    </div>
                    <div className="px-2 py-1 rounded-lg bg-[#FAF8F5] dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 min-w-0">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 leading-tight">
                        {lang === 'en' ? 'Service Areas' : 'কভারেজ এলাকা'}
                      </span>
                      <span className="block text-[11px] sm:text-xs font-medium text-stone-700 dark:text-stone-300 truncate">
                        {areas.join(' · ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Single-Row Bottom Footer: Monthly Honorarium Left + Compact Action Buttons Right */}
                <div className="flex items-center justify-between gap-1 sm:gap-2 pt-2 border-t border-slate-100 dark:border-stone-800">
                  <div className="px-2 py-1 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-500/25 shrink-0">
                    <span className="block text-[8px] sm:text-[9px] uppercase tracking-tight sm:tracking-wider font-bold text-[#047857] dark:text-emerald-400 leading-tight">
                      {lang === 'en' ? 'Monthly Honorarium' : 'মাসিক সম্মানী'}
                    </span>
                    <div className="leading-tight">
                      <span className="text-xs sm:text-base font-extrabold font-mono-num text-stone-900 dark:text-white">
                        {formatBDT(tutor.monthlyFee, lang)}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400">
                        {lang === 'en' ? '/mo' : '/মাস'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenProfileModal(tutor)}
                      className="min-h-[36px] sm:min-h-[38px] inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 hover:bg-stone-200/70 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 text-[11px] sm:text-xs font-semibold active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <FileText className="hidden min-[380px]:inline w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                      <span>
                        {lang === 'en' ? 'Profile & Reviews' : 'প্রোফাইল ও রিভিউ'}
                        <span className="hidden sm:inline">
                          {' '}
                          (
                          {lang === 'bn'
                            ? toBanglaNumber(tutor.totalReviews)
                            : tutor.totalReviews}
                          )
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenTrialModal(tutor)}
                      aria-label={
                        lang === 'en'
                          ? 'Book 2 Free Trial Classes'
                          : '২টি ফ্রি ট্রায়াল ক্লাস বুক করুন'
                      }
                      className={`min-h-[36px] sm:min-h-[38px] inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        isTrialBooked
                          ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40'
                          : 'bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white shadow-xs'
                      }`}
                    >
                      {isTrialBooked ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#047857] dark:text-emerald-400 shrink-0" />
                          <span>{lang === 'en' ? 'Booked' : 'বুক হয়েছে'}</span>
                        </>
                      ) : (
                        <>
                          <CalendarCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                          <span>
                            {lang === 'en' ? (
                              <>
                                <span className="hidden sm:inline">Free </span>
                                Trial
                              </>
                            ) : (
                              'ট্রায়াল'
                            )}
                          </span>
                        </>
                      )}
                    </button>
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
