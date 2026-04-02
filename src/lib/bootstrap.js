import bcrypt from 'bcryptjs';
import User from '@/models/User';
import Conversation from '@/models/Conversation';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';

const DEMO_BOT_EMAIL = 'assistant@chatapp.local';

export async function ensureStarterConversationForUser(user) {
  let bot = await User.findOne({ email: DEMO_BOT_EMAIL });

  if (!bot) {
    const passwordHash = await bcrypt.hash(`seed-${Date.now()}-${Math.random()}`, 10);
    bot = await User.create({
      email: DEMO_BOT_EMAIL,
      passwordHash,
      name: 'Chat Assistant',
      avatarUrl: 'https://i.pravatar.cc/48?img=12',
      isOnline: true,
      lastSeen: new Date(),
    });
  }

  const existingMembership = await ConversationMember.findOne({ userId: user._id }).lean();
  if (existingMembership) {
    return;
  }

  const conversation = await Conversation.create({
    isGroup: false,
    memberCount: 2,
    lastMessage: 'Welcome to ChatApp! Send a message to start chatting.',
    lastMessageTime: new Date(),
  });

  await ConversationMember.create([
    {
      conversationId: conversation._id,
      userId: user._id,
      isMuted: false,
      isPinned: true,
      unreadCount: 1,
      joinedAt: new Date(),
    },
    {
      conversationId: conversation._id,
      userId: bot._id,
      isMuted: false,
      isPinned: false,
      unreadCount: 0,
      joinedAt: new Date(),
    },
  ]);

  await Message.create({
    conversationId: conversation._id,
    senderId: bot._id,
    text: `Hi ${user.name.split(' ')[0]}! Your account is ready.`,
    type: 'text',
    status: 'delivered',
  });
}
