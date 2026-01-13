import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    Timestamp,
    DocumentData,
    deleteDoc,
    increment,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import type {
    Challenge,
    Proposal,
    ProjectRoom,
    RoomMessage,
    ChallengeStatus,
    ChallengeCategory,
    EscrowStatus,
    FellowshipUserProfile,
} from '@/types/fellowships';

// Helper to get collection reference safely
const getCollectionRef = (name: string) => {
    if (!isFirebaseConfigured || !db) {
        throw new Error('Firestore is not configured');
    }
    return collection(db, name);
};

// Helper to convert Firestore timestamps
const convertTimestamps = <T extends DocumentData>(data: T): T => {
    const result = { ...data } as Record<string, unknown>;
    for (const key in result) {
        const value = result[key];
        if (value instanceof Timestamp) {
            result[key] = value.toDate();
        }
    }
    return result as T;
};

// ============================================
// CHALLENGE OPERATIONS
// ============================================

export const createChallenge = async (
    challenge: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt' | 'proposalCount'>
): Promise<string> => {
    const challengesCollection = getCollectionRef('challenges');
    const challengeRef = doc(challengesCollection);
    await setDoc(challengeRef, {
        ...challenge,
        deadline: Timestamp.fromDate(challenge.deadline),
        proposalCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return challengeRef.id;
};

export const getChallenge = async (challengeId: string): Promise<Challenge | null> => {
    const challengesCollection = getCollectionRef('challenges');
    const challengeRef = doc(challengesCollection, challengeId);
    const snap = await getDoc(challengeRef);
    if (snap.exists()) {
        return convertTimestamps({ id: snap.id, ...snap.data() }) as Challenge;
    }
    return null;
};

export const getChallenges = async (
    filters?: {
        status?: ChallengeStatus;
        category?: ChallengeCategory;
        corporateId?: string;
    },
    limitCount = 50
): Promise<Challenge[]> => {
    const challengesCollection = getCollectionRef('challenges');
    let q = query(challengesCollection, orderBy('createdAt', 'desc'), limit(limitCount));

    if (filters?.status) {
        q = query(challengesCollection, where('status', '==', filters.status), orderBy('createdAt', 'desc'), limit(limitCount));
    }
    if (filters?.category) {
        q = query(challengesCollection, where('category', '==', filters.category), orderBy('createdAt', 'desc'), limit(limitCount));
    }
    if (filters?.corporateId) {
        q = query(challengesCollection, where('corporateId', '==', filters.corporateId), orderBy('createdAt', 'desc'), limit(limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => convertTimestamps({ id: docSnap.id, ...docSnap.data() }) as Challenge);
};

export const getOpenChallenges = async (limitCount = 50): Promise<Challenge[]> => {
    const challengesCollection = getCollectionRef('challenges');
    const q = query(
        challengesCollection,
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => convertTimestamps({ id: docSnap.id, ...docSnap.data() }) as Challenge);
};

export const updateChallenge = async (
    challengeId: string,
    data: Partial<Challenge>
): Promise<void> => {
    const challengesCollection = getCollectionRef('challenges');
    const challengeRef = doc(challengesCollection, challengeId);
    await updateDoc(challengeRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
};

export const updateChallengeStatus = async (
    challengeId: string,
    status: ChallengeStatus,
    selectedProposalId?: string
): Promise<void> => {
    const challengesCollection = getCollectionRef('challenges');
    const challengeRef = doc(challengesCollection, challengeId);
    const updateData: Record<string, unknown> = {
        status,
        updatedAt: Timestamp.now(),
    };
    if (selectedProposalId) {
        updateData.selectedProposalId = selectedProposalId;
    }
    await updateDoc(challengeRef, updateData);
};

// ============================================
// PROPOSAL OPERATIONS
// ============================================

export const createProposal = async (
    proposal: Omit<Proposal, 'id' | 'createdAt' | 'status'>
): Promise<string> => {
    const proposalsCollection = getCollectionRef('proposals');
    const proposalRef = doc(proposalsCollection);
    await setDoc(proposalRef, {
        ...proposal,
        status: 'pending',
        createdAt: Timestamp.now(),
    });

    // Increment proposal count on challenge
    const challengesCollection = getCollectionRef('challenges');
    const challengeRef = doc(challengesCollection, proposal.challengeId);
    await updateDoc(challengeRef, {
        proposalCount: increment(1),
    });

    return proposalRef.id;
};

export const getProposal = async (proposalId: string): Promise<Proposal | null> => {
    const proposalsCollection = getCollectionRef('proposals');
    const proposalRef = doc(proposalsCollection, proposalId);
    const snap = await getDoc(proposalRef);
    if (snap.exists()) {
        return convertTimestamps({ id: snap.id, ...snap.data() }) as Proposal;
    }
    return null;
};

export const getProposalsByChallenge = async (challengeId: string): Promise<Proposal[]> => {
    const proposalsCollection = getCollectionRef('proposals');
    const q = query(
        proposalsCollection,
        where('challengeId', '==', challengeId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => convertTimestamps({ id: docSnap.id, ...docSnap.data() }) as Proposal);
};

export const getProposalsByStudent = async (studentId: string): Promise<Proposal[]> => {
    const proposalsCollection = getCollectionRef('proposals');
    const q = query(
        proposalsCollection,
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => convertTimestamps({ id: docSnap.id, ...docSnap.data() }) as Proposal);
};

export const updateProposalStatus = async (
    proposalId: string,
    status: Proposal['status']
): Promise<void> => {
    const proposalsCollection = getCollectionRef('proposals');
    const proposalRef = doc(proposalsCollection, proposalId);
    await updateDoc(proposalRef, { status });
};

export const hasStudentApplied = async (
    challengeId: string,
    studentId: string
): Promise<boolean> => {
    const proposalsCollection = getCollectionRef('proposals');
    const q = query(
        proposalsCollection,
        where('challengeId', '==', challengeId),
        where('studentId', '==', studentId),
        limit(1)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

// ============================================
// PROJECT ROOM OPERATIONS
// ============================================

export const createProjectRoom = async (
    room: Omit<ProjectRoom, 'id' | 'createdAt' | 'status' | 'escrowStatus'>
): Promise<string> => {
    const roomsCollection = getCollectionRef('projectRooms');
    const roomRef = doc(roomsCollection);
    await setDoc(roomRef, {
        ...room,
        status: 'active',
        escrowStatus: 'held',
        createdAt: Timestamp.now(),
    });
    return roomRef.id;
};

export const getProjectRoom = async (roomId: string): Promise<ProjectRoom | null> => {
    const roomsCollection = getCollectionRef('projectRooms');
    const roomRef = doc(roomsCollection, roomId);
    const snap = await getDoc(roomRef);
    if (snap.exists()) {
        return convertTimestamps({ id: snap.id, ...snap.data() }) as ProjectRoom;
    }
    return null;
};

export const getProjectRoomByChallenge = async (challengeId: string): Promise<ProjectRoom | null> => {
    const roomsCollection = getCollectionRef('projectRooms');
    const q = query(roomsCollection, where('challengeId', '==', challengeId), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        return convertTimestamps({ id: docSnap.id, ...docSnap.data() }) as ProjectRoom;
    }
    return null;
};

export const getProjectRoomsByUser = async (userId: string): Promise<ProjectRoom[]> => {
    const roomsCollection = getCollectionRef('projectRooms');
    // Get rooms where user is student or corporate
    const studentQuery = query(roomsCollection, where('studentId', '==', userId), orderBy('createdAt', 'desc'));
    const corporateQuery = query(roomsCollection, where('corporateId', '==', userId), orderBy('createdAt', 'desc'));

    const [studentSnap, corporateSnap] = await Promise.all([
        getDocs(studentQuery),
        getDocs(corporateQuery),
    ]);

    const rooms = [
        ...studentSnap.docs.map((docSnap) => convertTimestamps({ id: docSnap.id, ...docSnap.data() }) as ProjectRoom),
        ...corporateSnap.docs.map((docSnap) => convertTimestamps({ id: docSnap.id, ...docSnap.data() }) as ProjectRoom),
    ];

    // Sort by createdAt desc and remove duplicates
    return rooms.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const updateEscrowStatus = async (
    roomId: string,
    escrowStatus: EscrowStatus
): Promise<void> => {
    const roomsCollection = getCollectionRef('projectRooms');
    const roomRef = doc(roomsCollection, roomId);
    const updateData: Record<string, unknown> = { escrowStatus };
    if (escrowStatus === 'released') {
        updateData.status = 'completed';
        updateData.completedAt = Timestamp.now();
    }
    await updateDoc(roomRef, updateData);
};

// ============================================
// ROOM MESSAGE OPERATIONS
// ============================================

export const createRoomMessage = async (
    message: Omit<RoomMessage, 'id' | 'createdAt'>
): Promise<string> => {
    const messagesCollection = getCollectionRef('roomMessages');
    const messageRef = doc(messagesCollection);
    await setDoc(messageRef, {
        ...message,
        createdAt: Timestamp.now(),
    });
    return messageRef.id;
};

export const getRoomMessages = async (roomId: string, limitCount = 100): Promise<RoomMessage[]> => {
    const messagesCollection = getCollectionRef('roomMessages');
    const q = query(
        messagesCollection,
        where('roomId', '==', roomId),
        orderBy('createdAt', 'asc'),
        limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => convertTimestamps({ id: docSnap.id, ...docSnap.data() }) as RoomMessage);
};

// ============================================
// USER VERIFICATION OPERATIONS
// ============================================

export const getUserFellowshipProfile = async (
    userId: string
): Promise<FellowshipUserProfile | null> => {
    if (!isFirebaseConfigured) return null;
    const usersCollection = getCollectionRef('users');
    const userRef = doc(usersCollection, userId);
    try {
        const docSnapshot = await getDoc(userRef);
        if (!docSnapshot.exists()) return null;
        const data = docSnapshot.data();
        return {
            role: data.role,
            isVerified: data.isVerified,
            verifiedAt: data.verifiedAt?.toDate?.() || data.verifiedAt,
            companyName: data.companyName,
            companyDescription: data.companyDescription,
        };
    } catch (error) {
        console.error('Error getting fellowship profile:', error);
        return null;
    }
};

export const updateUserFellowshipProfile = async (
    userId: string,
    data: FellowshipUserProfile
): Promise<void> => {
    if (!isFirebaseConfigured) {
        console.error('Firebase not configured');
        return;
    }
    const usersCollection = getCollectionRef('users');
    const userRef = doc(usersCollection, userId);
    const updateData: Record<string, unknown> = { ...data };
    if (data.verifiedAt) {
        updateData.verifiedAt = Timestamp.fromDate(data.verifiedAt);
    }
    // Use setDoc with merge to create document if it doesn't exist
    await setDoc(userRef, updateData, { merge: true });
    console.log('[Fellowship] Role saved successfully:', data.role);
};

export const verifyStudentByEmail = async (
    userId: string,
    email: string
): Promise<{ success: boolean; message: string }> => {
    const academicDomains = ['.ac.in', '.edu', '.edu.in', '.ac.uk', '.edu.au'];
    const isAcademic = academicDomains.some((domain) => email.toLowerCase().endsWith(domain));

    if (isAcademic) {
        await updateUserFellowshipProfile(userId, {
            isVerified: true,
            verifiedAt: new Date(),
        });
        return { success: true, message: 'Email verified successfully!' };
    }

    return {
        success: false,
        message: 'Your email domain is not recognized as an academic institution. Please upload your student ID for manual verification.',
    };
};

export const verifyStudentManually = async (userId: string): Promise<void> => {
    await updateUserFellowshipProfile(userId, {
        isVerified: true,
        verifiedAt: new Date(),
    });
};

// ============================================
// HELPER: SELECT PROPOSAL AND CREATE ROOM
// ============================================

export const selectProposalAndCreateRoom = async (
    challengeId: string,
    proposalId: string,
    challenge: Challenge,
    proposal: Proposal
): Promise<string> => {
    // Update proposal status to selected
    await updateProposalStatus(proposalId, 'selected');

    // Reject other proposals
    const otherProposals = await getProposalsByChallenge(challengeId);
    for (const p of otherProposals) {
        if (p.id !== proposalId && p.status === 'pending') {
            await updateProposalStatus(p.id, 'rejected');
        }
    }

    // Update challenge status
    await updateChallengeStatus(challengeId, 'in_progress', proposalId);

    // Create project room
    const roomId = await createProjectRoom({
        challengeId,
        challengeTitle: challenge.title,
        studentId: proposal.studentId,
        studentName: proposal.studentName,
        corporateId: challenge.corporateId,
        corporateName: challenge.corporateName,
        escrowAmount: challenge.price,
    });

    // Add initial milestone message
    await createRoomMessage({
        roomId,
        senderId: 'system',
        senderName: 'System',
        senderRole: 'corporate',
        content: `Project started! ${proposal.studentName}'s proposal was selected. ₹${challenge.price.toLocaleString()} is now held in escrow.`,
        type: 'milestone',
    });

    return roomId;
};
