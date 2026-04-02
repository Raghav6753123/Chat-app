import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';

const footerLinks = {
  Product: [
    { id: 'fl-features', label: 'Features', href: '#features' },
    { id: 'fl-pricing', label: 'Pricing', href: '#pricing' },
    { id: 'fl-security', label: 'Security', href: '#security' },
    { id: 'fl-download', label: 'Download', href: '#download' },
    { id: 'fl-changelog', label: 'Changelog', href: '#' },
  ],
  Company: [
    { id: 'fl-about', label: 'About us', href: '#' },
    { id: 'fl-blog', label: 'Blog', href: '#' },
    { id: 'fl-careers', label: 'Careers', href: '#' },
    { id: 'fl-press', label: 'Press kit', href: '#' },
  ],
  Support: [
    { id: 'fl-help', label: 'Help center', href: '#' },
    { id: 'fl-status', label: 'System status', href: '#' },
    { id: 'fl-contact', label: 'Contact us', href: '#' },
    { id: 'fl-community', label: 'Community', href: '#' },
  ],
  Legal: [
    { id: 'fl-privacy', label: 'Privacy policy', href: '#' },
    { id: 'fl-terms', label: 'Terms of service', href: '#' },
    { id: 'fl-cookies', label: 'Cookie policy', href: '#' },
    { id: 'fl-gdpr', label: 'GDPR', href: '#' },
  ],
};

export default function LandingFooter() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-16">
        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <AppLogo size={32} />
              <span className="font-display text-lg font-700 text-white">ChatApp</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              Fast, private, and open. Real-time messaging for everyone.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-dot" />
              <span className="text-xs text-gray-500">All systems operational</span>
            </div>
          </div>

          {/* Link groups */}
          {Object.entries(footerLinks)?.map(([group, links]) => (
            <div key={`footer-group-${group}`} className="flex flex-col gap-3">
              <p className="text-xs font-600 text-gray-300 uppercase tracking-widest">{group}</p>
              {links?.map((link) => (
                <a
                  key={link?.id}
                  href={link?.href}
                  className="text-sm text-gray-500 hover:text-gray-200 transition-colors duration-150"
                >
                  {link?.label}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © 2026 ChatApp Inc. All rights reserved.
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