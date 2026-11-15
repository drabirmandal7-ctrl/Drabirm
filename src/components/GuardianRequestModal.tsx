import React, { useState } from 'react';
import {
  CheckCircle2,
  DollarSign,
  GraduationCap,
  MapPin,
  Phone,
  Send,
  Sparkles,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { MADARIPUR_UPAZILAS, UPAZILA_LABELS } from '../data/madaripurData';
import { GuardianRequestRecord, Language, Upazila } from '../types/madaripur';
import {
  MADARIPUR_INSTITUTION_CATEGORIES,
  validatePhoneBD,
} from '../utils/tutorEngine';

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
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [studentClass, setStudentClass] = useState('Class 9 (Science)');
  const [mediumVersion, setMediumVersion] = useState('Bangla Medium');
  const [schoolCollegeName, setSchoolCollegeName] = useState('');
  const [numberOfStudents, setNumberOfStudents] = useState<string>('1');
  const [subjects, setSubjects] = useState('');
  const [upazilaArea, setUpazilaArea] = useState<string>('Madaripur Sadar');
  const [fullAddress, setFullAddress] = useState('');
  const [offeredSalary, setOfferedSalary] = useState<string>('5000');
  const [daysPerWeek, setDaysPerWeek] = useState<string>('4');
  const [preferredTimeDuration, setPreferredTimeDuration] = useState<string>(
    'Evening (After 5 PM) · 1.5 hrs'
  );
  const [preferredGender, setPreferredGender] = useState<string>('Any');
  const [preferredUniversity, setPreferredUniversity] = useState<string>(
    'Any Verified University / College'
  );
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<GuardianRequestRecord | null>(null);

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
    const isValidPhone = validatePhoneBD(guardianPhone);
    if (!isValidPhone) {
      setPhoneError(
        lang === 'en'
          ? 'Please enter a valid 11-digit Bangladeshi phone number (e.g. 01308937770).'
          : 'অনুগ্রহ করে ১১ ডিজিটের সঠিক বাংলাদেশী মোবাইল নম্বর লিখুন।'
      );
      return;
    }

    if (!guardianName.trim() || !subjects.trim() || !fullAddress.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmitRequest({
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        studentClass: studentClass.trim(),
        mediumVersion: mediumVersion.trim(),
        schoolCollegeName: schoolCollegeName.trim() || undefined,
        numberOfStudents: Number(numberOfStudents) || 1,
        subjects: subjects.trim(),
        upazilaArea,
        fullAddress: fullAddress.trim(),
        offeredSalary: Number(offeredSalary) || 5000,
        daysPerWeek: Number(daysPerWeek) || 4,
        preferredTimeDuration: preferredTimeDuration.trim() || undefined,
        preferredGender,
        preferredUniversity: preferredUniversity.trim() || undefined,
        additionalNotes: additionalNotes.trim() || undefined,
      });

      if (res && res.id) {
        setSubmittedRecord(res);
      } else {
        setSubmittedRecord({
          id: `gr-${Date.now()}`,
          guardianName,
          guardianPhone,
          studentClass,
          mediumVersion,
          schoolCollegeName: schoolCollegeName.trim() || undefined,
          numberOfStudents: Number(numberOfStudents) || 1,
          subjects,
          upazilaArea,
          fullAddress,
          offeredSalary: Number(offeredSalary) || 5000,
          daysPerWeek: Number(daysPerWeek) || 4,
          preferredTimeDuration: preferredTimeDuration.trim() || undefined,
          preferredGender,
          preferredUniversity: preferredUniversity.trim() || undefined,
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
    setGuardianName('');
    setGuardianPhone('');
    setSchoolCollegeName('');
    setSubjects('');
    setFullAddress('');
    setAdditionalNotes('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guardian-request-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={handleResetAndClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white relative">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-amber-300">
              <UserCheck className="w-6 h-6" />
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-extrabold text-amber-200 mb-1">
                <Sparkles className="w-3 h-3" />
                <span>
                  {lang === 'en'
                    ? 'No Sign-In Required'
                    : 'সাইন-ইন এর প্রয়োজন নেই'}
                </span>
              </div>
              <h2
                id="guardian-request-title"
                className="text-lg sm:text-xl font-extrabold tracking-tight text-white"
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
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
          {submittedRecord ? (
            /* Success Feedback Card */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-stone-900 dark:text-white">
                  {lang === 'en'
                    ? 'Tuition Request Submitted Successfully!'
                    : 'আপনার টিউটর রিকোয়েস্ট সফলভাবে জমা হয়েছে!'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-2 max-w-md mx-auto leading-relaxed">
                  {lang === 'en'
                    ? `Thank you, ${submittedRecord.guardianName}. Tutor Zone administration will review your request and connect you with top verified tutors in ${submittedRecord.upazilaArea}.`
                    : `ধন্যবাদ, ${submittedRecord.guardianName}। টিউটর জোন অ্যাডমিনিস্ট্রেশন আপনার রিকোয়েস্টটি রিভিউ করে খুব শীঘ্রই ${submittedRecord.upazilaArea}-এর সেরা শিক্ষকদের সাথে যোগাযোগ করিয়ে দেবে।`}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Student Level:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    {submittedRecord.studentClass}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Subjects:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    {submittedRecord.subjects}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Salary / Days:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    ৳{submittedRecord.offeredSalary} / mo ({submittedRecord.daysPerWeek} days/wk)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300">
                    Pending Admin Verification
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'Done & Close' : 'সম্পন্ন ও বন্ধ করুন'}
                </button>
              </div>
            </div>
          ) : (
            /* Guardian Request Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
                {lang === 'en'
                  ? 'Fill out the details below to request a verified home or online tutor in Madaripur. Our admin panel will process your request promptly.'
                  : 'মাদারীপুরের অভিজ্ঞ ও ভেরিফাইড শিক্ষক পেতে আপনার পছন্দ ও প্রয়োজনীয় তথ্যসমূহ নিচে পূরণ করুন।'}
              </p>

              {/* Grid 1: Guardian Name & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="gr-guardian-name"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Guardian Name <span className="text-red-500">*</span>
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
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="gr-guardian-phone"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Guardian Phone Number <span className="text-red-500">*</span>
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
                      className={`w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border text-stone-900 dark:text-white focus:outline-none transition-colors ${
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

              {/* Grid 2: Student Class, Medium/Version, School/College Name, & Number of Students */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <label
                    htmlFor="gr-student-class"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Student Class <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input
                      id="gr-student-class"
                      type="text"
                      required
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      placeholder="e.g. Class 9 (Science)"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="gr-medium-version"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Medium / Version <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gr-medium-version"
                    value={mediumVersion}
                    onChange={(e) => setMediumVersion(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  >
                    <option value="Bangla Medium">Bangla Medium</option>
                    <option value="English Version">English Version</option>
                    <option value="Madrasah/Quranic">Madrasah / Quranic</option>
                    <option value="Admission Test">Admission Test</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="gr-school-college"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    School / College Name
                  </label>
                  <input
                    id="gr-school-college"
                    type="text"
                    list="madaripur-institutions-datalist"
                    value={schoolCollegeName}
                    onChange={(e) => setSchoolCollegeName(e.target.value)}
                    placeholder="e.g. Madaripur Govt. College (Govt. Nazimuddin College)"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gr-num-students"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    No. of Students
                  </label>
                  <select
                    id="gr-num-students"
                    value={numberOfStudents}
                    onChange={(e) => setNumberOfStudents(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  >
                    <option value="1">1 Student</option>
                    <option value="2">2 Students</option>
                    <option value="3">3 Students</option>
                    <option value="4">4 Students</option>
                  </select>
                </div>
              </div>

              {/* Grid 2B: Subjects & Preferred University/Qualification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="gr-subjects"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Subjects Needed (Comma Separated) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="gr-subjects"
                    type="text"
                    required
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    placeholder="e.g. Physics, Higher Math, Chemistry"
                    className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gr-preferred-uni"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Preferred University / Qualification
                  </label>
                  <input
                    id="gr-preferred-uni"
                    type="text"
                    list="madaripur-institutions-datalist"
                    value={preferredUniversity}
                    onChange={(e) => setPreferredUniversity(e.target.value)}
                    placeholder="e.g. Madaripur Govt. College (Govt. Nazimuddin College)"
                    className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                  <datalist id="madaripur-institutions-datalist">
                    {MADARIPUR_INSTITUTION_CATEGORIES.map((inst) => (
                      <option key={inst} value={inst}>
                        {inst}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Grid 3: Upazila/Area & Full Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="gr-upazila"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Upazila / Location <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gr-upazila"
                    value={upazilaArea}
                    onChange={(e) => setUpazilaArea(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  >
                    {MADARIPUR_UPAZILAS.map((u) => (
                      <option key={u} value={u}>
                        {lang === 'en' ? UPAZILA_LABELS[u].en : UPAZILA_LABELS[u].bn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="gr-full-address"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Complete Home Address / Landmark <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input
                      id="gr-full-address"
                      type="text"
                      required
                      value={fullAddress}
                      onChange={(e) => setFullAddress(e.target.value)}
                      placeholder="e.g. Lake Par, Ward 4, Near DC Office, Madaripur Sadar"
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 4: Salary, Days per Week, Preferred Time/Duration, & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <label
                    htmlFor="gr-salary"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Offered Salary (BDT/mo) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
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
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="gr-days"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Days per Week <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gr-days"
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  >
                    <option value="2">2 Days / Week</option>
                    <option value="3">3 Days / Week</option>
                    <option value="4">4 Days / Week</option>
                    <option value="5">5 Days / Week</option>
                    <option value="6">6 Days / Week</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="gr-time-duration"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Tutoring Time / Duration
                  </label>
                  <input
                    id="gr-time-duration"
                    type="text"
                    value={preferredTimeDuration}
                    onChange={(e) => setPreferredTimeDuration(e.target.value)}
                    placeholder="e.g. Evening 5 PM · 1.5 hrs"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gr-gender"
                    className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                  >
                    Preferred Gender
                  </label>
                  <select
                    id="gr-gender"
                    value={preferredGender}
                    onChange={(e) => setPreferredGender(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                  >
                    <option value="Any">Any Gender</option>
                    <option value="Male">Male Tutor Only</option>
                    <option value="Female">Female Tutor Only</option>
                  </select>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label
                  htmlFor="gr-notes"
                  className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                >
                  Additional Requirements / Special Notes
                </label>
                <textarea
                  id="gr-notes"
                  rows={2}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="e.g. Prefers BUET or DU student, timing in the evening after 5 PM."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 transition-colors"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Submitting Request...'
                      : 'Submit Tuition Request'}
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
