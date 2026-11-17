import React, { useEffect, useState } from 'react';
import {
  MADARIPUR_UPAZILAS,
  UPAZILA_LABELS,
} from '../data/madaripurData';
import {
  CircularApplicationRow,
  Language,
  MediumCategory,
  TrialBookingRecord,
  TuitionJob,
  TutoringMode,
  TutorProfile,
  TutorReview,
  Upazila,
  VerificationRequest,
} from '../types/madaripur';
import {
  ADMIN_REJECTION_QUICK_REASONS,
  CircularApplicationInput,
  DUPLICATE_CIRCULAR_APPLICATION_MESSAGE,
  UNVERIFIED_TUTOR_APPLY_TOAST_MESSAGE,
  UserAccount,
  extractAdminNoteFromApplication,
  extractMediaFeeFromApplication,
  findApplicantFullTutorProfile,
  formatBDT,
  getCleanApplicantExperienceNote,
  hasTutorAlreadyAppliedToCircular,
  isAuthorizedAdminAccount,
  isTutorAccountRestricted,
  isTutorProfileVerifiedForApplication,
  toBanglaNumber,
  validateCircularApplicationInput,
  validatePhoneBD,
  verifyAdminPin,
} from '../utils/tutorEngine';
import { TutorPortraitSvg } from './TutorPortraitSvg';
import {
  Award,
  CalendarCheck,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Lock,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

/* ============================================================================
   1. FULL PROFILE & GUARDIAN REVIEWS MODAL
   ============================================================================ */
interface FullProfileModalProps {
  lang: Language;
  tutor: TutorProfile | null;
  onClose: () => void;
  onBookTrial: (tutor: TutorProfile) => void;
  onAddReview: (tutorId: string, review: TutorReview) => void;
  onDeleteReview: (tutorId: string, reviewId: string) => void;
}

export const FullProfileModal: React.FC<FullProfileModalProps> = ({
  lang,
  tutor,
  onClose,
  onBookTrial,
  onAddReview,
  onDeleteReview,
}) => {
  const [guardianName, setGuardianName] = useState('');
  const [guardianArea, setGuardianArea] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [hiredSubject, setHiredSubject] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  if (!tutor) return null;

  const isVerified = tutor.nidVerified && tutor.uniIdVerified;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardianName.trim() || !comment.trim()) {
      setReviewError(
        lang === 'en'
          ? 'Please enter the guardian name and a written review.'
          : 'অনুগ্রহ করে অভিভাবকের নাম ও লিখিত রিভিউ প্রদান করুন।'
      );
      return;
    }

    const newRev: TutorReview = {
      id: `rev-${Date.now()}`,
      guardianName: guardianName.trim(),
      guardianArea: guardianArea.trim() || 'Madaripur Sadar',
      studentClass: studentClass.trim() || 'HSC / SSC',
      hiredSubject: hiredSubject.trim() || tutor.subjectsEn[0],
      rating,
      date: 'October 2026',
      commentEn: comment.trim(),
      commentBn: comment.trim(),
      verifiedHire: true,
    };

    onAddReview(tutor.id, newRev);
    setGuardianName('');
    setComment('');
    setReviewError('');
    setReviewSuccess(true);
  };

  // Compute star distribution (5 down to 1)
  const starCounts = [5, 4, 3, 2, 1].map((starVal) => {
    const count = tutor.reviews.filter(
      (r) => Math.round(r.rating) === starVal
    ).length;
    const pct =
      tutor.reviews.length > 0
        ? Math.round((count / tutor.reviews.length) * 100)
        : 0;
    return { starVal, count, pct };
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close profile modal"
          className="absolute top-5 right-5 p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 pr-10">
          {tutor.profilePhotoUrl ? (
            <img
              src={tutor.profilePhotoUrl}
              alt={`Verified photo of ${tutor.nameEn}`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover border-2 border-[#047857]/40 shrink-0 shadow-xs"
            />
          ) : (
            <TutorPortraitSvg
              variant={tutor.portraitVariant}
              className="w-20 h-20"
            />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold mb-1">
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-[#047857] dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {lang === 'en'
                      ? 'Verified Educator (NID & University ID)'
                      : 'ভেরিফায়েড শিক্ষক (এনআইডি ও বিশ্ববিদ্যালয় আইডি)'}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>
                    {lang === 'en'
                      ? 'Verification Pending Admin Review'
                      : 'অ্যাডমিন ভেরিফিকেশন পেন্ডিং'}
                  </span>
                </span>
              )}
            </div>

            <h2
              id="profile-modal-title"
              className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-white"
            >
              {lang === 'en' ? tutor.nameEn : tutor.nameBn}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-0.5">
              {lang === 'en' ? tutor.departmentEn : tutor.departmentBn} ·{' '}
              {lang === 'en'
                ? tutor.institutionFullEn
                : tutor.institutionFullBn}
            </p>
          </div>
        </div>

        {/* Academic & Verification Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 p-4 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 text-xs">
          <div>
            <span className="text-stone-500 dark:text-stone-400 block">
              {lang === 'en' ? 'Average Rating' : 'গড় স্টার রেটিং'}
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono-num inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {tutor.rating.toFixed(2)} ({tutor.totalReviews})
            </span>
          </div>
          <div>
            <span className="text-stone-500 dark:text-stone-400 block">
              {lang === 'en' ? 'HSC & SSC' : 'এইচএসসি ও এসএসসি'}
            </span>
            <span className="font-bold text-stone-900 dark:text-white font-mono-num">
              {tutor.hscGpa}
            </span>
          </div>
          <div>
            <span className="text-stone-500 dark:text-stone-400 block">
              {lang === 'en' ? 'Students Mentored' : 'শিক্ষার্থী সংখ্যা'}
            </span>
            <span className="font-bold text-[#047857] dark:text-emerald-400 font-mono-num">
              {lang === 'bn'
                ? `${toBanglaNumber(tutor.studentsTaught)} জন`
                : `${tutor.studentsTaught} Students`}
            </span>
          </div>
          <div>
            <span className="text-stone-500 dark:text-stone-400 block">
              {lang === 'en' ? 'Monthly Fee' : 'মাসিক সম্মানী'}
            </span>
            <span className="font-bold text-stone-900 dark:text-white font-mono-num">
              {formatBDT(tutor.monthlyFee, lang)}
            </span>
          </div>
        </div>

        {/* Teaching Details */}
        <div className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 mb-6">
          <p>{lang === 'en' ? tutor.bioEn : tutor.bioBn}</p>
          <div>
            <strong className="text-stone-900 dark:text-white">
              {lang === 'en' ? 'Preferred Classes: ' : 'পড়ানোর শ্রেণি: '}
            </strong>
            {lang === 'en'
              ? tutor.preferredClassesEn
              : tutor.preferredClassesBn}
          </div>
          <div>
            <strong className="text-stone-900 dark:text-white">
              {lang === 'en' ? 'Schedule Availability: ' : 'সময়সূচি: '}
            </strong>
            {lang === 'en' ? tutor.availableDaysEn : tutor.availableDaysBn}
          </div>
          <div>
            <strong className="text-stone-900 dark:text-white">
              {lang === 'en'
                ? 'Covered Madaripur Landmarks: '
                : 'মাদারীপুরের যেসব এলাকায় পড়ান: '}
            </strong>
            {(lang === 'en'
              ? tutor.coveredAreasEn
              : tutor.coveredAreasBn
            ).join(' · ')}
          </div>
        </div>

        {/* VISIBLE AVERAGE RATING & STAR BREAKDOWN SUMMARY */}
        <div className="p-4 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-4 text-center sm:text-left sm:border-r border-stone-200 dark:border-stone-700 sm:pr-4">
              <div className="text-3xl font-extrabold font-mono-num text-stone-900 dark:text-white">
                {lang === 'bn'
                  ? toBanglaNumber(tutor.rating.toFixed(2))
                  : tutor.rating.toFixed(2)}
                <span className="text-sm font-normal text-stone-400">
                  {' '}
                  / 5.0
                </span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-0.5 my-1">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <Star
                    key={idx}
                    className={`w-4 h-4 ${
                      idx <= Math.round(tutor.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-300 dark:text-stone-600'
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400">
                {lang === 'en'
                  ? `Based on ${tutor.totalReviews} hired guardian reviews`
                  : `${toBanglaNumber(tutor.totalReviews)} জন অভিভাবকের মূল্যায়ন`}
              </div>
            </div>

            <div className="sm:col-span-8 space-y-1.5">
              {starCounts.map((row) => (
                <div
                  key={row.starVal}
                  className="flex items-center gap-2 text-xs font-mono-num"
                >
                  <span className="w-8 text-stone-600 dark:text-stone-300 font-semibold">
                    {row.starVal} ★
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-stone-500">
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ADD GUARDIAN STAR RATING & WRITTEN REVIEW FORM */}
        <form
          onSubmit={handleReviewSubmit}
          className="p-4 sm:p-5 rounded-xl bg-white dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 mb-6"
        >
          <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white mb-3">
            {lang === 'en'
              ? 'Leave a Star Rating & Written Review (Guardians Who Hired This Tutor)'
              : 'এই শিক্ষকের পাঠদান সম্পর্কে আপনার স্টার রেটিং ও লিখিত রিভিউ দিন'}
          </h4>

          {/* Interactive 1 to 5 Star Rating Selector */}
          <div className="mb-3.5">
            <span className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              {lang === 'en'
                ? 'Select Star Rating (1 to 5 Stars)'
                : 'স্টার রেটিং নির্বাচন করুন (১ থেকে ৫ স্টার)'}
            </span>
            <div
              role="group"
              aria-label="Star rating selector"
              className="flex flex-wrap items-center gap-2"
            >
              {[1, 2, 3, 4, 5].map((starValue) => {
                const active = rating >= starValue;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    aria-label={`Rate ${starValue} out of 5 stars`}
                    aria-pressed={rating === starValue}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      rating === starValue
                        ? 'bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-300'
                        : 'bg-[#FAF8F5] dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        active
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-300'
                      }`}
                    />
                    <span className="font-mono-num">{starValue}.0</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-2.5">
            <div>
              <label
                htmlFor="rev-guardian-name"
                className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1"
              >
                {lang === 'en' ? 'Guardian Name' : 'অভিভাবকের নাম'}
              </label>
              <input
                id="rev-guardian-name"
                type="text"
                placeholder="e.g. Rahim Hosen"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="rev-guardian-area"
                className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1"
              >
                {lang === 'en' ? 'Madaripur Area' : 'এলাকা / উপজেলা'}
              </label>
              <input
                id="rev-guardian-area"
                type="text"
                placeholder={lang === 'en' ? 'e.g. Madaripur Sadar' : 'যেমনঃ মাদারীপুর সদর'}
                value={guardianArea}
                onChange={(e) => setGuardianArea(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="rev-subject"
                className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1"
              >
                {lang === 'en' ? 'Hired Subject & Class' : 'পড়ানোর বিষয় ও শ্রেণি'}
              </label>
              <input
                id="rev-subject"
                type="text"
                placeholder={lang === 'en' ? 'e.g. Class 9 Physics' : 'যেমনঃ ৯ম শ্রেণি পদার্থবিজ্ঞান'}
                value={hiredSubject}
                onChange={(e) => setHiredSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
              />
            </div>
          </div>

          <div className="mb-3">
            <label
              htmlFor="rev-written-comment"
              className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1"
            >
              {lang === 'en'
                ? 'Written Review (Punctuality, Teaching Clarity & Student Progress)'
                : 'লিখিত রিভিউ (শিক্ষকের সময়নিষ্ঠা ও পাঠদান কৌশল)'}
            </label>
            <textarea
              id="rev-written-comment"
              rows={2}
              placeholder={
                lang === 'en'
                  ? 'e.g. Very punctual and explains concepts clearly.'
                  : 'যেমনঃ সময়নিষ্ঠ এবং খুব সুন্দরভাবে বোঝান।'
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              {reviewError && (
                <p className="text-xs text-red-600 font-semibold">
                  {reviewError}
                </p>
              )}
              {reviewSuccess && (
                <p className="text-xs text-[#047857] dark:text-emerald-400 font-semibold">
                  {lang === 'en'
                    ? 'Review published! Average rating updated on profile card and modal.'
                    : 'রিভিউ প্রকাশিত হয়েছে! গড় রেটিং আপডেট করা হয়েছে।'}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold whitespace-nowrap shrink-0"
            >
              {lang === 'en'
                ? 'Publish Rating & Review'
                : 'রেটিং ও রিভিউ প্রকাশ করুন'}
            </button>
          </div>
        </form>

        {/* Guardian Reviews List */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 mb-6">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>
              {lang === 'en'
                ? `Guardian Reviews (${tutor.reviews.length})`
                : `অভিভাবকদের লিখিত রিভিউ (${toBanglaNumber(tutor.reviews.length)})`}
            </span>
          </h3>

          <div className="space-y-3">
            {tutor.reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-stone-900 dark:text-white">
                      {rev.guardianName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-stone-500">{rev.guardianArea}</span>
                    {rev.hiredSubject && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#047857] dark:text-emerald-400 font-medium">
                          {rev.hiredSubject}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-mono-num font-bold text-amber-600 dark:text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {rev.rating.toFixed(1)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteReview(tutor.id, rev.id)}
                      aria-label={`Delete review by ${rev.guardianName}`}
                      className="p-1 rounded text-stone-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                  {lang === 'en' ? rev.commentEn : rev.commentBn}
                </p>
                <div className="text-[11px] text-stone-400 mt-1">
                  {rev.studentClass} · {rev.date}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer Action */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300"
          >
            {lang === 'en' ? 'Close' : 'বন্ধ করুন'}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onBookTrial(tutor);
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>
              {lang === 'en'
                ? 'Book 2 Free Trial Classes'
                : '২টি ফ্রি ট্রায়াল ক্লাস বুক করুন'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   2. BOOK 2 FREE TRIAL CLASSES MODAL
   ============================================================================ */
interface BookTrialModalProps {
  lang: Language;
  tutor: TutorProfile | null;
  onClose: () => void;
  onConfirmBooking: (booking: TrialBookingRecord) => void;
}

export const BookTrialModal: React.FC<BookTrialModalProps> = ({
  lang,
  tutor,
  onClose,
  onConfirmBooking,
}) => {
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [landmark, setLandmark] = useState('');
  const [preferredStart, setPreferredStart] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedRecord, setSubmittedRecord] =
    useState<TrialBookingRecord | null>(null);

  if (!tutor) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardianName.trim()) {
      setErrorMsg(
        lang === 'en'
          ? 'Please enter the guardian or student name.'
          : 'অনুগ্রহ করে অভিভাবক বা শিক্ষার্থীর নাম লিখুন।'
      );
      return;
    }
    if (!validatePhoneBD(guardianPhone)) {
      setErrorMsg(
        lang === 'en'
          ? 'Please enter a valid 11-digit Bangladesh mobile number (e.g. 01308937770).'
          : 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01308937770)।'
      );
      return;
    }
    if (!landmark.trim()) {
      setErrorMsg(
        lang === 'en'
          ? 'Please specify your house/road landmark in Madaripur.'
          : 'মাদারীপুরে আপনার বাসা বা ল্যান্ডমার্ক উল্লেখ করুন।'
      );
      return;
    }

    const record: TrialBookingRecord = {
      id: `TRL-${Math.floor(1000 + Math.random() * 9000)}`,
      tutorId: tutor.id,
      tutorName: tutor.nameEn,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      studentClass,
      upazila: tutor.upazila,
      landmark: landmark.trim(),
      preferredStart,
      createdAt: 'Just now',
    };

    setErrorMsg('');
    setSubmittedRecord(record);
    onConfirmBooking(record);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close trial booking modal"
          className="absolute top-5 right-5 p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {submittedRecord ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-[#047857] dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2
              id="trial-modal-title"
              className="text-xl font-extrabold text-stone-900 dark:text-white mb-1"
            >
              {lang === 'en'
                ? '2 Free Trial Classes Confirmed!'
                : '২টি ফ্রি ট্রায়াল ক্লাস বুকিং সম্পন্ন হয়েছে!'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mb-4">
              {lang === 'en'
                ? `Booking Ref ${submittedRecord.id} sent to ${tutor.nameEn}. Typical response time: ${tutor.responseTimeEn}.`
                : `বুকিং রেফারেন্স ${submittedRecord.id} সফলভাবে ${tutor.nameBn}-এর কাছে পাঠানো হয়েছে।`}
            </p>
            <div className="text-left p-4 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs space-y-1 mb-5">
              <div>
                <strong>Guardian:</strong> {submittedRecord.guardianName} (
                {submittedRecord.guardianPhone})
              </div>
              <div>
                <strong>Class & Landmark:</strong>{' '}
                {submittedRecord.studentClass} · {submittedRecord.landmark}
              </div>
              <div>
                <strong>First Trial Slot:</strong>{' '}
                {submittedRecord.preferredStart}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#047857] text-white text-xs font-semibold"
            >
              {lang === 'en' ? 'Done' : 'সম্পন্ন'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="text-xs font-semibold text-[#047857] dark:text-emerald-400 mb-1">
              {lang === 'en'
                ? 'Zero-Obligation 2-Day Demo Classes'
                : 'কোনো অগ্রিম চার্জ ছাড়াই ২টি ডেমো ক্লাস'}
            </div>
            <h2
              id="trial-modal-title"
              className="text-xl font-extrabold text-stone-900 dark:text-white mb-1"
            >
              {lang === 'en'
                ? `Book 2 Free Trial Classes with ${tutor.nameEn}`
                : `${tutor.nameBn}-এর সাথে ২টি ফ্রি ট্রায়াল ক্লাস`}
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-5">
              {lang === 'en'
                ? `Monthly Fee after trial: ${formatBDT(tutor.monthlyFee, lang)}/mo · Status: ${tutor.verificationCode}`
                : `ট্রায়াল পরবর্তী মাসিক সম্মানী: ${formatBDT(tutor.monthlyFee, lang)}/মাস`}
            </p>

            <div className="space-y-3.5 mb-5">
              <div>
                <label
                  htmlFor="trial-guardian-name"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en'
                    ? 'Guardian Full Name'
                    : 'অভিভাবকের পূর্ণ নাম'}
                </label>
                <input
                  id="trial-guardian-name"
                  type="text"
                  placeholder="e.g. Rahim Hosen"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="trial-guardian-phone"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en'
                      ? 'Mobile Number (11 Digits)'
                      : 'মোবাইল নম্বর (১১ ডিজিট)'}
                  </label>
                  <input
                    id="trial-guardian-phone"
                    type="tel"
                    placeholder="01308937770"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num"
                  />
                </div>

                <div>
                  <label
                    htmlFor="trial-student-class"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en'
                      ? 'Student Class / Exam'
                      : 'শিক্ষার্থীর শ্রেণি'}
                  </label>
                  <input
                    id="trial-student-class"
                    type="text"
                    placeholder={lang === 'en' ? 'e.g. Class 8' : 'যেমনঃ ৮ম শ্রেণি'}
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="trial-landmark"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en'
                    ? 'House / Road Landmark in Madaripur'
                    : 'মাদারীপুরে বাসার ঠিকানা ও ল্যান্ডমার্ক'}
                </label>
                <input
                  id="trial-landmark"
                  type="text"
                  placeholder={lang === 'en' ? 'e.g. Lake Par, Ward 4' : 'যেমনঃ লেক পাড়, ওয়ার্ড ৪'}
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="trial-slot"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en'
                    ? 'Preferred Trial Day & Time'
                    : 'ট্রায়াল ক্লাসের পছন্দের দিন ও সময়'}
                </label>
                <input
                  id="trial-slot"
                  type="text"
                  placeholder={lang === 'en' ? 'e.g. Saturday at 5:00 PM' : 'যেমনঃ শনিবার বিকাল ৫টা'}
                  value={preferredStart}
                  onChange={(e) => setPreferredStart(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-red-600 mb-3">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-sm font-semibold transition-colors"
            >
              {lang === 'en'
                ? 'Confirm 2 Free Trial Classes'
                : '২টি ফ্রি ট্রায়াল ক্লাস নিশ্চিত করুন'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   3. MULTI-TUTOR APPLICATION MODAL (SUPABASE "circular_applications")
   ============================================================================ */
interface ApplyJobModalProps {
  lang: Language;
  job: TuitionJob | null;
  applications?: CircularApplicationRow[];
  currentUser?: UserAccount | null;
  myTutorProfile?: VerificationRequest | null;
  onOpenSignIn?: () => void;
  onOpenCreateAccount?: () => void;
  onClose: () => void;
  onConfirmApply: (
    jobId: string,
    input: CircularApplicationInput
  ) => Promise<void> | void;
}

export const ApplyJobModal: React.FC<ApplyJobModalProps> = ({
  lang,
  job,
  applications = [],
  currentUser,
  myTutorProfile,
  onOpenSignIn,
  onOpenCreateAccount,
  onClose,
  onConfirmApply,
}) => {
  const [tutorId, setTutorId] = useState('');
  const [tutorName, setTutorName] = useState('');
  const [tutorInstitution, setTutorInstitution] = useState('');
  const [tutorPhone, setTutorPhone] = useState('');
  const [pitch, setPitch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [appliedDone, setAppliedDone] = useState(false);
  const [submittedTutorId, setSubmittedTutorId] = useState('');

  const authenticatedEmail = (currentUser?.email || '').trim().toLowerCase();
  const authenticatedUserId = (
    currentUser?.id ||
    (authenticatedEmail ? authenticatedEmail.split('@')[0] : '') ||
    currentUser?.fullName ||
    ''
  ).trim();
  const isLoggedIn = Boolean(authenticatedEmail || authenticatedUserId);

  useEffect(() => {
    if (job) {
      setTutorId(myTutorProfile?.id || authenticatedUserId || '');
      setTutorName(
        myTutorProfile?.tutorNameEn || currentUser?.fullName || ''
      );
      setTutorInstitution(
        myTutorProfile
          ? `${myTutorProfile.institutionFullEn} · ${myTutorProfile.departmentEn}`
          : ''
      );
      setTutorPhone(myTutorProfile?.phone || '');
      setPitch('');
      setErrorMsg('');
      setSubmitting(false);
      setAppliedDone(false);
      setSubmittedTutorId('');
    }
  }, [job, myTutorProfile, currentUser, authenticatedUserId]);

  if (!job) return null;

  const isRestricted = isTutorAccountRestricted(myTutorProfile);
  const isVerifiedTutor =
    isAuthorizedAdminAccount(currentUser) ||
    isTutorProfileVerifiedForApplication(myTutorProfile);
  const existingUserApp = hasTutorAlreadyAppliedToCircular(
    applications,
    job.id,
    currentUser,
    myTutorProfile,
    {
      userEmail: authenticatedEmail || null,
      userId: currentUser?.id || authenticatedUserId || null,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setErrorMsg(
        lang === 'en'
          ? 'Please sign in to your account to apply for this tuition circular.'
          : 'টিউশনিতে আবেদন করতে অনুগ্রহ করে আপনার অ্যাকাউন্টে সাইন ইন করুন।'
      );
      return;
    }

    if (isRestricted) {
      setErrorMsg(
        lang === 'en'
          ? 'Your account is currently restricted from applying to circulars. Please contact Admin for re-verification.'
          : 'আপনার অ্যাকাউন্টে বর্তমানে আবেদনের সীমাবদ্ধতা রয়েছে।'
      );
      return;
    }

    if (!isVerifiedTutor) {
      setErrorMsg(UNVERIFIED_TUTOR_APPLY_TOAST_MESSAGE);
      return;
    }

    const cleanPhone = (tutorPhone || myTutorProfile?.phone || '')
      .trim()
      .replace(/[\s-]/g, '');
    const resolvedTutorId =
      tutorId.trim() || myTutorProfile?.id || authenticatedUserId || cleanPhone;
    const resolvedName =
      tutorName.trim() || myTutorProfile?.tutorNameEn || currentUser?.fullName || '';
    const resolvedQualification =
      tutorInstitution.trim() ||
      (myTutorProfile
        ? `${myTutorProfile.institutionFullEn} · ${myTutorProfile.departmentEn}`
        : '');

    const duplicateCheck = hasTutorAlreadyAppliedToCircular(
      applications,
      job.id,
      currentUser,
      myTutorProfile,
      {
        tutorId: resolvedTutorId,
        tutorPhone: cleanPhone,
        userEmail: authenticatedEmail || null,
        userId: currentUser?.id || authenticatedUserId || null,
      }
    );
    if (duplicateCheck) {
      setErrorMsg(DUPLICATE_CIRCULAR_APPLICATION_MESSAGE);
      return;
    }

    const validation = validateCircularApplicationInput({
      tutorId: resolvedTutorId,
      tutorName: resolvedName,
      tutorPhone: cleanPhone,
      qualification: resolvedQualification,
      experienceNote: pitch,
    });

    if (!validation.valid) {
      setErrorMsg(
        lang === 'en'
          ? validation.error || 'Please check your application details.'
          : 'অনুগ্রহ করে আপনার নাম, সঠিক ১১ ডিজিটের মোবাইল নম্বর এবং শিক্ষাগত যোগ্যতা পূরণ করুন।'
      );
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    try {
      await onConfirmApply(job.id, {
        tutorId: resolvedTutorId,
        tutorName: resolvedName,
        tutorPhone: cleanPhone,
        qualification: resolvedQualification,
        experienceNote: pitch.trim(),
        userEmail: authenticatedEmail || null,
        userId: authenticatedUserId || null,
      });
      setSubmittedTutorId(resolvedTutorId);
      setAppliedDone(true);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to submit application right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-job-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close application modal"
          className="absolute top-5 right-5 p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {!isLoggedIn ? (
          <div className="text-center py-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-[#047857]/30 text-[#047857] dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h2
              id="apply-job-title"
              className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-white mb-1.5"
            >
              {lang === 'en'
                ? 'Sign In Required to Apply'
                : 'আবেদন করতে সাইন ইন করুন'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-5">
              {lang === 'en'
                ? 'Every tuition application is strictly bound to your personal account and Tutor Profile so only you and the Admin can view your application status.'
                : 'আপনার টিউশনি আবেদনটি আপনার অ্যাকাউন্ট ও প্রোফাইলের সাথে যুক্ত থাকবে।'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {onOpenSignIn && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSignIn();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'Sign In' : 'সাইন ইন করুন'}
                </button>
              )}
              {onOpenCreateAccount && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreateAccount();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'Create Account' : 'অ্যাকাউন্ট খুলুন'}
                </button>
              )}
            </div>
          </div>
        ) : appliedDone || existingUserApp ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2
              id="apply-job-title"
              className="text-xl font-extrabold text-stone-900 dark:text-white mb-1"
            >
              {appliedDone
                ? lang === 'en'
                  ? `Application Submitted for ${job.id}!`
                  : `${job.id} টিউশনিতে আবেদন সম্পন্ন!`
                : 'Already Applied ✓'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mb-3">
              {appliedDone
                ? lang === 'en'
                  ? `Linked to your account (${authenticatedEmail || authenticatedUserId}) and saved to Supabase "circular_applications" (${submittedTutorId || existingUserApp?.tutor_id || 'Pending'}).`
                  : `আপনার অ্যাকাউন্টের সাথে যুক্ত হয়ে জমা হয়েছে।`
                : DUPLICATE_CIRCULAR_APPLICATION_MESSAGE}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-[#047857] dark:text-emerald-300 border border-emerald-500/40 text-xs font-extrabold mb-5">
              <span>Already Applied ✓</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#047857] text-white text-xs font-semibold cursor-pointer"
            >
              {lang === 'en' ? 'Back to Tuition Circulars' : 'সার্কুলারে ফিরে যান'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="text-xs font-mono-num font-bold text-[#047857] dark:text-emerald-400 mb-1">
              {job.id} · {job.upazila} · {formatBDT(job.salaryBdt, lang)}/mo
            </div>
            <h2
              id="apply-job-title"
              className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-white mb-1"
            >
              {lang === 'en' ? job.titleEn : job.titleBn}
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-3 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{lang === 'en' ? job.landmarkEn : job.landmarkBn}</span>
            </p>

            {/* Account & Saved Tutor Profile Auto-Link Banner */}
            <div className="mb-4 p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/50 border border-[#047857]/30 text-xs text-stone-700 dark:text-stone-200 flex items-center justify-between gap-2">
              <div>
                <span className="font-bold text-[#047857] dark:text-emerald-400 block">
                  {myTutorProfile
                    ? `Linked to Saved Tutor Profile (${myTutorProfile.id})`
                    : `Linked to Account (${authenticatedUserId})`}
                </span>
                <span className="text-[11px] font-mono-num text-stone-500 dark:text-stone-400">
                  {authenticatedEmail || authenticatedUserId}
                </span>
              </div>
              {myTutorProfile?.profilePhotoDataUrl && (
                <img
                  src={myTutorProfile.profilePhotoDataUrl}
                  alt={myTutorProfile.tutorNameEn}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-[#047857]"
                />
              )}
            </div>

            <div className="space-y-3 mb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="apply-tutor-id"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en'
                      ? 'Tutor ID (or Verification ID)'
                      : 'টিউটর আইডি (অথবা ভেরিফিকেশন আইডি)'}
                  </label>
                  <input
                    id="apply-tutor-id"
                    type="text"
                    placeholder="e.g. VER-2026-101"
                    value={tutorId}
                    onChange={(e) => setTutorId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num"
                  />
                </div>

                <div>
                  <label
                    htmlFor="apply-tutor-phone"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en'
                      ? 'Phone Number (11 Digits)'
                      : 'মোবাইল নম্বর (১১ ডিজিট)'}
                  </label>
                  <input
                    id="apply-tutor-phone"
                    type="tel"
                    placeholder="01308937770"
                    value={tutorPhone}
                    onChange={(e) => setTutorPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="apply-tutor-name"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en' ? 'Your Full Name' : 'আপনার পূর্ণ নাম'}
                </label>
                <input
                  id="apply-tutor-name"
                  type="text"
                  placeholder="e.g. Rahim Hosen"
                  value={tutorName}
                  onChange={(e) => setTutorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="apply-tutor-college"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en'
                    ? 'University / Qualification'
                    : 'কলেজ / বিশ্ববিদ্যালয় ও শিক্ষাগত যোগ্যতা'}
                </label>
                <input
                  id="apply-tutor-college"
                  type="text"
                  placeholder="e.g. University of Dhaka · B.Sc. in Physics"
                  value={tutorInstitution}
                  onChange={(e) => setTutorInstitution(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="apply-tutor-pitch"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en'
                    ? 'Short Note (Experience & Availability)'
                    : 'সংক্ষিপ্ত নোট (অভিজ্ঞতা ও সময়সূচি)'}
                </label>
                <input
                  id="apply-tutor-pitch"
                  type="text"
                  placeholder="e.g. 4 years HSC teaching experience, ready for free trial"
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>
            </div>

            {errorMsg && (
              <p role="alert" className="text-xs font-semibold text-red-600 mb-3">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#047857] hover:bg-[#065F46] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {submitting
                ? lang === 'en'
                  ? 'Saving Application to Supabase...'
                  : 'সুপাবেস ডাটাবেসে জমা হচ্ছে...'
                : lang === 'en'
                ? 'Submit Tutor Application'
                : 'আবেদন নিশ্চিত করুন'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   4. POST TUITION CIRCULAR MODAL (GUARDIAN)
   ============================================================================ */
interface PostJobModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onAddJob: (newJob: TuitionJob) => Promise<void> | void;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({
  lang,
  isOpen,
  onClose,
  onAddJob,
}) => {
  const [title, setTitle] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [numStudents, setNumStudents] = useState('');
  const [upazila, setUpazila] = useState<Exclude<Upazila, 'All'> | ''>('');
  const [landmark, setLandmark] = useState('');
  const [medium, setMedium] = useState<Exclude<MediumCategory, 'All'> | ''>('');
  const [mode, setMode] = useState<Exclude<TutoringMode, 'All'> | ''>('');
  const [subjects, setSubjects] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState('');
  const [salaryBdt, setSalaryBdt] = useState('');
  const [preferredGender, setPreferredGender] =
    useState<TuitionJob['preferredGender'] | ''>('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !upazila || !landmark.trim() || !guardianName.trim()) {
      setErrorMsg(
        lang === 'en'
          ? 'Please fill in the circular headline, upazila, landmark, and guardian name.'
          : 'অনুগ্রহ করে সার্কুলার শিরোনাম, উপজেলা, ল্যান্ডমার্ক ও অভিভাবকের নাম পূরণ করুন।'
      );
      return;
    }
    if (!validatePhoneBD(guardianPhone)) {
      setErrorMsg(
        lang === 'en'
          ? 'Please enter a valid 11-digit BD mobile number (e.g. 01308937770).'
          : 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।'
      );
      return;
    }

    const subjectList = subjects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const resolvedSubjects = subjectList.length
      ? subjectList
      : ['General Science & Math'];
    const resolvedClass = studentClass.trim() || 'SSC / HSC';
    const resolvedMedium = (medium || 'Bangla Medium') as Exclude<
      MediumCategory,
      'All'
    >;
    const resolvedMode = (mode || 'Home') as Exclude<TutoringMode, 'All'>;
    const resolvedGender = (preferredGender ||
      'Any') as TuitionJob['preferredGender'];
    const createdTimestamp = new Date().toISOString();

    const newJob: TuitionJob = {
      id: `MDP-${Math.floor(2047 + Math.random() * 900)}`,
      titleEn: title.trim(),
      titleBn: title.trim(),
      studentClassEn: resolvedClass,
      studentClassBn: resolvedClass,
      upazila: upazila as Exclude<Upazila, 'All'>,
      landmarkEn: landmark.trim(),
      landmarkBn: landmark.trim(),
      medium: resolvedMedium,
      mode: resolvedMode,
      subjectsEn: resolvedSubjects,
      subjectsBn: subjectList.length ? subjectList : ['গণিত ও বিজ্ঞান'],
      daysPerWeek: Number(daysPerWeek) || 3,
      salaryBdt: Number(salaryBdt) || 3000,
      numStudents: Number(numStudents) || 1,
      preferredGender: resolvedGender,
      preferredInstitutionEn: 'Verified Madaripur Tutor',
      preferredInstitutionBn: 'যাচাইকৃত মাদারীপুর টিউটর',
      postedAgoEn: 'Just now',
      postedAgoBn: 'এইমাত্র',
      guardianName: guardianName.trim(),
      contactPhone: guardianPhone.trim(),
      requirements: title.trim(),
      classSubject: `${resolvedClass} · ${resolvedSubjects.join(', ')}`,
      tutoringFormat: `${resolvedMode} · ${resolvedMedium}`,
      tutorPreference: resolvedGender,
      status: 'Active',
      createdAt: createdTimestamp,
      applicantsCount: 0,
      urgent: true,
    };

    setSubmitting(true);
    try {
      await onAddJob(newJob);
      setTitle('');
      setStudentClass('');
      setNumStudents('');
      setUpazila('');
      setLandmark('');
      setMedium('');
      setMode('');
      setPreferredGender('');
      setSubjects('');
      setDaysPerWeek('');
      setSalaryBdt('');
      setGuardianName('');
      setGuardianPhone('');
      setErrorMsg('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-job-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close post circular modal"
          className="absolute top-5 right-5 p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <form onSubmit={handleSubmit}>
          <div className="text-xs font-semibold text-[#047857] dark:text-emerald-400 mb-1">
            {lang === 'en'
              ? 'Admin-Only Official Tuition Circular Publisher'
              : 'শুধুমাত্র অ্যাডমিন কর্তৃক অফিসিয়াল টিউশনি সার্কুলার প্রকাশ'}
          </div>
          <h2
            id="post-job-title"
            className="text-xl font-extrabold text-stone-900 dark:text-white mb-4"
          >
            {lang === 'en'
              ? 'Admin: Post a Live Tuition Circular'
              : 'অ্যাডমিন: লাইভ টিউশনি সার্কুলার পোস্ট করুন'}
          </h2>

          <div className="space-y-3.5 mb-5">
            <div>
              <label
                htmlFor="post-title"
                className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
              >
                {lang === 'en'
                  ? 'Tuition Requirement Headline'
                  : 'টিউশনির শিরোনাম'}
              </label>
              <input
                id="post-title"
                type="text"
                placeholder={
                  lang === 'en'
                    ? 'e.g. Science Tutor Needed for Class 9-10'
                    : 'যেমনঃ ৯ম-১০ম শ্রেণির বিজ্ঞান টিউটর প্রয়োজন'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="post-upazila"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en' ? 'Upazila / Hub' : 'উপজেলা / এলাকা'}
                </label>
                <select
                  id="post-upazila"
                  required
                  value={upazila}
                  onChange={(e) =>
                    setUpazila(e.target.value as Exclude<Upazila, 'All'> | '')
                  }
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                >
                  <option value="">
                    {lang === 'en' ? 'Select Upazila' : 'উপজেলা নির্বাচন'}
                  </option>
                  {MADARIPUR_UPAZILAS.map((u) => (
                    <option key={u} value={u}>
                      {lang === 'en' ? UPAZILA_LABELS[u].en : UPAZILA_LABELS[u].bn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="post-class"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en' ? 'Student Class' : 'শিক্ষার্থীর শ্রেণি'}
                </label>
                <input
                  id="post-class"
                  type="text"
                  placeholder={
                    lang === 'en' ? 'e.g. Class 8' : 'যেমনঃ ৮ম শ্রেণি'
                  }
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="post-num-students"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en' ? 'No. of Students' : 'শিক্ষার্থীর সংখ্যা'}
                </label>
                <input
                  id="post-num-students"
                  type="number"
                  min={1}
                  max={10}
                  value={numStudents}
                  onChange={(e) => setNumStudents(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g. 1' : 'যেমনঃ ১'}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="post-landmark"
                className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
              >
                {lang === 'en'
                  ? 'Exact Location Landmark'
                  : 'বাসার সঠিক ল্যান্ডমার্ক / সড়ক'}
              </label>
              <input
                id="post-landmark"
                type="text"
                placeholder={
                  lang === 'en'
                    ? 'e.g. Lake Par, Ward 4, Near DC Office'
                    : 'যেমনঃ লেক পাড়, ওয়ার্ড ৪'
                }
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="post-medium"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en' ? 'Medium' : 'মিডিয়াম'}
                </label>
                <select
                  id="post-medium"
                  value={medium}
                  onChange={(e) =>
                    setMedium(
                      e.target.value as Exclude<MediumCategory, 'All'> | ''
                    )
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                >
                  <option value="">
                    {lang === 'en' ? 'Select Medium' : 'মিডিয়াম নির্বাচন'}
                  </option>
                  <option value="Bangla Medium">Bangla Medium</option>
                  <option value="English Version">English Version</option>
                  <option value="Admission Test">Admission Test</option>
                  <option value="Madrasah/Quranic">Madrasah/Quranic</option>
                  <option value="ICT">ICT</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="post-mode"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en' ? 'Mode' : 'টিউশনির ধরন'}
                </label>
                <select
                  id="post-mode"
                  value={mode}
                  onChange={(e) =>
                    setMode(
                      e.target.value as Exclude<TutoringMode, 'All'> | ''
                    )
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                >
                  <option value="">
                    {lang === 'en' ? 'Select Mode' : 'ধরন নির্বাচন'}
                  </option>
                  <option value="Home">Home</option>
                  <option value="Online">Online</option>
                  <option value="Group">Group</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="post-gender"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en' ? 'Tutor Gender' : 'শিক্ষকের লিঙ্গ'}
                </label>
                <select
                  id="post-gender"
                  value={preferredGender}
                  onChange={(e) =>
                    setPreferredGender(
                      e.target.value as TuitionJob['preferredGender'] | ''
                    )
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                >
                  <option value="">
                    {lang === 'en' ? 'Select Gender' : 'লিঙ্গ নির্বাচন'}
                  </option>
                  <option value="Any">Any</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="post-subjects"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en' ? 'Subjects' : 'বিষয়সমূহ'}
                </label>
                <input
                  id="post-subjects"
                  type="text"
                  placeholder={lang === 'en' ? 'e.g. Math, Physics' : 'যেমনঃ গণিত'}
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="post-days"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en' ? 'Days / Week' : 'সপ্তাহে কত দিন'}
                </label>
                <input
                  id="post-days"
                  type="number"
                  min={1}
                  max={7}
                  placeholder="e.g. 4"
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num"
                />
              </div>

              <div>
                <label
                  htmlFor="post-salary"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en' ? 'Monthly Salary (BDT)' : 'মাসিক বেতন (টাকা)'}
                </label>
                <input
                  id="post-salary"
                  type="number"
                  min={1000}
                  max={50000}
                  step={500}
                  placeholder="e.g. 3000"
                  value={salaryBdt}
                  onChange={(e) => setSalaryBdt(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="post-guardian-name"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en' ? 'Guardian Name' : 'অভিভাবকের নাম'}
                </label>
                <input
                  id="post-guardian-name"
                  type="text"
                  placeholder="e.g. Rahim Hosen"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="post-guardian-phone"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en'
                    ? 'Guardian Mobile (11 Digits)'
                    : 'অভিভাবকের মোবাইল নম্বর'}
                </label>
                <input
                  id="post-guardian-phone"
                  type="tel"
                  placeholder="e.g. 01308937770"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-red-600 mb-3">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#047857] hover:bg-[#065F46] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {submitting
              ? lang === 'en'
                ? 'Publishing to Supabase tuition_circulars...'
                : 'সুপাবেস ডাটাবেসে প্রকাশিত হচ্ছে...'
              : lang === 'en'
              ? 'Admin: Publish Circular to Tutor Zone Job Board'
              : 'অ্যাডমিন হিসেবে সার্কুলারটি জব বোর্ডে প্রকাশ করুন'}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
   5. ADMIN PASSWORD / PIN MODAL (STRICT ADMIN DESK LOCK)
   ============================================================================ */
interface AdminPinModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  lang,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setPin('');
    setErrorMsg('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = verifyAdminPin(pin);
    if (!check.valid) {
      setErrorMsg(
        lang === 'en'
          ? check.error || 'Incorrect Admin PIN. Access denied.'
          : 'ভুল অ্যাডমিন পিন। প্রবেশাধিকার সংরক্ষিত।'
      );
      return;
    }

    setPin('');
    setErrorMsg('');
    onSuccess();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-pin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-7 shadow-xl">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close admin login modal"
          className="absolute top-5 right-5 p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#047857] dark:text-emerald-400 mb-1.5">
          <Lock className="w-3.5 h-3.5" />
          <span>
            {lang === 'en'
              ? 'Tutor Zone · Restricted Administrator Access'
              : 'টিউটর জোন · সংরক্ষিত অ্যাডমিন প্রবেশাধিকার'}
          </span>
        </div>

        <h2
          id="admin-pin-modal-title"
          className="text-xl font-extrabold text-stone-900 dark:text-white"
        >
          {lang === 'en' ? 'Admin Login' : 'অ্যাডমিন লগইন'}
        </h2>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 mb-5">
          {lang === 'en'
            ? 'Enter the Admin PIN (153800) for your authenticated drabirm4@gmail.com session to unlock Admin Review and Tuition Circular publishing in this tab.'
            : 'অ্যাডমিন রিভিউ ও টিউশনি সার্কুলার পোস্ট আনলক করতে অ্যাডমিন পিন প্রদান করুন।'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-pin-input"
              className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
            >
              {lang === 'en'
                ? 'Admin Password / PIN'
                : 'অ্যাডমিন পাসওয়ার্ড / পিন'}
            </label>
            <input
              id="admin-pin-input"
              type="password"
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num focus:outline-none focus:border-[#047857]"
            />
          </div>

          {errorMsg && (
            <p role="alert" className="text-xs font-semibold text-red-600">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              {lang === 'en' ? 'Cancel' : 'বাতিল'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold transition-colors"
            >
              {lang === 'en' ? 'Unlock Admin' : 'অ্যাডমিন আনলক করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
   6. ADMIN APPLICANTS LIST & CONFIRM 1 TUTOR MODAL ("circular_applications")
   ============================================================================ */
interface AdminApplicantsModalProps {
  lang: Language;
  job: TuitionJob | null;
  applicants: CircularApplicationRow[];
  verificationRequests?: VerificationRequest[];
  onClose: () => void;
  onConfirmApplicant: (
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
  onRejectApplicant?: (
    circularId: string,
    applicant: CircularApplicationRow,
    rejectionNote?: string,
    restrictAccount?: boolean
  ) => Promise<void> | void;
  onUnblockApplicant?: (
    circularId: string,
    applicant: CircularApplicationRow
  ) => Promise<void> | void;
  onHideApplicantFromAdmin?: (
    applicant: CircularApplicationRow
  ) => Promise<void> | void;
  onDeleteApplicantEverywhere?: (
    applicant: CircularApplicationRow
  ) => Promise<void> | void;
}

export const AdminApplicantsModal: React.FC<AdminApplicantsModalProps> = ({
  lang,
  job,
  applicants,
  verificationRequests = [],
  onClose,
  onConfirmApplicant,
  onRejectApplicant,
  onUnblockApplicant,
  onHideApplicantFromAdmin,
  onDeleteApplicantEverywhere,
}) => {
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);
  const [expandedProfileKey, setExpandedProfileKey] = useState<string | null>(
    null
  );

  // Admin Confirm / Verify Tutor with Media Fee, Guardian Details & Custom Note
  const [confirmTargetApplicant, setConfirmTargetApplicant] =
    useState<CircularApplicationRow | null>(null);
  const [adminMediaFee, setAdminMediaFee] = useState<number>(1000);
  const [adminGuardianPhone, setAdminGuardianPhone] = useState<string>('');
  const [adminGuardianAddress, setAdminGuardianAddress] = useState<string>('');
  const [adminCustomNote, setAdminCustomNote] = useState<string>('');
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState<boolean>(false);

  // Executive Admin Rejection Popover / Inline Drawer State
  const [rejectTargetApplicant, setRejectTargetApplicant] =
    useState<CircularApplicationRow | null>(null);
  const [rejectionNoteInput, setRejectionNoteInput] = useState<string>('');
  const [restrictAccountOnReject, setRestrictAccountOnReject] =
    useState<boolean>(true);
  const [isSubmittingReject, setIsSubmittingReject] = useState<boolean>(false);

  if (!job) return null;

  const isSameApplicantTarget = (
    a: CircularApplicationRow | null,
    b: CircularApplicationRow
  ): boolean => {
    if (!a) return false;
    if (a.id && b.id) return a.id === b.id;
    return a.tutor_id === b.tutor_id && a.tutor_phone === b.tutor_phone;
  };

  const handleDirectConfirmClick = async (applicant: CircularApplicationRow) => {
    const key = applicant.id || `${applicant.tutor_id}-${applicant.tutor_phone}`;
    setConfirmingKey(key);
    try {
      await onConfirmApplicant(job.id, applicant, {
        status: 'confirmed',
        mediaFee: 0,
        guardianPhone:
          applicant.guardian_phone || job.contactPhone || undefined,
        guardianAddress:
          applicant.guardian_address ||
          [job.landmarkEn, job.upazila].filter(Boolean).join(', ') ||
          job.upazila ||
          undefined,
      });
      if (isSameApplicantTarget(confirmTargetApplicant, applicant)) {
        setConfirmTargetApplicant(null);
      }
      if (isSameApplicantTarget(rejectTargetApplicant, applicant)) {
        setRejectTargetApplicant(null);
      }
    } finally {
      setConfirmingKey(null);
    }
  };

  const handleOpenConfirmDialog = (applicant: CircularApplicationRow) => {
    if (isSameApplicantTarget(confirmTargetApplicant, applicant)) {
      setConfirmTargetApplicant(null);
      return;
    }
    setRejectTargetApplicant(null);
    setConfirmTargetApplicant(applicant);
    const parsedFee = extractMediaFeeFromApplication(applicant, 1000);
    setAdminMediaFee(parsedFee > 0 ? parsedFee : 1000);
    setAdminGuardianPhone(
      applicant.guardian_phone || job.contactPhone || ''
    );
    setAdminGuardianAddress(
      applicant.guardian_address ||
        [job.landmarkEn, job.upazila].filter(Boolean).join(', ') ||
        job.upazila ||
        ''
    );
    setAdminCustomNote(extractAdminNoteFromApplication(applicant));
  };

  const handleExecuteConfirm = async () => {
    if (!confirmTargetApplicant) return;
    const key =
      confirmTargetApplicant.id ||
      `${confirmTargetApplicant.tutor_id}-${confirmTargetApplicant.tutor_phone}`;
    setConfirmingKey(key);
    setIsSubmittingConfirm(true);
    try {
      await onConfirmApplicant(job.id, confirmTargetApplicant, {
        status: 'verified_for_tuition',
        mediaFee: Number(adminMediaFee) || 1000,
        guardianPhone: adminGuardianPhone.trim(),
        guardianAddress: adminGuardianAddress.trim(),
        adminNote: adminCustomNote.trim(),
      });
      setConfirmTargetApplicant(null);
    } finally {
      setIsSubmittingConfirm(false);
      setConfirmingKey(null);
    }
  };

  const handleToggleRejectDrawer = (applicant: CircularApplicationRow) => {
    if (isSameApplicantTarget(rejectTargetApplicant, applicant)) {
      setRejectTargetApplicant(null);
      return;
    }
    setConfirmTargetApplicant(null);
    setRejectTargetApplicant(applicant);
    setRejectionNoteInput(extractAdminNoteFromApplication(applicant) || '');
    setRestrictAccountOnReject(true);
  };

  const handleExecuteReject = async (
    applicant: CircularApplicationRow,
    customReason?: string
  ) => {
    if (!onRejectApplicant) return;
    const key = applicant.id || `${applicant.tutor_id}-${applicant.tutor_phone}`;
    setConfirmingKey(key);
    setIsSubmittingReject(true);
    try {
      const finalReason =
        (customReason !== undefined ? customReason : rejectionNoteInput).trim() ||
        'Subject/Class Mismatch';
      await onRejectApplicant(
        job.id,
        applicant,
        finalReason,
        restrictAccountOnReject
      );
      setRejectTargetApplicant(null);
    } finally {
      setIsSubmittingReject(false);
      setConfirmingKey(null);
    }
  };

  const handleUnblockClick = async (applicant: CircularApplicationRow) => {
    if (!onUnblockApplicant) return;
    const key = applicant.id || `${applicant.tutor_id}-${applicant.tutor_phone}`;
    setConfirmingKey(key);
    try {
      await onUnblockApplicant(job.id, applicant);
      if (isSameApplicantTarget(rejectTargetApplicant, applicant)) {
        setRejectTargetApplicant(null);
      }
    } finally {
      setConfirmingKey(null);
    }
  };

  const handleHideFromAdminClick = async (
    applicant: CircularApplicationRow
  ) => {
    if (!onHideApplicantFromAdmin) return;
    const key = applicant.id || `${applicant.tutor_id}-${applicant.tutor_phone}`;
    setConfirmingKey(key);
    try {
      await onHideApplicantFromAdmin(applicant);
    } finally {
      setConfirmingKey(null);
    }
  };

  const handleDeleteEverywhereClick = async (
    applicant: CircularApplicationRow
  ) => {
    if (!onDeleteApplicantEverywhere) return;
    const key = applicant.id || `${applicant.tutor_id}-${applicant.tutor_phone}`;
    setConfirmingKey(key);
    try {
      await onDeleteApplicantEverywhere(applicant);
    } finally {
      setConfirmingKey(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-applicants-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto overflow-x-hidden"
    >
      <div className="relative w-full max-w-full sm:max-w-4xl rounded-2xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-6 max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close applicants modal"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="pr-10">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#047857] dark:text-emerald-400 mb-1">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>
              {lang === 'en'
                ? `Admin Applicant Review · Circular ${job.id}`
                : `অ্যাডমিন আবেদনকারী তালিকা · সার্কুলার ${job.id}`}
            </span>
          </div>

          <h2
            id="admin-applicants-title"
            className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-white mb-1.5 break-words"
          >
            {lang === 'en' ? job.titleEn : job.titleBn}
          </h2>

          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-400 mb-4">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold text-stone-700 dark:text-stone-300">
              {job.upazila}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-[#047857]/30 font-mono-num font-bold text-[#047857] dark:text-emerald-400">
              {formatBDT(job.salaryBdt, lang)}/mo
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <span>Status:</span>
              <strong className="text-[#047857] dark:text-emerald-400">
                {job.status || 'Active'}
              </strong>
            </span>
            {job.confirmedTutorName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100/90 dark:bg-emerald-950/80 border border-[#047857]/40 font-semibold text-[#047857] dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Confirmed: {job.confirmedTutorName} ({job.confirmedTutorId})
                </span>
              </span>
            )}
          </div>
        </div>

        {applicants.length === 0 ? (
          <div className="rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-8 text-center">
            <p className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-1">
              {lang === 'en'
                ? 'No tutors have applied to this circular yet (0 applicants).'
                : 'এই সার্কুলারে এখনো কোনো শিক্ষক আবেদন করেননি (০ জন)।'}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {lang === 'en'
                ? 'When tutors submit applications in Tuition Circulars, their full details will appear here.'
                : 'টিউশনি সার্কুলার থেকে শিক্ষকরা আবেদন করলে এখানে তালিকা দেখা যাবে।'}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {applicants.map((applicant, idx) => {
              const statusNormalized = (applicant.status || 'Pending')
                .trim()
                .toLowerCase();
              const isDirectConfirmed =
                statusNormalized === 'confirmed' ||
                statusNormalized === 'approved';
              const isVerifiedForTuition =
                statusNormalized === 'verified_for_tuition' ||
                statusNormalized === 'verified for tuition';
              const isConfirmed = isDirectConfirmed || isVerifiedForTuition;
              const isRejected = statusNormalized === 'rejected';
              const applicantMediaFee = extractMediaFeeFromApplication(
                applicant,
                1000
              );
              const applicantAdminNote =
                extractAdminNoteFromApplication(applicant);
              const cleanExperienceNote =
                getCleanApplicantExperienceNote(applicant);
              const isFeePanelOpen = isSameApplicantTarget(
                confirmTargetApplicant,
                applicant
              );
              const isRejectDrawerOpen = isSameApplicantTarget(
                rejectTargetApplicant,
                applicant
              );
              const key =
                applicant.id ||
                `${applicant.tutor_id}-${applicant.tutor_phone}-${idx}`;
              const isBusy =
                confirmingKey ===
                (applicant.id ||
                  `${applicant.tutor_id}-${applicant.tutor_phone}`);
              const linkedProfile = findApplicantFullTutorProfile(
                applicant,
                verificationRequests
              );
              const isTutorRestricted = isTutorAccountRestricted(linkedProfile);
              const isExpanded = expandedProfileKey === key;

              return (
                <div
                  key={key}
                  className={`w-full max-w-full overflow-x-hidden rounded-xl p-4 sm:p-5 border transition-colors ${
                    isDirectConfirmed
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-[#047857]'
                      : isVerifiedForTuition
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-600/70'
                      : isRejected
                      ? 'bg-red-50/40 dark:bg-red-950/20 border-red-300 dark:border-red-900/50'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <div className="space-y-3 w-full max-w-full">
                    {/* Top Tutor Header & Aligned Badges */}
                    <div className="flex items-start gap-3 min-w-0">
                      {linkedProfile?.profilePhotoDataUrl ? (
                        <img
                          src={linkedProfile.profilePhotoDataUrl}
                          alt={applicant.tutor_name}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#047857] shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-stone-100 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 flex items-center justify-center text-stone-400 shrink-0">
                          <User className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <span className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white break-words">
                              {applicant.tutor_name}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-[#047857]/30 text-xs font-mono-num font-bold text-[#047857] dark:text-emerald-400">
                              ID: {linkedProfile?.id || applicant.tutor_id}
                            </span>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              isDirectConfirmed
                                ? 'bg-emerald-100/95 dark:bg-emerald-950 text-[#047857] dark:text-emerald-300 border-[#047857]/50'
                                : isVerifiedForTuition
                                ? 'bg-amber-100/95 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border-amber-500/50'
                                : isRejected
                                ? 'bg-red-100/90 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
                                : 'bg-amber-100/90 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            }`}
                          >
                            {isVerifiedForTuition
                              ? `💳 Verified (Media Fee Required: ৳${applicantMediaFee})`
                              : isDirectConfirmed
                              ? '✅ Confirmed for Tuition'
                              : isRejected
                              ? '🚫 Not Selected'
                              : '⏳ Pending Review'}
                          </span>
                        </div>

                        {/* Clean Structured Tutor Details Strip */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 text-xs">
                          <div className="min-w-0">
                            <span className="block text-[10px] uppercase tracking-wider font-semibold text-stone-400 dark:text-stone-500">
                              {lang === 'en'
                                ? 'University / Qualification'
                                : 'শিক্ষাগত যোগ্যতা'}
                            </span>
                            <span className="font-bold text-stone-800 dark:text-stone-200 break-words">
                              {linkedProfile
                                ? `${linkedProfile.institutionFullEn} · ${linkedProfile.departmentEn}`
                                : applicant.institution_qualification}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <span className="block text-[10px] uppercase tracking-wider font-semibold text-stone-400 dark:text-stone-500">
                              {lang === 'en'
                                ? 'Mobile Number (Admin Only)'
                                : 'মোবাইল নম্বর'}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono-num font-bold text-stone-900 dark:text-white break-all">
                              <Phone className="w-3.5 h-3.5 text-[#047857] shrink-0" />
                              <span>
                                {linkedProfile?.phone || applicant.tutor_phone}
                              </span>
                            </span>
                          </div>

                          {(cleanExperienceNote || applicantAdminNote) && (
                            <div className="min-w-0 sm:col-span-2 lg:col-span-1 space-y-0.5">
                              {cleanExperienceNote && (
                                <div>
                                  <span className="block text-[10px] uppercase tracking-wider font-semibold text-stone-400 dark:text-stone-500">
                                    {lang === 'en' ? 'Applicant Note' : 'নোট'}
                                  </span>
                                  <span className="font-medium text-stone-600 dark:text-stone-300 break-words">
                                    {cleanExperienceNote}
                                  </span>
                                </div>
                              )}
                              {applicantAdminNote && (
                                <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 break-words">
                                  📌 Admin Note: {applicantAdminNote}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Responsive Flex-Wrap Action Bar with Two Separate Workflow Options */}
                    <div className="flex flex-wrap gap-2 items-center pt-3 border-t border-stone-200/80 dark:border-stone-700/80 w-full max-w-full">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedProfileKey(isExpanded ? null : key)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 hover:border-[#047857] border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#047857] dark:text-emerald-400 shrink-0" />
                        <span>
                          {isExpanded
                            ? '🔼 Hide Full Tutor Profile'
                            : '👁️ View Full Tutor Profile'}
                        </span>
                      </button>

                      {/* WORKFLOW BUTTON 1 & BUTTON 2 BASED ON ACTIVE STATE */}
                      {isDirectConfirmed ? (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDirectConfirmClick(applicant)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950 text-[#047857] dark:text-emerald-300 border-2 border-[#047857] ring-2 ring-[#047857]/20 transition-colors cursor-default"
                          >
                            <span>✅ Confirmed</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleOpenConfirmDialog(applicant)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
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
                            disabled={isBusy}
                            onClick={() => handleOpenConfirmDialog(applicant)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              isFeePanelOpen
                                ? 'bg-amber-700 text-white border border-amber-800'
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                            }`}
                          >
                            <span>💳 Edit Fee</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDirectConfirmClick(applicant)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#047857] hover:bg-[#065F46] text-white transition-colors cursor-pointer"
                          >
                            <span>✅ Mark as Directly Confirmed</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Button 1: Direct Confirmation */}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDirectConfirmClick(applicant)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#047857] hover:bg-[#065F46] text-white transition-colors cursor-pointer"
                          >
                            <span>✅ Confirm Tutor</span>
                          </button>

                          {/* Button 2: Set Media Fee & Verify */}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleOpenConfirmDialog(applicant)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              isFeePanelOpen
                                ? 'bg-amber-700 text-white border border-amber-800'
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                            }`}
                          >
                            <span>💳 Confirm &amp; Set Fee</span>
                          </button>
                        </>
                      )}

                      {onRejectApplicant && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleRejectDrawer(applicant)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isRejectDrawerOpen
                              ? 'bg-rose-800 text-white border border-rose-900'
                              : isRejected
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-400/50 hover:bg-red-200/70'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          <span>
                            {isRejected
                              ? '❌ Edit Rejection Note'
                              : '❌ Reject'}
                          </span>
                        </button>
                      )}

                      {(isRejected || isTutorRestricted) && onUnblockApplicant && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleUnblockClick(applicant)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 transition-colors cursor-pointer"
                        >
                          <span>🔄 Lift Restriction / Unblock Tutor</span>
                        </button>
                      )}

                      {onHideApplicantFromAdmin && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleHideFromAdminClick(applicant)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition-colors cursor-pointer"
                        >
                          <span>🧹 Delete from Admin Panel</span>
                        </button>
                      )}

                      {onDeleteApplicantEverywhere && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDeleteEverywhereClick(applicant)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white border border-red-800 transition-colors cursor-pointer"
                        >
                          <span>🗑️ Delete from Everywhere</span>
                        </button>
                      )}
                    </div>

                    {/* EXECUTIVE ADMIN REJECTION POPOVER / GLASSMORPHIC INLINE DRAWER */}
                    {isRejectDrawerOpen && (
                      <div
                        role="region"
                        aria-label={`Assign Rejection Note for ${applicant.tutor_name}`}
                        className="mt-3 p-3.5 sm:p-4 rounded-xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-2 border-rose-500/60 dark:border-rose-600/60 space-y-3 w-full max-w-full overflow-x-hidden shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2 pb-2 border-b border-rose-200/70 dark:border-rose-900/60">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                              {lang === 'en'
                                ? 'Executive Compliance & Rejection Desk'
                                : 'আবেদন বাতিল ও রিভিউ নোট'}
                            </span>
                            <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-white">
                              {lang === 'en'
                                ? `❌ Reject Application & Assign Note for ${applicant.tutor_name}`
                                : `❌ ${applicant.tutor_name}-এর আবেদন বাতিল ও নোট প্রদান`}
                            </h4>
                          </div>
                          <button
                            type="button"
                            disabled={isSubmittingReject}
                            onClick={() => setRejectTargetApplicant(null)}
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
                              : 'দ্রুত কারণ নির্বাচন করুন:'}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {ADMIN_REJECTION_QUICK_REASONS.map((reason) => {
                              const isSelectedChip =
                                rejectionNoteInput.trim().toLowerCase() ===
                                reason.toLowerCase();
                              return (
                                <button
                                  key={reason}
                                  type="button"
                                  onClick={() => setRejectionNoteInput(reason)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                    isSelectedChip
                                      ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                      : 'bg-rose-50/80 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                                  }`}
                                >
                                  {reason}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom Rejection Note Input */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                            {lang === 'en'
                              ? 'Custom Admin Review / Rejection Note'
                              : 'কাস্টম অ্যাডমিন রিভিউ / বাতিলের কারণ'}
                          </label>
                          <input
                            type="text"
                            aria-label="Custom Admin Review Note"
                            value={rejectionNoteInput}
                            onChange={(e) =>
                              setRejectionNoteInput(e.target.value)
                            }
                            placeholder={
                              lang === 'en'
                                ? 'Type a custom rejection note or select a quick template above...'
                                : 'বাতিলের কারণ লিখুন অথবা উপরের টেমপ্লেট বেছে নিন...'
                            }
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-rose-200/60 dark:border-rose-900/50">
                          <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={restrictAccountOnReject}
                              onChange={(e) =>
                                setRestrictAccountOnReject(e.target.checked)
                              }
                              className="rounded border-stone-300 text-rose-600 focus:ring-rose-500"
                            />
                            <span>
                              {lang === 'en'
                                ? 'Also restrict tutor account until re-verification'
                                : 'পুনরায় ভেরিফিকেশন না হওয়া পর্যন্ত অ্যাকাউন্ট সীমাবদ্ধ রাখুন'}
                            </span>
                          </label>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={isSubmittingReject}
                              onClick={() => setRejectTargetApplicant(null)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer"
                            >
                              {lang === 'en' ? 'Cancel' : 'বাতিল'}
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingReject}
                              onClick={() => handleExecuteReject(applicant)}
                              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>
                                {isSubmittingReject
                                  ? 'Saving...'
                                  : lang === 'en'
                                  ? 'Confirm Rejection'
                                  : 'বাতিল নিশ্চিত করুন'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* INLINE EXPANDABLE PANEL: SET MEDIA FEE & VERIFY */}
                    {isFeePanelOpen && (
                      <div
                        role="region"
                        aria-label={`Set Media Fee and Verify ${applicant.tutor_name}`}
                        className="mt-3 p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5] dark:bg-stone-900 border-2 border-amber-500/60 dark:border-amber-600/60 space-y-3 w-full max-w-full overflow-x-hidden shadow-xs"
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
                                ? `💳 Confirm & Set Fee for ${applicant.tutor_name} (${job.id})`
                                : `💳 ${applicant.tutor_name}-এর জন্য মিডিয়া ফি নির্ধারণ (${job.id})`}
                            </h4>
                          </div>
                          <button
                            type="button"
                            disabled={isSubmittingConfirm}
                            onClick={() => setConfirmTargetApplicant(null)}
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
                              value={adminMediaFee}
                              onChange={(e) =>
                                setAdminMediaFee(Number(e.target.value) || 0)
                              }
                              className="w-full px-3 py-1.5 text-xs sm:text-sm font-bold font-mono-num rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
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
                              value={adminGuardianPhone}
                              onChange={(e) =>
                                setAdminGuardianPhone(e.target.value)
                              }
                              className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono-num rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
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
                              value={adminGuardianAddress}
                              onChange={(e) =>
                                setAdminGuardianAddress(e.target.value)
                              }
                              className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
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
                              value={adminCustomNote}
                              onChange={(e) =>
                                setAdminCustomNote(e.target.value)
                              }
                              className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
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
                            and unlocks bKash/Nagad payment on tutor&apos;s
                            profile.
                          </span>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={isSubmittingConfirm}
                              onClick={() => setConfirmTargetApplicant(null)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer"
                            >
                              {lang === 'en' ? 'Cancel' : 'বাতিল'}
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingConfirm}
                              onClick={handleExecuteConfirm}
                              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#047857] hover:bg-[#065F46] text-white shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              {isSubmittingConfirm ? (
                                <>
                                  <Clock className="w-3.5 h-3.5 animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>
                                    {lang === 'en'
                                      ? `Submit & Verify (৳${adminMediaFee})`
                                      : `ভেরিফাই ও ফি সেট করুন (৳${adminMediaFee})`}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expandable Full Tutor Profile Card for Admin Inspection */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#047857] dark:text-emerald-400">
                          {linkedProfile
                            ? `Linked Tutor Verification Profile (${linkedProfile.id} · Status: ${linkedProfile.status})`
                            : 'Applicant Details (No separate tutor_verifications record found for this account yet)'}
                        </span>
                        {(applicant.user_email || linkedProfile?.userEmail) && (
                          <span className="font-mono-num text-stone-500">
                            Account: {applicant.user_email || linkedProfile?.userEmail}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs">
                        <div>
                          <span className="block text-[11px] text-stone-500">
                            Full Name
                          </span>
                          <span className="font-bold text-stone-900 dark:text-white">
                            {linkedProfile?.tutorNameEn || applicant.tutor_name}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-stone-500">
                            Mobile Number
                          </span>
                          <span className="font-mono-num font-bold text-stone-900 dark:text-white">
                            {linkedProfile?.phone || applicant.tutor_phone}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-stone-500">
                            Smart NID Number
                          </span>
                          <span className="font-mono-num font-bold text-[#047857] dark:text-emerald-400">
                            {linkedProfile?.nidNumber || 'Not submitted'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-stone-500">
                            Upazila
                          </span>
                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {linkedProfile?.upazila || job.upazila}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-stone-500">
                            Expected Fee
                          </span>
                          <span className="font-mono-num font-bold text-stone-900 dark:text-white">
                            {linkedProfile
                              ? `${formatBDT(linkedProfile.monthlyFee, lang)}/mo`
                              : 'As per circular'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-stone-500">
                            Registration ID
                          </span>
                          <span className="font-mono-num font-bold text-amber-700 dark:text-amber-400">
                            {linkedProfile?.studentRegId || 'Not submitted'}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="block text-[11px] text-stone-500">
                            University / College
                          </span>
                          <span className="font-bold text-stone-900 dark:text-white">
                            {linkedProfile
                              ? `${linkedProfile.institutionFullEn} (${linkedProfile.collegeTag})`
                              : applicant.institution_qualification}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="block text-[11px] text-stone-500">
                            Department / Degree
                          </span>
                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {linkedProfile?.departmentEn ||
                              applicant.institution_qualification}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="block text-[11px] text-stone-500">
                            Teaching Subjects
                          </span>
                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {linkedProfile?.subjectsEn?.join(', ') ||
                              'All Circular Subjects'}
                          </span>
                        </div>
                      </div>

                      {linkedProfile && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* 1. Profile Photo */}
                          <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                            <div className="flex items-center justify-between text-xs font-semibold text-stone-800 dark:text-stone-200 mb-2">
                              <span>Profile Photo (JPG/PNG)</span>
                              <Camera className="w-3.5 h-3.5 text-[#047857]" />
                            </div>
                            {linkedProfile.profilePhotoDataUrl ? (
                              <img
                                src={linkedProfile.profilePhotoDataUrl}
                                alt={`Profile Photo for ${linkedProfile.tutorNameEn}`}
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                                className="w-full h-32 object-cover rounded-lg border border-stone-200 dark:border-stone-700"
                              />
                            ) : (
                              <div className="w-full h-32 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xs text-stone-500">
                                Default Portrait Avatar
                              </div>
                            )}
                          </div>

                          {/* 2. Smart NID Scan */}
                          <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                            <div className="flex items-center justify-between text-xs font-semibold text-stone-800 dark:text-stone-200 mb-2">
                              <span>Smart NID Scan</span>
                              <FileCheck2 className="w-3.5 h-3.5 text-[#047857]" />
                            </div>
                            {linkedProfile.nidScanDataUrl ? (
                              <img
                                src={linkedProfile.nidScanDataUrl}
                                alt={`NID Scan for ${linkedProfile.tutorNameEn}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-32 object-cover rounded-lg border border-stone-200 dark:border-stone-700"
                              />
                            ) : (
                              <div className="w-full h-32 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xs font-mono-num text-stone-600 dark:text-stone-300">
                                NID: {linkedProfile.nidNumber}
                              </div>
                            )}
                          </div>

                          {/* 3. University / Student ID Card Scan */}
                          <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                            <div className="flex items-center justify-between text-xs font-semibold text-stone-800 dark:text-stone-200 mb-2">
                              <span>Student ID Card Scan</span>
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            {linkedProfile.uniScanDataUrl ? (
                              <img
                                src={linkedProfile.uniScanDataUrl}
                                alt={`Student ID Scan for ${linkedProfile.tutorNameEn}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-32 object-cover rounded-lg border border-stone-200 dark:border-stone-700"
                              />
                            ) : (
                              <div className="w-full h-32 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xs font-mono-num text-stone-600 dark:text-stone-300">
                                Reg ID: {linkedProfile.studentRegId}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

