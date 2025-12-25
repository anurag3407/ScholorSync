import { NextRequest, NextResponse } from 'next/server';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import { updateUser, getUser } from '@/lib/firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId, documentType } = await request.json();

    if (!userId || !documentType) {
      return NextResponse.json(
        { success: false, error: 'User ID and Document Type are required' },
        { status: 400 }
      );
    }

    // Update user document in Firestore to remove the document
    if (isFirebaseConfigured) {
      try {
        const user = await getUser(userId);
        if (user && user.documents) {
          const updatedDocuments = { ...user.documents };
          delete updatedDocuments[documentType];
          
          await updateUser(userId, { documents: updatedDocuments });
        }
      } catch (firestoreError) {
        console.error('Firestore update error:', firestoreError);
        return NextResponse.json(
          { success: false, error: 'Failed to delete document from database' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
