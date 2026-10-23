import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

interface LogoProps {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { box: 'h-7 w-7', icon: 15, text: 'text-base' },
  md: { box: 'h-8 w-8', icon: 17, text: 'text-lg' },
  lg: { box: 'h-10 w-10', icon: 21, text: 'text-xl' },
};

export function Logo({
  to = '/',
  size = 'md',
  showWordmark = true,
  className = '',
}: LogoProps) {
  const s = sizeMap[size];
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label="Promptly home"
    >
      <span
        className={`${s.box} relative inline-flex items-center justify-center rounded-lg bg-brand-600 text-white shadow-soft transition-transform group-hover:scale-[1.04]`}
      >
        <Sparkles size={s.icon} strokeWidth={2.5} />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-mint-400 ring-2 ring-white" />
      </span>
      {showWordmark && (
        <span className={`${s.text} font-bold tracking-tight text-ink-900`}>
          Promptly
        </span>
      )}
    </Link>
  );
}
