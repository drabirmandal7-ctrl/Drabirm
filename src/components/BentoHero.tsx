import React, { useState } from 'react';
import {
  BookOpen,
  Briefcase,
  CheckCircle2,
  Laptop,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Upload,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import {
  CollegeTag,
  FilterState,
  Language,
  MediumCategory,
  Upazila,
} from '../types/madaripur';
import {
  MADARIPUR_UPAZILAS,
  UI_COPY,
  UPAZILA_LABELS,
} from '../data/madaripurData';
import {
  DEFAULT_SITE_SOCIAL_SETTINGS,
  MADARIPUR_COLLEGE_LABELS_BN,
  MADARIPUR_INSTITUTION_CATEGORIES,
  SiteSocialSettings,
  formatBDT,
  resolveHomepageLiveStats,
  toBanglaNumber,
} from '../utils/tutorEngine';

interface BentoHeroProps {
  lang: Language;
  onToggleLang: (next: Language) => void;
  darkMode: boolean;
  onToggleDark: () => void;
  shortlistCount: number;
  shortlistedOnly: boolean;
  onToggleShortlistedOnly: () => void;
  filters: FilterState;
  onUpdateFilters: (partial: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onOpenTutorUploadDesk: () => void;
  onOpenGuardianModal: () => void;
  onOpenTuitionCircularsDesk?: () => void;
  verifiedTutorsCount?: number;
  onlineTutorsCount?: number;
  activeCircularsCount?: number;
  siteSocialSettings?: SiteSocialSettings;
}

const COLLEGE_TAGS: CollegeTag[] = [
  'All',
  ...MADARIPUR_INSTITUTION_CATEGORIES,
];

const COLLEGE_LABELS_BN: Record<CollegeTag, string> = MADARIPUR_COLLEGE_LABELS_BN;

const MEDIUM_CATEGORIES: MediumCategory[] = [
  'All',
  'Bangla Medium',
  'English Version',
  'Admission Test',
  'Madrasah/Quranic',
  'ICT',
];

const MEDIUM_LABELS_BN: Record<MediumCategory, string> = {
  All: 'সকল মিডিয়াম',
  'Bangla Medium': 'বাংলা মিডিয়াম',
  'English Version': 'ইংলিশ ভার্সন',
  'Admission Test': 'ভর্তি পরীক্ষা',
  'Madrasah/Quranic': 'মাদ্রাসা / কুরআন',
  ICT: 'আইসিটি স্পেশাল',
};

export const BentoHero: React.FC<BentoHeroProps> = ({
  lang,
  onToggleLang,
  darkMode,
  onToggleDark,
  shortlistCount,
  shortlistedOnly,
  onToggleShortlistedOnly,
  filters,
  onUpdateFilters,
  onResetFilters,
  onOpenTutorUploadDesk,
  onOpenGuardianModal,
  onOpenTuitionCircularsDesk,
  verifiedTutorsCount = 6,
  onlineTutorsCount = 4,
  activeCircularsCount = 4,
  siteSocialSettings,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const liveCms = resolveHomepageLiveStats(
    siteSocialSettings,
    {
      verifiedTutorsCount,
      onlineTutorsCount,
      activeCircularsCount,
    },
    lang
  );

  const allUpazilas: Upazila[] = ['All', ...MADARIPUR_UPAZILAS];
  const activeFiltersCount =
    (filters.upazila !== 'All' ? 1 : 0) +
    (filters.medium !== 'All' ? 1 : 0) +
    (filters.gender !== 'All' ? 1 : 0) +
    (filters.college !== 'All' ? 1 : 0) +
    (filters.maxBudget < 10000 ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0);

  const scrollToTutorDirectory = () => {
    const target =
      document.getElementById('tutor-console') ||
      document.getElementById('live-tutor-directory');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleQuickUpazilaTap = (upz: Upazila) => {
    onUpdateFilters({ upazila: upz });
    scrollToTutorDirectory();
  };

  return (
    <section
      data-testid="original-dashboard-hero"
      aria-label="Tutor Zone Dashboard Hero"
      className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-4 sm:space-y-5 overflow-x-hidden"
    >
      {/* Top Location Kicker + Utility Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
        <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-stone-700 dark:text-stone-300 min-w-0">
          <span aria-hidden="true" className="shrink-0">
            📍
          </span>
          <span className="truncate">{UI_COPY[lang].districtKicker}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onToggleLang(lang === 'en' ? 'bn' : 'en')}
            className="min-h-[38px] sm:min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-[#047857] shadow-2xs active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <span aria-hidden="true">🌐</span>
            <span>বাংলা / English</span>
          </button>

          <button
            type="button"
            onClick={onToggleShortlistedOnly}
            aria-pressed={shortlistedOnly}
            className={`min-h-[38px] sm:min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-2xs active:scale-[0.98] transition-all duration-200 cursor-pointer ${
              shortlistedOnly
                ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-400 text-amber-900 dark:text-amber-300'
                : 'bg-white dark:bg-stone-900 border-emerald-500/20 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-[#047857]'
            }`}
          >
            <span aria-hidden="true">{shortlistedOnly ? '❤️' : '🤍'}</span>
            <span>
              {lang === 'en'
                ? `Shortlisted (${shortlistCount})`
                : `পছন্দের তালিকা (${toBanglaNumber(shortlistCount)})`}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleDark}
            aria-pressed={darkMode}
            className="min-h-[38px] sm:min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-[#047857] shadow-2xs active:scale-[0.98] transition-all duration-200 cursor-pointer"
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

      {/* Main Dashboard Hero & Search/Area Filter Console */}
      <div className="relative rounded-3xl bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 p-4 sm:p-7 lg:p-8 shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl"
        />

        <div className="relative z-10 space-y-5">
          {/* Verification & Trust Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-500/30 dark:border-emerald-800/80 text-[#047857] dark:text-emerald-300 text-xs font-extrabold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>
                {lang === 'bn' &&
                liveCms.heroTopBadge1 ===
                  DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_1
                  ? '🛡️ ম্যানুয়াল এনআইডি ও বিশ্ববিদ্যালয় আইডি ভেরিফিকেশন'
                  : liveCms.heroTopBadge1}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/70 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span>
                {lang === 'bn' &&
                liveCms.heroTopBadge2 ===
                  DEFAULT_SITE_SOCIAL_SETTINGS.hero_top_badge_2
                  ? 'যাচাইকৃত অভিভাবক রিভিউ'
                  : liveCms.heroTopBadge2}
              </span>
            </span>
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-stone-900 dark:text-white leading-tight">
              {lang === 'bn' &&
              liveCms.heroTitle === DEFAULT_SITE_SOCIAL_SETTINGS.hero_title
                ? UI_COPY[lang].heroHeadline
                : liveCms.heroTitle}
            </h1>
            <div
              aria-hidden="true"
              className="mt-2.5 h-1.5 w-24 sm:w-32 rounded-full bg-gradient-to-r from-[#059669] via-[#047857] to-teal-400"
            />
          </div>

          {/* Search Bar & 1-Click Area & Hub Filter */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#FAF8F5] dark:bg-stone-800/70 border border-emerald-500/20 dark:border-stone-700/80 space-y-3 w-full max-w-full">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  aria-label="Search Tutor, Subject, or College"
                  placeholder={
                    lang === 'en'
                      ? 'Search Tutor, Subject, or College...'
                      : 'শিক্ষক, বিষয় বা কলেজের নাম দিয়ে খুঁজুন...'
                  }
                  value={filters.searchQuery}
                  onChange={(e) =>
                    onUpdateFilters({ searchQuery: e.target.value })
                  }
                  className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-base sm:text-sm rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-[#047857]"
                />
              </div>

              {(activeFiltersCount > 0 ||
                Boolean(filters.searchQuery.trim())) && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="min-h-[44px] inline-flex items-center gap-1 text-xs font-bold text-[#047857] dark:text-emerald-400 hover:underline px-2.5 py-2 whitespace-nowrap shrink-0 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Reset' : 'রিসেট'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                aria-expanded={isFilterOpen}
                className="min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white flex items-center gap-1.5 shrink-0 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
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

            {/* 1-Click Area & Hub Filter Horizontal Scroll Row */}
            <div className="pt-2 border-t border-stone-200/70 dark:border-stone-700/70">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {UI_COPY[lang].upazilaFilterLabel}
                </span>
              </div>

              <div className="relative w-full max-w-full overflow-hidden">
                <div
                  role="group"
                  aria-label="1-Click Area & Hub Filter"
                  className="flex items-center overflow-x-auto no-scrollbar flex-nowrap gap-2 pb-1 pr-6 w-full"
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
                            : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-[#047857]'
                        }`}
                      >
                        {lang === 'en'
                          ? UPAZILA_LABELS[upz].en
                          : UPAZILA_LABELS[upz].bn}
                      </button>
                    );
                  })}
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-[#FAF8F5] dark:from-stone-800 to-transparent"
                />
              </div>
            </div>

            {/* Expandable Advanced Filter Drawer */}
            {isFilterOpen && (
              <div className="pt-3 border-t border-stone-200 dark:border-stone-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label
                      htmlFor="hero-upazila-select"
                      className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1"
                    >
                      {lang === 'en' ? 'Upazila / Area Hub' : 'উপজেলা / এলাকা'}
                    </label>
                    <select
                      id="hero-upazila-select"
                      value={filters.upazila}
                      onChange={(e) =>
                        onUpdateFilters({ upazila: e.target.value as Upazila })
                      }
                      className="w-full min-h-[42px] py-2 px-2.5 text-base sm:text-xs font-semibold rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                    >
                      {allUpazilas.map((u) => (
                        <option key={u} value={u}>
                          {lang === 'en'
                            ? UPAZILA_LABELS[u].en
                            : UPAZILA_LABELS[u].bn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="hero-medium-select"
                      className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1"
                    >
                      {lang === 'en' ? 'Medium / Category' : 'মিডিয়াম / বিভাগ'}
                    </label>
                    <select
                      id="hero-medium-select"
                      value={filters.medium}
                      onChange={(e) =>
                        onUpdateFilters({
                          medium: e.target.value as MediumCategory,
                        })
                      }
                      className="w-full min-h-[42px] py-2 px-2.5 text-base sm:text-xs font-semibold rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                    >
                      {MEDIUM_CATEGORIES.map((m) => (
                        <option key={m} value={m}>
                          {lang === 'en' ? m : MEDIUM_LABELS_BN[m]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                      {lang === 'en' ? 'Tutor Gender' : 'শিক্ষকের লিঙ্গ'}
                    </span>
                    <div
                      role="group"
                      aria-label="Tutor gender filter"
                      className="grid grid-cols-3 p-0.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700"
                    >
                      {(['All', 'Male', 'Female'] as const).map((g) => {
                        const active = filters.gender === g;
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => onUpdateFilters({ gender: g })}
                            className={`min-h-[38px] py-1 text-xs font-semibold rounded-md active:scale-[0.98] transition-all cursor-pointer ${
                              active
                                ? 'bg-[#047857] text-white shadow-xs'
                                : 'text-stone-600 dark:text-stone-300'
                            }`}
                          >
                            {lang === 'en'
                              ? g
                              : g === 'All'
                              ? 'সবাই'
                              : g === 'Male'
                              ? 'পুরুষ'
                              : 'মহিলা'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-stone-200/70 dark:border-stone-700/70 items-center">
                  <div className="md:col-span-8 min-w-0 max-w-full">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                      {lang === 'en'
                        ? 'Institution / College'
                        : 'প্রতিষ্ঠান / কলেজ'}
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      {COLLEGE_TAGS.map((col) => {
                        const active = filters.college === col;
                        return (
                          <button
                            key={col}
                            type="button"
                            onClick={() => onUpdateFilters({ college: col })}
                            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border shrink-0 whitespace-nowrap active:scale-[0.98] transition-all cursor-pointer ${
                              active
                                ? 'bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-300 font-bold'
                                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            {lang === 'en'
                              ? col === 'All'
                                ? 'All Institutions'
                                : col
                              : COLLEGE_LABELS_BN[col]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 inline-flex items-center gap-1">
                        <SlidersHorizontal className="w-3 h-3" />
                        <span>{lang === 'en' ? 'Max Fee' : 'সর্বোচ্চ বেতন'}</span>
                      </span>
                      <span className="font-mono-num font-bold text-[#047857] dark:text-emerald-400">
                        {formatBDT(filters.maxBudget, lang)}/mo
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2000}
                      max={10000}
                      step={500}
                      value={filters.maxBudget}
                      onChange={(e) =>
                        onUpdateFilters({ maxBudget: Number(e.target.value) })
                      }
                      className="w-full h-1.5 accent-[#047857] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 w-full">
            <button
              type="button"
              onClick={scrollToTutorDirectory}
              className="min-h-[44px] max-w-full inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white text-xs sm:text-sm font-extrabold shadow-xs active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'en'
                  ? '📖 Explore Verified Tutors'
                  : '📖 যাচাইকৃত টিউটর খুঁজুন'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenTutorUploadDesk}
              className="min-h-[44px] max-w-full inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-white border border-stone-200 dark:border-stone-700 text-xs sm:text-sm font-extrabold active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0" />
              <span>{lang === 'en' ? 'Profile →' : 'প্রোফাইল →'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenGuardianModal}
              className="min-h-[44px] max-w-full text-left inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/70 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 text-xs sm:text-sm font-extrabold active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                {lang === 'en'
                  ? 'Hire a Verified Tutor (For Guardians)'
                  : 'ভেরিফাইড টিউটর নিন (অভিভাবকদের জন্য)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* LIVE PLATFORM TRUST STRIP (Dynamic Real-Time or Manual Admin Counters + Pulse Indicators) */}
      <div
        data-testid="live-platform-trust-strip"
        role="region"
        aria-label="Live Platform Trust Strip"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3"
      >
        {/* Counter 1: Verified Tutors */}
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 p-3.5 sm:p-4 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#059669] to-[#047857] text-white flex items-center justify-center shrink-0 shadow-xs">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black font-mono-num text-stone-900 dark:text-white">
                {liveCms.verifiedTutorsDisplay}
              </span>
              <span
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
                aria-hidden="true"
              />
            </div>
            <span className="block text-[11px] sm:text-xs font-bold text-stone-600 dark:text-stone-400 truncate">
              {lang === 'en' ? 'Verified Tutors' : 'ভেরিফাইড টিউটর'}
            </span>
          </div>
        </div>

        {/* Counter 2: Online Tutors */}
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 p-3.5 sm:p-4 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#059669] to-[#047857] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Laptop className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black font-mono-num text-stone-900 dark:text-white">
                {liveCms.onlineTutorsDisplay}
              </span>
              <span
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
                aria-hidden="true"
              />
            </div>
            <span className="block text-[11px] sm:text-xs font-bold text-stone-600 dark:text-stone-400 truncate">
              {lang === 'en' ? 'Online Tutors' : 'অনলাইন টিউটর'}
            </span>
          </div>
        </div>

        {/* Counter 3: Active Tuition Circulars */}
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 p-3.5 sm:p-4 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#059669] to-[#047857] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black font-mono-num text-stone-900 dark:text-white">
                {liveCms.activeCircularsDisplay}
              </span>
              <span
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
                aria-hidden="true"
              />
            </div>
            <span className="block text-[11px] sm:text-xs font-bold text-stone-600 dark:text-stone-400 truncate">
              {lang === 'en'
                ? 'Active Tuition Circulars'
                : 'চলমান টিউশনি সার্কুলার'}
            </span>
          </div>
        </div>

        {/* Counter 4 (Trust Card 3): Smart NID Verified */}
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 p-3.5 sm:p-4 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#059669] to-[#047857] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black font-mono-num text-[#047857] dark:text-emerald-400">
                {liveCms.trustCard3Value}
              </span>
              <span
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
                aria-hidden="true"
              />
            </div>
            <span className="block text-[11px] sm:text-xs font-bold text-stone-600 dark:text-stone-400 truncate">
              {liveCms.trustCard3Label}
            </span>
          </div>
        </div>

        {/* Counter 5 (Trust Card 4): Fast Guardian Matching */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 p-3.5 sm:p-4 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#059669] to-[#047857] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black font-mono-num text-stone-900 dark:text-white">
                {liveCms.trustCard4Value}
              </span>
              <span
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
                aria-hidden="true"
              />
            </div>
            <span className="block text-[11px] sm:text-xs font-bold text-stone-600 dark:text-stone-400 truncate">
              {liveCms.trustCard4Label}
            </span>
          </div>
        </div>
      </div>

      {/* DUAL QUICK-ACTION HERO PANEL (For Guardians & For Tutors) */}
      <div
        data-testid="dual-quick-action-panel"
        className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4"
      >
        {/* Left Card: For Guardians */}
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 p-4 sm:p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-[#047857] dark:text-emerald-300 border border-emerald-500/25">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'en' ? 'For Guardians' : 'অভিভাবকদের জন্য'}</span>
              </span>
              <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                {lang === 'bn' &&
                liveCms.guardianCardBadge ===
                  DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_badge
                  ? '২টি ফ্রি ট্রায়াল ক্লাস'
                  : liveCms.guardianCardBadge}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white">
              {lang === 'bn' &&
              liveCms.guardianCardTitle ===
                DEFAULT_SITE_SOCIAL_SETTINGS.guardian_card_title
                ? 'আপনার সন্তানের জন্য ভেরিফাইড হোম/অনলাইন টিউটর প্রয়োজন?'
                : liveCms.guardianCardTitle}
            </h2>

            {/* Quick Upazila Filter Chips */}
            <div>
              <span className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                {lang === 'en'
                  ? 'Quick Upazila Filter:'
                  : 'উপজেলা অনুযায়ী দ্রুত খুঁজুন:'}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {MADARIPUR_UPAZILAS.map((upz) => {
                  const isSelected = filters.upazila === upz;
                  return (
                    <button
                      key={upz}
                      type="button"
                      onClick={() => handleQuickUpazilaTap(upz)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border active:scale-[0.98] transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#059669] to-[#047857] text-white border-[#047857] shadow-2xs'
                          : 'bg-[#FAF8F5] dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-emerald-500/20 dark:border-stone-700 hover:border-[#047857]'
                      }`}
                    >
                      <MapPin className="w-3 h-3 text-[#059669] dark:text-emerald-400 shrink-0" />
                      <span>
                        {lang === 'en'
                          ? UPAZILA_LABELS[upz].en
                          : UPAZILA_LABELS[upz].bn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenGuardianModal}
              className="min-h-[44px] flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white text-xs sm:text-sm font-extrabold shadow-sm active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'en' ? 'Request a Tutor' : 'টিউটর রিকোয়েস্ট পাঠান'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Card: For Tutors */}
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 p-4 sm:p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-[#047857] dark:text-emerald-300 border border-emerald-500/25">
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {lang === 'en' ? 'For Tutors & Scholars' : 'টিউটরদের জন্য'}
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-[#047857] dark:text-emerald-300 border border-emerald-500/25 font-mono-num">
                <span
                  className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
                  aria-hidden="true"
                />
                <span>
                  {lang === 'en'
                    ? `${liveCms.activeCircularsDisplay} Active Circulars Live`
                    : `${liveCms.activeCircularsDisplay}টি চলমান সার্কুলার`}
                </span>
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white">
              {lang === 'bn' &&
              liveCms.tutorCardTitle ===
                DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_title
                ? 'মাদারীপুরে টিউশনি খুঁজছেন?'
                : liveCms.tutorCardTitle}
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {lang === 'bn' &&
              liveCms.tutorCardDesc ===
                DEFAULT_SITE_SOCIAL_SETTINGS.tutor_card_desc
                ? 'আপনার স্মার্ট এনআইডি ও স্টুডেন্ট আইডি ভেরিফাই করে ভেরিফাইড ব্যাজ পান এবং সরাসরি চলমান টিউশনি সার্কুলারে আবেদন করুন।'
                : liveCms.tutorCardDesc}
            </p>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (onOpenTuitionCircularsDesk) {
                  onOpenTuitionCircularsDesk();
                } else {
                  scrollToTutorDirectory();
                }
              }}
              className="min-h-[44px] flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white text-xs sm:text-sm font-extrabold shadow-sm active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'en'
                  ? 'Browse Tuition Circulars'
                  : 'টিউশনি সার্কুলার দেখুন'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenTutorUploadDesk}
              className="min-h-[44px] flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-[#047857] dark:text-emerald-300 border border-emerald-500/30 text-xs sm:text-sm font-extrabold active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'en' ? 'Upload Profile' : 'প্রোফাইল আপলোড করুন'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* HOW TUTOR ZONE WORKS (3 SIMPLE STEPS) VISUAL RIBBON */}
      <div
        data-testid="how-tutor-zone-works-ribbon"
        role="region"
        aria-label="How Tutor Zone Works (3 Simple Steps)"
        className="rounded-2xl bg-white dark:bg-stone-900 border border-emerald-500/20 dark:border-stone-800 p-4 sm:p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          <div className="inline-flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/80 text-[#047857] dark:text-emerald-300 border border-emerald-500/25">
              {lang === 'en' ? 'How Tutor Zone Works' : 'টিউটর জোন যেভাবে কাজ করে'}
            </span>
            <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-white">
              {lang === 'en'
                ? 'How Tutor Zone Works (3 Simple Steps)'
                : 'মাত্র ৩টি সহজ ধাপে নিশ্চিত টিউটর ও টিউশনি'}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-stone-800/70 border border-emerald-500/20 flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#059669] to-[#047857] text-white font-mono-num text-xs font-extrabold flex items-center justify-center shrink-0 shadow-2xs">
              1
            </span>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-white">
                {lang === 'en'
                  ? '1. Search or Request a Tutor'
                  : '১. টিউটর খুঁজুন বা রিকোয়েস্ট পাঠান'}
              </h4>
              <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed">
                {lang === 'en'
                  ? 'Filter tutors by Upazila, college, or budget—or submit a free Guardian Tutor Request in 60 seconds.'
                  : 'উপজেলা, কলেজ ও বাজেট অনুযায়ী টিউটর খুঁজুন অথবা অভিভাবক রিকোয়েস্ট ফর্ম পূরণ করুন।'}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-stone-800/70 border border-emerald-500/20 flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#059669] to-[#047857] text-white font-mono-num text-xs font-extrabold flex items-center justify-center shrink-0 shadow-2xs">
              2
            </span>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-white">
                {lang === 'en'
                  ? '2. Smart NID & ID Audit'
                  : '২. স্মার্ট এনআইডি ও আইডি যাচাই'}
              </h4>
              <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed">
                {lang === 'en'
                  ? 'Every tutor profile is manually audited with Smart NID and University/College ID before badge activation.'
                  : 'প্রত্যেক টিউটরের স্মার্ট এনআইডি ও স্টুডেন্ট আইডি অ্যাডমিন কর্তৃক শতভাগ যাচাই করা হয়।'}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-stone-800/70 border border-emerald-500/20 flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#059669] to-[#047857] text-white font-mono-num text-xs font-extrabold flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-white">
                {lang === 'en'
                  ? '3. Book 2 Free Trial Classes'
                  : '৩. ২টি ফ্রি ট্রায়াল ক্লাস বুক করুন'}
              </h4>
              <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed">
                {lang === 'en'
                  ? 'Evaluate teaching quality with 2 free trial sessions before confirming monthly tuition.'
                  : 'মাসিক টিউশনি চূড়ান্ত করার আগে ২টি ফ্রি ট্রায়াল ক্লাস নিয়ে শিক্ষকের মান যাচাই করুন।'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default BentoHero;
