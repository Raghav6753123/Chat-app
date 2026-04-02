import Link from 'next/link';
import { ArrowRight, Shield, Zap, Users } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';

export default function HeroSection() {
  return (
    <section className="relative pt-24 pb-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-hero pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="relative max-w-screen-xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Copy */}
          <div className="flex flex-col gap-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 text-sky-700 text-xs font-600 px-4 py-1.5 rounded-full w-fit">
              <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse-dot" />
              Now with end-to-end encryption by default
            </div>

            <h1 className="text-5xl lg:text-6xl font-800 text-gray-900 leading-tight tracking-tight">
              Messages that{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500">
                feel instant.
              </span>
              <br />
              Privacy that feels{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-sky-500">
                natural.
              </span>
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
              ChatApp connects you to the people that matter — with blazing-fast delivery, read receipts, group chats up to 500 people, and file sharing up to 2GB. No ads. No data selling. Ever.
            </p>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Shield, label: 'End-to-end encrypted' },
                { icon: Zap, label: 'Sub-100ms delivery' },
                { icon: Users, label: '12M+ active users' },
              ]?.map((pill) => (
                <div
                  key={`pill-${pill?.label}`}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-500 px-3 py-1.5 rounded-full shadow-sm"
                >
                  <pill.icon size={13} className="text-sky-500" />
                  {pill?.label}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/sign-up-login-screen"
                className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-600 text-sm px-7 py-3.5 rounded-xl shadow-lg shadow-sky-200 transition-all duration-150"
              >
                Start chatting free
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/chat-dashboard"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 active:scale-95 text-gray-700 font-600 text-sm px-7 py-3.5 rounded-xl border border-gray-200 shadow-sm transition-all duration-150"
              >
                View live demo
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2">
                {[
                  { src: 'https://i.pravatar.cc/40?img=1', alt: 'User avatar showing a smiling person' },
                  { src: 'https://i.pravatar.cc/40?img=5', alt: 'User avatar showing a professional person' },
                  { src: 'https://i.pravatar.cc/40?img=9', alt: 'User avatar showing a young person' },
                  { src: 'https://i.pravatar.cc/40?img=12', alt: 'User avatar showing a casual person' },
                ]?.map((avatar, i) => (
                  <div
                    key={`avatar-${i}`}
                    className="w-8 h-8 rounded-full border-2 border-white overflow-hidden ring-1 ring-gray-100"
                  >
                    <AppImage
                      src={avatar?.src}
                      alt={avatar?.alt}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5]?.map((star) => (
                    <span key={`star-${star}`} className="text-amber-400 text-xs">★</span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  <span className="font-600 text-gray-700">4.9/5</span> from 28,000+ reviews
                </p>
              </div>
            </div>
          </div>

          {/* Right — Chat UI Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              {/* Phone mockup */}
              <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200 border border-gray-100 overflow-hidden">
                {/* Chat header */}
                <div className="bg-sky-500 px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 overflow-hidden flex-shrink-0">
                    <AppImage
                      src="https://i.pravatar.cc/40?img=47"
                      alt="Contact avatar showing a person"
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-600">Priya Sharma</p>
                    <p className="text-sky-100 text-xs">Online</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="bg-slate-50 px-4 py-4 flex flex-col gap-3 min-h-[320px]">
                  {/* Date separator */}
                  <div className="flex items-center justify-center">
                    <span className="text-xs text-gray-400 bg-white px-3 py-0.5 rounded-full border border-gray-100">Today</span>
                  </div>

                  {/* Received */}
                  <div className="flex items-end gap-2 max-w-[80%]">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      <AppImage src="https://i.pravatar.cc/24?img=47" alt="Contact avatar" width={24} height={24} className="w-full h-full object-cover" />
                    </div>
                    <div className="message-bubble-received px-3 py-2 shadow-sm">
                      <p className="text-sm text-gray-800">Hey! Are you free this evening? 😊</p>
                      <p className="text-xs text-gray-400 mt-0.5 text-right">2:14 PM</p>
                    </div>
                  </div>

                  {/* Sent */}
                  <div className="flex items-end gap-2 max-w-[80%] self-end flex-row-reverse">
                    <div className="message-bubble-sent px-3 py-2 shadow-sm">
                      <p className="text-sm text-white">Yes! Was thinking the same thing 🎉</p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <p className="text-xs text-sky-100">2:16 PM</p>
                        <svg className="w-3.5 h-3.5 text-sky-100" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Received */}
                  <div className="flex items-end gap-2 max-w-[80%]">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      <AppImage src="https://i.pravatar.cc/24?img=47" alt="Contact avatar" width={24} height={24} className="w-full h-full object-cover" />
                    </div>
                    <div className="message-bubble-received px-3 py-2 shadow-sm">
                      <p className="text-sm text-gray-800">Let's grab coffee at 6? ☕</p>
                      <p className="text-xs text-gray-400 mt-0.5 text-right">2:18 PM</p>
                    </div>
                  </div>

                  {/* Typing indicator */}
                  <div className="flex items-end gap-2 max-w-[80%]">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      <AppImage src="https://i.pravatar.cc/24?img=47" alt="Contact avatar" width={24} height={24} className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2]?.map((dot) => (
                          <div
                            key={`typing-dot-${dot}`}
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${dot * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input bar */}
                <div className="bg-white border-t border-gray-100 px-3 py-3 flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 rounded-full px-4 py-2 flex items-center">
                    <span className="text-gray-400 text-sm">Type a message...</span>
                  </div>
                  <div className="w-9 h-9 bg-sky-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm shadow-sky-200">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Floating notification */}
              <div className="absolute -top-4 -right-4 glass-card rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 w-56">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                  <AppImage src="https://i.pravatar.cc/36?img=33" alt="Notification avatar" width={36} height={36} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-600 text-gray-800 truncate">Arjun Mehta</p>
                  <p className="text-xs text-gray-500 truncate">Sent you a photo 📸</p>
                </div>
                <div className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0 animate-pulse-dot" />
              </div>

              {/* Floating group badge */}
              <div className="absolute -bottom-4 -left-4 glass-card rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {[1, 2, 3]?.map((n) => (
                    <div key={`group-av-${n}`} className="w-6 h-6 rounded-full overflow-hidden border-2 border-white">
                      <AppImage src={`https://i.pravatar.cc/24?img=${n * 7}`} alt="Group member avatar" width={24} height={24} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-600 text-gray-800">Team Standup</p>
                  <p className="text-xs text-gray-400">8 members online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}