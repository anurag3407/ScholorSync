import { NextRequest, NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from '@/lib/firebase/config';
import { updateUser, getUser } from '@/lib/firebase/firestore';
import { extractDocumentData } from '@/lib/langchain/chains';
import fs from 'fs';
import path from 'path';

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

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

    // Validate file size (max 5MB for base64 storage, max 1MB recommended)
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

    let downloadUrl: string = '';
    let storageMethod: 'firebase' | 'local' | 'base64' = 'base64';

    // Try Firebase Storage first
    if (isFirebaseConfigured) {
      try {
        const fileName = `${userId}/${documentType}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `documents/${fileName}`);
        
        await uploadBytes(storageRef, buffer, {
          contentType: file.type,
        });

        downloadUrl = await getDownloadURL(storageRef);
        storageMethod = 'firebase';
      } catch (storageError) {
        console.error('Firebase Storage error:', storageError);
        // Fall through to alternative storage
      }
    }

    // Fallback: In development, try local file storage
    if (storageMethod === 'base64' && isDev) {
      try {
        downloadUrl = await saveToLocalStorage(buffer, userId, documentType, file.name);
        storageMethod = 'local';
      } catch (localError) {
        console.error('Local storage error:', localError);
        // Fall through to base64
      }
    }

    // Final fallback: Store as base64 data URL (works everywhere)
    if (!downloadUrl) {
      const base64Data = buffer.toString('base64');
      downloadUrl = `data:${file.type};base64,${base64Data}`;
      storageMethod = 'base64';
    }

    // Skip OCR for now - Tesseract.js has compatibility issues with Next.js API routes
    // TODO: Consider using a cloud OCR service (Google Vision, AWS Textract) for production
    const extractedData = {};

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
              storageMethod,
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
        storageMethod,
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

// Save file to local public/uploads folder (development only)
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
