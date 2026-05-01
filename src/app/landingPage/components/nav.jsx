'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Testimonials', href: '#testimonials' },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
      }`}
    >
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AppLogo size={36} />
          <span className="font-display text-xl font-bold tracking-tight text-gray-900">ChatApp</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((item) => (
            <a
              key={`nav-${item.label}`}
              href={item.href}
              className="text-sm font-medium text-gray-600 hover:text-sky-600 transition-colors duration-150"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/signup-login-screen"
            className="text-sm font-semibold text-gray-700 hover:text-sky-600 transition-colors duration-150 px-4 py-2 rounded-lg hover:bg-sky-50"
          >
            Sign in
          </Link>
          <Link
            href="/signup-login-screen"
            className="text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 active:scale-95 transition-all duration-150 px-5 py-2.5 rounded-xl shadow-sm shadow-sky-200"
          >
            Get started free
          </Link>
        </div>

        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4 animate-fade-in">
          {NAV_LINKS.map((item) => (
            <a
              key={`mobile-nav-${item.label}`}
              href={item.href}
              className="text-sm font-medium text-gray-700 py-2"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <Link
            href="/signup-login-screen"
            className="text-sm font-semibold text-center text-white bg-sky-500 py-3 rounded-xl"
            onClick={() => setMobileOpen(false)}
          >
            Get started free
          </Link>
        </div>
      )}
    </header>
  );
}