import { NextRequest, NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from '@/lib/firebase/config';
import { updateUser, getUser } from '@/lib/firebase/firestore';
import { extractDocumentData } from '@/lib/langchain/chains';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';

// Check if Firebase Storage is properly configured and working
const useLocalStorage = !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.includes('demo');

export async function POST(request: NextRequest) {
  try {
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

    let downloadUrl: string;

    // Try Firebase Storage first, fallback to local storage
    if (!useLocalStorage && isFirebaseConfigured) {
      try {
        const fileName = `${userId}/${documentType}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `documents/${fileName}`);
        
        await uploadBytes(storageRef, buffer, {
          contentType: file.type,
        });

        downloadUrl = await getDownloadURL(storageRef);
      } catch (storageError) {
        console.error('Firebase Storage error, falling back to local storage:', storageError);
        // Fall through to local storage
        downloadUrl = await saveToLocalStorage(buffer, userId, documentType, file.name);
      }
    } else {
      // Use local storage
      downloadUrl = await saveToLocalStorage(buffer, userId, documentType, file.name);
    }

    // Perform OCR if it's an image
    let extractedData = {};
    if (file.type.startsWith('image/')) {
      try {
        const ocrResult = await Tesseract.recognize(
          buffer,
          'eng',
          {
            logger: (m) => console.log(m),
          }
        );

        extractedData = await extractDocumentData(documentType, ocrResult.data.text);
      } catch (ocrError) {
        console.error('OCR error:', ocrError);
        // Continue without extracted data
      }
    }

    // Update user document in Firestore
    if (isFirebaseConfigured) {
      try {
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
      } catch (firestoreError) {
        console.error('Firestore update error:', firestoreError);
        // Continue - document was uploaded successfully
      }
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

// Save file to local public/uploads folder
async function saveToLocalStorage(
  buffer: Buffer, 
  userId: string, 
  documentType: string, 
  fileName: string
): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', userId, documentType);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const uniqueFileName = `${Date.now()}_${fileName}`;
  const filePath = path.join(uploadsDir, uniqueFileName);
  
  // Write file to disk
  fs.writeFileSync(filePath, buffer);
  
  // Return URL path (relative to public folder)
  return `/uploads/${userId}/${documentType}/${uniqueFileName}`;
}
