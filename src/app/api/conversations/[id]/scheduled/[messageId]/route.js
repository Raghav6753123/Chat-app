import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, context) {
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

  const body = await request.json();
  const { text, scheduledFor } = body;

  const message = await Message.findOne({
    _id: messageId,
    conversationId,
    senderId: authUser._id,
    status: 'scheduled'
  });

  if (!message) {
    return NextResponse.json({ error: 'Scheduled message not found or cannot be edited' }, { status: 404 });
  }

  if (text !== undefined && text.trim().length === 0) {
    return NextResponse.json({ error: 'Message text cannot be empty' }, { status: 400 });
  }

  if (scheduledFor !== undefined) {
    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 });
    }
    message.scheduledFor = scheduledDate;
  }

  if (text !== undefined) {
    message.text = text;
  }

  await message.save();

  return NextResponse.json({ success: true, message });
}

export async function DELETE(request, context) {
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

  const result = await Message.deleteOne({
    _id: messageId,
    conversationId,
    senderId: authUser._id,
    status: 'scheduled'
  });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Scheduled message not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
