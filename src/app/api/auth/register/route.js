import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import {
  signAuthToken,
  withAuthCookie,
} from '@/lib/auth';
import { ensureStarterConversationForUser } from '@/lib/bootstrap';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const name = (body.fullName || body.name || '').trim();
    const email = (body.email || '').toLowerCase().trim();
    const password = body.password || '';

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return NextResponse.json({ error: 'Email is already in use' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      avatarUrl: `https://i.pravatar.cc/48?u=${encodeURIComponent(email)}`,
      isOnline: true,
      lastSeen: new Date(),
    });

    await ensureStarterConversationForUser(user);

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
      { error: 'Failed to register user', details: error.message },
      { status: 500 }
    );
  }
}
