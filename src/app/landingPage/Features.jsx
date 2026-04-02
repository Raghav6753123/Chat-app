import {
  Lock, Zap, Users, Paperclip, Smartphone, Bell,
  MessageCircle, Video, Globe, Star
} from 'lucide-react';

const features = [
  {
    id: 'feat-encryption',
    icon: Lock,
    color: 'bg-sky-50 text-sky-600',
    title: 'End-to-End Encryption',
    description: 'Every message, call, and file is encrypted in transit and at rest. Only you and your recipient can read your conversations.',
  },
  {
    id: 'feat-speed',
    icon: Zap,
    color: 'bg-amber-50 text-amber-600',
    title: 'Sub-100ms Delivery',
    description: 'Our global edge network routes messages in under 100 milliseconds — messages feel instantaneous no matter where you are.',
  },
  {
    id: 'feat-groups',
    icon: Users,
    color: 'bg-violet-50 text-violet-600',
    title: 'Groups up to 500',
    description: 'Create groups for family, friends, or your entire company. Polls, pinned messages, admin controls, and invite links included.',
  },
  {
    id: 'feat-files',
    icon: Paperclip,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'File Sharing up to 2GB',
    description: 'Share videos, documents, photos, and archives. Files are stored for 30 days and can be re-downloaded by any group member.',
  },
  {
    id: 'feat-multidevice',
    icon: Smartphone,
    color: 'bg-rose-50 text-rose-600',
    title: 'Multi-Device Sync',
    description: 'Stay in sync across up to 5 devices simultaneously. Your messages, contacts, and settings follow you everywhere.',
  },
  {
    id: 'feat-notifications',
    icon: Bell,
    color: 'bg-orange-50 text-orange-600',
    title: 'Smart Notifications',
    description: 'Mention alerts, custom sounds per contact, scheduled DND, and priority contact bypass — notifications that respect your focus.',
  },
  {
    id: 'feat-voice',
    icon: MessageCircle,
    color: 'bg-teal-50 text-teal-600',
    title: 'Voice Messages',
    description: 'Record and send voice notes up to 5 minutes. Waveform playback, speed controls, and transcription for accessibility.',
  },
  {
    id: 'feat-video',
    icon: Video,
    color: 'bg-indigo-50 text-indigo-600',
    title: 'HD Video Calls',
    description: 'Crystal-clear video and audio calls for up to 32 participants. Screen sharing, virtual backgrounds, and recording.',
  },
  {
    id: 'feat-global',
    icon: Globe,
    color: 'bg-cyan-50 text-cyan-600',
    title: '52 Languages Supported',
    description: 'Full UI localization, right-to-left support, and auto-translation for incoming messages in 52 languages.',
  },
];

