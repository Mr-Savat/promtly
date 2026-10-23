import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme, type Theme } from '@/lib/theme';

interface ThemeToggleProps {
  variant?: 'icon' | 'segmented';
  className?: string;
}

export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'segmented') {
    const options: { value: Theme; label: string; icon: typeof Sun }[] = [
      { value: 'light', label: 'Light', icon: Sun },
      { value: 'dark', label: 'Dark', icon: Moon },
      { value: 'system', label: 'System', icon: Laptop },
    ];

    return (
      <div
        className={`inline-flex items-center rounded-xl border border-ink-200 bg-ink-100/70 p-1 dark:border-ink-700 dark:bg-ink-800/80 ${className}`}
        role="radiogroup"
        aria-label="Select theme mode"
      >
        {options.map((opt) => {
          const isSelected = theme === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                isSelected
                  ? 'bg-white text-ink-900 shadow-soft dark:bg-ink-700 dark:text-white'
                  : 'text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white'
              }`}
            >
              <Icon size={14} className={isSelected ? 'text-brand-600 dark:text-brand-400' : ''} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Icon button variant
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200/80 bg-white/80 text-ink-600 shadow-soft backdrop-blur-sm transition-all duration-150 hover:bg-ink-50 hover:text-ink-900 hover:border-ink-300 active:scale-95 dark:border-ink-700/80 dark:bg-ink-800/80 dark:text-ink-300 dark:hover:bg-ink-700 dark:hover:text-white ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="sr-only">Toggle theme</span>
      {isDark ? (
        <Sun
          size={16}
          className="transition-transform duration-200 text-amber-400 hover:rotate-45"
        />
      ) : (
        <Moon
          size={16}
          className="transition-transform duration-200 text-ink-700 hover:-rotate-12"
        />
      )}
    </button>
  );
}
