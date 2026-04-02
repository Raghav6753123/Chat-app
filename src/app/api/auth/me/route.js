import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio || '',
    isOnline: user.isOnline,
    lastSeen: user.lastSeen,
    createdAt: user.createdAt,
    settings: {
      desktopNotifications: user.settings?.desktopNotifications ?? true,
      enterToSend: user.settings?.enterToSend ?? true,
      compactMode: user.settings?.compactMode ?? false,
    },
  };
}

export async function GET(request) {
  const user = await getAuthUserFromRequest(request);

  if (!user) {
    return unauthorizedResponse();
  }

  return NextResponse.json({
    user: serializeUser(user),
  });
}

export async function PATCH(request) {
  const authUser = await getAuthUserFromRequest(request);

  if (!authUser) {
    return unauthorizedResponse();
  }

  await connectDB();

  const body = await request.json();
  const updates = {};

  if (typeof body.name === 'string') {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    updates.name = name;
  }

  if (typeof body.bio === 'string') {
    updates.bio = body.bio.trim().slice(0, 160);
  }

  if (typeof body.email === 'string') {
    const email = body.email.toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ error: 'Email cannot be empty' }, { status: 400 });
    }

    const existing = await User.findOne({
      email,
      _id: { $ne: authUser._id },
    }).lean();

    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    updates.email = email;
  }

  if (body.settings && typeof body.settings === 'object') {
    updates.settings = {
      desktopNotifications:
        body.settings.desktopNotifications ?? authUser.settings?.desktopNotifications ?? true,
      enterToSend: body.settings.enterToSend ?? authUser.settings?.enterToSend ?? true,
      compactMode: body.settings.compactMode ?? authUser.settings?.compactMode ?? false,
    };
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
  }

  const updated = await User.findByIdAndUpdate(authUser._id, { $set: updates }, { new: true });

  return NextResponse.json({ user: serializeUser(updated) });
}
