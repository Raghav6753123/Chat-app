import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { toClockTime, toRelativeLastSeen } from '@/lib/formatters';
import Conversation from '@/models/Conversation';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';
import User from '@/models/User';
import { getPusherServer } from '@/lib/pusher-server';

function avatarAlt(name) {
  return `${name} avatar`;
}

async function buildConversationSummaryForUser(userId, conversationId) {
  const [membership, conversation, members] = await Promise.all([
    ConversationMember.findOne({ conversationId, userId }).lean(),
    Conversation.findById(conversationId).lean(),
    ConversationMember.find({ conversationId }).lean(),
  ]);

  if (!membership || !conversation) {
    return null;
  }

  const userIds = [...new Set(members.map((member) => member.userId.toString()))].map(
    (id) => new mongoose.Types.ObjectId(id)
  );
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));

  const peerMembership = members.find(
    (member) => member.userId.toString() !== userId.toString()
  );
  const peerUser = peerMembership
    ? usersById.get(peerMembership.userId.toString())
    : null;

  const latestMessage = await Message.findOne({
    conversationId,
    hiddenFor: { $ne: userId },
  })
    .sort({ createdAt: -1 })
    .lean();

  const name = conversation.isGroup
    ? conversation.name || 'Untitled Group'
    : peerUser?.name || 'Unknown User';

  const avatar = conversation.isGroup
    ? conversation.avatarUrl || 'https://i.pravatar.cc/48?img=30'
    : peerUser?.avatarUrl || 'https://i.pravatar.cc/48?img=1';

  const role = membership.role || 'member';

  return {
    id: conversation._id.toString(),
    name,
    avatar,
    avatarAlt: avatarAlt(name),
    isGroup: conversation.isGroup,
    isOnline: conversation.isGroup ? false : Boolean(peerUser?.isOnline),
    lastSeen: conversation.isGroup ? undefined : toRelativeLastSeen(peerUser?.lastSeen),
    lastMessage: latestMessage?.text || conversation.lastMessage || 'Start the conversation',
    lastMessageTime: toClockTime(latestMessage?.createdAt || conversation.lastMessageTime),
    unreadCount: membership.unreadCount || 0,
    isMuted: Boolean(membership.isMuted),
    isPinned: Boolean(membership.isPinned),
    members: conversation.memberCount || members.length,
    memberRole: role,
    canManageGroup: Boolean(
      conversation.isGroup &&
      (role === 'owner' ||
        role === 'admin' ||
        conversation.createdBy?.toString() === userId.toString())
    ),
  };
}

async function requireMembership(conversationId, userId) {
  return ConversationMember.findOne({ conversationId, userId }).lean();
}

