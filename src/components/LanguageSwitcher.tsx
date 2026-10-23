import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  showIcon?: boolean;
}

export function LanguageSwitcher({ className = '', showIcon = true }: LanguageSwitcherProps) {
  const [currentLang, setCurrentLang] = useState<'en' | 'km'>('en');

  useEffect(() => {
    // Read the googtrans cookie to determine active language
    const match = document.cookie.match(/(?:^|; )googtrans=([^;]*)/);
    if (match && match[1].includes('/km')) {
      setCurrentLang('km');
      document.documentElement.lang = 'km';
    } else {
      setCurrentLang('en');
      document.documentElement.lang = 'en';
    }
  }, []);

  const switchLanguage = (lang: 'en' | 'km') => {
    if (lang === currentLang) return;

    const cookieVal = `/en/${lang}`;
    // Set cookie for root path and hostname
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    if (window.location.hostname && window.location.hostname !== 'localhost') {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${window.location.hostname};`;
    }

    setCurrentLang(lang);
    document.documentElement.lang = lang;

    // Try in-place DOM translation without full page reload
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (combo) {
      combo.value = lang;
      combo.dispatchEvent(new Event('change'));
      return;
    }

    // Fallback if Google Translate combo is not yet loaded into the DOM
    window.location.reload();
  };

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl border border-ink-200/80 bg-white/80 p-0.5 shadow-soft backdrop-blur-sm dark:border-ink-700/80 dark:bg-ink-800/80 ${className}`}
      role="group"
      aria-label="Language selection"
    >
      {showIcon && (
        <span className="flex items-center pl-2 pr-0.5 text-ink-400 dark:text-ink-500">
          <Globe size={14} />
        </span>
      )}
      <button
        type="button"
        onClick={() => switchLanguage('en')}
        aria-pressed={currentLang === 'en'}
        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 ${
          currentLang === 'en'
            ? 'bg-brand-600 text-white shadow-xs dark:bg-brand-600 dark:text-white'
            : 'text-ink-600 hover:text-ink-900 hover:bg-ink-100/70 dark:text-ink-400 dark:hover:text-white dark:hover:bg-ink-700/60'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchLanguage('km')}
        aria-pressed={currentLang === 'km'}
        className={`rounded-lg px-2.5 py-1 text-xs font-semibold font-['Kantumruy_Pro'] transition-all duration-150 ${
          currentLang === 'km'
            ? 'bg-brand-600 text-white shadow-xs dark:bg-brand-600 dark:text-white'
            : 'text-ink-600 hover:text-ink-900 hover:bg-ink-100/70 dark:text-ink-400 dark:hover:text-white dark:hover:bg-ink-700/60'
        }`}
      >
        ខ្មែរ
      </button>
    </div>
  );
}
