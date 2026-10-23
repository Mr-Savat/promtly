import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';
import { Clock, History, LogOut, Settings, Sparkles } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth';

interface AppShellProps {
  children?: ReactNode;
}

const navItems = [
  { to: '/app', label: 'Editor', icon: Sparkles, end: true },
  { to: '/app/history', label: 'History', icon: History, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

export function AppShell({ children }: AppShellProps) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login', { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <div className="flex flex-col items-center gap-3 text-ink-400">
          <span className="h-8 w-8 animate-pulse rounded-lg bg-brand-200" />
          <p className="text-sm">Loading Promptly...</p>
        </div>
      </div>
    );
  }

  const email = user.email ?? '';
  const initials = email.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink-50 lg:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-200 bg-white lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink-200 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink-800">{email}</p>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-ink-400 hover:text-rose-600"
              >
                <LogOut size={11} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Top nav (mobile + desktop top bar) */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-200 bg-white/85 px-4 backdrop-blur-md lg:h-16 lg:px-8">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <Logo size="sm" />
          </div>
          {/* Desktop spacer / page hint */}
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-ink-500">
              AI Prompt Assistant
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/app"
              className="hidden rounded-lg px-3 py-1.5 text-xs font-medium text-ink-500 hover:bg-ink-100 hover:text-ink-800 sm:inline-flex sm:items-center sm:gap-1.5"
            >
              <Clock size={13} />
              <span>History</span>
            </Link>
            <span className="hidden h-5 w-px bg-ink-200 sm:block" />
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-ink-400 sm:block">
                {email}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                {initials}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="sticky bottom-0 z-30 flex border-t border-ink-200 bg-white lg:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-brand-600' : 'text-ink-500'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
