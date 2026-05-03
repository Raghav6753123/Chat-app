import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import Notification from '@/models/Notification';

export async function PATCH(request, context) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) return unauthorizedResponse();

  await connectDB();
  const { id } = await context.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid notification id' }, { status: 400 });
  }

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: authUser._id },
      { $set: { readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
