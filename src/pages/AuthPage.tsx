import { Link, useNavigate } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';

export interface AuthPageProps {
  mode: 'login' | 'signup' | 'forgot' | 'reset';
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function AuthPage({ mode }: AuthPageProps) {
  const {
    signIn,
    signUp,
    signInWithGoogle,
    resetPasswordForEmail,
    updatePassword,
    signInAsDemo,
  } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Form Validations
    if (isSignup && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!isReset && !email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if ((isLogin || isSignup || isReset) && !password) {
      setError('Please enter a password.');
      return;
    }

    if ((isSignup || isReset) && password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if ((isSignup || isReset) && password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setSubmitting(true);

    try {
      if (isLogin) {
        const result = await signIn(email.trim(), password);
        if (result.error) {
          setError(result.error);
        } else {
          notify('Welcome back to Promptly!', 'success');
          navigate('/app');
        }
      } else if (isSignup) {
        const result = await signUp(email.trim(), password, fullName.trim());
        if (result.error) {
          setError(result.error);
        } else {
          notify('Account created! Welcome to Promptly.', 'success');
          navigate('/app');
        }
      } else if (isForgot) {
        const result = await resetPasswordForEmail(email.trim());
        if (result.error) {
          setError(result.error);
        } else {
          setSuccessMessage(
            `Password reset link sent to ${email.trim()}. Please check your inbox or spam folder.`
          );
          notify('Recovery link sent to your email.', 'info');
        }
      } else if (isReset) {
        const result = await updatePassword(password);
        if (result.error) {
          setError(result.error);
        } else {
          notify('Your password has been successfully updated.', 'success');
          navigate('/auth/login');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleSubmitting(true);
    const result = await signInWithGoogle();
    setGoogleSubmitting(false);
    if (result.error) {
      setError(result.error);
    }
  };

  const handleDemoAccess = () => {
    signInAsDemo();
    notify('Signed in as Demo User. You have full access!', 'success');
    navigate('/app');
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-ink-950 text-ink-900 dark:text-ink-100 grid lg:grid-cols-2 transition-colors duration-200">
      {/* ============================================================= */}
      {/* LEFT COLUMN: AUTH FORM BLOCK                                  */}
      {/* ============================================================= */}
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 md:px-16 lg:px-20 xl:px-24">
        {/* Top Header: Logo & Theme Toggle / Home */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Home</span>
            </Link>
          </div>
        </div>

        {/* Center: Auth Form Container */}
        <div className="mx-auto w-full max-w-sm py-8 sm:py-12">
          {/* Headings */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink-950 dark:text-white">
              {isLogin && 'Welcome Back'}
              {isSignup && 'Create Account'}
              {isForgot && 'Reset Password'}
              {isReset && 'Set New Password'}
            </h1>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              {isLogin && 'Sign in to continue to your prompt dashboard'}
              {isSignup && 'Start creating AI prompts ChatGPT and Claude can actually understand'}
              {isForgot && "Enter your email to receive a password recovery link"}
              {isReset && 'Choose a secure password for your Promptly account'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Sign Up only) */}
            {isSignup && (
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1.5 block text-xs font-semibold text-ink-700 dark:text-ink-300"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500"
                  />
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="input pl-10 pr-3.5 py-2.5 text-sm"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email (Login, Signup, Forgot) */}
            {!isReset && (
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold text-ink-700 dark:text-ink-300"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="input pl-10 pr-3.5 py-2.5 text-sm"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password (Login, Signup, Reset) */}
            {!isForgot && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-ink-700 dark:text-ink-300"
                  >
                    {isReset ? 'New Password' : 'Password'}
                  </label>
                  {isLogin && (
                    <Link
                      to="/auth/forgot-password"
                      className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignup || isReset ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10 pr-10 py-2.5 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 dark:text-ink-500 dark:hover:text-ink-300 transition-colors p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (Signup, Reset) */}
            {(isSignup || isReset) && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-xs font-semibold text-ink-700 dark:text-ink-300"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500"
                  />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10 pr-10 py-2.5 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 dark:text-ink-500 dark:hover:text-ink-300 transition-colors p-0.5"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message Alert */}
            {error && (
              <div
                className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 animate-fade-in flex items-start gap-2"
                role="alert"
              >
                <span className="font-semibold shrink-0">!</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300 animate-fade-in flex items-start gap-2"
                role="status"
              >
                <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2.5 font-semibold text-sm shadow-soft rounded-lg transition-all"
            >
              {submitting ? (
                'Processing...'
              ) : (
                <>
                  {isLogin && 'Sign In'}
                  {isSignup && 'Create Account'}
                  {isForgot && 'Send Reset Link'}
                  {isReset && 'Update Password'}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher Link */}
          <div className="mt-5 text-center text-xs text-ink-500 dark:text-ink-400">
            {isLogin && (
              <p>
                Don't have an account?{' '}
                <Link
                  to="/auth/signup"
                  className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                >
                  Sign Up
                </Link>
              </p>
            )}
            {isSignup && (
              <p>
                Already have an account?{' '}
                <Link
                  to="/auth/login"
                  className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                >
                  Sign In
                </Link>
              </p>
            )}
            {(isForgot || isReset) && (
              <p>
                Remember your password?{' '}
                <Link
                  to="/auth/login"
                  className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                >
                  Back to Sign In
                </Link>
              </p>
            )}
          </div>

          {/* Social OAuth Divider & Google Button (Login & Signup only) */}
          {(isLogin || isSignup) && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-ink-200/80 dark:border-ink-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-ink-400 font-medium dark:bg-ink-950 dark:text-ink-500">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleSubmitting}
                className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-xs font-semibold text-ink-800 shadow-soft transition-all hover:bg-ink-50 hover:border-ink-300 active:scale-[0.99] disabled:opacity-50 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-100 dark:hover:bg-ink-800"
              >
                <GoogleIcon />
                <span>
                  {googleSubmitting ? 'Connecting...' : 'Continue with Google'}
                </span>
              </button>
            </>
          )}

          {/* Quick Demo Access Option */}
          <div className="mt-5 rounded-xl border border-brand-200/80 bg-brand-50/60 p-3.5 text-center dark:border-brand-900/60 dark:bg-brand-950/40">
            <p className="text-xs font-semibold text-brand-900 dark:text-brand-300">
              Just want to test Promptly?
            </p>
            <p className="mt-0.5 text-[11px] text-brand-700 dark:text-brand-400">
              No password or account creation required.
            </p>
            <button
              type="button"
              onClick={handleDemoAccess}
              className="mt-2.5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:bg-brand-700 active:scale-[0.98]"
            >
              <Sparkles size={14} />
              <span>Continue with Demo Account</span>
            </button>
          </div>
        </div>

        {/* Bottom Security / Trust Footer */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-ink-400 dark:text-ink-500 text-center">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
            Secure Authentication
          </span>
          <span>•</span>
          <span>Powered by Supabase</span>
        </div>
      </div>

      {/* ============================================================= */}
      {/* RIGHT COLUMN: GRAPHIC & BRAND SHOWCASE BLOCK                  */}
      {/* (Inspired by the modern blue organic shapes reference image)  */}
      {/* ============================================================= */}
      <div className="relative hidden lg:flex items-center justify-center overflow-hidden bg-[#1062fe] p-12 xl:p-16 text-white select-none">
        {/* Modern organic fluid blob shapes matching the reference screenshot */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          {/* Top-left organic blob */}
          <div className="absolute -left-12 top-10 h-64 w-64 rounded-[50%_60%_70%_40%/40%_60%_50%_60%] bg-[#4b8fff]/35 blur-xl animate-pulse-soft" />

          {/* Top-right floating pebble blobs */}
          <div className="absolute right-12 top-16 h-36 w-36 rounded-[60%_40%_50%_70%/60%_50%_60%_40%] bg-[#7cb3ff]/30 blur-md" />
          <div className="absolute right-36 top-32 h-20 w-20 rounded-full bg-[#9dc6ff]/25" />

          {/* Giant organic center fluid shape */}
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-[45%_55%_65%_35%/50%_45%_55%_50%] bg-[#327dfc]/40 blur-2xl" />

          {/* Right edge organic shapes */}
          <div className="absolute -right-8 top-1/2 h-56 w-40 rounded-[40%_60%_70%_30%/50%_60%_40%_50%] bg-[#6ba8ff]/30 blur-lg" />

          {/* Bottom-right scattered blobs */}
          <div className="absolute right-20 bottom-16 h-44 w-60 rounded-[60%_40%_45%_55%/40%_60%_50%_50%] bg-[#5c9eff]/35 blur-lg" />
          <div className="absolute left-12 bottom-12 h-32 w-48 rounded-[50%_50%_60%_40%/40%_50%_60%_50%] bg-[#3c84fc]/30 blur-lg" />
        </div>

        {/* Center: Clean Brand Headline & Subtitle */}
        <div className="relative z-10 text-center max-w-lg mx-auto px-4">
          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Don't learn prompt engineering.
            <span className="block text-blue-100 opacity-95 mt-2 font-semibold text-2xl xl:text-3xl">
              Just tell AI what you want.
            </span>
          </h2>

          <p className="mt-5 text-sm xl:text-base leading-relaxed text-blue-100/90 max-w-md mx-auto">
            Promptly finds what's missing from your request, asks targeted clarification questions, and writes prompts ChatGPT, Claude, and Gemini understand accurately.
          </p>
        </div>
      </div>
    </div>
  );
}
