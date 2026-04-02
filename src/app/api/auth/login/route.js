import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import {
  signAuthToken,
  withAuthCookie,
} from '@/lib/auth';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const email = (body.email || '').toLowerCase().trim();
    const password = body.password || '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { isOnline: true, lastSeen: new Date() } }
    );

    const token = signAuthToken({ userId: user._id.toString(), email: user.email });
    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio || '',
        settings: {
          desktopNotifications: user.settings?.desktopNotifications ?? true,
          enterToSend: user.settings?.enterToSend ?? true,
          compactMode: user.settings?.compactMode ?? false,
        },
      },
    });

    return withAuthCookie(response, token);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to log in', details: error.message },
      { status: 500 }
    );
  }
}
