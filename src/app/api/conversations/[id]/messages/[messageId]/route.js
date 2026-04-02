import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { toClockTime } from '@/lib/formatters';
import Conversation from '@/models/Conversation';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';
import { getPusherServer } from '@/lib/pusher-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function canAccessConversation(conversationId, userId) {
  const membership = await ConversationMember.findOne({ conversationId, userId }).lean();
  return Boolean(membership);
}

export async function DELETE(request, context) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) {
    return unauthorizedResponse();
  }

  await connectDB();

  const { id, messageId } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
  }

  const conversationId = new mongoose.Types.ObjectId(id);
  const normalizedMessageId = new mongoose.Types.ObjectId(messageId);

  const hasAccess = await canAccessConversation(conversationId, authUser._id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const scope = body?.scope === 'everyone' ? 'everyone' : 'me';

  const message = await Message.findOne({ _id: normalizedMessageId, conversationId });
  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  if (scope === 'everyone') {
    if (message.senderId.toString() !== authUser._id.toString()) {
      return NextResponse.json(
        { error: 'Only the sender can delete for everyone' },
        { status: 403 }
      );
    }

    await Message.deleteOne({ _id: normalizedMessageId });

    const latestMessage = await Message.findOne({ conversationId })
      .sort({ createdAt: -1 })
      .lean();

    const nextLastMessage = latestMessage?.text || latestMessage?.type || '';
    const nextLastMessageTime = latestMessage?.createdAt || null;

    await Conversation.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessage: nextLastMessage,
        lastMessageTime: nextLastMessageTime,
      },
    });

    const pusherServer = getPusherServer();
    if (pusherServer) {
      try {
        await pusherServer.trigger(
          `private-conversation-${conversationId.toString()}`,
          'deleted-message',
          {
            conversationId: conversationId.toString(),
            messageId: normalizedMessageId.toString(),
            scope: 'everyone',
            lastMessage: nextLastMessage,
            lastMessageTime: nextLastMessageTime ? toClockTime(nextLastMessageTime) : '',
          }
        );
      } catch {
        // Keep delete successful even if realtime publish fails.
      }
    }

    return NextResponse.json({
      ok: true,
      scope: 'everyone',
      messageId: normalizedMessageId.toString(),
      lastMessage: nextLastMessage,
      lastMessageTime: nextLastMessageTime ? toClockTime(nextLastMessageTime) : '',
    });
  }

  await Message.updateOne(
    { _id: normalizedMessageId },
    { $addToSet: { hiddenFor: authUser._id } }
  );

  return NextResponse.json({
    ok: true,
    scope: 'me',
    messageId: normalizedMessageId.toString(),
  });
}
