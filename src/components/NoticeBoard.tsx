import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Info,
  Maximize2,
  Megaphone,
  Minimize2,
  ShieldAlert,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Language, SiteNotice } from '../types/madaripur';
import {
  getActiveSiteNotices,
  getNoticeCategoryBadgeStyle,
  toBanglaNumber,
} from '../utils/tutorEngine';

export interface NoticeBoardProps {
  lang: Language;
  notices: SiteNotice[];
  isAdmin?: boolean;
  onOpenAdminNoticeManager?: () => void;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({
  lang,
  notices,
  isAdmin = false,
  onOpenAdminNoticeManager,
}) => {
  const activeNotices = getActiveSiteNotices(notices);
  const [zoomedNotice, setZoomedNotice] = useState<SiteNotice | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zoomedNotice) {
        setZoomedNotice(null);
        setZoomScale(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedNotice]);

  const handleOpenZoom = (notice: SiteNotice) => {
    setZoomedNotice(notice);
    setZoomScale(1);
  };

  const handleCloseZoom = () => {
    setZoomedNotice(null);
    setZoomScale(1);
  };

  const formatNoticeDate = (isoString?: string) => {
    if (!isoString) return lang === 'en' ? 'Recent Update' : 'সাম্প্রতিক নোটিশ';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return lang === 'en' ? 'Recent' : 'সাম্প্রতিক';
      const formatted = d.toLocaleDateString(
        lang === 'en' ? 'en-US' : 'bn-BD',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }
      );
      return formatted;
    } catch {
      return lang === 'en' ? 'Recent' : 'সাম্প্রতিক';
    }
  };

  return (
    <section
      id="official-notice-board"
      aria-label={
        lang === 'en'
          ? 'Official Notices and Announcements'
          : 'অফিসিয়াল নোটিশ ও ঘোষণা'
      }
      className="relative w-full border-t border-stone-200/90 dark:border-stone-800 bg-gradient-to-b from-stone-50/80 via-white to-[#FAF8F5] dark:from-stone-900 dark:via-stone-900/95 dark:to-stone-950 py-10 sm:py-14"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/80 text-xs font-extrabold text-[#047857] dark:text-emerald-300 mb-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Megaphone className="w-3.5 h-3.5" />
              <span>
                {lang === 'en'
                  ? 'Official Notice Board'
                  : 'অফিসিয়াল নোটিশ বোর্ড'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
              {lang === 'en'
                ? 'Official Announcements & Circulars'
                : 'অফিসিয়াল নোটিশ ও গুরুত্বপূর্ণ বিজ্ঞপ্তি'}
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1.5 max-w-2xl leading-relaxed">
              {lang === 'en'
                ? 'Stay informed with verified updates, tuition directives, policy changes, and official announcements directly from Tutor Zone administration.'
                : 'টিউটর জোন অ্যাডমিনিস্ট্রেশনের সরাসরি ভেরিফাইড নির্দেশনা, টিউশনি বিজ্ঞপ্তি ও অফিশিয়াল আপডেট জানুন।'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="font-mono-num text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 shadow-2xs">
              {lang === 'en'
                ? `${activeNotices.length} ${
                    activeNotices.length === 1 ? 'Notice' : 'Notices'
                  }`
                : `${toBanglaNumber(activeNotices.length)} টি নোটিশ`}
            </span>

            {isAdmin && onOpenAdminNoticeManager && (
              <button
                type="button"
                onClick={onOpenAdminNoticeManager}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
              >
                <span>⚙️ Manage Notices</span>
              </button>
            )}
          </div>
        </div>

        {/* Notices Content */}
        {activeNotices.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-stone-850 border border-stone-200/90 dark:border-stone-800 p-8 sm:p-12 text-center shadow-xs">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[#047857] dark:text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white mb-1.5">
              {lang === 'en'
                ? 'All Systems Active · No Emergency Notices'
                : 'সব কার্যক্রম স্বাভাবিক · নতুন কোনো জরুরি বিজ্ঞপ্তি নেই'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
              {lang === 'en'
                ? 'All tuition circulars and tutor verification processes are running normally. New notices will appear here as soon as published.'
                : 'সকল টিউশনি সার্কুলার ও শিক্ষক ভেরিফিকেশন প্রক্রিয়া স্বাভাবিক নিয়মে চলছে। নতুন কোনো ঘোষণা প্রকাশিত হলে এখানে প্রদর্শিত হবে।'}
            </p>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 ${
              activeNotices.length === 1
                ? 'max-w-3xl mx-auto'
                : activeNotices.length === 2
                ? 'md:grid-cols-2'
                : 'md:grid-cols-2 lg:grid-cols-3'
            } gap-6`}
          >
            {activeNotices.map((notice) => {
              const badgeStyle = getNoticeCategoryBadgeStyle(notice.badge_text);
              const formattedDate = formatNoticeDate(notice.created_at);

              return (
                <article
                  key={notice.id}
                  className="group relative overflow-hidden flex flex-col justify-between rounded-2xl bg-white dark:bg-stone-850 border border-stone-200/90 dark:border-stone-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200"
                >
                  {/* Subtle Background Security Watermark */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden z-0 opacity-[0.035] dark:opacity-[0.05]"
                  >
                    <span className="-rotate-18 text-lg sm:text-xl font-extrabold uppercase tracking-[0.18em] text-stone-900 dark:text-white whitespace-nowrap">
                      Tutor Zone · Drabir Mandal
                    </span>
                  </div>

                  <div className="relative z-10 space-y-3.5">
                    {/* Top Row: Category Pill & Publication Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`}
                        />
                        <span>{notice.badge_text || 'Official Notice'}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 dark:text-stone-400">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>{formattedDate}</span>
                      </span>
                    </div>

                    {/* Notice Title */}
                    <h3 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {notice.title}
                    </h3>

                    {/* Notice Description / Content */}
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line line-clamp-6">
                      {notice.content}
                    </p>

                    {/* Image Banner with Click to Zoom Lightbox */}
                    {notice.image_url && (
                      <div className="pt-2">
                        <div
                          onClick={() => handleOpenZoom(notice)}
                          className="relative rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200/90 dark:border-stone-700/80 cursor-pointer shadow-2xs group/img"
                          title={
                            lang === 'en'
                              ? 'Click to zoom poster/image'
                              : 'পোস্টার বড় করে দেখতে ক্লিক করুন'
                          }
                        >
                          <img
                            src={notice.image_url}
                            alt={notice.title}
                            referrerPolicy="no-referrer"
                            className="w-full max-h-80 object-contain sm:object-cover rounded-xl transition-transform duration-300 group-hover/img:scale-[1.02]"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-2xs">
                            <Maximize2 className="w-4 h-4" />
                            <span>
                              {lang === 'en' ? 'Click to Zoom' : 'বড় করে দেখুন'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Official Issuer Signature */}
                  <div className="relative z-10 pt-4 mt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500">
                    <span className="inline-flex items-center gap-1 font-extrabold text-[#047857] dark:text-emerald-400">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>Tutor Zone · Drabir Mandal</span>
                    </span>
                    {notice.image_url && (
                      <button
                        type="button"
                        onClick={() => handleOpenZoom(notice)}
                        className="inline-flex items-center gap-1 text-stone-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>{lang === 'en' ? 'View Poster' : 'পোস্টার দেখুন'}</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Modal for Notice Image / Circular Poster */}
      {zoomedNotice && zoomedNotice.image_url && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-notice-title"
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
          onClick={handleCloseZoom}
        >
          <div
            className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-stone-950/90 border-b border-stone-800 text-white shrink-0">
              <div className="min-w-0 flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  {zoomedNotice.badge_text || 'Official Notice'}
                </span>
                <h3
                  id="lightbox-notice-title"
                  className="text-xs sm:text-sm font-bold truncate"
                >
                  {zoomedNotice.title}
                </h3>
              </div>

              {/* Zoom Controls & Close */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setZoomScale((s) => Math.max(0.6, s - 0.2))}
                  aria-label="Zoom out"
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <span className="font-mono-num text-xs font-semibold px-2 text-stone-400 select-none">
                  {Math.round(zoomScale * 100)}%
                </span>

                <button
                  type="button"
                  onClick={() => setZoomScale((s) => Math.min(2.5, s + 0.2))}
                  aria-label="Zoom in"
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setZoomScale(1)}
                  aria-label="Reset zoom"
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors text-xs font-bold px-2.5 cursor-pointer"
                  title="Reset 100%"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={handleCloseZoom}
                  aria-label="Close modal"
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-900/60 text-stone-300 hover:text-white transition-colors ml-1 cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Image Canvas */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-stone-950/80 min-h-[300px]">
              <img
                src={zoomedNotice.image_url}
                alt={zoomedNotice.title}
                referrerPolicy="no-referrer"
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-xl select-none"
              />
            </div>

            {/* Bottom Caption Bar */}
            <div className="px-4 py-2.5 bg-stone-950/90 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400">
              <span className="truncate max-w-xl">
                {zoomedNotice.content}
              </span>
              <span className="font-mono-num shrink-0 text-[11px] text-emerald-400 font-semibold">
                Tutor Zone · Drabir Mandal · {formatNoticeDate(zoomedNotice.created_at)}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
