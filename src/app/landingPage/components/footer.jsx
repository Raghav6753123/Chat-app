import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';

const footerLinks = {
  Product: [
    { id: 'fl-features', label: 'Features', href: '#features' },
    { id: 'fl-testimonials', label: 'Testimonials', href: '#testimonials' },
  ],
  Resources: [
    { id: 'fl-github', label: 'GitHub', href: '#' },
    { id: 'fl-docs', label: 'Documentation', href: '#' },
  ],
};

export default function LandingFooter() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <AppLogo size={32} />
              <span className="font-display text-lg font-bold text-white">ChatApp</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500 max-w-xs">
              A real-time messaging app built with Next.js, MongoDB, and Pusher. Open source and self-hostable.
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={`footer-group-${group}`} className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest">{group}</p>
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  className="text-sm text-gray-500 hover:text-gray-200 transition-colors duration-150"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            Built as a portfolio project. Not affiliated with any commercial messaging service.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/signup-login-screen" className="text-xs text-gray-500 hover:text-sky-400 transition-colors">
              Sign in
            </Link>
            <Link href="/signup-login-screen" className="text-xs text-white bg-sky-500 hover:bg-sky-600 px-4 py-1.5 rounded-lg transition-colors">
              Get started free
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}