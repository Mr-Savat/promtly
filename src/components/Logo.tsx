import { Link } from 'react-router-dom';

interface LogoProps {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'text-base',
  md: 'text-lg sm:text-xl',
  lg: 'text-2xl',
};

export function Logo({
  to = '/',
  size = 'md',
  className = '',
}: LogoProps) {
  const textSize = sizeMap[size];
  return (
    <Link
      to={to}
      className={`group inline-flex items-center select-none transition-transform active:scale-[0.98] ${className}`}
      aria-label="Promptly home"
    >
      <span
        translate="no"
        className={`notranslate ${textSize} font-extrabold tracking-tight text-ink-900 hover:text-ink-950 dark:text-white dark:hover:text-white transition-colors`}
      >
        Promptly<span className="text-brand-600 dark:text-brand-400">.</span>
      </span>
    </Link>
  );
}
