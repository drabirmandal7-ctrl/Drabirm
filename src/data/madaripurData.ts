import {
  Language,
  TuitionJob,
  TutorProfile,
  Upazila,
  VerificationRequest,
} from '../types/madaripur';

export const MADARIPUR_UPAZILAS: Exclude<Upazila, 'All'>[] = [
  'Madaripur Sadar',
  'Shibchar',
  'Kalkini',
  'Rajoir',
  'Dasar',
];

export const UPAZILA_LABELS: Record<
  Upazila,
  { en: string; bn: string; subEn: string; subBn: string; count: number }
> = {
  All: {
    en: 'All Areas',
    bn: 'সকল এলাকা',
    subEn: '5 Hubs · All Regions',
    subBn: '৫টি হাব · সকল অঞ্চল',
    count: 0,
  },
  'Madaripur Sadar': {
    en: 'Madaripur Sadar',
    bn: 'মাদারীপুর সদর',
    subEn: 'Shakuni Lake · Police Lines · College Rd',
    subBn: 'শকুনী লেক · পুলিশ লাইনস · কলেজ রোড',
    count: 0,
  },
  Shibchar: {
    en: 'Shibchar',
    bn: 'শিবচর',
    subEn: 'Pachchar · Express Highway · 71 Sculpture',
    subBn: 'পাচ্চর · এক্সপ্রেস হাইওয়ে · ৭১ চত্বর',
    count: 0,
  },
  Kalkini: {
    en: 'Kalkini',
    bn: 'কালকিনি',
    subEn: 'Kalkini Municipality · Syed Abul Hossain Rd',
    subBn: 'কালকিনি পৌরসভা · সৈয়দ আবুল হোসেন সড়ক',
    count: 0,
  },
  Rajoir: {
    en: 'Rajoir',
    bn: 'রাজৈর',
    subEn: 'Tekerhat Port · Amgram · Bhanga Bridge',
    subBn: 'টেকেরহাট বন্দর · আমগ্রাম · ভাঙ্গা ব্রিজ',
    count: 0,
  },
  Dasar: {
    en: 'Dasar',
    bn: 'ডাসার',
    subEn: 'Govt. Sheikh Hasina Academy · Nabagram',
    subBn: 'ডাসার উপজেলা · নবগ্রাম · কাজীবাকাই',
    count: 0,
  },
};

export const TUTORING_MODES_META = [
  {
    id: 'Home' as const,
    code: '01',
    titleEn: 'Home Tutoring',
    titleBn: 'হোম টিউশন (বাসায় গিয়ে)',
    descEn: '1-on-1 personal guidance at your residence across all local hubs.',
    descBn: 'যেকোনো এলাকায় বাসায় গিয়ে ১-টু-১ যত্নসহকারে পাঠদান।',
    rateRangeEn: '৳3,000 – ৳8,000 / mo',
    rateRangeBn: '৳৩,০০০ – ৳৮,০০০ / মাস',
  },
  {
    id: 'Online' as const,
    code: '02',
    titleEn: 'Online Live Class',
    titleBn: 'অনলাইন লাইভ ক্লাস',
    descEn: 'Connect with DU, BUET & Medical scholars via interactive pen-tab.',
    descBn: 'ঢাবি, বুয়েট ও মেডিকেল শিক্ষার্থীদের সাথে ইন্টারেক্টিভ পেন-ট্যাব ক্লাস।',
    rateRangeEn: '৳2,200 – ৳6,500 / mo',
    rateRangeBn: '৳২,২০০ – ৳৬,৫০০ / মাস',
  },
  {
    id: 'Group' as const,
    code: '03',
    titleEn: 'Group / Micro-Batch',
    titleBn: 'গ্রুপ / মাইক্রো-ব্যাচ',
    descEn: 'Small 3–5 student peer groups to share fees and encourage healthy competition.',
    descBn: '৩–৫ জন শিক্ষার্থীর ছোট ব্যাচে সাশ্রয়ী খরচে প্রতিযোগিতামূলক পড়াশোনা।',
    rateRangeEn: '৳2,000 – ৳3,500 / student',
    rateRangeBn: '৳২,০০০ – ৳৩,৫০০ / জন',
  },
];

// All pre-populated tutor, verification, and tuition job records deleted as requested
export const INITIAL_TUTORS: TutorProfile[] = [];

export const INITIAL_VERIFICATION_REQUESTS: VerificationRequest[] = [];

export const INITIAL_TUITION_JOBS: TuitionJob[] = [];

export const UI_COPY: Record<
  Language,
  {
    navTutors: string;
    navVerification: string;
    navJobBoard: string;
    navTutorBoard: string;
    navModes: string;
    ctaPostJob: string;
    districtKicker: string;
    heroHeadline: string;
    heroSubhead: string;
    upazilaFilterLabel: string;
    modeSectionLabel: string;
    metricVerifiedLabel: string;
    metricCircularsLabel: string;
    metricResponseLabel: string;
    metricTrialLabel: string;
  }
> = {
  en: {
    navTutors: 'Dashboard',
    navVerification: 'Profile',
    navJobBoard: 'Tuition Circulars',
    navTutorBoard: 'Tutor Board',
    navModes: 'Tutoring Modes',
    ctaPostJob: 'Post Tuition Circular',
    districtKicker: 'Tutor Zone · Verified Home & Online Education Network',
    heroHeadline: 'Verified home & online tutors',
    heroSubhead: '',
    upazilaFilterLabel: '1-Click Area & Hub Filter',
    modeSectionLabel: 'Select Tutoring Format (Filters Tutor Board)',
    metricVerifiedLabel: 'NID & Uni ID Verified Tutors',
    metricCircularsLabel: 'Live Tuition Circulars',
    metricResponseLabel: 'Median Guardian Match Time',
    metricTrialLabel: 'Booked Free Trial Classes',
  },
  bn: {
    navTutors: 'ড্যাশবোর্ড',
    navVerification: 'প্রোফাইল',
    navJobBoard: 'টিউশনি সার্কুলার',
    navTutorBoard: 'টিউটর বোর্ড',
    navModes: 'টিউশনির ধরন',
    ctaPostJob: 'টিউশনি পোস্ট করুন',
    districtKicker: 'টিউটর জোন · যাচাইকৃত হোম ও অনলাইন টিউটর প্ল্যাটফর্ম',
    heroHeadline: 'যাচাইকৃত হোম ও অনলাইন টিউটর',
    heroSubhead: '',
    upazilaFilterLabel: '১-ক্লিকে এলাকা ও হাব নির্বাচন করুন',
    modeSectionLabel: 'টিউশনির ধরন নির্বাচন করুন (টিউটর বোর্ডে ফিল্টার হবে)',
    metricVerifiedLabel: 'এনআইডি ও আইডি যাচাইকৃত শিক্ষক',
    metricCircularsLabel: 'চলমান টিউশনি সার্কুলার',
    metricResponseLabel: 'অভিভাবক রেসপন্স সময়',
    metricTrialLabel: 'বুককৃত ফ্রি ট্রায়াল ক্লাস',
  },
};
