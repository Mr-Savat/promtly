import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { Clock, History, LogOut, Menu, Plus, Settings, Sparkles, X } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
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
  const { user, loading, signOut, isDemoUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login', { replace: true });
    }
  }, [loading, user, navigate]);

  // Close drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

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

  const email = user.email ?? (isDemoUser ? 'demo@promptly.ai' : '');
  const initials = email.slice(0, 2).toUpperCase() || 'DM';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isItemActive = (to: string) => {
    if (to === '/app') return location.pathname === '/app';
    if (to === '/app/history') return location.pathname.startsWith('/app/history');
    if (to === '/settings') return location.pathname.startsWith('/settings') || location.pathname.startsWith('/app/settings');
    return false;
  };

  const getPageTitle = () => {
    if (location.pathname === '/app') return 'Editor';
    if (location.pathname.startsWith('/app/history')) return 'History';
    if (location.pathname.startsWith('/settings') || location.pathname.startsWith('/app/settings')) return 'Settings';
    return 'Dashboard';
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex h-full flex-col bg-white dark:bg-ink-900">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-100 px-5 dark:border-ink-800">
        <Logo />
        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-white"
          >
            <X size={19} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const active = isItemActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs dark:bg-brand-950/60 dark:text-brand-300'
                  : 'text-ink-600 hover:bg-ink-100/70 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800/60 dark:hover:text-white'
              }`}
            >
              <item.icon
                size={18}
                className={`shrink-0 transition-colors ${
                  active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400 group-hover:text-ink-700 dark:text-ink-500 dark:group-hover:text-ink-300'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Account */}
      <div className="shrink-0 border-t border-ink-200 bg-white p-3.5 dark:border-ink-800 dark:bg-ink-900">
        {isDemoUser && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-2 text-center text-[11px] font-medium text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Sparkles size={12} className="text-amber-600 dark:text-amber-400" /> Demo Account
            </span>
          </div>
        )}
        <div className="flex items-center gap-3 rounded-xl bg-ink-50/70 p-2.5 border border-ink-100 dark:border-ink-800 dark:bg-ink-800/60">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white shadow-xs">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-ink-900 dark:text-ink-100" title={email}>
              {email}
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-ink-500 hover:text-rose-600 transition-colors dark:text-ink-400 dark:hover:text-rose-400"
            >
              <LogOut size={11} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-ink-50 text-ink-900 antialiased transition-colors duration-200 dark:bg-ink-950 dark:text-ink-100">
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-ink-200 bg-white sticky top-0 h-screen z-20 dark:border-ink-800 dark:bg-ink-900">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink-950/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer content */}
          <div className="relative flex w-72 max-w-[82vw] flex-col bg-white shadow-2xl transition-transform animate-scale-in z-10 h-full dark:bg-ink-900">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* Right Column: Header + Main View */}
      <div className="flex flex-1 flex-col min-w-0 w-full">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8 dark:border-ink-800 dark:bg-ink-950/95 transition-colors duration-200">
          {/* Left section: Hamburger (mobile) + Page / Brand Info */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open sidebar menu"
              className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 hover:text-ink-900 md:hidden transition-colors dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white"
            >
              <Menu size={20} />
            </button>

            <div className="md:hidden">
              <Logo size="sm" />
            </div>

            <div className="hidden md:flex items-center gap-2.5">
              <span className="text-sm font-semibold text-ink-800 dark:text-ink-100">
                {getPageTitle()}
              </span>
              <span className="text-ink-300 dark:text-ink-600">/</span>
              <span className="text-xs text-ink-500 font-medium dark:text-ink-400">Promptly Studio</span>
              {isDemoUser && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/60 dark:text-amber-300">
                  <Sparkles size={11} className="text-amber-600 dark:text-amber-400" /> Demo
                </span>
              )}
            </div>
          </div>

          {/* Right section: Quick actions + Language Switcher + Theme Toggle + User pill */}
          <div className="flex items-center gap-2.5">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Quick Theme Toggle Icon */}
            <ThemeToggle />

            {location.pathname !== '/app' && (
              <Link
                to="/app"
                className="btn-primary btn-sm hidden sm:inline-flex"
              >
                <Plus size={14} />
                <span>New prompt</span>
              </Link>
            )}

            <div className="flex items-center gap-2 pl-1">
              <span className="hidden text-xs font-medium text-ink-500 lg:inline-block max-w-[140px] truncate dark:text-ink-400" title={email}>
                {email}
              </span>
              <Link
                to="/settings"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white shadow-xs hover:ring-2 hover:ring-brand-300 transition-all dark:hover:ring-brand-500"
                title="Account Settings"
              >
                {initials}
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area (Full width, no horizontal clip) */}
        <main className="flex-1 w-full min-w-0 pb-16 md:pb-6">
          {children ?? <Outlet />}
        </main>

        {/* Mobile bottom nav bar */}
        <nav className="fixed bottom-0 inset-x-0 z-20 flex border-t border-ink-200 bg-white/95 backdrop-blur-md md:hidden dark:border-ink-800 dark:bg-ink-950/95 transition-colors duration-200">
          {navItems.map((item) => {
            const active = isItemActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${
                  active ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-ink-500 dark:text-ink-400'
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
