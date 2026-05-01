import AppImage from '@/components/ui/AppImage';

const testimonials = [
  {
    id: 'test-1',
    name: 'Kavya Nair',
    role: 'Product Designer',
    avatar: 'https://i.pravatar.cc/64?img=47',
    avatarAlt: 'User avatar',
    rating: 5,
    quote: 'The file sharing is seamless and the group feature has replaced other tools we were using. Clean and fast.',
  },
  {
    id: 'test-2',
    name: 'Marcus Obi',
    role: 'Engineering Lead',
    avatar: 'https://i.pravatar.cc/64?img=68',
    avatarAlt: 'User avatar',
    rating: 5,
    quote: 'Real-time delivery is genuinely impressive. Messages feel instantaneous even across different locations.',
  },
  {
    id: 'test-3',
    name: 'Sophie Lindqvist',
    role: 'Remote Team Lead',
    avatar: 'https://i.pravatar.cc/64?img=25',
    avatarAlt: 'User avatar',
    rating: 5,
    quote: 'The typing indicators and pinned conversations keep our distributed team organized. Simple and effective.',
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-slate-50">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            What people are saying
          </h2>
          <p className="text-gray-500 text-lg">
            Feedback from real users of ChatApp.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col gap-4"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={`${t.id}-star-${i}`} className="text-amber-400 text-sm">&#9733;</span>
                ))}
              </div>

              <p className="text-gray-700 text-sm leading-relaxed flex-1">{`"${t.quote}"`}</p>

              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <AppImage
                    src={t.avatar}
                    alt={t.avatarAlt}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}