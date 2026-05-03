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

async function buildConversationSummaries(authUserId) {
  const memberships = await ConversationMember.find({ userId: authUserId })
    .sort({ isPinned: -1, updatedAt: -1 })
    .lean();

  if (!memberships.length) {
    return [];
  }

  const conversationIds = memberships.map((member) => member.conversationId);

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
        (member) => member.userId.toString() !== authUserId.toString()
      );
      const peerUser = peerMembership
        ? usersById.get(peerMembership.userId.toString())
        : null;

      const latestMessage = await Message.findOne({
        conversationId: conversation._id,
        hiddenFor: { $ne: authUserId },
      })
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
        isArchived: Boolean(membership.isArchived),
        wallpaper: membership.wallpaper || '',
        members: conversation.memberCount || members.length,
        memberRole: membership.role || 'member',
        canManageGroup: Boolean(
          conversation.isGroup &&
          ((membership.role || 'member') === 'owner' ||
            (membership.role || 'member') === 'admin' ||
            conversation.createdBy?.toString() === authUserId.toString())
        ),
      };
    })
  );

  return output.filter(Boolean);
}

async function buildConversationSummaryForUser(authUserId, conversationId) {
  const summaries = await buildConversationSummaries(authUserId);
  return summaries.find((summary) => summary.id === conversationId.toString()) || null;
}

export async function GET(request) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) {
    return unauthorizedResponse();
  }

  await connectDB();

  const output = await buildConversationSummaries(authUser._id);

  return NextResponse.json({
    conversations: output,
  });
}

export async function POST(request) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) {
    return unauthorizedResponse();
  }

  await connectDB();

  const body = await request.json();
  const isGroup = Boolean(body.isGroup);
  const groupName = (body.name || '').trim();
  const memberEmails = Array.isArray(body.memberEmails)
    ? body.memberEmails.map((email) => String(email).toLowerCase().trim()).filter(Boolean)
    : [];

  if (!memberEmails.length) {
    return NextResponse.json(
      { error: 'At least one participant email is required' },
      { status: 400 }
    );
  }

  if (isGroup && !groupName) {
    return NextResponse.json(
      { error: 'Group name is required for group conversations' },
      { status: 400 }
    );
  }

  const uniqueEmails = [...new Set(memberEmails)].filter(
    (email) => email !== String(authUser.email).toLowerCase()
  );

  if (!uniqueEmails.length) {
    return NextResponse.json(
      { error: 'Please provide at least one participant other than yourself' },
      { status: 400 }
    );
  }

  const memberUsers = await User.find({ email: { $in: uniqueEmails } }).lean();
  if (memberUsers.length !== uniqueEmails.length) {
    return NextResponse.json(
      { error: 'One or more participant emails were not found' },
      { status: 404 }
    );
  }

  const memberIds = memberUsers.map((user) => user._id.toString());

  if (!isGroup && memberIds.length !== 1) {
    return NextResponse.json(
      { error: 'Direct chat supports exactly one participant' },
      { status: 400 }
    );
  }

  if (!isGroup) {
    const directMemberships = await ConversationMember.find({
      userId: { $in: [authUser._id, memberUsers[0]._id] },
    }).lean();

    const countsByConversation = new Map();
    directMemberships.forEach((membership) => {
      const key = membership.conversationId.toString();
      countsByConversation.set(key, (countsByConversation.get(key) || 0) + 1);
    });

    const candidateIds = [...countsByConversation.entries()]
      .filter(([, count]) => count === 2)
      .map(([conversationId]) => new mongoose.Types.ObjectId(conversationId));

    if (candidateIds.length) {
      const existingConversation = await Conversation.findOne({
        _id: { $in: candidateIds },
        isGroup: false,
      }).lean();

      if (existingConversation) {
        const conversationSummary = await buildConversationSummaries(authUser._id);
        const selectedConversation = conversationSummary.find(
          (conversation) => conversation.id === existingConversation._id.toString()
        );

        return NextResponse.json({ conversation: selectedConversation, existed: true });
      }
    }
  }

  const conversation = await Conversation.create({
    isGroup,
    name: isGroup ? groupName : null,
    avatarUrl: isGroup
      ? `https://i.pravatar.cc/48?u=${encodeURIComponent(groupName || memberUsers[0].email)}`
      : '',
    createdBy: isGroup ? authUser._id : null,
    memberCount: memberUsers.length + 1,
    lastMessage: isGroup
      ? `${authUser.name} created the group`
      : 'Start the conversation',
    lastMessageTime: new Date(),
  });

  const memberDocs = [
    {
      conversationId: conversation._id,
      userId: authUser._id,
      role: isGroup ? 'owner' : 'member',
      isMuted: false,
      isPinned: false,
      unreadCount: 0,
      joinedAt: new Date(),
    },
    ...memberUsers.map((user) => ({
      conversationId: conversation._id,
      userId: user._id,
      role: 'member',
      isMuted: false,
      isPinned: false,
      unreadCount: 1,
      joinedAt: new Date(),
    })),
  ];

  await ConversationMember.insertMany(memberDocs);

  const systemMessage = isGroup
    ? `${authUser.name} created the group ${groupName}`
    : `${authUser.name} started a conversation`;

  await Message.create({
    conversationId: conversation._id,
    senderId: authUser._id,
    text: systemMessage,
    type: 'text',
    status: 'delivered',
  });

  const summaries = await buildConversationSummaries(authUser._id);
  const createdConversation = summaries.find(
    (item) => item.id === conversation._id.toString()
  );

  const pusherServer = getPusherServer();
  if (pusherServer) {
    try {
      const recipients = [...memberUsers, authUser];
      await Promise.all(
        recipients.map(async (user) => {
          const summary = await buildConversationSummaryForUser(user._id, conversation._id);
          if (!summary) {
            return;
          }

          await pusherServer.trigger(`private-user-${user._id.toString()}`, 'conversation-added', {
            conversation: summary,
          });
        })
      );
    } catch {
      // Keep API success even if realtime fanout fails.
    }
  }

  return NextResponse.json({ conversation: createdConversation, existed: false }, { status: 201 });
}
