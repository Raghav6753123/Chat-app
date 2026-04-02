import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { toClockTime, toRelativeLastSeen } from '@/lib/formatters';
import Conversation from '@/models/Conversation';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';
import User from '@/models/User';

function avatarAlt(name) {
  return `${name} avatar`;
}

export async function GET(request) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) {
    return unauthorizedResponse();
  }

  await connectDB();

  const memberships = await ConversationMember.find({ userId: authUser._id })
    .sort({ isPinned: -1, updatedAt: -1 })
    .lean();

  if (!memberships.length) {
    return NextResponse.json({ conversations: [] });
  }

  const conversationIds = memberships.map((m) => m.conversationId);

  const [conversationDocs, allMembers] = await Promise.all([
    Conversation.find({ _id: { $in: conversationIds } }).lean(),
    ConversationMember.find({ conversationId: { $in: conversationIds } }).lean(),
  ]);

  const conversationsById = new Map(
    conversationDocs.map((conversation) => [conversation._id.toString(), conversation])
  );

  const userIds = [...new Set(allMembers.map((member) => member.userId.toString()))].map(
    (id) => new mongoose.Types.ObjectId(id)
  );
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));

  const output = await Promise.all(
    memberships.map(async (membership) => {
      const conversation = conversationsById.get(membership.conversationId.toString());
      if (!conversation) return null;

      const members = allMembers.filter(
        (member) => member.conversationId.toString() === conversation._id.toString()
      );

      const peerMembership = members.find(
        (member) => member.userId.toString() !== authUser._id.toString()
      );
      const peerUser = peerMembership
        ? usersById.get(peerMembership.userId.toString())
        : null;

      const latestMessage = await Message.findOne({ conversationId: conversation._id })
        .sort({ createdAt: -1 })
        .lean();

      const name = conversation.isGroup
        ? conversation.name || 'Untitled Group'
        : peerUser?.name || 'Unknown User';

      const avatar = conversation.isGroup
        ? conversation.avatarUrl || 'https://i.pravatar.cc/48?img=30'
        : peerUser?.avatarUrl || 'https://i.pravatar.cc/48?img=1';

      return {
        id: conversation._id.toString(),
        name,
        avatar,
        avatarAlt: avatarAlt(name),
        isGroup: conversation.isGroup,
        isOnline: conversation.isGroup ? false : Boolean(peerUser?.isOnline),
        lastSeen: conversation.isGroup ? undefined : toRelativeLastSeen(peerUser?.lastSeen),
        lastMessage:
          latestMessage?.text ||
          conversation.lastMessage ||
          'Start the conversation',
        lastMessageTime: toClockTime(latestMessage?.createdAt || conversation.lastMessageTime),
        unreadCount: membership.unreadCount || 0,
        isMuted: Boolean(membership.isMuted),
        isPinned: Boolean(membership.isPinned),
        members: conversation.memberCount || members.length,
      };
    })
  );

  return NextResponse.json({
    conversations: output.filter(Boolean),
  });
}
