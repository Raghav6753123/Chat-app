import AppImage from '@/components/ui/AppImage';

const testimonials = [
  {
    id: 'test-1',
    name: 'Kavya Nair',
    role: 'Product Designer at Razorpay',
    avatar: 'https://i.pravatar.cc/64?img=47',
    avatarAlt: 'Professional woman with dark hair in office setting',
    rating: 5,
    quote: 'We switched our entire design team to ChatApp six months ago. The file sharing is seamless and the groups feature has replaced three other tools we were paying for.',
  },
  {
    id: 'test-2',
    name: 'Marcus Obi',
    role: 'Engineering Lead at Flutterwave',
    avatar: 'https://i.pravatar.cc/64?img=68',
    avatarAlt: 'Professional man in casual work attire',
    rating: 5,
    quote: 'Sub-100ms delivery is not marketing fluff — I tested it with a colleague in Lagos and one in San Francisco. The latency is genuinely impressive.',
  },
  {
    id: 'test-3',
    name: 'Sophie Lindqvist',
    role: 'Head of Remote at Klarna',
    avatar: 'https://i.pravatar.cc/64?img=25',
    avatarAlt: 'Smiling woman with blonde hair in professional setting',
    rating: 5,
    quote: 'The multi-device sync is perfect for our distributed team across 12 time zones. Notifications are smart enough to not wake me up at 3am.',
  },
  {
    id: 'test-4',
    name: 'Ravi Krishnamurthy',
    role: 'Founder at Growthschool',
    avatar: 'https://i.pravatar.cc/64?img=59',
    avatarAlt: 'Entrepreneur in casual setting with confident expression',
    rating: 5,
    quote: 'We run a community of 40,000 learners and ChatApp groups handle it without breaking a sweat. The admin controls are exactly what we needed.',
  },
  {
    id: 'test-5',
    name: 'Amina Toure',
    role: 'CTO at Paystack',
    avatar: 'https://i.pravatar.cc/64?img=38',
    avatarAlt: 'Tech leader with professional appearance',
    rating: 5,
    quote: 'End-to-end encryption was the deciding factor for us. We handle sensitive financial data and ChatApp is the only messaging platform our security team approved.',
  },
  {
    id: 'test-6',
    name: 'Yuki Tanaka',
    role: 'Senior Developer at LINE',
    avatar: 'https://i.pravatar.cc/64?img=15',
    avatarAlt: 'Developer in casual tech company environment',
    rating: 5,
    quote: 'I work at a messaging company and still use ChatApp personally. The voice messages with waveform playback are the best I have seen anywhere.',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-800 text-gray-900 tracking-tight mb-4">
            Trusted by millions worldwide
          </h2>
          <p className="text-gray-500 text-lg">
            From individual users to enterprise teams — here is what they say.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials?.map((t) => (
            <div
              key={t?.id}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col gap-4"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: t?.rating })?.map((_, i) => (
                  <span key={`${t?.id}-star-${i}`} className="text-amber-400 text-sm">★</span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 text-sm leading-relaxed flex-1">{`"${t?.quote}"`}</p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <AppImage
                    src={t?.avatar}
                    alt={t?.avatarAlt}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-600 text-gray-900">{t?.name}</p>
                  <p className="text-xs text-gray-500">{t?.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}