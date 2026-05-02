import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { toClockTime } from '@/lib/formatters';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';
import User from '@/models/User';

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
    scheduledFor: message.scheduledFor || undefined,
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
  const hasAccess = await ConversationMember.exists({ conversationId, userId: authUser._id });

  if (!hasAccess) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const messages = await Message.find({
    conversationId,
    senderId: authUser._id,
    status: 'scheduled',
    hiddenFor: { $ne: authUser._id },
  }).sort({ scheduledFor: 1 }).lean();

  const senderIds = [...new Set(messages.map((message) => message.senderId.toString()))].map(
    (senderId) => new mongoose.Types.ObjectId(senderId)
  );
  const users = await User.find({ _id: { $in: senderIds } }).lean();
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));

  // Gather reply-to message data
  const replyToIds = messages
    .filter((m) => m.replyToId)
    .map((m) => m.replyToId);
  const replyToMessages = replyToIds.length
    ? await Message.find({ _id: { $in: replyToIds } }).lean()
    : [];
  const replyToById = new Map(replyToMessages.map((m) => [m._id.toString(), m]));

  const replyToSenderIds = [...new Set(replyToMessages.map((m) => m.senderId.toString()))]
    .filter((rid) => !usersById.has(rid))
    .map((rid) => new mongoose.Types.ObjectId(rid));

  if (replyToSenderIds.length > 0) {
    const additionalUsers = await User.find({ _id: { $in: replyToSenderIds } }).lean();
    for (const u of additionalUsers) {
      usersById.set(u._id.toString(), u);
    }
  }

  const serializedMessages = messages.map((m) => {
    const sender = usersById.get(m.senderId.toString());
    const replyToMessage = m.replyToId ? replyToById.get(m.replyToId.toString()) : null;
    const replyToSender = replyToMessage ? usersById.get(replyToMessage.senderId.toString()) : null;
    return serializeMessage(m, sender, replyToMessage, replyToSender);
  });

  return NextResponse.json({ messages: serializedMessages });
}