function canManageGroup(conversation, membership, authUserId) {
  if (!conversation?.isGroup || !membership) {
    return false;
  }

  const role = membership.role || 'member';
  return (
    role === 'owner' ||
    role === 'admin' ||
    conversation.createdBy?.toString() === authUserId.toString()
  );
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
        role: member.role || 'member',
        isCurrentUser: member.userId.toString() === authUser._id.toString(),
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

  const { id } = await context.params;
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

  if (!canManageGroup(conversation, membership, authUser._id)) {
    return NextResponse.json(
      { error: 'Only group managers can add members' },
      { status: 403 }
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
  if (users.length !== memberEmails.length) {
    return NextResponse.json(
      { error: 'One or more participant emails were not found' },
      { status: 404 }
    );
  }

  const existingMembers = await ConversationMember.find({ conversationId }).lean();
  const existingUserIds = new Set(existingMembers.map((member) => member.userId.toString()));

  const newMembers = users
    .filter((user) => !existingUserIds.has(user._id.toString()))
    .map((user) => ({
      conversationId,
      userId: user._id,
      role: 'member',
      isMuted: false,
      isPinned: false,
      unreadCount: 1,
      joinedAt: new Date(),
    }));

  if (!newMembers.length) {
    return NextResponse.json({ added: 0 });
  }

  await ConversationMember.insertMany(newMembers);

  const addedIds = newMembers.map((member) => member.userId);
  const addedUsers = await User.find({ _id: { $in: addedIds } }).lean();
  const addedNames = addedUsers.map((user) => user.name).join(', ');

  if (addedNames) {
    await Message.create({
      conversationId,
      senderId: authUser._id,
      text: `${authUser.name} added ${addedNames}`,
      type: 'text',
      status: 'delivered',
    });

    conversation.lastMessage = `${authUser.name} added ${addedNames}`;
    conversation.lastMessageTime = new Date();
  }

  conversation.memberCount = existingMembers.length + newMembers.length;
  await conversation.save();

  const pusherServer = getPusherServer();
  if (pusherServer) {
    try {
      await pusherServer.trigger(`private-conversation-${conversationId.toString()}`, 'group-updated', {
        conversationId: conversationId.toString(),
        members: conversation.memberCount,
        lastMessage: conversation.lastMessage,
        lastMessageTime: toClockTime(conversation.lastMessageTime),
      });

      await Promise.all(
        addedUsers.map(async (user) => {
          const summary = await buildConversationSummaryForUser(user._id, conversationId);
          if (!summary) {
            return;
          }

          await pusherServer.trigger(`private-user-${user._id.toString()}`, 'conversation-added', {
            conversation: summary,
          });
        })
      );
    } catch {
      // Keep API success even when realtime fanout fails.
    }
  }

  return NextResponse.json({ added: newMembers.length });
}

export async function DELETE(request, context) {
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

  const targetUserId = new mongoose.Types.ObjectId(userId);
  const targetMembership = await ConversationMember.findOne({
    conversationId,
    userId: targetUserId,
  }).lean();

  if (!targetMembership) {
    return NextResponse.json({ error: 'Member not found in this group' }, { status: 404 });
  }

  const removingSelf = targetUserId.toString() === authUser._id.toString();
  if (!removingSelf && !canManageGroup(conversation, membership, authUser._id)) {
    return NextResponse.json(
      { error: 'Only group managers can remove other members' },
      { status: 403 }
    );
  }

  if (targetMembership.role === 'owner' && !removingSelf) {
    return NextResponse.json(
      { error: 'Group owner cannot be removed by another member' },
      { status: 400 }
    );
  }

  await ConversationMember.deleteOne({
    conversationId,
    userId: targetUserId,
  });

  const memberCount = await ConversationMember.countDocuments({ conversationId });
  if (!memberCount) {
    await Conversation.deleteOne({ _id: conversationId });
    return NextResponse.json({ ok: true, removedConversation: true });
  }

  if (targetMembership.role === 'owner') {
    const nextOwner = await ConversationMember.findOne({ conversationId }).sort({ joinedAt: 1 });
    if (nextOwner) {
      nextOwner.role = 'owner';
      await nextOwner.save();
      conversation.createdBy = nextOwner.userId;
    }
  }

  const targetUser = await User.findById(targetUserId).lean();
  if (targetUser) {
    await Message.create({
      conversationId,
      senderId: authUser._id,
      text: removingSelf
        ? `${authUser.name} left the group`
        : `${authUser.name} removed ${targetUser.name}`,
      type: 'text',
      status: 'delivered',
    });

    conversation.lastMessage = removingSelf
      ? `${authUser.name} left the group`
      : `${authUser.name} removed ${targetUser.name}`;
    conversation.lastMessageTime = new Date();
  }

  conversation.memberCount = memberCount;
  await conversation.save();

  return NextResponse.json({ ok: true });
}

export async function PATCH(request, context) {
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
  const membership = await requireMembership(conversationId, authUser._id);
  if (!membership) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const body = await request.json();
  const updates = {};

  if (typeof body.isMuted === 'boolean') {
    updates.isMuted = body.isMuted;
  }

  if (typeof body.isPinned === 'boolean') {
    updates.isPinned = body.isPinned;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'No valid preference updates provided' }, { status: 400 });
  }

  const updated = await ConversationMember.findByIdAndUpdate(
    membership._id,
    { $set: updates },
    { new: true }
  ).lean();

  return NextResponse.json({
    preferences: {
      isMuted: Boolean(updated.isMuted),
      isPinned: Boolean(updated.isPinned),
    },
  });
}
