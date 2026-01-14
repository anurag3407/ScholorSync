// Fellowships Module Types

export type UserRole = 'student' | 'corporate';
export type ChallengeCategory = 'design' | 'content' | 'development' | 'research' | 'marketing';
export type ChallengeStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type ProposalStatus = 'pending' | 'selected' | 'rejected';
export type EscrowStatus = 'held' | 'released' | 'disputed';
export type RoomStatus = 'active' | 'completed' | 'cancelled';
export type MessageType = 'text' | 'file' | 'milestone';

// Challenge posted by a corporate
export interface Challenge {
    id: string;
    title: string;
    description: string;
    price: number;
    status: ChallengeStatus;
    corporateId: string;
    corporateName: string;
    companyName?: string;
    category: ChallengeCategory;
    deadline: Date;
    requirements: string[];
    selectedProposalId?: string;
    proposalCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

// Proposal submitted by a student
export interface Proposal {
    id: string;
    challengeId: string;
    challengeTitle?: string;
    studentId: string;
    studentName: string;
    studentEmail?: string;
    coverLetter: string;
    status: ProposalStatus;
    createdAt: Date;
}

// Project Room - workspace for matched student-corporate pair
export interface ProjectRoom {
    id: string;
    challengeId: string;
    challengeTitle: string;
    studentId: string;
    studentName: string;
    corporateId: string;
    corporateName: string;
    escrowStatus: EscrowStatus;
    escrowAmount: number;
    status: RoomStatus;
    createdAt: Date;
    completedAt?: Date;
}

// Message in a project room
export interface RoomMessage {
    id: string;
    roomId: string;
    senderId: string;
    senderName: string;
    senderRole: UserRole;
    content: string;
    attachmentUrl?: string;
    attachmentName?: string;
    type: MessageType;
    createdAt: Date;
}

// Extended user profile fields for fellowships
export interface FellowshipUserProfile {
    role?: UserRole;
    isVerified?: boolean;
    verifiedAt?: Date;
    companyName?: string;
    companyDescription?: string;
    razorpayLinkedAccountId?: string;
    bankAccountNumber?: string;
    ifscCode?: string;
}

// Category metadata for UI
export const CHALLENGE_CATEGORIES: Record<ChallengeCategory, { label: string; icon: string; color: string }> = {
    design: { label: 'Design', icon: '🎨', color: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300' },
    content: { label: 'Content Writing', icon: '✍️', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    development: { label: 'Development', icon: '💻', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    research: { label: 'Research', icon: '🔬', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
    marketing: { label: 'Marketing', icon: '📢', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
};

// Status display metadata
export const CHALLENGE_STATUS_LABELS: Record<ChallengeStatus, { label: string; color: string }> = {
    open: { label: 'Open for Applications', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    completed: { label: 'Completed', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

export const ESCROW_STATUS_LABELS: Record<EscrowStatus, { label: string; color: string; icon: string }> = {
    held: { label: 'Safe in Escrow', color: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300', icon: '🔒' },
    released: { label: 'Funds Released', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300', icon: '✅' },
    disputed: { label: 'Under Dispute', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300', icon: '⚠️' },
};
