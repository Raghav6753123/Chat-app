import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import ConversationMember from '@/models/ConversationMember';
import { getPusherServer } from '@/lib/pusher-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, context) {
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
  const membership = await ConversationMember.findOne({
    conversationId,
    userId: authUser._id,
  }).lean();

  if (!membership) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const isTyping = Boolean(body?.isTyping);

  const pusherServer = getPusherServer();
  if (pusherServer) {
    try {
      await pusherServer.trigger(
        `private-conversation-${conversationId.toString()}`,
        'typing-status',
        {
          conversationId: conversationId.toString(),
          userId: authUser._id.toString(),
          userName: authUser.name,
          isTyping,
        }
      );
    } catch {
      // Keep typing endpoint resilient when realtime publish fails.
    }
  }

  return NextResponse.json({ ok: true });
}
