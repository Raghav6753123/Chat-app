import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';

async function getMembership(conversationId, userId) {
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
  const membership = await getMembership(conversationId, authUser._id);
  if (!membership) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  if (!conversation.isGroup) {
    return NextResponse.json({ error: 'Only groups can be updated' }, { status: 400 });
  }

  if (!canManageGroup(conversation, membership, authUser._id)) {
    return NextResponse.json(
      { error: 'Only group managers can update this group' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const updates = {};

  if (typeof body.name === 'string') {
    const nextName = body.name.trim();
    if (!nextName) {
      return NextResponse.json({ error: 'Group name cannot be empty' }, { status: 400 });
    }
    updates.name = nextName;
  }

  if (typeof body.avatarUrl === 'string') {
    updates.avatarUrl = body.avatarUrl.trim();
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
  }

  const previousName = conversation.name || 'Untitled Group';
  Object.assign(conversation, updates);
  await conversation.save();

  if (updates.name && updates.name !== previousName) {
    await Message.create({
      conversationId,
      senderId: authUser._id,
      text: `${authUser.name} renamed the group to ${updates.name}`,
      type: 'text',
      status: 'delivered',
    });

    conversation.lastMessage = `${authUser.name} renamed the group to ${updates.name}`;
    conversation.lastMessageTime = new Date();
    await conversation.save();
  }

  return NextResponse.json({
    conversation: {
      id: conversation._id.toString(),
      name: conversation.name || 'Untitled Group',
      avatar: conversation.avatarUrl || 'https://i.pravatar.cc/48?img=30',
      isGroup: true,
      members: conversation.memberCount || 0,
    },
  });
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
  const membership = await getMembership(conversationId, authUser._id);
  if (!membership) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  if (conversation.isGroup) {
    await ConversationMember.deleteOne({
      conversationId,
      userId: authUser._id,
    });

    const remainingMembers = await ConversationMember.countDocuments({ conversationId });

    if (!remainingMembers) {
      await Promise.all([
        Conversation.deleteOne({ _id: conversationId }),
        Message.deleteMany({ conversationId }),
      ]);
    } else {
      if (conversation.createdBy?.toString() === authUser._id.toString()) {
        const nextOwner = await ConversationMember.findOne({ conversationId }).sort({ joinedAt: 1 });
        if (nextOwner) {
          nextOwner.role = 'owner';
          await nextOwner.save();
          conversation.createdBy = nextOwner.userId;
        }
      }

      conversation.memberCount = remainingMembers;
      conversation.lastMessage = `${authUser.name} left the group`;
      conversation.lastMessageTime = new Date();
      await conversation.save();

      await Message.create({
        conversationId,
        senderId: authUser._id,
        text: `${authUser.name} left the group`,
        type: 'text',
        status: 'delivered',
      });
    }

    return NextResponse.json({
      ok: true,
      action: 'left-group',
      removedConversationId: conversationId.toString(),
    });
  }

  await ConversationMember.deleteOne({
    conversationId,
    userId: authUser._id,
  });

  return NextResponse.json({
    ok: true,
    action: 'hidden-direct',
    removedConversationId: conversationId.toString(),
  });
}
