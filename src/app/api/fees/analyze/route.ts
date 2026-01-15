import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/firebase/firestore';
import { getFeeStructureByCollegeName } from '@/lib/firebase/firestore';
import { analyzeFeeAnomaly } from '@/lib/langchain/chains';

// Force dynamic rendering - prevents static generation issues
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { success: false, error: 'File and User ID are required' },
        { status: 400 }
      );
    }

    // Get user profile to determine college and branch
    const user = await getUser(userId);
    if (!user || !user.profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    const { college, branch } = user.profile;

    // Get official fee structure for the college
    const feeStructure = await getFeeStructureByCollegeName(college);
    if (!feeStructure) {
      return NextResponse.json(
        { success: false, error: 'Fee structure not found for your college' },
        { status: 404 }
      );
    }

    // Get fees for the specific branch
    const branchFees = feeStructure.branches[branch];
    if (!branchFees) {
      return NextResponse.json(
        { success: false, error: 'Fee structure not found for your branch' },
        { status: 404 }
      );
    }

    // Perform OCR on the receipt
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let receiptText = '';
    if (file.type.startsWith('image/')) {
      // Dynamic import to avoid build-time issues on Vercel
      const Tesseract = await import('tesseract.js');
      const ocrResult = await Tesseract.recognize(buffer, 'eng');
      receiptText = ocrResult.data.text;
    } else {
      // For PDF, we would need a PDF parser
      // For now, return an error for PDFs
      return NextResponse.json(
        { success: false, error: 'PDF parsing not supported yet. Please upload an image.' },
        { status: 400 }
      );
    }

    // Analyze the receipt using AI
    const analysis = await analyzeFeeAnomaly(
      receiptText,
      {
        tuition: branchFees.tuition,
        hostel: branchFees.hostel,
        mess: branchFees.mess,
        other: branchFees.other,
      },
      branch,
      college
    );

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error analyzing fees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze fee receipt' },
      { status: 500 }
    );
  }
}
