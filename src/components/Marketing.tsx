import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Chrome,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuth } from '@/lib/auth';

const NAV_ITEMS = [
  { id: 'how-it-works', label: 'How it works' },
  { id: 'why', label: 'Why Promptly' },
  { id: 'extension', label: 'Extension' },
];

export function MarketingHeader() {
  const { user, signInAsDemo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scrollspy to automatically highlight the active section while scrolling
  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('');
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      let currentSection = '';

      for (const item of NAV_ITEMS) {
        const element = document.getElementById(item.id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            currentSection = item.id;
          }
        }
      }

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setActiveSection(id);

    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  const handleDemoAccess = () => {
    signInAsDemo();
    navigate('/app');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-white/90 backdrop-blur-md transition-colors duration-200 dark:border-ink-800 dark:bg-ink-950/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
        <Logo />

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1.5 md:flex" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs dark:bg-brand-950/60 dark:text-brand-300'
                    : 'text-ink-600 hover:bg-ink-100/70 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800/60 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden items-center gap-2.5 md:flex">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Theme Toggle Icon Button */}
          <ThemeToggle />

          {user ? (
            <Link to="/app" className="btn-primary text-xs py-2">
              <span>Open Editor</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              {/* Quick 1-click Demo Account button */}
              <button
                type="button"
                onClick={handleDemoAccess}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50/70 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-all hover:bg-brand-100 active:scale-[0.98] dark:border-brand-800/80 dark:bg-brand-950/60 dark:text-brand-300 dark:hover:bg-brand-900/60"
                title="Instant access without registration"
              >
                <Sparkles size={13} className="text-brand-600 dark:text-brand-400" />
                <span>Try Demo</span>
              </button>

              <Link
                to="/auth/login"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900 transition-colors dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white"
              >
                Log in
              </Link>
              <Link to="/auth/signup" className="btn-primary text-xs py-1.5">
                Try Promptly
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          {!user && (
            <button
              type="button"
              onClick={handleDemoAccess}
              className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700"
            >
              <Sparkles size={12} />
              Demo
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 hover:text-ink-900 transition-colors"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-ink-200 bg-white px-5 py-4 shadow-soft md:hidden animate-fade-in dark:border-ink-800 dark:bg-ink-900">
          <nav className="flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold dark:bg-brand-950/60 dark:text-brand-300'
                      : 'text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <CheckCircle2 size={16} className="text-brand-600 dark:text-brand-400" />}
                </button>
              );
            })}
          </nav>

          {/* Mobile Language Switcher */}
          <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3 dark:border-ink-800">
            <span className="text-xs font-semibold text-ink-700 dark:text-ink-300">Language</span>
            <LanguageSwitcher />
          </div>

          {/* Mobile Theme Switcher */}
          <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3 dark:border-ink-800">
            <span className="text-xs font-semibold text-ink-700 dark:text-ink-300">Theme</span>
            <ThemeToggle variant="segmented" />
          </div>

          <div className="mt-4 pt-4 border-t border-ink-100 flex flex-col gap-2 dark:border-ink-800">
            {user ? (
              <Link
                to="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full justify-center text-sm"
              >
                Open Editor
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleDemoAccess}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 py-2.5 text-xs font-semibold text-brand-700 shadow-soft dark:border-brand-800/80 dark:bg-brand-950/60 dark:text-brand-300"
                >
                  <Sparkles size={14} />
                  <span>Try Demo Account (Instant Access)</span>
                </button>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Link
                    to="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-secondary justify-center text-xs py-2"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/auth/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary justify-center text-xs py-2"
                  >
                    Sign up
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function MarketingFooter() {
  const { user, signInAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemoAccess = () => {
    signInAsDemo();
    navigate('/app');
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <footer className="border-t border-ink-200 bg-white transition-colors duration-200 dark:border-ink-800 dark:bg-ink-950">
      <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand info (2 columns on wide screens) */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="md" />
            <p className="max-w-sm text-sm text-ink-600 dark:text-ink-400 leading-relaxed">
              Don't learn prompt engineering. Just tell AI what you want. Promptly helps you structure clear, high-performing prompts for ChatGPT, Claude, and Gemini.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-ink-700 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300">
                <Chrome size={12} className="text-brand-600 dark:text-brand-400" />
                Extension Ready
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-ink-700 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300">
                <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                Zero-Keylogging
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-900 dark:text-white">
              Navigation
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('how-it-works')}
                  className="text-ink-600 dark:text-ink-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  How it works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('why')}
                  className="text-ink-600 dark:text-ink-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  Why Promptly
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('extension')}
                  className="text-ink-600 dark:text-ink-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  Chrome Extension
                </button>
              </li>
            </ul>
          </div>

          {/* Integrations */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-900 dark:text-white">
              Integrations
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-600 dark:text-ink-400">
              <li>
                <a
                  href="https://chatgpt.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors inline-flex items-center gap-1"
                >
                  ChatGPT
                </a>
              </li>
              <li>
                <a
                  href="https://claude.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors inline-flex items-center gap-1"
                >
                  Claude AI
                </a>
              </li>
              <li>
                <a
                  href="https://gemini.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors inline-flex items-center gap-1"
                >
                  Google Gemini
                </a>
              </li>
            </ul>
          </div>

          {/* Get Started / Account */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-900 dark:text-white">
              Get Started
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {user ? (
                <>
                  <li>
                    <Link
                      to="/app"
                      className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                    >
                      Open Editor →
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/app/history"
                      className="text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white transition-colors"
                    >
                      Prompt History
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/settings"
                      className="text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white transition-colors"
                    >
                      Settings
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={handleDemoAccess}
                      className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                    >
                      <Sparkles size={13} />
                      <span>Demo Mode (No Login)</span>
                    </button>
                  </li>
                  <li>
                    <Link
                      to="/auth/login"
                      className="text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white transition-colors"
                    >
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/auth/signup"
                      className="text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white transition-colors"
                    >
                      Create Free Account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-100 pt-6 text-xs text-ink-500 dark:border-ink-800 dark:text-ink-400 sm:flex-row">
          <p>© 2026 Promptly. A prompt assistant, not a prompt marketplace.</p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-ink-600 dark:text-ink-300 font-medium">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FeatureRowProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureIcon({ icon: Icon, title, description }: FeatureRowProps) {
  return (
    <div className="flex gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
        <Icon size={20} />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{description}</p>
      </div>
    </div>
  );
}

export function ChromeBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300">
      <Chrome size={13} className="text-brand-600 dark:text-brand-400" />
      Chrome extension ready
    </span>
  );
}
