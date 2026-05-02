import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import Message from '@/models/Message';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) {
    return unauthorizedResponse();
  }

  await connectDB();

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });
  }

  const conversationId = new mongoose.Types.ObjectId(id);

  // We find messages of type 'call_log'
  const callMessages = await Message.find({
    conversationId,
    type: 'call_log'
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  const mappedCalls = callMessages.map(msg => {
    const isOutgoing = msg.senderId.toString() === authUser._id.toString();
    return {
      id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      status: msg.callStatus, // 'missed', 'completed', 'cancelled'
      isOutgoing,
      type: msg.callType === 'video' ? 'video' : 'audio',
      startedAt: msg.createdAt, // UI uses startedAt to sort
      durationLabel: msg.duration || '0m 0s'
    };
  });

  return NextResponse.json({ calls: mappedCalls });
}

export async function POST(request, context) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function PATCH(request, context) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
