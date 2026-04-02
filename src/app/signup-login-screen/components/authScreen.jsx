'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from './loginForm';
import SignupForm from './signupForm';
import AppLogo from '@/components/ui/AppLogo';
import AppImage from '@/components/ui/AppImage';
import { Shield, Zap, Users } from 'lucide-react';

export default function AuthScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (mounted && response.ok) {
          router.replace('/chatDashboard');
        }
      } catch {
        // No-op: unauthenticated users stay on this screen.
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-500 via-sky-600 to-emerald-600 relative overflow-hidden flex-col justify-between p-12">
        {/* Background circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <AppLogo size={40} />
          <span className="font-display text-2xl font-700 text-white">ChatApp</span>
        </div>

        {/* Center content */}
        <div className="relative flex flex-col gap-8">
          <div>
            <h2 className="text-4xl font-800 text-white leading-tight mb-4">
              Connect with everyone<br />you care about
            </h2>
            <p className="text-sky-100 text-lg leading-relaxed">
              Fast, private, and beautifully simple. Join 12 million people who trust ChatApp for their most important conversations.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3">
            {[
              { icon: Shield, label: 'End-to-end encrypted by default' },
              { icon: Zap, label: 'Messages delivered in under 100ms' },
              { icon: Users, label: 'Groups up to 500 members' },
            ]?.map((f) => (
              <div key={`auth-feat-${f?.label}`} className="flex items-center gap-3 bg-white/15 rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <f.icon size={16} className="text-white" />
                </div>
                <span className="text-white text-sm font-500">{f?.label}</span>
              </div>
            ))}
          </div>

          {/* Avatars */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 5, 9, 12, 20]?.map((n) => (
                <div key={`auth-av-${n}`} className="w-8 h-8 rounded-full border-2 border-white/40 overflow-hidden">
                  <AppImage
                    src={`https://i.pravatar.cc/32?img=${n}`}
                    alt="User avatar"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <p className="text-sky-100 text-sm">
              <span className="font-700 text-white">12M+</span> users trust ChatApp
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="relative text-sky-200 text-xs">
          Your data is yours. We never sell it, never read it, never share it.
        </p>
      </div>
      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <AppLogo size={32} />
            <span className="font-display text-xl font-700 text-gray-900">ChatApp</span>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 text-sm font-600 py-2.5 rounded-lg transition-all duration-200 ${
                activeTab === 'login' ?'bg-white text-gray-900 shadow-sm' :'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 text-sm font-600 py-2.5 rounded-lg transition-all duration-200 ${
                activeTab === 'signup' ?'bg-white text-gray-900 shadow-sm' :'text-gray-500 hover:text-gray-700'
              }`}
            >
              Create account
            </button>
          </div>

          {/* Form */}
          {activeTab === 'login' ? (
            <LoginForm onSwitchToSignup={() => setActiveTab('signup')} />
          ) : (
            <SignupForm onSwitchToLogin={() => setActiveTab('login')} />
          )}
        </div>
      </div>
    </div>
  );
}