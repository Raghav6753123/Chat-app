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
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || 'Failed to create account');
        return;
      }

      toast.success(`Welcome to ChatApp, ${payload.user.name.split(' ')[0]}!`);
      router.push('/chatDashboard');
    } catch {
      toast.error('Unable to create account right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
        <p className="text-sm text-gray-500">Free forever. No credit card needed.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {/* Full name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700" htmlFor="signup-name">
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
            <p className="text-xs text-red-500 font-medium">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700" htmlFor="signup-email">
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
            <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700" htmlFor="signup-password">
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
              <span className="text-xs font-medium text-gray-500">{strength.label}</span>
            </div>
          )}
          {errors.password && (
            <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700" htmlFor="signup-confirm">
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
            <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold text-sm py-3.5 rounded-xl transition-all duration-150 active:scale-[0.98] shadow-sm shadow-sky-200 mt-1"
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
          className="text-sky-600 font-semibold hover:text-sky-700 transition-colors"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}