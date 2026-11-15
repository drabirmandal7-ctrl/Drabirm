import React, { useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  Phone,
  Send,
  Sparkles,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { MADARIPUR_UPAZILAS, UPAZILA_LABELS } from '../data/madaripurData';
import { GuardianRequestRecord, Language } from '../types/madaripur';
import { validatePhoneBD } from '../utils/tutorEngine';

export interface GuardianRequestModalProps {
  isOpen: boolean;
  lang: Language;
  onClose: () => void;
  onSubmitRequest: (input: {
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
  }) => Promise<GuardianRequestRecord | void> | void;
}

export const GuardianRequestModal: React.FC<GuardianRequestModalProps> = ({
  isOpen,
  lang,
  onClose,
  onSubmitRequest,
}) => {
  const [headline, setHeadline] = useState('');
  const [upazilaArea, setUpazilaArea] = useState<string>('Madaripur Sadar');
  const [studentClass, setStudentClass] = useState('Class 9-10');
  const [numberOfStudents, setNumberOfStudents] = useState<string>('1');
  const [fullAddress, setFullAddress] = useState('');
  const [mediumVersion, setMediumVersion] = useState('Bangla Medium');
  const [tutoringMode, setTutoringMode] = useState('Home');
  const [preferredGender, setPreferredGender] = useState<string>('Any');
  const [subjects, setSubjects] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState<string>('4');
  const [offeredSalary, setOfferedSalary] = useState<string>('5000');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] =
    useState<GuardianRequestRecord | null>(null);

  if (!isOpen) return null;

  const handlePhoneChange = (val: string) => {
    setGuardianPhone(val);
    if (val.trim()) {
      const isValid = validatePhoneBD(val);
      if (!isValid) {
        setPhoneError(
          lang === 'en'
            ? 'Please enter a valid 11-digit Bangladeshi phone number (e.g. 01308937770).'
            : 'অনুগ্রহ করে ১১ ডিজিটের সঠিক বাংলাদেশী মোবাইল নম্বর লিখুন।'
        );
      } else {
        setPhoneError(null);
      }
    } else {
      setPhoneError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (
      !guardianName.trim() ||
      !studentClass.trim() ||
      !subjects.trim() ||
      !fullAddress.trim()
    ) {
      setFormError(
        lang === 'en'
          ? 'Please fill in Student Class, Location Landmark, Subjects, and Guardian Name.'
          : 'অনুগ্রহ করে শ্রেণি, বাসার ঠিকানা, বিষয় এবং অভিভাবকের নাম পূরণ করুন।'
      );
      return;
    }

    if (!validatePhoneBD(guardianPhone)) {
      setPhoneError(
        lang === 'en'
          ? 'Please enter a valid 11-digit Bangladeshi phone number (e.g. 01308937770).'
          : 'অনুগ্রহ করে ১১ ডিজিটের সঠিক বাংলাদেশী মোবাইল নম্বর লিখুন।'
      );
      return;
    }

    const cleanHeadline = headline.trim();
    const resolvedTimeModeNote = `Mode: ${tutoringMode}`;

    setIsSubmitting(true);
    try {
      const res = await onSubmitRequest({
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        studentClass: studentClass.trim(),
        mediumVersion: mediumVersion.trim(),
        numberOfStudents: Number(numberOfStudents) || 1,
        subjects: subjects.trim(),
        upazilaArea,
        fullAddress: fullAddress.trim(),
        offeredSalary: Number(offeredSalary) || 5000,
        daysPerWeek: Number(daysPerWeek) || 4,
        preferredTimeDuration: resolvedTimeModeNote,
        preferredGender,
        additionalNotes: cleanHeadline || undefined,
      });

      if (res && res.id) {
        setSubmittedRecord(res);
      } else {
        setSubmittedRecord({
          id: `gr-${Date.now()}`,
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
          studentClass: studentClass.trim(),
          mediumVersion: mediumVersion.trim(),
          numberOfStudents: Number(numberOfStudents) || 1,
          subjects: subjects.trim(),
          upazilaArea,
          fullAddress: fullAddress.trim(),
          offeredSalary: Number(offeredSalary) || 5000,
          daysPerWeek: Number(daysPerWeek) || 4,
          preferredTimeDuration: resolvedTimeModeNote,
          preferredGender,
          additionalNotes: cleanHeadline || undefined,
          status: 'pending',
        });
      }
    } catch {
      // Error handled upstream
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedRecord(null);
    setHeadline('');
    setFullAddress('');
    setSubjects('');
    setGuardianName('');
    setGuardianPhone('');
    setPhoneError(null);
    setFormError(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guardian-request-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={handleResetAndClose}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 p-2 rounded-xl bg-white/10 border border-white/20 text-amber-300">
              <UserCheck className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/15 text-[10px] sm:text-[11px] font-extrabold text-amber-200 mb-0.5">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>
                  {lang === 'en'
                    ? 'No Sign-In Required'
                    : 'সাইন-ইন এর প্রয়োজন নেই'}
                </span>
              </div>
              <h2
                id="guardian-request-title"
                className="text-base sm:text-lg font-extrabold tracking-tight text-white truncate"
              >
                {lang === 'en'
                  ? 'Hire a Verified Tutor (For Guardians)'
                  : 'অভিভাবকদের জন্য টিউটর রিকোয়েস্ট ফরম'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Close modal"
            className="shrink-0 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {submittedRecord ? (
            /* Success Feedback Card */
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-white">
                  {lang === 'en'
                    ? 'Tuition Request Submitted Successfully!'
                    : 'আপনার টিউটর রিকোয়েস্ট সফলভাবে জমা হয়েছে!'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1.5 max-w-md mx-auto leading-relaxed">
                  {lang === 'en'
                    ? `Thank you, ${submittedRecord.guardianName}. Tutor Zone admin will review your request and connect you with verified tutors in ${submittedRecord.upazilaArea}.`
                    : `ধন্যবাদ, ${submittedRecord.guardianName}। টিউটর জোন অ্যাডমিন আপনার রিকোয়েস্টটি রিভিউ করে ${submittedRecord.upazilaArea}-এর সেরা শিক্ষকদের সাথে যোগাযোগ করিয়ে দেবে।`}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-stone-500">Student Class:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200 text-right">
                    {submittedRecord.studentClass}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-stone-500">Subjects:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200 text-right">
                    {submittedRecord.subjects}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-stone-500">Salary / Days:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-right">
                    ৳{submittedRecord.offeredSalary} / mo ({submittedRecord.daysPerWeek} days/wk)
                  </span>
                </div>
                <div className="flex justify-between gap-2 items-center">
                  <span className="text-stone-500">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300">
                    Pending Admin Verification
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'Done & Close' : 'সম্পন্ন ও বন্ধ করুন'}
                </button>
              </div>
            </div>
          ) : (
            /* Streamlined Guardian Request Form (Matches Admin Post Circular Structure) */
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* 1. Tuition Requirement Headline / Title (Optional) */}
              <div className="min-w-0">
                <label
                  htmlFor="gr-headline"
                  className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en'
                    ? 'Tuition Requirement Headline / Title (Optional)'
                    : 'টিউশনির শিরোনাম (ঐচ্ছিক)'}
                </label>
                <input
                  id="gr-headline"
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder={
                    lang === 'en'
                      ? 'e.g. Science Tutor Needed for Class 9-10'
                      : 'যেমনঃ ৯ম-১০ম শ্রেণির বিজ্ঞান টিউটর প্রয়োজন'
                  }
                  className="w-full min-w-0 px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                />
              </div>

              {/* 2. Upazila / Location & Exact Location / Landmark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label
                    htmlFor="gr-upazila"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en' ? 'Upazila / Location' : 'উপজেলা / এলাকা'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gr-upazila"
                    value={upazilaArea}
                    onChange={(e) => setUpazilaArea(e.target.value)}
                    className="w-full min-w-0 px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  >
                    {MADARIPUR_UPAZILAS.map((u) => (
                      <option key={u} value={u}>
                        {lang === 'en' ? UPAZILA_LABELS[u].en : UPAZILA_LABELS[u].bn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="gr-full-address"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en'
                      ? 'Exact Location / Landmark'
                      : 'বাসার সঠিক ল্যান্ডমার্ক / ঠিকানা'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input
                      id="gr-full-address"
                      type="text"
                      required
                      value={fullAddress}
                      onChange={(e) => setFullAddress(e.target.value)}
                      placeholder="e.g. Lake Par, Ward 4, Near DC Office"
                      className="w-full min-w-0 pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Student Class & No. of Students */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label
                    htmlFor="gr-student-class"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en' ? 'Student Class' : 'শিক্ষার্থীর শ্রেণি'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="gr-student-class"
                    type="text"
                    required
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder={
                      lang === 'en' ? 'e.g. Class 9-10' : 'যেমনঃ ৯ম-১০ম শ্রেণি'
                    }
                    className="w-full min-w-0 px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="gr-num-students"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en' ? 'No. of Students' : 'শিক্ষার্থীর সংখ্যা'}
                  </label>
                  <select
                    id="gr-num-students"
                    value={numberOfStudents}
                    onChange={(e) => setNumberOfStudents(e.target.value)}
                    className="w-full min-w-0 px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  >
                    <option value="1">1 Student</option>
                    <option value="2">2 Students</option>
                    <option value="3">3 Students</option>
                    <option value="4">4 Students</option>
                  </select>
                </div>
              </div>

              {/* 4. Medium / Version, Mode (Home/Online), & Tutor Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="min-w-0">
                  <label
                    htmlFor="gr-medium-version"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en' ? 'Medium / Version' : 'মিডিয়াম'}
                  </label>
                  <select
                    id="gr-medium-version"
                    value={mediumVersion}
                    onChange={(e) => setMediumVersion(e.target.value)}
                    className="w-full min-w-0 px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  >
                    <option value="Bangla Medium">Bangla Medium</option>
                    <option value="English Version">English Version</option>
                    <option value="Admission Test">Admission Test</option>
                    <option value="Madrasah/Quranic">Madrasah / Quranic</option>
                    <option value="ICT">ICT</option>
                  </select>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="gr-mode"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en' ? 'Mode (Home/Online)' : 'টিউশনির ধরন'}
                  </label>
                  <select
                    id="gr-mode"
                    value={tutoringMode}
                    onChange={(e) => setTutoringMode(e.target.value)}
                    className="w-full min-w-0 px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  >
                    <option value="Home">Home</option>
                    <option value="Online">Online</option>
                    <option value="Group">Group</option>
                  </select>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="gr-gender"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en' ? 'Tutor Gender' : 'শিক্ষকের লিঙ্গ'}
                  </label>
                  <select
                    id="gr-gender"
                    value={preferredGender}
                    onChange={(e) => setPreferredGender(e.target.value)}
                    className="w-full min-w-0 px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  >
                    <option value="Any">Any</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* 5. Subjects Needed, Days per Week, & Monthly Salary (BDT) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="min-w-0">
                  <label
                    htmlFor="gr-subjects"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en' ? 'Subjects Needed' : 'বিষয়সমূহ'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="gr-subjects"
                    type="text"
                    required
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    placeholder="e.g. Math, Physics"
                    className="w-full min-w-0 px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="gr-days"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en' ? 'Days / Week' : 'সপ্তাহে কত দিন'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gr-days"
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(e.target.value)}
                    className="w-full min-w-0 px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  >
                    <option value="2">2 Days / Week</option>
                    <option value="3">3 Days / Week</option>
                    <option value="4">4 Days / Week</option>
                    <option value="5">5 Days / Week</option>
                    <option value="6">6 Days / Week</option>
                  </select>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="gr-salary"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en' ? 'Monthly Salary (BDT)' : 'মাসিক বেতন (টাকা)'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="gr-salary"
                    type="number"
                    required
                    min={1000}
                    max={50000}
                    step={500}
                    value={offeredSalary}
                    onChange={(e) => setOfferedSalary(e.target.value)}
                    placeholder="5000"
                    className="w-full min-w-0 px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-mono-num focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              {/* 6. Guardian Name & Guardian Mobile (11 Digits) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label
                    htmlFor="gr-guardian-name"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en' ? 'Guardian Name' : 'অভিভাবকের নাম'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input
                      id="gr-guardian-name"
                      type="text"
                      required
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="e.g. Rahim Hosen"
                      className="w-full min-w-0 pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="gr-guardian-phone"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    {lang === 'en'
                      ? 'Guardian Mobile (11 Digits)'
                      : 'অভিভাবকের মোবাইল (১১ ডিজিট)'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input
                      id="gr-guardian-phone"
                      type="tel"
                      required
                      value={guardianPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="01308937770"
                      className={`w-full min-w-0 pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border text-stone-900 dark:text-white font-mono-num focus:outline-none transition-colors ${
                        phoneError
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-stone-300 dark:border-stone-700 focus:border-emerald-600'
                      }`}
                    />
                  </div>
                  {phoneError && (
                    <p className="text-[11px] text-red-500 font-semibold mt-1">
                      {phoneError}
                    </p>
                  )}
                </div>
              </div>

              {formError && (
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                  {formError}
                </p>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'Cancel' : 'বাতিল'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>
                    {isSubmitting
                      ? lang === 'en'
                        ? 'Submitting Request...'
                        : 'রিকোয়েস্ট জমা হচ্ছে...'
                      : lang === 'en'
                      ? 'Submit Tuition Request'
                      : 'টিউটর রিকোয়েস্ট জমা দিন'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
