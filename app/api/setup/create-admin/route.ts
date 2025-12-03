import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, name, email, password, avatarUrl } = body;

    // Validate required fields
    if (!username || !name || !email || !password) {
      return NextResponse.json({
        success: false,
        error: 'All fields are required'
      }, { status: 400 });
    }

    // Check if user already exists
    const existing = await sql`
      SELECT uid FROM users WHERE email = ${email} LIMIT 1
    `;

    if (existing.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'A user with this email already exists'
      }, { status: 400 });
    }

    // Create unique ID
    const uid = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Insert admin user into database
    await sql`
      INSERT INTO users (uid, email, name, avatar_url, role, password_hash, created_at)
      VALUES (
        ${uid},
        ${email},
        ${name},
        ${avatarUrl || null},
        'Administrator',
        ${password},
        NOW()
      )
    `;

    // Return success with user data
    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        uid,
        email,
        name,
        role: 'Administrator'
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create admin account'
    }, { status: 500 });
  }
}
