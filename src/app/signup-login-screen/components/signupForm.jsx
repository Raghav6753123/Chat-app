'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function SignupForm({ onSwitchToLogin }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const passwordRegister = register('password', {
    required: 'Password is required',
    minLength: { value: 8, message: 'Password must be at least 8 characters' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    // Backend integration point: POST /api/auth/register with { fullName, email, password }
    await new Promise((r) => setTimeout(r, 1400));
    toast.success(`Welcome to ChatApp, ${data.fullName.split(' ')[0]}!`);
    router.push('/chatDashboard');
    setIsLoading(false);
  };

  const passwordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const levels = [
      { label: 'Too short', color: 'bg-red-400' },
      { label: 'Weak', color: 'bg-red-400' },
      { label: 'Fair', color: 'bg-amber-400' },
      { label: 'Good', color: 'bg-sky-400' },
      { label: 'Strong', color: 'bg-emerald-500' },
    ];
    return { score, ...levels[score] };
  };

  const strength = passwordStrength(passwordValue || '');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-700 text-gray-900 mb-1">Create your account</h1>
        <p className="text-sm text-gray-500">Free forever. No credit card needed.</p>
      </div>

      {/* Social auth */}
      <button
        type="button"
        onClick={() => toast.info('Google sign-up coming soon')}
        className="flex items-center justify-center gap-3 w-full border border-gray-200 rounded-xl py-3 text-sm font-500 text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-150"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400 font-500">or create with email</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {/* Full name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-500 text-gray-700" htmlFor="signup-name">
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Alex Morgan"
            className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all duration-150 ${
              errors.fullName ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            {...register('fullName', {
              required: 'Full name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
            })}
          />
          {errors.fullName && (
            <p className="text-xs text-red-500 font-500">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-500 text-gray-700" htmlFor="signup-email">
            Email address
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all duration-150 ${
              errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            {...register('email', {
              required: 'Email address is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
            })}
          />
          {errors.email && (
            <p className="text-xs text-red-500 font-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-500 text-gray-700" htmlFor="signup-password">
            Password
          </label>
          <p className="text-xs text-gray-400">Use 8+ characters with a mix of letters, numbers, and symbols</p>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a strong password"
              className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all duration-150 ${
                errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              {...passwordRegister}
              onChange={(e) => {
                passwordRegister.onChange(e);
                setPasswordValue(e.target.value);
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Strength bar */}
          {passwordValue && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={`strength-bar-${level}`}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      strength.score >= level ? strength.color : 'bg-gray-100'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-500 text-gray-500">{strength.label}</span>
            </div>
          )}
          {errors.password && (
            <p className="text-xs text-red-500 font-500">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-500 text-gray-700" htmlFor="signup-confirm">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="signup-confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat your password"
              className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all duration-150 ${
                errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === passwordValue || 'Passwords do not match',
              })}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 font-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms */}
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-sky-500 focus:ring-sky-500 cursor-pointer flex-shrink-0"
            {...register('agreeTerms', {
              required: 'You must agree to the terms to create an account',
            })}
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            I agree to ChatApp&apos;s{' '}
            <a href="#" className="text-sky-600 hover:underline font-500">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-sky-600 hover:underline font-500">Privacy Policy</a>
          </span>
        </label>
        {errors.agreeTerms && (
          <p className="text-xs text-red-500 font-500">{errors.agreeTerms.message}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-600 text-sm py-3.5 rounded-xl transition-all duration-150 active:scale-[0.98] shadow-sm shadow-sky-200 mt-1"
          style={{ minHeight: '48px' }}
        >
          {isLoading ? (
            <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <>
              <UserPlus size={16} />
              Create free account
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <button
          onClick={onSwitchToLogin}
          className="text-sky-600 font-600 hover:text-sky-700 transition-colors"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}