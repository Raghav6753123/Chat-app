import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import ConversationMember from '@/models/ConversationMember';
import User from '@/models/User';

async function requireMembership(conversationId, userId) {
  return ConversationMember.findOne({ conversationId, userId }).lean();
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
  const membership = await requireMembership(conversationId, authUser._id);
  if (!membership) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const members = await ConversationMember.find({ conversationId }).lean();
  const userIds = members.map((member) => member.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));

  return NextResponse.json({
    members: members.map((member) => {
      const user = usersById.get(member.userId.toString());
      return {
        id: member._id.toString(),
        userId: member.userId.toString(),
        conversationId: member.conversationId.toString(),
        name: user?.name || 'Unknown User',
        email: user?.email || '',
        avatarUrl: user?.avatarUrl || '',
        isOnline: Boolean(user?.isOnline),
        isMuted: Boolean(member.isMuted),
        isPinned: Boolean(member.isPinned),
        unreadCount: member.unreadCount || 0,
        joinedAt: member.joinedAt,
      };
    }),
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
  const membership = await requireMembership(conversationId, authUser._id);
  if (!membership) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  if (!conversation.isGroup) {
    return NextResponse.json(
      { error: 'Members can only be added to group conversations' },
      { status: 400 }
    );
  }

  const body = await request.json();
  const memberEmails = Array.isArray(body.memberEmails)
    ? body.memberEmails.map((email) => String(email).toLowerCase().trim()).filter(Boolean)
    : [];

  if (!memberEmails.length) {
    return NextResponse.json({ error: 'memberEmails is required' }, { status: 400 });
  }

  const users = await User.find({ email: { $in: memberEmails } }).lean();
  if (!users.length) {
    return NextResponse.json({ error: 'No matching users found' }, { status: 404 });
  }

  const existingMembers = await ConversationMember.find({ conversationId }).lean();
  const existingUserIds = new Set(existingMembers.map((member) => member.userId.toString()));

  const newMembers = users
    .filter((user) => !existingUserIds.has(user._id.toString()))
    .map((user) => ({
      conversationId,
      userId: user._id,
      isMuted: false,
      isPinned: false,
      unreadCount: 1,
      joinedAt: new Date(),
    }));

  if (!newMembers.length) {
    return NextResponse.json({ added: 0 });
  }

  await ConversationMember.insertMany(newMembers);
  conversation.memberCount = existingMembers.length + newMembers.length;
  await conversation.save();

  return NextResponse.json({ added: newMembers.length });
}

export async function DELETE(request, context) {
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
  const membership = await requireMembership(conversationId, authUser._id);
  if (!membership) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  if (!conversation.isGroup) {
    return NextResponse.json(
      { error: 'Members can only be removed from group conversations' },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ error: 'Valid userId query param is required' }, { status: 400 });
  }

  await ConversationMember.deleteOne({
    conversationId,
    userId: new mongoose.Types.ObjectId(userId),
  });

  const memberCount = await ConversationMember.countDocuments({ conversationId });
  conversation.memberCount = memberCount;
  await conversation.save();

  return NextResponse.json({ ok: true });
}
