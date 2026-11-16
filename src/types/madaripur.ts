export type Language = 'en' | 'bn';

export type Upazila =
  | 'All'
  | 'Madaripur Sadar'
  | 'Shibchar'
  | 'Kalkini'
  | 'Rajoir'
  | 'Dasar';

export type TutoringMode =
  | 'All'
  | 'Home'
  | 'Online'
  | 'Group';

export type MediumCategory =
  | 'All'
  | 'Bangla Medium'
  | 'English Version'
  | 'Admission Test'
  | 'Madrasah/Quranic'
  | 'ICT';

export type CollegeTag =
  | 'All'
  | 'Madaripur Govt. College (Govt. Nazimuddin College)'
  | 'Govt. Sufia Mohila College, Madaripur'
  | 'Govt. Barhamganj College, Shibchar'
  | 'Kalkini Syed Abul Hossain College (Govt.)'
  | "Govt. Sheikh Hasina Academy & Women's College, Dasar"
  | 'Rajoir Gopalganj K.J.S. Pilot Model Institution & College'
  | 'Rajoir Govt. Degree College'
  | 'Shibchar Nandakumar Model Institution & College'
  | 'Elias Ahmed Chowdhury Degree College, Shibchar'
  | "Syed Abul Hossain Academy & Women's College, Madaripur"
  | 'Charmuguria Merchant College, Madaripur'
  | 'Khoajpur Tekerhat Fazlul Haque Degree College'
  | 'Alhaj Aminuddin High School & College, Madaripur'
  | 'Shashikar Shahid Smriti Degree College, Dasar'
  | 'Khaserhat Syed Abul Hossain Degree College, Kalkini'
  | 'Barthi Tara Prasanna High School & College'
  | 'Kadambari Union Degree College, Rajoir'
  | 'Rizvia Islamia Kamil Madrasah, Madaripur'
  | 'Madaripur Technical School & College (TSC)'
  | 'Public University (DU / BUET / JU / RU / JNU)'
  | 'Medical College'
  | 'National University (NU) Affiliated College'
  | 'Private University / Other Institution'
  | 'Govt. Nazimuddin College'
  | 'Madaripur Govt. College'
  | 'DU'
  | 'BUET'
  | 'Medical';

export type TutorGender = 'All' | 'Male' | 'Female';

export type VerificationStatus = 'Approved' | 'Pending' | 'Rejected';

export interface TutorReview {
  id: string;
  guardianName: string;
  guardianArea: string;
  studentClass: string;
  hiredSubject?: string;
  rating: number; // 1 to 5
  date: string;
  commentEn: string;
  commentBn: string;
  verifiedHire?: boolean;
}

export interface VerificationRequest {
  id: string; // e.g. VER-2026-109 (maps to verification_code)
  supabaseRowId?: string;
  userEmail?: string;
  email?: string;
  userId?: string;
  tutorId: string;
  tutorNameEn: string;
  tutorNameBn: string;
  gender: 'Male' | 'Female';
  upazila: Exclude<Upazila, 'All'> | '';
  phone: string;
  profilePhotoName?: string;
  profilePhotoDataUrl?: string;
  nidNumber: string; // 10, 13, or 17 digits (or optional pending)
  nidDocumentName: string;
  nidScanDataUrl?: string;
  collegeTag: Exclude<CollegeTag, 'All'> | '';
  institutionFullEn: string;
  departmentEn: string;
  studentRegId: string;
  academicSession: string;
  uniDocumentName: string;
  uniScanDataUrl?: string;
  subjectsEn: string[];
  medium?: Exclude<MediumCategory, 'All'> | string;
  experience?: string;
  monthlyFee: number;
  submittedAt: string;
  status: VerificationStatus;
  is_rejected?: boolean;
  rejection_note?: string;
  adminNote?: string;
  reviewedAt?: string;
  hiddenFromAdmin?: boolean;
}

