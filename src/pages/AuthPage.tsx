import { Link } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';

interface AuthPageProps {
  mode: 'login' | 'signup';
}

export function AuthPage({ mode }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const { notify } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === 'signup';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    const result = isSignup
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    notify(
      isSignup ? 'Account created. Welcome to Promptly.' : 'Welcome back.',
      'success'
    );
    // AuthProvider will update session; AppShell will redirect to /app
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" />
          </div>

          <div className="card p-7">
            <h1 className="text-xl font-bold tracking-tight text-ink-900">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-1.5 text-sm text-ink-500">
              {isSignup
                ? 'Start writing prompts AI can actually understand.'
                : 'Log in to continue improving your prompts.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold text-ink-700"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input pl-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-semibold text-ink-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={
                      isSignup ? 'new-password' : 'current-password'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="input pl-9 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 animate-fade-in"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting
                  ? 'Please wait...'
                  : isSignup
                    ? 'Create account'
                    : 'Log in'}
                {!submitting && <ArrowRight size={15} />}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-ink-500">
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <Link
                    to="/auth/login"
                    className="font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Log in
                  </Link>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <Link
                    to="/auth/signup"
                    className="font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-ink-400">
            <Link to="/" className="hover:text-ink-600">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
