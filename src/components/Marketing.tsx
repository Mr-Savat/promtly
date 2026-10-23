import { Link } from 'react-router-dom';
import { Chrome, type LucideIcon } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth';

export function MarketingHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex">
          <a
            href="#how-it-works"
            className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
          >
            How it works
          </a>
          <a
            href="#why"
            className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
          >
            Why Promptly
          </a>
          <a
            href="#extension"
            className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
          >
            Extension
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/app" className="btn-primary">
              Open editor
            </Link>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="btn-ghost hidden sm:inline-flex"
              >
                Log in
              </Link>
              <Link to="/auth/signup" className="btn-primary">
                Try Promptly
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-ink-200 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <Logo size="sm" />
            <p className="mt-3 max-w-xs text-sm text-ink-500">
              Don't learn prompt engineering. Just tell AI what you want.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <a
              href="#how-it-works"
              className="text-ink-500 hover:text-ink-800"
            >
              How it works
            </a>
            <a href="#why" className="text-ink-500 hover:text-ink-800">
              Why Promptly
            </a>
            <a href="#extension" className="text-ink-500 hover:text-ink-800">
              Extension
            </a>
            <Link to="/auth/login" className="text-ink-500 hover:text-ink-800">
              Log in
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t border-ink-100 pt-6 text-xs text-ink-400">
          © {new Date().getFullYear()} Promptly. A prompt assistant, not a prompt
          marketplace.
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
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon size={20} />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-600">{description}</p>
      </div>
    </div>
  );
}

export function ChromeBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-600">
      <Chrome size={13} className="text-brand-600" />
      Chrome extension ready
    </span>
  );
}