export interface TutorVerificationRow {
  id?: string;
  verification_code: string;
  user_email?: string | null;
  email?: string | null;
  user_id?: string | null;
  full_name: string;
  mobile_number: string;
  phone?: string | null;
  upazila: string;
  gender: string;
  expected_fee: number | string;
  profile_photo_url?: string | null;
  profile_photo_name?: string | null;
  smart_nid_number: string;
  nid_scan_url?: string | null;
  nid_file_name?: string | null;
  institution?: string | null;
  institution_category: string;
  university_college_name: string;
  department_degree: string;
  student_registration_id: string;
  teaching_subjects: string;
  medium?: string | null;
  experience?: string | null;
  student_id_scan_url?: string | null;
  student_id_file_name?: string | null;
  admin_audit_note?: string | null;
  rejection_note?: string | null;
  is_rejected?: boolean | null;
  status: 'Pending' | 'Approved' | 'Rejected' | string;
  hidden_from_admin?: boolean | null;
  created_at?: string;
}

export interface SupabaseTutorProfileTableRow {
  verification_code: string;
  user_id: string | null;
  email: string | null;
  user_email: string | null;
  full_name: string;
  phone: string;
  mobile_number: string;
  upazila: string;
  gender: string;
  institution: string;
  institution_category: string;
  university_college_name: string;
  department: string;
  department_degree: string;
  medium: string;
  experience: string;
  expected_fee: number;
  teaching_subjects: string;
  smart_nid_number: string;
  student_registration_id: string;
  profile_photo_url: string | null;
  profile_photo_name: string | null;
  nid_scan_url: string | null;
  nid_file_name: string | null;
  student_id_scan_url: string | null;
  student_id_file_name: string | null;
  status: string;
  verification_status: string;
}

export interface TutorProfile {
  id: string;
  nameEn: string;
  nameBn: string;
  gender: 'Male' | 'Female';
  profilePhotoUrl?: string;
  collegeTag: Exclude<CollegeTag, 'All'>;
  institutionFullEn: string;
  institutionFullBn: string;
  departmentEn: string;
  departmentBn: string;
  upazila: Exclude<Upazila, 'All'>;
  coveredAreasEn: string[];
  coveredAreasBn: string[];
  modes: Exclude<TutoringMode, 'All'>[];
  mediums: Exclude<MediumCategory, 'All'>[];
  subjectsEn: string[];
  subjectsBn: string[];
  preferredClassesEn: string;
  preferredClassesBn: string;
  monthlyFee: number; // BDT 2000 - 10000
  experienceYears: number;
  responseTimeEn: string;
  responseTimeBn: string;
  nidVerified: boolean;
  uniIdVerified: boolean;
  verificationStatus?: VerificationStatus;
  verificationCode: string;
  rating: number;
  totalReviews: number;
  studentsTaught: number;
  bioEn: string;
  bioBn: string;
  hscGpa: string;
  sscGpa: string;
  availableDaysEn: string;
  availableDaysBn: string;
  portraitVariant:
    | 'arif'
    | 'nusrat'
    | 'tanvir'
    | 'farhana'
    | 'mahmud'
    | 'tasnim'
    | 'rakib'
    | 'sadia';
  reviews: TutorReview[];
}

export interface TuitionCircularRow {
  id?: string;
  circular_id?: string;
  title: string;
  class_subject?: string;
  class_level?: string | null;
  medium?: string | null;
  subjects?: string | string[] | null;
  upazila: string;
  location_details?: string;
  location?: string | null;
  tutoring_format?: string;
  salary: number | string;
  days_per_week: number | string;
  tutor_preference?: string;
  tutor_gender?: string | null;
  guardian_name?: string | null;
  guardian_phone: string;
  guardian_address?: string | null;
  status: string;
  num_students?: number | string | null;
  hidden_from_admin?: boolean | null;
  applicants?: unknown[] | null;
  rejection_note?: string | null;
  raw_data?: Record<string, any> | null;
  created_at?: string;
}

export interface CircularApplicationRow {
  id?: string;
  circular_id: string;
  user_email?: string | null;
  user_id?: string | null;
  tutor_id: string;
  tutor_name: string;
  tutor_phone: string;
  institution_qualification: string;
  experience_note: string;
  status:
    | 'Pending'
    | 'confirmed'
    | 'Confirmed'
    | 'Rejected'
    | 'verified_for_tuition'
    | string;
  media_fee?: number | null;
  guardian_phone?: string | null;
  guardian_address?: string | null;
  admin_note?: string | null;
  rejection_note?: string | null;
  is_rejected?: boolean | null;
  hidden_from_admin?: boolean | null;
  created_at?: string;
}

