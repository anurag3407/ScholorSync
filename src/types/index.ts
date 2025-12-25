// User Types
export interface UserProfile {
  name: string;
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
  income: number;
  percentage: number;
  branch: string;
  year: number;
  state: string;
  college: string;
  gender: 'Male' | 'Female' | 'Other';
  achievements: string[];
}

export interface UserDocument {
  type: string;
  name: string;
  fileUrl: string;
  fileName: string;
  uploadedAt: Date;
  extractedData: Record<string, unknown>;
}

export interface AppliedScholarship {
  id: string;
  status: 'applied' | 'pending' | 'approved' | 'rejected';
  appliedOn: Date;
}

export interface User {
  uid: string;
  email: string;
  profile: UserProfile;
  documents: {
    incomeCert?: UserDocument;
    casteCert?: UserDocument;
    marksheet?: UserDocument;
    domicile?: UserDocument;
    aadhaar?: UserDocument;
    [key: string]: UserDocument | undefined;
  };
  savedScholarships: string[];
  appliedScholarships: AppliedScholarship[];
  notifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Scholarship Types
export interface ScholarshipEligibility {
  categories: string[];
  incomeLimit: number;
  minPercentage: number;
  states: string[];
  branches: string[];
  gender: 'Male' | 'Female' | 'all';
  yearRange: [number, number];
  missingRequirements?: string[];
}

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  type: 'government' | 'private' | 'college';
  amount: {
    min: number;
    max: number;
  };
  eligibility: ScholarshipEligibility;
  eligibilityText: string;
  description?: string;
  deadline: string;
  applicationUrl: string;
  documentsRequired: string[];
  sourceUrl: string;
  scrapedAt: Date;
  embedding?: number[];
}

export interface ScholarshipMatch extends Scholarship {
  matchPercentage: number;
  matchReasons: string[];
  missingCriteria: string[];
}

// Fee Structure Types
export interface BranchFees {
  tuition: number;
  hostel: number;
  mess: number;
  other: Record<string, number>;
}

export interface FeeStructure {
  id: string;
  collegeName: string;
  branches: Record<string, BranchFees>;
  lastUpdated: Date;
}

export interface FeeAnomaly {
  category: string;
  expectedAmount: number;
  chargedAmount: number;
  difference: number;
  explanation: string;
}

export interface FeeAnalysisResult {
  receiptTotal: number;
  expectedTotal: number;
  anomalies: FeeAnomaly[];
  overchargeAmount: number;
  recommendation: string;
}

// Community Tips
export interface CommunityTip {
  id: string;
  scholarshipId: string;
  tip: string;
  createdBy: string;
  createdAt: Date;
  upvotes: number;
  verified: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'new_scholarship' | 'deadline_reminder' | 'application_update' | 'tip';
  title: string;
  message: string;
  scholarshipId?: string;
  read: boolean;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// AI Response Types
export interface EligibilityExplanation {
  eligible: boolean;
  matchPercentage: number;
  explanation: string;
  meetsCriteria: string[];
  missedCriteria: string[];
  suggestions: string[];
}

export interface WhyNotMeResult {
  scholarship: Scholarship;
  gapPercentage: number;
  missingCriteria: {
    criterion: string;
    currentValue: string;
    requiredValue: string;
    actionable: boolean;
    suggestion: string;
  }[];
}

export interface SuccessPrediction {
  scholarshipId: string;
  successRate: number;
  competitionLevel: 'low' | 'medium' | 'high';
  recommendation: string;
  similarProfiles: number;
}
