import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import Notification from '@/models/Notification';

export async function GET(request) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) return unauthorizedResponse();

  await connectDB();

  try {
    const notifications = await Notification.find({ userId: authUser._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({ userId: authUser._id, readAt: null });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
