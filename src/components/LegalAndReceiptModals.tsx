import React, { useState } from 'react';
import { Language } from '../types/madaripur';
import { formatBDT, toBanglaNumber } from '../utils/tutorEngine';
import { BrandLogo } from './BrandLogo';
import {
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  FileCheck2,
  GraduationCap,
  Lock,
  Printer,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';

/* ============================================================================
   1. PRINTABLE PAID INVOICE / MONEY RECEIPT MODAL
   ============================================================================ */
export interface ReceiptInvoiceData {
  invoiceId: string;
  tutorName: string;
  tutorCode?: string;
  tutorPhone?: string;
  tutorEmail?: string;
  circularId?: string;
  circularTitle?: string;
  paymentMethod: string;
  senderNumber: string;
  transactionId: string;
  amount: number;
  purpose?: string;
  date: string;
  guardianPhone?: string;
  guardianAddress?: string;
}

interface PaidInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  invoiceData: ReceiptInvoiceData | null;
}

export const PaidInvoiceModal: React.FC<PaidInvoiceModalProps> = ({
  isOpen,
  onClose,
  lang,
  invoiceData,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !invoiceData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyInvoiceId = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(invoiceData.invoiceId);
      }
    } catch {
      // Ignore iframe restrictions
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static"
    >
      {/* Print-specific style override */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice-container, #printable-invoice-container * {
            visibility: visible;
          }
          #printable-invoice-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="printable-invoice-container"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto print:max-h-none print:overflow-visible"
      >
        {/* Subtle Background Security Watermark (Screen + Print) */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 flex flex-col items-center justify-center gap-16 overflow-hidden z-0 opacity-[0.045] dark:opacity-[0.06] print:opacity-[0.06]"
        >
          <span className="-rotate-24 text-2xl sm:text-4xl font-extrabold uppercase tracking-[0.22em] text-stone-900 dark:text-white whitespace-nowrap">
            Tutor Zone · Drabir Mandal
          </span>
          <span className="-rotate-24 text-2xl sm:text-4xl font-extrabold uppercase tracking-[0.22em] text-stone-900 dark:text-white whitespace-nowrap">
            Tutor Zone · Drabir Mandal
          </span>
        </div>

        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print relative z-10 flex items-center justify-between pb-4 mb-6 border-b border-stone-200 dark:border-stone-800">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Tutor Zone Money Receipt · Tutor Zone · Drabir Mandal</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Print / Save PDF' : 'প্রিন্ট / ডাউনলোড PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close invoice modal"
              className="p-1.5 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ====================================================================
           OFFICIAL PRINTABLE MONEY RECEIPT / INVOICE BODY
           ==================================================================== */}
        <div className="relative z-10 space-y-6">
          {/* Header Row: Logo & Official Seal */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-stone-200 dark:border-stone-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BrandLogo size="lg" />
              </div>
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                Verified Educator &amp; Guardian Network · Tutor Zone · Drabir Mandal
              </p>
              <p className="text-[11px] font-mono text-stone-400">
                Support: facebook.com/tutorzone.madaripur · WhatsApp: 01602-393192
              </p>
            </div>

            {/* Official Verified Paid Stamp Seal */}
            <div className="shrink-0 flex flex-col items-end">
              <div className="relative inline-flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-[#047857] dark:border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 rotate-[-2deg] shadow-xs">
                <div className="flex items-center gap-1 text-[#047857] dark:text-emerald-400 font-extrabold text-xs tracking-wider uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>OFFICIAL VERIFIED PAID</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
                  Tutor Zone · Drabir Mandal
                </span>
                <span className="text-[9px] font-mono text-stone-500 dark:text-stone-400">
                  {invoiceData.date}
                </span>
              </div>
            </div>
          </div>

          {/* Receipt Title & Ref Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#047857] dark:text-emerald-400 block">
                Official Money Receipt
              </span>
              <h2 className="text-base font-extrabold text-stone-900 dark:text-white font-mono">
                {invoiceData.invoiceId}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                Date: <strong className="text-stone-900 dark:text-white font-mono">{invoiceData.date}</strong>
              </span>

              <button
                type="button"
                onClick={handleCopyInvoiceId}
                className="no-print p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 transition-colors"
                title="Copy Invoice ID"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* 2-Column Info Grid: Billed To (Tutor) & Payment Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Column 1: Billed To Tutor */}
            <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1.5">
              <span className="block text-[10px] uppercase font-extrabold tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                Billed To (Tutor Member)
              </span>
              <div className="font-bold text-sm text-stone-900 dark:text-white">
                {invoiceData.tutorName}
              </div>
              {invoiceData.tutorCode && (
                <div className="text-stone-600 dark:text-stone-300 font-mono">
                  Verification Code: <strong className="text-[#047857] dark:text-emerald-400">{invoiceData.tutorCode}</strong>
                </div>
              )}
              {invoiceData.tutorPhone && (
                <div className="text-stone-600 dark:text-stone-300 font-mono">
                  Phone: {invoiceData.tutorPhone}
                </div>
              )}
              {invoiceData.tutorEmail && (
                <div className="text-stone-500 dark:text-stone-400 truncate">
                  Email: {invoiceData.tutorEmail}
                </div>
              )}
            </div>

            {/* Column 2: Payment Credentials */}
            <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1.5">
              <span className="block text-[10px] uppercase font-extrabold tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                Payment Verification Details
              </span>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Method:</span>
                <span className={`px-2 py-0.5 rounded font-extrabold text-white text-[11px] ${invoiceData.paymentMethod === 'Nagad' ? 'bg-[#F7941D] text-stone-950' : 'bg-[#E2136E]'}`}>
                  {invoiceData.paymentMethod}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-stone-500">Sender Number:</span>
                <span className="font-bold text-stone-900 dark:text-white">{invoiceData.senderNumber}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-stone-500">Transaction ID (TrxID):</span>
                <span className="font-extrabold text-[#047857] dark:text-emerald-400">{invoiceData.transactionId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Status:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">Verified Paid</span>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-3">Description &amp; Tuition Circular</th>
                  <th className="p-3 text-right">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-stone-800 dark:text-stone-200 font-medium">
                <tr>
                  <td className="p-3">
                    <div className="font-bold text-stone-900 dark:text-white">
                      {invoiceData.purpose || 'Tuition Media Confirmation Fee'}
                    </div>
                    {invoiceData.circularId && (
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        Circular ID: <strong className="font-mono text-emerald-700 dark:text-emerald-400">{invoiceData.circularId}</strong>
                        {invoiceData.circularTitle ? ` · ${invoiceData.circularTitle}` : ''}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-sm">
                    {formatBDT(invoiceData.amount, lang)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-emerald-50/60 dark:bg-emerald-950/40 border-t-2 border-[#047857] text-stone-900 dark:text-white font-extrabold">
                <tr>
                  <td className="p-3 text-right uppercase tracking-wider text-[11px]">Total Paid Amount:</td>
                  <td className="p-3 text-right font-mono text-base text-[#047857] dark:text-emerald-400">
                    {formatBDT(invoiceData.amount, lang)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Unlocked Guardian Contact Details (if present) */}
          {(invoiceData.guardianPhone || invoiceData.guardianAddress) && (
            <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-[#047857]/40 text-xs space-y-1">
              <div className="font-extrabold text-[#047857] dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Unlocked Guardian Information for Circular {invoiceData.circularId}:</span>
              </div>
              {invoiceData.guardianPhone && (
                <div className="text-stone-800 dark:text-stone-200 font-mono">
                  <strong>Guardian Mobile:</strong> {invoiceData.guardianPhone}
                </div>
              )}
              {invoiceData.guardianAddress && (
                <div className="text-stone-800 dark:text-stone-200">
                  <strong>Full Address / Landmark:</strong> {invoiceData.guardianAddress}
                </div>
              )}
            </div>
          )}

          {/* Money Receipt Terms & Refund Policy Footer Note */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
            <div>
              <strong>Tutor Zone Guarantee:</strong> This receipt serves as official digital proof of media fee payment. All payments are protected under our <strong>100% Media Fee Replacement or Full Refund Policy</strong> if the tuition is discontinued within the trial period through no fault of the tutor.
            </div>
          </div>

          {/* Signature Line for Print */}
          <div className="pt-6 flex justify-between items-end text-xs text-stone-400 border-t border-stone-100 dark:border-stone-800">
            <div>
              <span className="block font-mono text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                Security Watermark: Tutor Zone · Drabir Mandal
              </span>
              <span>Official Verified Digital Receipt · No Physical Signature Required</span>
            </div>
            <div className="text-right">
              <div className="w-44 ml-auto border-b border-stone-400 dark:border-stone-600 mb-1" />
              <span className="font-extrabold text-stone-800 dark:text-stone-200 block">
                Tutor Zone · Drabir Mandal
              </span>
              <span className="block text-[10px] text-[#047857] dark:text-emerald-400 font-semibold">
                Official Issuer Signature
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   2. TERMS & CONDITIONS AND MEDIA FEE REFUND POLICY MODAL
   ============================================================================ */
interface TermsAndRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  initialTab?: 'terms' | 'refund';
}

export const TermsAndRefundModal: React.FC<TermsAndRefundModalProps> = ({
  isOpen,
  onClose,
  lang,
  initialTab = 'refund',
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'refund'>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-refund-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/65 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title & Tab Switcher */}
        <div className="pr-10 mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] dark:text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Policy &amp; Safety Directives</span>
          </div>
          <h2
            id="terms-refund-modal-title"
            className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-white"
          >
            {lang === 'en' ? 'Terms & Media Fee Refund Policy' : 'শর্তাবলী ও মিডিয়া ফি রিফান্ড পলিসি'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Transparent rules and safety guarantees for verified tutors and guardians across Madaripur.
          </p>
        </div>

        {/* Tab Navigation Buttons */}
        <div
          role="tablist"
          className="flex border-b border-stone-200 dark:border-stone-800 mb-6 font-bold text-xs sm:text-sm"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'refund'}
            onClick={() => setActiveTab('refund')}
            className={`py-2.5 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'refund'
                ? 'border-[#047857] text-[#047857] dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{lang === 'en' ? 'Media Fee & Refund Safety Guarantee' : 'মিডিয়া ফি ও ১০০% রিফান্ড গ্যারান্টি'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'terms'}
            onClick={() => setActiveTab('terms')}
            className={`py-2.5 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'terms'
                ? 'border-[#047857] text-[#047857] dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>{lang === 'en' ? 'Terms & Conditions' : 'ব্যবহারের শর্তাবলী'}</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'refund' ? (
          /* TAB 2: MEDIA FEE & REFUND POLICY */
          <div className="space-y-5 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            {/* Highlighted Guarantee Banner */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border-2 border-[#047857] text-[#047857] dark:text-emerald-300 space-y-1.5 shadow-xs">
              <div className="font-extrabold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>100% Free Replacement OR Full Media Fee Refund Guarantee</span>
              </div>
              <p className="text-xs leading-normal">
                Tutor Zone ensures complete financial protection for all tutors. If a confirmed tuition circular falls through or is discontinued by the guardian during the trial period through no fault of the tutor, you are guaranteed a <strong>100% Free Replacement</strong> to a new tuition or a <strong>Full Media Fee Refund</strong>.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-stone-900 dark:text-white text-sm mb-1">
                  1. What is the Media Fee? (মিডিয়া ফি কী?)
                </h3>
                <p>
                  The media fee is a nominal administrative charge (standard BDT 1,000 unless specified otherwise on a custom circular) paid by the confirmed tutor after Admin verifies their profile and matches them to a guardian request. This fee covers document verification, guardian background checks, and matching operations.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-stone-900 dark:text-white text-sm mb-1">
                  2. Eligibility for 100% Refund or Replacement (রিফান্ডের শর্তাবলি)
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Guardian Cancellation:</strong> If the guardian cancels the tuition before classes begin or during the 2-day trial period, the tutor receives 100% free replacement to another job or a full refund.</li>
                  <li><strong>Location or Schedule Misrepresentation:</strong> If the actual location or class schedule differs drastically from the published circular and the tutor cannot proceed.</li>
                  <li><strong>Prompt Audit:</strong> Tutors must notify Admin via WhatsApp (01602-393192) or Facebook support within 7 days of confirmation.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-extrabold text-stone-900 dark:text-white text-sm mb-1">
                  3. Refund Processing Time (রিফান্ড পাওয়ার সময়সীমা)
                </h3>
                <p>
                  Once our Admin Desk audits the situation with the guardian, approved refunds are transferred directly back to your bKash or Nagad sender number within <strong>24 to 48 hours</strong>.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-stone-900 dark:text-white text-sm mb-1">
                  4. Printable Paid Money Receipt (অফিশিয়াল মানি রিসিট)
                </h3>
                <p>
                  For every approved bKash or Nagad payment, an official <strong>Tutor Zone Paid Invoice / Money Receipt</strong> with a unique Invoice ID and Verified Seal stamp is made available under your profile for printing or saving as PDF.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 1: TERMS & CONDITIONS */
          <div className="space-y-4 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            <div>
              <h3 className="font-extrabold text-stone-900 dark:text-white text-sm mb-1">
                1. Strict Credential &amp; Document Privacy (গোপনীয়তা ও ভেরিফিকেশন)
              </h3>
              <p>
                Tutor Zone requires all tutors to submit valid Smart NID scans and University/College ID credentials for verification. All NID scans, Student ID scans, and phone numbers are <strong>NEVER displayed publicly</strong> on the Tutor Board. They are stored securely and accessed strictly by authorized admins in the Admin Review Desk.
              </p>
            </div>

            <div>
              <h3 className="font-extrabold text-stone-900 dark:text-white text-sm mb-1">
                2. Authentic Information Policy (সঠিক তথ্যের নিশ্চয়তা)
              </h3>
              <p>
                Tutors must provide truthful academic qualifications, HSC/SSC GPAs, and institutional affiliations. Providing false credentials, fake NID numbers, or impersonating another student results in immediate account termination.
              </p>
            </div>

            <div>
              <h3 className="font-extrabold text-stone-900 dark:text-white text-sm mb-1">
                3. Guardian &amp; Student Code of Conduct (অভিভাবকদের জন্য নির্দেশনা)
              </h3>
              <p>
                Guardians benefit from 2 Free Trial Classes without advance charges. Guardians must provide a respectful learning environment and honor the agreed monthly tutoring fee upon completion of trial classes.
              </p>
            </div>

            <div>
              <h3 className="font-extrabold text-stone-900 dark:text-white text-sm mb-1">
                4. Desk &amp; Session Security (সিকিউরিটি ও সুরক্ষা)
              </h3>
              <p>
                Admin Review operations are strictly locked behind secondary PIN authentication (PIN: 153800 for drabirm4@gmail.com). Non-admin users cannot access administrative audit controls or confidential document vaults.
              </p>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
          <span>© 2026 Tutor Zone · Developed &amp; Maintained by Drabir Mandal</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold cursor-pointer transition-colors"
          >
            {lang === 'en' ? 'I Understand & Accept' : 'আমি বুঝেছি ও সম্মত'}
          </button>
        </div>
      </div>
    </div>
  );
};
