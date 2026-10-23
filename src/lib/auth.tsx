import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

const DEMO_STORAGE_KEY = 'promptly_demo_active';

export const DEMO_USER: User = {
  id: 'demo-user-promptly',
  app_metadata: { provider: 'demo' },
  user_metadata: {
    full_name: 'Demo User',
    name: 'Demo User',
    is_demo: true,
  },
  aud: 'authenticated',
  confirmation_sent_at: '',
  recovery_sent_at: '',
  email_change_sent_at: '',
  new_email: '',
  invited_at: '',
  action_link: '',
  email: 'demo@promptly.ai',
  phone: '',
  created_at: '2026-01-01T00:00:00.000Z',
  confirmed_at: '2026-01-01T00:00:00.000Z',
  email_confirmed_at: '2026-01-01T00:00:00.000Z',
  phone_confirmed_at: '',
  last_sign_in_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString(),
  identities: [],
  factors: [],
};

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemoUser: boolean;
  signInAsDemo: () => void;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DEMO_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        setIsDemo(false);
        try {
          localStorage.removeItem(DEMO_STORAGE_KEY);
        } catch {}
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? (isDemo ? DEMO_USER : null),
      session,
      loading,
      isDemoUser: !session?.user && isDemo,
      signInAsDemo() {
        try {
          localStorage.setItem(DEMO_STORAGE_KEY, 'true');
        } catch {}
        setIsDemo(true);
      },
      async signUp(email, password, fullName) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: fullName
            ? {
                data: {
                  full_name: fullName,
                  name: fullName,
                },
              }
            : undefined,
        });
        return { error: error ? translateAuthError(error.message) : null };
      },
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!error) {
          try {
            localStorage.removeItem(DEMO_STORAGE_KEY);
          } catch {}
          setIsDemo(false);
        }
        return { error: error ? translateAuthError(error.message) : null };
      },
      async signInWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/app`,
          },
        });
        return { error: error ? translateAuthError(error.message) : null };
      },
      async resetPasswordForEmail(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        return { error: error ? translateAuthError(error.message) : null };
      },
      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password });
        return { error: error ? translateAuthError(error.message) : null };
      },
      async signOut() {
        try {
          localStorage.removeItem(DEMO_STORAGE_KEY);
        } catch {}
        setIsDemo(false);
        await supabase.auth.signOut();
      },
    }),
    [session, isDemo, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) {
    return 'That email and password do not match. Please try again.';
  }
  if (m.includes('user already registered')) {
    return 'An account with that email already exists. Try logging in instead.';
  }
  if (m.includes('password') && m.includes('at least')) {
    return 'Password must be at least 6 characters.';
  }
  if (m.includes('email')) {
    return 'Please enter a valid email address.';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return 'Something went wrong. Please try again.';
}
