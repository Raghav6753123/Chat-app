import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { toClockTime } from '@/lib/formatters';
import { getPusherServer } from '@/lib/pusher-server';
import Conversation from '@/models/Conversation';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function serializeMessage(message, sender) {
  return {
    id: message._id.toString(),
    senderId: message.senderId.toString(),
    senderName: sender?.name || 'Unknown',
    text: message.text,
    timestamp: toClockTime(message.createdAt),
    status: message.status,
    type: message.type,
    fileUrl: message.fileUrl || undefined,
    fileName: message.fileName || undefined,
    fileSize: message.fileSize || undefined,
    duration: message.duration || undefined,
    createdAt: message.createdAt,
    isEdited: false,
    reactions: {},
    isForwarded: true,
  };
}

export async function POST(request, context) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) {
    return unauthorizedResponse();
  }

  await connectDB();

  const { id: sourceConversationIdStr, messageId: sourceMessageIdStr } = await context.params;
  
  if (!mongoose.Types.ObjectId.isValid(sourceConversationIdStr) || !mongoose.Types.ObjectId.isValid(sourceMessageIdStr)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const sourceConversationId = new mongoose.Types.ObjectId(sourceConversationIdStr);
  const sourceMessageId = new mongoose.Types.ObjectId(sourceMessageIdStr);

  const hasAccess = await ConversationMember.exists({ conversationId: sourceConversationId, userId: authUser._id });
  if (!hasAccess) {
    return NextResponse.json({ error: 'Source conversation not found' }, { status: 404 });
  }

  const sourceMessage = await Message.findOne({
    _id: sourceMessageId,
    conversationId: sourceConversationId,
    hiddenFor: { $ne: authUser._id }
  });

  if (!sourceMessage || sourceMessage.type === 'call_log') {
    return NextResponse.json({ error: 'Message cannot be forwarded' }, { status: 400 });
  }

  const body = await request.json();
  const targetConversationIds = body.targetConversationIds || [];

  if (!Array.isArray(targetConversationIds) || targetConversationIds.length === 0) {
    return NextResponse.json({ error: 'Target conversations required' }, { status: 400 });
  }

  const validTargetIds = targetConversationIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
  
  const memberships = await ConversationMember.find({
    userId: authUser._id,
    conversationId: { $in: validTargetIds }
  });

  const accessibleTargetIds = memberships.map(m => m.conversationId.toString());

  if (accessibleTargetIds.length === 0) {
    return NextResponse.json({ error: 'No valid target conversations' }, { status: 400 });
  }

  const pusherServer = getPusherServer();
  const forwardedMessages = [];

  for (const targetIdStr of accessibleTargetIds) {
    const targetId = new mongoose.Types.ObjectId(targetIdStr);
    
    const newMessage = await Message.create({
      conversationId: targetId,
      senderId: authUser._id,
      text: sourceMessage.text,
      type: sourceMessage.type,
      fileUrl: sourceMessage.fileUrl,
      fileName: sourceMessage.fileName,
      fileSize: sourceMessage.fileSize,
      duration: sourceMessage.duration,
      waveform: sourceMessage.waveform,
      status: 'sent',
      isForwarded: true,
      forwardedFromConversationId: sourceConversationId,
      forwardedFromMessageId: sourceMessageId,
      createdAt: new Date(),
    });

    let lastMessageText = newMessage.text;
    if (newMessage.type === 'image') lastMessageText = 'Sent a photo';
    if (newMessage.type === 'file') lastMessageText = `Sent a file: ${newMessage.fileName}`;
    if (newMessage.type === 'voice') lastMessageText = `Sent a voice message (${newMessage.duration})`;

    await Conversation.updateOne(
      { _id: targetId },
      {
        $set: {
          lastMessage: lastMessageText,
          lastMessageTime: newMessage.createdAt,
        },
      }
    );

    await ConversationMember.updateMany(
      {
        conversationId: targetId,
        userId: { $ne: authUser._id },
      },
      {
        $inc: { unreadCount: 1 },
      }
    );

    const serializedMessage = serializeMessage(newMessage.toObject(), authUser);
    forwardedMessages.push(serializedMessage);

    if (pusherServer) {
      await pusherServer.trigger(`private-conversation-${targetIdStr}`, 'new-message', {
        conversationId: targetIdStr,
        message: serializedMessage,
      }).catch(console.error);
    }
  }

  return NextResponse.json({ success: true, forwardedMessages });
}
