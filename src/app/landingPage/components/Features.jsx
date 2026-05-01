import {
  Zap, Users, Paperclip, Bell,
  MessageCircle, Pin, Image as ImageIcon, Settings, Star
} from 'lucide-react';

const features = [
  {
    id: 'feat-realtime',
    icon: Zap,
    color: 'bg-amber-50 text-amber-600',
    title: 'Real-time Messaging',
    description: 'Messages are delivered instantly using Pusher channels. See typing indicators and new messages without refreshing.',
  },
  {
    id: 'feat-groups',
    icon: Users,
    color: 'bg-violet-50 text-violet-600',
    title: 'Direct & Group Chats',
    description: 'Start direct conversations or create group chats with multiple members. Add, remove, and manage participants easily.',
  },
  {
    id: 'feat-files',
    icon: Paperclip,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'File & Image Sharing',
    description: 'Share images (JPG, PNG, WebP, GIF) and documents (PDF, DOC, XLS) up to 10MB per file directly in conversations.',
  },
  {
    id: 'feat-typing',
    icon: MessageCircle,
    color: 'bg-teal-50 text-teal-600',
    title: 'Typing Indicators',
    description: 'See when others are typing in real-time. Indicators appear in both direct and group conversations.',
  },
  {
    id: 'feat-pinmute',
    icon: Pin,
    color: 'bg-sky-50 text-sky-600',
    title: 'Pin & Mute',
    description: 'Pin important conversations to the top of your list. Mute noisy groups to stay focused without missing messages.',
  },
  {
    id: 'feat-media',
    icon: ImageIcon,
    color: 'bg-rose-50 text-rose-600',
    title: 'Shared Media Gallery',
    description: 'Browse all shared photos and files in one place. Open images in a full-screen viewer or download attachments.',
  },
  {
    id: 'feat-notifications',
    icon: Bell,
    color: 'bg-orange-50 text-orange-600',
    title: 'Unread Counts',
    description: 'Never miss a message. Unread counts appear on conversations and clear automatically when you open them.',
  },
  {
    id: 'feat-profile',
    icon: Settings,
    color: 'bg-indigo-50 text-indigo-600',
    title: 'Profile & Settings',
    description: 'Customize your display name, bio, and email. Toggle notifications, compact mode, and other preferences.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 text-sky-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            <Star size={12} />
            Everything you need to stay connected
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Built for real conversations,<br />not just notifications
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            ChatApp packs every feature modern messaging needs - clean, fast, and honest.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-50 transition-all duration-200"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                <feature.icon size={22} />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
