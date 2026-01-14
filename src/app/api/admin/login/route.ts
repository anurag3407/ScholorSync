import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@admin.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[Admin Login] ENV configured:', {
      hasAdminEmail: !!ADMIN_EMAIL,
      hasAdminPassword: !!ADMIN_PASSWORD,
      emailLength: ADMIN_EMAIL?.length || 0,
    });

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }

    // Check if env vars are not configured
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error('[Admin Login] ADMIN_EMAIL or ADMIN_PASSWORD not set in .env');
      return NextResponse.json({
        success: false,
        error: 'Admin credentials not configured. Please set ADMIN_EMAIL and ADMIN_PASSWORD in .env'
      }, { status: 500 });
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return NextResponse.json({
        success: true,
        data: {
          isAdmin: true,
          email: ADMIN_EMAIL,
          name: 'Administrator',
          role: 'admin',
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid credentials'
    }, { status: 401 });
  } catch (error) {
    console.error('Admin Login Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Login failed'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminEmail = request.headers.get('x-admin-email');
    const adminPassword = request.headers.get('x-admin-password');

    if (adminEmail === ADMIN_EMAIL && adminPassword === ADMIN_PASSWORD) {
      return NextResponse.json({
        success: true,
        data: {
          isAdmin: true,
          email: ADMIN_EMAIL,
          name: 'Administrator',
          role: 'admin',
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Unauthorized'
    }, { status: 401 });
  } catch (error) {
    console.error('Admin Verify Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Verification failed'
    }, { status: 500 });
  }
}
