import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { toClockTime } from '@/lib/formatters';
import { getPusherServer } from '@/lib/pusher-server';
import Conversation from '@/models/Conversation';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function serializeMessage(message, sender, replyToMessage, replyToSender) {
  const serialized = {
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
    replyTo: message.replyToId?.toString() || undefined,
    createdAt: message.createdAt,
    isEdited: Boolean(message.isEdited),
    editedAt: message.editedAt || undefined,
    reactions: message.reactions || {},
  };

  if (replyToMessage) {
    serialized.replyToMessage = {
      id: replyToMessage._id.toString(),
      text: replyToMessage.text || (replyToMessage.type === 'image' ? 'Photo' : replyToMessage.type === 'file' ? replyToMessage.fileName || 'File' : ''),
      senderName: replyToSender?.name || 'Unknown',
      type: replyToMessage.type,
    };
  }

  return serialized;
}

export async function POST(request, context) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) {
    return unauthorizedResponse();
  }

  await connectDB();

  const { id: conversationIdStr, messageId: messageIdStr } = await context.params;
  
  if (!mongoose.Types.ObjectId.isValid(conversationIdStr) || !mongoose.Types.ObjectId.isValid(messageIdStr)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const conversationId = new mongoose.Types.ObjectId(conversationIdStr);
  const messageId = new mongoose.Types.ObjectId(messageIdStr);

  const hasAccess = await ConversationMember.exists({ conversationId, userId: authUser._id });
  if (!hasAccess) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const message = await Message.findOne({
    _id: messageId,
    conversationId,
    senderId: authUser._id,
    status: 'scheduled'
  });

  if (!message) {
    return NextResponse.json({ error: 'Scheduled message not found' }, { status: 404 });
  }

  message.status = 'sent';
  message.scheduledFor = null;
  message.createdAt = new Date();
  
  await message.save();

  let lastMessageText = message.text;
  if (message.type === 'image') lastMessageText = 'Sent a photo';
  if (message.type === 'file') lastMessageText = `Sent a file: ${message.fileName}`;
  if (message.type === 'voice') lastMessageText = `Sent a voice message (${message.duration})`;

  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: {
        lastMessage: lastMessageText,
        lastMessageTime: new Date(),
      },
    }
  );

  await ConversationMember.updateMany(
    {
      conversationId,
      userId: { $ne: authUser._id },
    },
    {
      $inc: { unreadCount: 1 },
    }
  );

  let replyToMessage = null;
  let replyToSender = null;
  if (message.replyToId) {
    replyToMessage = await Message.findById(message.replyToId).lean();
    if (replyToMessage) {
      replyToSender = await User.findById(replyToMessage.senderId).lean();
    }
  }

  const serializedMessage = serializeMessage(message.toObject(), authUser, replyToMessage, replyToSender);

  const pusherServer = getPusherServer();
  await pusherServer.trigger(`private-conversation-${conversationId}`, 'new-message', {
    conversationId,
    message: serializedMessage,
  });

  return NextResponse.json({ success: true, message: serializedMessage });
}
