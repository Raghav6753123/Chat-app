import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';
import { getPusherServer } from '@/lib/pusher-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

async function canAccessConversation(conversationId, userId) {
  const membership = await ConversationMember.findOne({ conversationId, userId }).lean();
  return Boolean(membership);
}

export async function POST(request, context) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) {
    return unauthorizedResponse();
  }

  await connectDB();

  const { id, messageId } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(messageId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const conversationId = new mongoose.Types.ObjectId(id);
  const normalizedMessageId = new mongoose.Types.ObjectId(messageId);

  const hasAccess = await canAccessConversation(conversationId, authUser._id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const emoji = body.emoji;

  if (!emoji || !ALLOWED_REACTIONS.includes(emoji)) {
    return NextResponse.json(
      { error: 'Invalid reaction. Use one of: ' + ALLOWED_REACTIONS.join(' ') },
      { status: 400 }
    );
  }

  const message = await Message.findOne({ _id: normalizedMessageId, conversationId });
  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  const userId = authUser._id.toString();
  const reactions = message.reactions || {};
  const currentUsers = reactions[emoji] || [];

  if (currentUsers.includes(userId)) {
    // Toggle off
    reactions[emoji] = currentUsers.filter((id) => id !== userId);
    if (!reactions[emoji].length) {
      delete reactions[emoji];
    }
  } else {
    // Toggle on
    reactions[emoji] = [...currentUsers, userId];
  }

  message.reactions = reactions;
  message.markModified('reactions');
  await message.save();

  const pusherServer = getPusherServer();
  if (pusherServer) {
    try {
      await pusherServer.trigger(
        `private-conversation-${conversationId.toString()}`,
        'message-reaction',
        {
          conversationId: conversationId.toString(),
          messageId: normalizedMessageId.toString(),
          reactions,
        }
      );
    } catch {
      // Keep reaction successful even if realtime publish fails.
    }
  }

  return NextResponse.json({ ok: true, reactions });
}
