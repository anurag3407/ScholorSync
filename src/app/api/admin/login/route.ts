import { NextRequest, NextResponse } from 'next/server';

// Admin credentials
const ADMIN_EMAIL = 'admin123@gmail.com';
const ADMIN_PASSWORD = 'admin123';

// POST - Verify admin login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, { status: 400 });
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

// GET - Check if request has valid admin credentials
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
