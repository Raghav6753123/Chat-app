import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { toClockTime } from '@/lib/formatters';
import Conversation from '@/models/Conversation';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';
import User from '@/models/User';

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
    replyTo: message.replyToId?.toString() || undefined,
    createdAt: message.createdAt,
  };
}

async function canAccessConversation(conversationId, userId) {
  const membership = await ConversationMember.findOne({ conversationId, userId }).lean();
  return Boolean(membership);
}

export async function GET(request, context) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) {
    return unauthorizedResponse();
  }

  await connectDB();

  const { id } = context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });
  }

  const conversationId = new mongoose.Types.ObjectId(id);
  const hasAccess = await canAccessConversation(conversationId, authUser._id);

  if (!hasAccess) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  await ConversationMember.updateOne(
    { conversationId, userId: authUser._id },
    { $set: { unreadCount: 0 } }
  );

  const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
  const senderIds = [...new Set(messages.map((message) => message.senderId.toString()))].map(
    (senderId) => new mongoose.Types.ObjectId(senderId)
  );
  const users = await User.find({ _id: { $in: senderIds } }).lean();
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));

  return NextResponse.json({
    messages: messages.map((message) =>
      serializeMessage(message, usersById.get(message.senderId.toString()))
    ),
  });
}

export async function POST(request, context) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) {
    return unauthorizedResponse();
  }

  await connectDB();

  const { id } = context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });
  }

  const conversationId = new mongoose.Types.ObjectId(id);
  const hasAccess = await canAccessConversation(conversationId, authUser._id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const body = await request.json();
  const text = (body.text || '').trim();
  const type = body.type || 'text';

  if (!text && type === 'text') {
    return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const message = await Message.create({
    conversationId,
    senderId: authUser._id,
    text,
    type,
    status: 'sent',
    fileUrl: body.fileUrl || '',
    fileName: body.fileName || '',
    fileSize: body.fileSize || '',
    duration: body.duration || '',
    replyToId: body.replyToId && mongoose.Types.ObjectId.isValid(body.replyToId)
      ? new mongoose.Types.ObjectId(body.replyToId)
      : null,
  });

  conversation.lastMessage = text || type;
  conversation.lastMessageTime = new Date();
  await conversation.save();

  await ConversationMember.updateMany(
    {
      conversationId,
      userId: { $ne: authUser._id },
    },
    {
      $inc: { unreadCount: 1 },
    }
  );

  const sender = await User.findById(authUser._id).lean();

  return NextResponse.json(
    { message: serializeMessage(message.toObject(), sender) },
    { status: 201 }
  );
}