const stats = [
  { id: 'stat-users', value: '12M+', label: 'Active users' },
  { id: 'stat-messages', value: '4.2B', label: 'Messages daily' },
  { id: 'stat-uptime', value: '99.98%', label: 'Uptime SLA' },
  { id: 'stat-countries', value: '190+', label: 'Countries' },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 text-sky-700 text-xs font-600 px-4 py-1.5 rounded-full mb-4">
            <Star size={12} />
            Everything you need to stay connected
          </div>
          <h2 className="text-4xl font-800 text-gray-900 tracking-tight mb-4">
            Built for real conversations,<br />not just notifications
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            ChatApp packs every feature modern communication demands — without the bloat or the surveillance.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats?.map((stat) => (
            <div key={stat?.id} className="text-center">
              <p className="text-3xl font-800 text-gray-900 tabular-nums">{stat?.value}</p>
              <p className="text-sm text-gray-500 font-500 mt-1">{stat?.label}</p>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features?.map((feature) => (
            <div
              key={feature?.id}
              className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-50 transition-all duration-200"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feature?.color}`}>
                <feature.icon size={22} />
              </div>
              <h3 className="text-base font-700 text-gray-900 mb-2">{feature?.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature?.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}import {
  Lock, Zap, Users, Paperclip, Smartphone, Bell,
  MessageCircle, Video, Globe, Star
} from 'lucide-react';

const features = [
  {
    id: 'feat-encryption',
    icon: Lock,
    color: 'bg-sky-50 text-sky-600',
    title: 'End-to-End Encryption',
    description: 'Every message, call, and file is encrypted in transit and at rest. Only you and your recipient can read your conversations.',
  },
  {
    id: 'feat-speed',
    icon: Zap,
    color: 'bg-amber-50 text-amber-600',
    title: 'Sub-100ms Delivery',
    description: 'Our global edge network routes messages in under 100 milliseconds — messages feel instantaneous no matter where you are.',
  },
  {
    id: 'feat-groups',
    icon: Users,
    color: 'bg-violet-50 text-violet-600',
    title: 'Groups up to 500',
    description: 'Create groups for family, friends, or your entire company. Polls, pinned messages, admin controls, and invite links included.',
  },
  {
    id: 'feat-files',
    icon: Paperclip,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'File Sharing up to 2GB',
    description: 'Share videos, documents, photos, and archives. Files are stored for 30 days and can be re-downloaded by any group member.',
  },
  {
    id: 'feat-multidevice',
    icon: Smartphone,
    color: 'bg-rose-50 text-rose-600',
    title: 'Multi-Device Sync',
    description: 'Stay in sync across up to 5 devices simultaneously. Your messages, contacts, and settings follow you everywhere.',
  },
  {
    id: 'feat-notifications',
    icon: Bell,
    color: 'bg-orange-50 text-orange-600',
    title: 'Smart Notifications',
    description: 'Mention alerts, custom sounds per contact, scheduled DND, and priority contact bypass — notifications that respect your focus.',
  },
  {
    id: 'feat-voice',
    icon: MessageCircle,
    color: 'bg-teal-50 text-teal-600',
    title: 'Voice Messages',
    description: 'Record and send voice notes up to 5 minutes. Waveform playback, speed controls, and transcription for accessibility.',
  },
  {
    id: 'feat-video',
    icon: Video,
    color: 'bg-indigo-50 text-indigo-600',
    title: 'HD Video Calls',
    description: 'Crystal-clear video and audio calls for up to 32 participants. Screen sharing, virtual backgrounds, and recording.',
  },
  {
    id: 'feat-global',
    icon: Globe,
    color: 'bg-cyan-50 text-cyan-600',
    title: '52 Languages Supported',
    description: 'Full UI localization, right-to-left support, and auto-translation for incoming messages in 52 languages.',
  },
];

const stats = [
  { id: 'stat-users', value: '12M+', label: 'Active users' },
  { id: 'stat-messages', value: '4.2B', label: 'Messages daily' },
  { id: 'stat-uptime', value: '99.98%', label: 'Uptime SLA' },
  { id: 'stat-countries', value: '190+', label: 'Countries' },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 text-sky-700 text-xs font-600 px-4 py-1.5 rounded-full mb-4">
            <Star size={12} />
            Everything you need to stay connected
          </div>
          <h2 className="text-4xl font-800 text-gray-900 tracking-tight mb-4">
            Built for real conversations,<br />not just notifications
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            ChatApp packs every feature modern communication demands — without the bloat or the surveillance.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats?.map((stat) => (
            <div key={stat?.id} className="text-center">
              <p className="text-3xl font-800 text-gray-900 tabular-nums">{stat?.value}</p>
              <p className="text-sm text-gray-500 font-500 mt-1">{stat?.label}</p>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features?.map((feature) => (
            <div
              key={feature?.id}
              className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-50 transition-all duration-200"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feature?.color}`}>
                <feature.icon size={22} />
              </div>
              <h3 className="text-base font-700 text-gray-900 mb-2">{feature?.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature?.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}