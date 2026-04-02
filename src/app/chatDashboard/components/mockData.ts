export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'file' | 'voice';
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  duration?: string;
  replyTo?: string;
}

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  avatarAlt: string;
  isGroup: boolean;
  isOnline: boolean;
  lastSeen?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  members?: number;
  messages: Message[];
}

const ME = 'user-me';

export const conversations: Conversation[] = [
  {
    id: 'conv-001',
    name: 'Priya Sharma',
    avatar: 'https://i.pravatar.cc/48?img=47',
    avatarAlt: 'Woman with dark hair smiling in outdoor setting',
    isGroup: false,
    isOnline: true,
    lastMessage: 'Let\'s grab coffee at 6? ☕',
    lastMessageTime: '2:18 PM',
    unreadCount: 2,
    isMuted: false,
    isPinned: true,
    messages: [
      { id: 'msg-001-1', senderId: 'priya', text: 'Hey! Are you free this evening? 😊', timestamp: '2:14 PM', status: 'read', type: 'text' },
      { id: 'msg-001-2', senderId: ME, text: 'Yes! Was thinking the same thing 🎉', timestamp: '2:16 PM', status: 'read', type: 'text' },
      { id: 'msg-001-3', senderId: 'priya', text: 'Let\'s grab coffee at 6? ☕', timestamp: '2:18 PM', status: 'delivered', type: 'text' },
      { id: 'msg-001-4', senderId: ME, text: 'Sounds perfect! Blue Tokai near Indiranagar?', timestamp: '2:19 PM', status: 'read', type: 'text' },
      { id: 'msg-001-5', senderId: 'priya', text: 'Yes yes yes! See you there 🙌', timestamp: '2:21 PM', status: 'read', type: 'text' },
      { id: 'msg-001-6', senderId: ME, text: 'Can\'t wait! Also I have some news to share 👀', timestamp: '2:22 PM', status: 'delivered', type: 'text' },
      { id: 'msg-001-7', senderId: 'priya', text: 'Ooh what kind of news?? Tell me now!!', timestamp: '2:23 PM', status: 'read', type: 'text' },
    ],
  },
  {
    id: 'conv-002',
    name: 'Team Standup',
    avatar: 'https://i.pravatar.cc/48?img=33',
    avatarAlt: 'Group chat icon with team members',
    isGroup: true,
    isOnline: false,
    members: 8,
    lastMessage: 'Arjun: PR is up for review 🚀',
    lastMessageTime: '1:45 PM',
    unreadCount: 5,
    isMuted: false,
    isPinned: true,
    messages: [
      { id: 'msg-002-1', senderId: 'arjun', text: 'Morning everyone! Yesterday I finished the auth module refactor.', timestamp: '10:02 AM', status: 'read', type: 'text' },
      { id: 'msg-002-2', senderId: 'neha', text: 'Nice work Arjun! I\'m working on the dashboard charts today.', timestamp: '10:04 AM', status: 'read', type: 'text' },
      { id: 'msg-002-3', senderId: ME, text: 'I\'ll be reviewing the API schema changes this morning.', timestamp: '10:06 AM', status: 'read', type: 'text' },
      { id: 'msg-002-4', senderId: 'arjun', text: 'PR is up for review 🚀', timestamp: '1:45 PM', status: 'read', type: 'text' },
      { id: 'msg-002-5', senderId: 'neha', text: 'On it! Will review by EOD', timestamp: '1:46 PM', status: 'read', type: 'text' },
    ],
  },
  {
    id: 'conv-003',
    name: 'Arjun Mehta',
    avatar: 'https://i.pravatar.cc/48?img=59',
    avatarAlt: 'Young man with casual style in urban setting',
    isGroup: false,
    isOnline: true,
    lastMessage: 'Sent you the design files 📎',
    lastMessageTime: '12:30 PM',
    unreadCount: 0,
    isMuted: false,
    isPinned: false,
    messages: [
      { id: 'msg-003-1', senderId: 'arjun', text: 'Hey, can you check the Figma link I shared?', timestamp: '11:50 AM', status: 'read', type: 'text' },
      { id: 'msg-003-2', senderId: ME, text: 'Sure, send it over!', timestamp: '11:52 AM', status: 'read', type: 'text' },
      { id: 'msg-003-3', senderId: 'arjun', text: 'Sent you the design files 📎', timestamp: '12:30 PM', status: 'read', fileUrl: '#', fileName: 'Dashboard_v3.fig', fileSize: '4.2 MB', type: 'file' },
    ],
  },
  {
    id: 'conv-004',
    name: 'Neha Kapoor',
    avatar: 'https://i.pravatar.cc/48?img=25',
    avatarAlt: 'Woman in professional attire with friendly expression',
    isGroup: false,
    isOnline: false,
    lastSeen: 'Last seen 45 min ago',
    lastMessage: 'The presentation went really well!',
    lastMessageTime: '11:20 AM',
    unreadCount: 0,
    isMuted: true,
    isPinned: false,
    messages: [
      { id: 'msg-004-1', senderId: ME, text: 'How did the client presentation go?', timestamp: '11:00 AM', status: 'read', type: 'text' },
      { id: 'msg-004-2', senderId: 'neha', text: 'The presentation went really well!', timestamp: '11:20 AM', status: 'read', type: 'text' },
      { id: 'msg-004-3', senderId: 'neha', text: 'They loved the new onboarding flow 🎊', timestamp: '11:21 AM', status: 'read', type: 'text' },
    ],
  },
  {
    id: 'conv-005',
    name: 'Design Critique',
    avatar: 'https://i.pravatar.cc/48?img=15',
    avatarAlt: 'Design team group avatar',
    isGroup: true,
    isOnline: false,
    members: 12,
    lastMessage: 'Kavya: What do you think about this color?',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    isMuted: false,
    isPinned: false,
    messages: [
      { id: 'msg-005-1', senderId: 'kavya', text: 'What do you think about this color palette for the new landing?', timestamp: 'Yesterday 4:30 PM', status: 'read', type: 'text' },
      { id: 'msg-005-2', senderId: ME, text: 'I like the teal direction but the accent feels too saturated', timestamp: 'Yesterday 4:45 PM', status: 'read', type: 'text' },
    ],
  },
  {
    id: 'conv-006',
    name: 'Marcus Obi',
    avatar: 'https://i.pravatar.cc/48?img=68',
    avatarAlt: 'Professional man with confident expression',
    isGroup: false,
    isOnline: false,
    lastSeen: 'Last seen 2 hours ago',
    lastMessage: 'The API latency numbers look great 📊',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    isMuted: false,
    isPinned: false,
    messages: [
      { id: 'msg-006-1', senderId: 'marcus', text: 'Ran the load tests this morning', timestamp: 'Yesterday 2:10 PM', status: 'read', type: 'text' },
      { id: 'msg-006-2', senderId: 'marcus', text: 'The API latency numbers look great 📊', timestamp: 'Yesterday 2:11 PM', status: 'read', type: 'text' },
    ],
  },
  {
    id: 'conv-007',
    name: 'Riya Desai',
    avatar: 'https://i.pravatar.cc/48?img=38',
    avatarAlt: 'Young woman with warm smile in casual setting',
    isGroup: false,
    isOnline: true,
    lastMessage: 'Are you coming to the event on Friday?',
    lastMessageTime: 'Yesterday',
    unreadCount: 1,
    isMuted: false,
    isPinned: false,
    messages: [
      { id: 'msg-007-1', senderId: 'riya', text: 'Hey! Are you coming to the event on Friday?', timestamp: 'Yesterday 6:00 PM', status: 'delivered', type: 'text' },
    ],
  },
  {
    id: 'conv-008',
    name: 'Product Roadmap',
    avatar: 'https://i.pravatar.cc/48?img=12',
    avatarAlt: 'Product team group avatar',
    isGroup: true,
    isOnline: false,
    members: 6,
    lastMessage: 'You: Pinned the Q2 roadmap doc',
    lastMessageTime: 'Mon',
    unreadCount: 0,
    isMuted: true,
    isPinned: false,
    messages: [
      { id: 'msg-008-1', senderId: ME, text: 'Pinned the Q2 roadmap doc — everyone please review before Thursday', timestamp: 'Mon 10:00 AM', status: 'read', type: 'text' },
    ],
  },
  {
    id: 'conv-009',
    name: 'Yuki Tanaka',
    avatar: 'https://i.pravatar.cc/48?img=19',
    avatarAlt: 'Developer in casual tech environment',
    isGroup: false,
    isOnline: false,
    lastSeen: 'Last seen Sunday',
    lastMessage: 'Thanks for the code review feedback!',
    lastMessageTime: 'Sun',
    unreadCount: 0,
    isMuted: false,
    isPinned: false,
    messages: [
      { id: 'msg-009-1', senderId: 'yuki', text: 'Thanks for the code review feedback!', timestamp: 'Sun 3:20 PM', status: 'read', type: 'text' },
      { id: 'msg-009-2', senderId: ME, text: 'Happy to help! The PR looks great now.', timestamp: 'Sun 3:45 PM', status: 'read', type: 'text' },
    ],
  },
  {
    id: 'conv-010',
    name: 'Sophie Lindqvist',
    avatar: 'https://i.pravatar.cc/48?img=20',
    avatarAlt: 'Professional woman with blonde hair in office',
    isGroup: false,
    isOnline: false,
    lastSeen: 'Last seen Saturday',
    lastMessage: 'Looking forward to the all-hands! 🙌',
    lastMessageTime: 'Sat',
    unreadCount: 0,
    isMuted: false,
    isPinned: false,
    messages: [
      { id: 'msg-010-1', senderId: 'sophie', text: 'Looking forward to the all-hands! 🙌', timestamp: 'Sat 5:00 PM', status: 'read', type: 'text' },
    ],
  },
];