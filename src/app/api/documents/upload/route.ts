import { NextRequest, NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from '@/lib/firebase/config';
import { updateUser, getUser } from '@/lib/firebase/firestore';
import { extractDocumentData } from '@/lib/langchain/chains';
import Tesseract from 'tesseract.js';

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is configured
    if (!isFirebaseConfigured) {
      return NextResponse.json(
        { success: false, error: 'Firebase is not configured. Please set up environment variables.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const documentType = formData.get('documentType') as string;

    if (!file || !userId || !documentType) {
      return NextResponse.json(
        { success: false, error: 'File, User ID, and Document Type are required' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PDF, JPG, and PNG are allowed.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Firebase Storage with error handling
    let downloadUrl: string;
    try {
      const fileName = `${userId}/${documentType}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `documents/${fileName}`);
      
      await uploadBytes(storageRef, buffer, {
        contentType: file.type,
      });

      // Get download URL
      downloadUrl = await getDownloadURL(storageRef);
    } catch (storageError: any) {
      console.error('Storage error:', storageError);
      
      // Check if it's a storage configuration error
      if (storageError.code === 'storage/unknown' || storageError.status_ === 404) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Firebase Storage is not properly configured. Please check your storage bucket settings in Firebase Console.' 
          },
          { status: 500 }
        );
      }
      
      throw storageError;
    }

    // Perform OCR if it's an image
    let extractedData = {};
    if (file.type.startsWith('image/')) {
      try {
        // Perform OCR
        const ocrResult = await Tesseract.recognize(
          buffer,
          'eng',
          {
            logger: (m) => console.log(m),
          }
        );

        // Extract structured data using AI
        extractedData = await extractDocumentData(documentType, ocrResult.data.text);
      } catch (ocrError) {
        console.error('OCR error:', ocrError);
        // Continue without extracted data
      }
    }

    // Update user document in Firestore
    const user = await getUser(userId);
    if (user) {
      const updatedDocuments = {
        ...user.documents,
        [documentType]: {
          type: documentType,
          name: file.name,
          fileUrl: downloadUrl,
          fileName: file.name,
          uploadedAt: new Date(),
          extractedData,
        },
      };

      await updateUser(userId, { documents: updatedDocuments });
    }

    return NextResponse.json({
      success: true,
      document: {
        type: documentType,
        name: file.name,
        fileUrl: downloadUrl,
        fileName: file.name,
        extractedData,
      },
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
