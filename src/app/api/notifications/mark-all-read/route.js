import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import Notification from '@/models/Notification';

export async function POST(request) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) return unauthorizedResponse();

  await connectDB();

  try {
    await Notification.updateMany(
      { userId: authUser._id, readAt: null },
      { $set: { readAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
  }
}