export interface TuitionJob {
  id: string; // e.g., MDP-2041 (maps to circular_id)
  titleEn: string;
  titleBn: string;
  studentClassEn: string;
  studentClassBn: string;
  upazila: Exclude<Upazila, 'All'>;
  landmarkEn: string;
  landmarkBn: string;
  medium: Exclude<MediumCategory, 'All'>;
  mode: Exclude<TutoringMode, 'All'>;
  subjectsEn: string[];
  subjectsBn: string[];
  daysPerWeek: number;
  salaryBdt: number;
  numStudents?: number | string;
  preferredGender: 'Any' | 'Male' | 'Female';
  preferredInstitutionEn: string;
  preferredInstitutionBn: string;
  postedAgoEn: string;
  postedAgoBn: string;
  guardianName: string;
  contactPhone?: string;
  requirements?: string;
  classSubject?: string;
  tutoringFormat?: string;
  tutorPreference?: string;
  status?: string;
  confirmedTutorId?: string;
  confirmedTutorName?: string;
  createdAt?: string;
  applicantsCount: number;
  urgent?: boolean;
  hiddenFromAdmin?: boolean;
}

export interface FilterState {
  searchQuery: string;
  upazila: Upazila;
  mode: TutoringMode;
  medium: MediumCategory;
  college: CollegeTag;
  gender: TutorGender;
  maxBudget: number;
  verifiedOnly: boolean;
  shortlistedOnly: boolean;
}

export interface TrialBookingRecord {
  id: string;
  tutorId: string;
  tutorName: string;
  guardianName: string;
  guardianPhone: string;
  studentClass: string;
  upazila: string;
  landmark: string;
  preferredStart: string;
  createdAt: string;
}

export type PaymentMethod = 'bKash' | 'Nagad';
export type PaymentRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface PaymentRequestRow {
  id?: string;
  request_code?: string | null;
  user_id?: string | null;
  user_email: string | null;
  user_name?: string | null;
  tutor_id?: string | null;
  tutor_name?: string | null;
  payment_method: PaymentMethod | string;
  sender_number: string;
  transaction_id: string;
  amount: number | string;
  purpose?: string | null;
  circular_id?: string | null;
  circular_title?: string | null;
  guardian_phone?: string | null;
  guardian_address?: string | null;
  status: PaymentRequestStatus | string;
  admin_note?: string | null;
  hidden_from_admin?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentRequestRecord {
  id: string;
  requestCode: string;
  userId?: string;
  userEmail?: string;
  tutorId?: string;
  tutorName: string;
  paymentMethod: PaymentMethod;
  senderNumber: string;
  transactionId: string;
  amount: number;
  purpose: string;
  circularId?: string;
  circularTitle?: string;
  guardianPhone?: string;
  guardianAddress?: string;
  status: PaymentRequestStatus;
  adminNote?: string;
  hiddenFromAdmin?: boolean;
  createdAt: string;
}

export type NoticeCategory =
  | 'Official Update'
  | 'Urgent'
  | 'Tuition Notice'
  | 'Security / Verification'
  | 'General Announcement'
  | string;

export interface SiteNotice {
  id: string;
  title: string;
  content: string;
  badge_text?: string;
  image_url?: string;
  is_active: boolean;
  created_at?: string;
}

export interface GuardianRequestRow {
  id?: string;
  guardian_name: string;
  guardian_phone: string;
  student_class: string;
  medium_version?: string | null;
  school_college_name?: string | null;
  number_of_students?: number | string | null;
  subjects: string;
  upazila_area: string;
  full_address: string;
  offered_salary: number | string;
  days_per_week: number | string;
  preferred_time_duration?: string | null;
  preferred_gender?: string | null;
  preferred_university?: string | null;
  additional_notes?: string | null;
  status: 'pending' | 'converted' | 'contacted' | 'rejected' | string;
  created_at?: string;
}

export interface GuardianRequestRecord {
  id: string;
  guardianName: string;
  guardianPhone: string;
  studentClass: string;
  mediumVersion?: string;
  schoolCollegeName?: string;
  numberOfStudents?: number;
  subjects: string;
  upazilaArea: string;
  fullAddress: string;
  offeredSalary: number;
  daysPerWeek: number;
  preferredTimeDuration?: string;
  preferredGender: string;
  preferredUniversity?: string;
  additionalNotes?: string;
  status: 'pending' | 'converted' | 'contacted' | 'rejected' | string;
  createdAt?: string;
}




