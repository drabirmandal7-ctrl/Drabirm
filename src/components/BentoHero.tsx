import React, { useState } from 'react';
import {
  BookOpen,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  UserCheck,
  Users,
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
import { formatBDT, toBanglaNumber } from '../utils/tutorEngine';

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
}

const COLLEGE_TAGS: CollegeTag[] = [
  'All',
  'Govt. Nazimuddin College',
  'Madaripur Govt. College',
  'DU',
  'BUET',
  'Medical',
];

const COLLEGE_LABELS_BN: Record<CollegeTag, string> = {
  All: 'সকল প্রতিষ্ঠান',
  'Govt. Nazimuddin College': 'সরকারি নাজিমউদ্দিন কলেজ',
  'Madaripur Govt. College': 'মাদারীপুর সরকারি কলেজ',
  DU: 'ঢাকা বিশ্ববিদ্যালয় (DU)',
  BUET: 'বুয়েট (BUET)',
  Medical: 'মেডিকেল কলেজ',
};

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
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  return (
    <section
      data-testid="original-dashboard-hero"
      aria-label="Tutor Zone Dashboard Hero"
      className="max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6"
    >
      {/* Top Location Kicker + Utility Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-[#047857] shadow-2xs transition-all cursor-pointer"
          >
            <span aria-hidden="true">🌐</span>
            <span>বাংলা / English</span>
          </button>

          <button
            type="button"
            onClick={onToggleShortlistedOnly}
            aria-pressed={shortlistedOnly}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-2xs transition-all cursor-pointer ${
              shortlistedOnly
                ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-400 text-amber-900 dark:text-amber-300'
                : 'bg-white dark:bg-stone-900 border-stone-200/90 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-[#047857]'
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-[#047857] shadow-2xs transition-all cursor-pointer"
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
      <div className="relative rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 sm:p-7 lg:p-8 shadow-sm overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl"
        />

        <div className="relative z-10 space-y-5">
          {/* Verification & Trust Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/90 dark:border-emerald-800/80 text-[#047857] dark:text-emerald-300 text-xs font-extrabold">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>
                {lang === 'en'
                  ? '🛡️ Manual NID & University ID Verification Workflow'
                  : '🛡️ ম্যানুয়াল এনআইডি ও বিশ্ববিদ্যালয় আইডি ভেরিফিকেশন'}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/70 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span>
                {lang === 'en'
                  ? 'Verified Guardian Reviews'
                  : 'যাচাইকৃত অভিভাবক রিভিউ'}
              </span>
            </span>
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-stone-900 dark:text-white leading-tight">
              {UI_COPY[lang].heroHeadline}
            </h1>
            <div
              aria-hidden="true"
              className="mt-2.5 h-1.5 w-24 sm:w-32 rounded-full bg-gradient-to-r from-[#047857] via-emerald-500 to-teal-400"
            />
          </div>

          {/* Search Bar & 1-Click Area & Hub Filter */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#FAF8F5] dark:bg-stone-800/70 border border-stone-200/90 dark:border-stone-700/80 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
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
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-[#047857]"
                />
              </div>

              {(activeFiltersCount > 0 ||
                Boolean(filters.searchQuery.trim())) && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#047857] dark:text-emerald-400 hover:underline px-2 py-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Reset' : 'রিসেট'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                aria-expanded={isFilterOpen}
                className="px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer"
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

              <div className="relative">
                <div
                  role="group"
                  aria-label="1-Click Area & Hub Filter"
                  className="flex items-center overflow-x-auto no-scrollbar flex-nowrap gap-2 pb-1 pr-6"
                >
                  {allUpazilas.map((upz) => {
                    const active = filters.upazila === upz;
                    return (
                      <button
                        key={upz}
                        type="button"
                        onClick={() => onUpdateFilters({ upazila: upz })}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-full shrink-0 whitespace-nowrap transition-all cursor-pointer border ${
                          active
                            ? 'bg-[#047857] text-white border-[#047857] shadow-xs'
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
                      className="w-full py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
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
                      className="w-full py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
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
                            className={`py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
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
                  <div className="md:col-span-8">
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
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border shrink-0 whitespace-nowrap cursor-pointer ${
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
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={scrollToTutorDirectory}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs sm:text-sm font-extrabold shadow-xs transition-all cursor-pointer"
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
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-white border border-stone-200 dark:border-stone-700 text-xs sm:text-sm font-extrabold transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0" />
              <span>{lang === 'en' ? 'Profile →' : 'প্রোফাইল →'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenGuardianModal}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/70 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 text-xs sm:text-sm font-extrabold transition-all cursor-pointer"
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
    </section>
  );
};
export default BentoHero;
