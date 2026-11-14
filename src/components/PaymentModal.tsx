import React, { useEffect, useState } from 'react';
import {
  Language,
  PaymentMethod,
  PaymentRequestRecord,
  VerificationRequest,
} from '../types/madaripur';
import {
  DEFAULT_BKASH_NUMBER,
  DEFAULT_NAGAD_NUMBER,
  DEFAULT_VERIFICATION_FEE_BDT,
  PaymentSubmissionInput,
  SiteSocialSettings,
  UserAccount,
  formatBDT,
  validatePaymentSubmissionInput,
} from '../utils/tutorEngine';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Lock,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';

export interface PaymentModalProps {
  isOpen: boolean;
  lang: Language;
  onClose: () => void;
  currentUser?: UserAccount | null;
  myTutorProfile?: VerificationRequest | null;
  siteSettings?: SiteSocialSettings;
  userPayments?: PaymentRequestRecord[];
  defaultMethod?: PaymentMethod;
  defaultPurpose?: string;
  defaultAmount?: number;
  circularId?: string;
  circularTitle?: string;
  guardianPhone?: string;
  guardianAddress?: string;
  onSubmitPayment: (
    input: PaymentSubmissionInput
  ) => Promise<PaymentRequestRecord | void> | PaymentRequestRecord | void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  lang,
  onClose,
  currentUser,
  myTutorProfile,
  siteSettings,
  userPayments = [],
  defaultMethod = 'bKash',
  defaultPurpose = 'Profile Verification Fee',
  defaultAmount,
  circularId,
  circularTitle,
  guardianPhone,
  guardianAddress,
  onSubmitPayment,
}) => {
  const officialBkash =
    (siteSettings?.bkashNumber || '').trim() || DEFAULT_BKASH_NUMBER;
  const officialNagad =
    (siteSettings?.nagadNumber || '').trim() || DEFAULT_NAGAD_NUMBER;
  const defaultFee =
    defaultAmount && defaultAmount > 0
      ? defaultAmount
      : siteSettings?.verificationFee && siteSettings.verificationFee > 0
      ? siteSettings.verificationFee
      : DEFAULT_VERIFICATION_FEE_BDT;

  const resolvedInitialPurpose =
    defaultPurpose ||
    (circularId
      ? `Tuition Media Fee (${circularId})`
      : 'Profile Verification Fee');

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>(defaultMethod);
  const [purpose, setPurpose] = useState<string>(resolvedInitialPurpose);
  const [amount, setAmount] = useState<string>(String(defaultFee));
  const [tutorName, setTutorName] = useState<string>('');
  const [senderNumber, setSenderNumber] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedReceipt, setSubmittedReceipt] =
    useState<PaymentRequestRecord | null>(null);
  const [copiedMethod, setCopiedMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod(defaultMethod);
      const initPurp =
        defaultPurpose ||
        (circularId
          ? `Tuition Media Fee (${circularId})`
          : 'Profile Verification Fee');
      setPurpose(initPurp);
      setAmount(String(defaultFee));
      setTutorName(
        myTutorProfile?.tutorNameEn ||
          currentUser?.fullName ||
          (currentUser?.email ? currentUser.email.split('@')[0] : '') ||
          ''
      );
      setSenderNumber(myTutorProfile?.phone || '');
      setTransactionId('');
      setErrorMsg('');
      setIsSubmitting(false);
      setSubmittedReceipt(null);
      setCopiedMethod(null);
    }
  }, [
    isOpen,
    defaultMethod,
    defaultPurpose,
    defaultFee,
    circularId,
    myTutorProfile,
    currentUser,
  ]);

  if (!isOpen) return null;

  const activeOfficialNumber =
    paymentMethod === 'Nagad' ? officialNagad : officialBkash;

  const handleCopyNumber = async (method: PaymentMethod, num: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(num);
      }
    } catch {
      // Ignore clipboard permission errors in iframe
    }
    setCopiedMethod(method);
    window.setTimeout(() => {
      setCopiedMethod((prev) => (prev === method ? null : prev));
    }, 2200);
  };

  const handleSelectPackage = (pkgLabel: string, pkgAmount: number) => {
    setPurpose(pkgLabel);
    setAmount(String(pkgAmount));
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const payload: PaymentSubmissionInput = {
      paymentMethod,
      senderNumber: senderNumber.trim(),
      transactionId: transactionId.trim().toUpperCase(),
      amount: Number(amount) || defaultFee,
      purpose: purpose.trim() || (circularId ? `Tuition Media Fee (${circularId})` : 'Profile Verification Fee'),
      circularId: circularId?.trim() || undefined,
      circularTitle: circularTitle?.trim() || undefined,
      guardianPhone: guardianPhone?.trim() || undefined,
      guardianAddress: guardianAddress?.trim() || undefined,
      tutorName:
        tutorName.trim() ||
        myTutorProfile?.tutorNameEn ||
        currentUser?.fullName ||
        'Tutor Applicant',
      tutorId: myTutorProfile?.id || currentUser?.id,
      userEmail:
        currentUser?.email ||
        myTutorProfile?.userEmail ||
        myTutorProfile?.email ||
        null,
      userId: currentUser?.id || myTutorProfile?.userId || null,
    };

    const validation = validatePaymentSubmissionInput(payload);
    if (!validation.valid) {
      setErrorMsg(
        (lang === 'en' ? validation.errorEn : validation.errorBn) ||
          validation.errorEn ||
          'Please check your payment details.'
      );
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const result = await onSubmitPayment(payload);
      const receipt: PaymentRequestRecord = result || {
        id: `PAY-2026-${Math.floor(100 + Math.random() * 899)}`,
        requestCode: `PAY-2026-${Math.floor(100 + Math.random() * 899)}`,
        tutorName: payload.tutorName || 'Verified Tutor',
        tutorId: payload.tutorId,
        userEmail: payload.userEmail || undefined,
        userId: payload.userId || undefined,
        paymentMethod,
        senderNumber: payload.senderNumber.replace(/[\s-]/g, ''),
        transactionId: payload.transactionId,
        amount: Number(payload.amount) || defaultFee,
        purpose: payload.purpose || 'Profile Verification Fee',
        circularId: payload.circularId,
        circularTitle: payload.circularTitle,
        guardianPhone: payload.guardianPhone,
        guardianAddress: payload.guardianAddress,
        status: 'Pending',
        createdAt: 'Just now',
      };
      setSubmittedReceipt(receipt);
      setTransactionId('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : lang === 'en'
          ? 'Failed to submit payment verification request. Please try again.'
          : 'পেমেন্ট ভেরিফিকেশন জমা দেওয়া যায়নি। আবার চেষ্টা করুন।'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/65 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-2xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close payment verification modal"
          className="absolute top-4 right-4 p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="pr-10 mb-4">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#047857] dark:text-emerald-400 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {lang === 'en'
                ? 'Official Mobile Banking · Instant TrxID Verification'
                : 'অফিশিয়াল মোবাইল ব্যাংকিং · দ্রুত TrxID ভেরিফিকেশন'}
            </span>
          </div>
          <h2
            id="payment-modal-title"
            className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-white leading-tight"
          >
            {circularId
              ? lang === 'en'
                ? `Pay Media Fee · Circular ${circularId}`
                : `মিডিয়া ফি প্রদান · সার্কুলার ${circularId}`
              : lang === 'en'
              ? 'bKash & Nagad Payment Verification'
              : 'বিকাশ ও নগদ পেমেন্ট ভেরিফিকেশন'}
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
            {circularId
              ? lang === 'en'
                ? `Send the media fee for "${circularTitle || circularId}". Once Admin verifies your TrxID in the Admin Review Desk, the Guardian's phone number and full address will automatically unlock.`
                : `"${circularTitle || circularId}"-এর জন্য মিডিয়া ফি বিকাশ বা নগদে পাঠান। অ্যাডমিন আপনার TrxID ভেরিফাই করলে অভিভাবকের ফোন নম্বর ও ঠিকানা স্বয়ংক্রিয়ভাবে আনলক হয়ে যাবে।`
              : lang === 'en'
              ? 'Send your verification or media fee to our official bKash or Nagad number below, then submit your Sender Number and Transaction ID (TrxID).'
              : 'নিচের অফিশিয়াল বিকাশ অথবা নগদ নম্বরে ফি পাঠিয়ে আপনার প্রেরক নম্বর ও ট্রানজেকশন আইডি (TrxID) সাবমিট করুন।'}
          </p>
        </div>

        {/* Interactive bKash & Nagad Method Selector Cards */}
        <div
          role="group"
          aria-label="Select Payment Method (bKash or Nagad)"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"
        >
          {/* bKash Card */}
          <div
            onClick={() => {
              setPaymentMethod('bKash');
              setErrorMsg('');
            }}
            className={`rounded-xl p-3.5 border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
              paymentMethod === 'bKash'
                ? 'border-[#E2136E] bg-[#E2136E]/8 dark:bg-[#E2136E]/15 shadow-xs'
                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/80 hover:border-[#E2136E]/50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPaymentMethod('bKash');
                  setErrorMsg('');
                }}
                aria-pressed={paymentMethod === 'bKash'}
                className="inline-flex items-center gap-2 text-left focus:outline-none cursor-pointer"
              >
                <span className="w-8 h-8 rounded-lg bg-[#E2136E] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  bK
                </span>
                <div>
                  <span className="block text-sm font-extrabold text-stone-900 dark:text-white leading-tight">
                    bKash Personal / Payment
                  </span>
                  <span className="block text-[11px] font-semibold text-[#E2136E] dark:text-pink-400">
                    {lang === 'en' ? 'Send Money / Payment' : 'সেন্ড মানি / পেমেন্ট'}
                  </span>
                </div>
              </button>

              {paymentMethod === 'bKash' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E2136E] text-white">
                  Selected
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-stone-200/70 dark:border-stone-700/70 flex items-center justify-between gap-2">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold">
                  Official bKash Number
                </span>
                <span className="font-mono-num text-sm font-extrabold text-stone-900 dark:text-white">
                  {officialBkash}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleCopyNumber('bKash', officialBkash);
                }}
                aria-label={`Copy official bKash number ${officialBkash}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:border-[#E2136E] text-[11px] font-bold text-stone-700 dark:text-stone-200 transition-colors cursor-pointer"
              >
                {copiedMethod === 'bKash' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Nagad Card */}
          <div
            onClick={() => {
              setPaymentMethod('Nagad');
              setErrorMsg('');
            }}
            className={`rounded-xl p-3.5 border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
              paymentMethod === 'Nagad'
                ? 'border-[#F7941D] bg-[#F7941D]/10 dark:bg-[#F7941D]/15 shadow-xs'
                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/80 hover:border-[#F7941D]/50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPaymentMethod('Nagad');
                  setErrorMsg('');
                }}
                aria-pressed={paymentMethod === 'Nagad'}
                className="inline-flex items-center gap-2 text-left focus:outline-none cursor-pointer"
              >
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F7941D] to-[#EC1C24] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  NG
                </span>
                <div>
                  <span className="block text-sm font-extrabold text-stone-900 dark:text-white leading-tight">
                    Nagad Personal / Payment
                  </span>
                  <span className="block text-[11px] font-semibold text-[#D97706] dark:text-amber-400">
                    {lang === 'en' ? 'Send Money / Payment' : 'সেন্ড মানি / পেমেন্ট'}
                  </span>
                </div>
              </button>

              {paymentMethod === 'Nagad' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F7941D] text-stone-950">
                  Selected
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-stone-200/70 dark:border-stone-700/70 flex items-center justify-between gap-2">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold">
                  Official Nagad Number
                </span>
                <span className="font-mono-num text-sm font-extrabold text-stone-900 dark:text-white">
                  {officialNagad}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleCopyNumber('Nagad', officialNagad);
                }}
                aria-label={`Copy official Nagad number ${officialNagad}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:border-[#F7941D] text-[11px] font-bold text-stone-700 dark:text-stone-200 transition-colors cursor-pointer"
              >
                {copiedMethod === 'Nagad' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {submittedReceipt ? (
          /* Confirmation Receipt State */
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl bg-white dark:bg-stone-800 border border-emerald-500/40 p-5 text-center mb-4 shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-[#047857] dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white mb-1">
              {lang === 'en'
                ? `${submittedReceipt.paymentMethod} Payment Submitted for Verification!`
                : `${submittedReceipt.paymentMethod} পেমেন্ট ভেরিফিকেশনের জন্য জমা হয়েছে!`}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 mb-4">
              {lang === 'en'
                ? `Your Transaction ID (${submittedReceipt.transactionId}) has been recorded in Supabase "payment_requests" and sent to the Admin Review Desk.`
                : `আপনার ট্রানজেকশন আইডি (${submittedReceipt.transactionId}) সুপাবেস ডাটাবেসে সংরক্ষিত হয়েছে এবং অ্যাডমিন রিভিউতে পাঠানো হয়েছে।`}
            </p>

            <div className="text-left p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs space-y-1.5 mb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-stone-500">Request Code:</span>
                <span className="font-mono-num font-bold text-[#047857] dark:text-emerald-400">
                  {submittedReceipt.requestCode}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-stone-500">Payment Method:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md text-white text-[11px] ${
                    submittedReceipt.paymentMethod === 'Nagad'
                      ? 'bg-[#F7941D] text-stone-950'
                      : 'bg-[#E2136E]'
                  }`}
                >
                  {submittedReceipt.paymentMethod}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-stone-500">Sender Number:</span>
                <span className="font-mono-num font-bold text-stone-900 dark:text-white">
                  {submittedReceipt.senderNumber}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-stone-500">Transaction ID (TrxID):</span>
                <span className="font-mono-num font-extrabold text-stone-900 dark:text-white">
                  {submittedReceipt.transactionId}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-stone-500">Amount & Purpose:</span>
                <span className="font-mono-num font-bold text-stone-900 dark:text-white">
                  {formatBDT(submittedReceipt.amount, lang)} ·{' '}
                  {submittedReceipt.purpose}
                </span>
              </div>
              {submittedReceipt.circularId && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-stone-500">Tuition Circular:</span>
                  <span className="font-mono-num font-extrabold text-[#047857] dark:text-emerald-400">
                    {submittedReceipt.circularId}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-stone-500">Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Admin Review</span>
                </span>
              </div>
            </div>

            {submittedReceipt.circularId && (
              <div className="p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 text-left flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {lang === 'en'
                    ? `Guardian contact details for Circular ${submittedReceipt.circularId} will automatically unlock on your Applied Tuitions card once Admin approves this TrxID.`
                    : `অ্যাডমিন এই TrxID অনুমোদন করার সাথে সাথে সার্কুলার ${submittedReceipt.circularId}-এর জন্য অভিভাবকের ফোন নম্বর ও ঠিকানা স্বয়ংক্রিয়ভাবে আনলক হয়ে যাবে।`}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setSubmittedReceipt(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
              >
                {lang === 'en'
                  ? 'Submit Another TrxID'
                  : 'আরেকটি TrxID জমা দিন'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Done' : 'সম্পন্ন'}
              </button>
            </div>
          </div>
        ) : (
          /* Payment Submission Form */
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white dark:bg-stone-800/90 border border-stone-200/90 dark:border-stone-700 p-4 sm:p-5 mb-4"
          >
            {/* Quick Fee Package Presets */}
            <div className="mb-3.5">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                {lang === 'en'
                  ? '1. Select Verification or Media Package'
                  : '১. পেমেন্ট প্যাকেজ নির্বাচন করুন'}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSelectPackage('Profile Verification Fee', defaultFee)
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    purpose === 'Profile Verification Fee'
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border-[#047857] text-[#047857] dark:text-emerald-300'
                      : 'bg-[#FAF8F5] dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Profile Verification ({formatBDT(defaultFee, lang)})
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSelectPackage('Tuition Media Confirmation Fee', 1000)
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    purpose === 'Tuition Media Confirmation Fee'
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border-[#047857] text-[#047857] dark:text-emerald-300'
                      : 'bg-[#FAF8F5] dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  Tuition Media Fee ({formatBDT(1000, lang)})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label
                  htmlFor="pay-tutor-name"
                  className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en' ? 'Tutor / Sender Name' : 'শিক্ষকের নাম'}
                </label>
                <input
                  id="pay-tutor-name"
                  type="text"
                  value={tutorName}
                  onChange={(e) => setTutorName(e.target.value)}
                  placeholder="e.g. Md. Rakibul Hasan"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="pay-amount-bdt"
                  className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en' ? 'Amount (BDT ৳)' : 'টাকার পরিমাণ (৳)'}
                </label>
                <input
                  id="pay-amount-bdt"
                  type="number"
                  min={50}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono-num font-bold rounded-xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
              <div>
                <label
                  htmlFor="pay-sender-number"
                  className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en'
                    ? `Sender ${paymentMethod} Number (11 Digits)`
                    : `প্রেরক ${paymentMethod} নম্বর (১১ ডিজিট)`}
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="pay-sender-number"
                    type="tel"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="01712345678"
                    className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm font-mono-num rounded-xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="pay-trx-id"
                  className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                >
                  {lang === 'en'
                    ? `${paymentMethod} Transaction ID (TrxID)`
                    : `${paymentMethod} ট্রানজেকশন আইডি (TrxID)`}
                </label>
                <div className="relative">
                  <CreditCard className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="pay-trx-id"
                    type="text"
                    value={transactionId}
                    onChange={(e) =>
                      setTransactionId(e.target.value.toUpperCase())
                    }
                    placeholder={
                      paymentMethod === 'bKash'
                        ? 'e.g. BK9842X19Q'
                        : 'e.g. 8N7A6D5E12'
                    }
                    className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm font-mono-num font-bold uppercase rounded-xl bg-[#FAF8F5] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Step Reminder */}
            <div className="p-2.5 rounded-xl bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200/70 dark:border-stone-700 text-[11px] text-stone-600 dark:text-stone-400 mb-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0" />
                <span>
                  {lang === 'en' ? (
                    <>
                      Send{' '}
                      <strong className="font-mono-num text-stone-900 dark:text-white">
                        {formatBDT(Number(amount) || defaultFee, lang)}
                      </strong>{' '}
                      via <strong>{paymentMethod}</strong> to{' '}
                      <strong className="font-mono-num text-stone-900 dark:text-white">
                        {activeOfficialNumber}
                      </strong>{' '}
                      before submitting your TrxID.
                    </>
                  ) : (
                    <>
                      TrxID সাবমিট করার পূর্বে{' '}
                      <strong className="font-mono-num text-stone-900 dark:text-white">
                        {activeOfficialNumber}
                      </strong>{' '}
                      নম্বরে <strong>{paymentMethod}</strong> করুন।
                    </>
                  )}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="mb-3 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/70 border border-red-300 dark:border-red-800 text-xs font-bold text-red-700 dark:text-red-300 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 px-4 rounded-xl text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                paymentMethod === 'Nagad'
                  ? 'bg-gradient-to-r from-[#F7941D] to-[#EC1C24] hover:opacity-95'
                  : 'bg-gradient-to-r from-[#E2136E] to-[#B80D57] hover:opacity-95'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? lang === 'en'
                    ? 'Submitting to Supabase...'
                    : 'সুপাবেসে জমা হচ্ছে...'
                  : lang === 'en'
                  ? `Submit ${paymentMethod} TrxID for Verification`
                  : `${paymentMethod} TrxID ভেরিফিকেশনের জন্য জমা দিন`}
              </span>
            </button>
          </form>
        )}

        {/* User's Recent Payment Verification History */}
        {userPayments.length > 0 && (
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              {lang === 'en'
                ? `Your Submitted Payment Requests (${userPayments.length})`
                : `আপনার জমাকৃত পেমেন্ট তালিকা (${userPayments.length})`}
            </h3>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {userPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white shrink-0 ${
                        pay.paymentMethod === 'Nagad'
                          ? 'bg-[#F7941D] text-stone-950'
                          : 'bg-[#E2136E]'
                      }`}
                    >
                      {pay.paymentMethod}
                    </span>
                    <div className="min-w-0">
                      <div className="font-mono-num font-bold text-stone-900 dark:text-white truncate">
                        TrxID: {pay.transactionId} ·{' '}
                        {formatBDT(pay.amount, lang)}
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400 font-mono-num">
                        From: {pay.senderNumber} · {pay.requestCode}
                      </div>
                    </div>
                  </div>

                  <div>
                    {pay.status === 'Approved' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-[#047857] dark:text-emerald-300 border border-[#047857]/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : pay.status === 'Rejected' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-400/30">
                        <XCircle className="w-3 h-3" />
                        <span>Rejected</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-400/40">
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
