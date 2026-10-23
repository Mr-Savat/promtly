import { useEffect, useRef } from 'react';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
}

/**
 * A large writing canvas. Uses a controlled textarea styled to feel like
 * a writing workspace rather than a small form field. Auto-resizes to fill
 * its container and supports Cmd/Ctrl+Enter to trigger analysis.
 */
export function PromptEditor({
  value,
  onChange,
  onAnalyze,
  placeholder = 'Tell AI what you want to accomplish...',
  autoFocus = false,
  ariaLabel = 'Prompt editor',
}: PromptEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onAnalyze?.();
    }
  };

  return (
    <div className="relative flex min-h-[280px] flex-1">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        spellCheck
        translate="no"
        className="notranslate w-full resize-none rounded-xl border border-ink-200 bg-white px-5 py-4 text-[17px] leading-relaxed text-ink-900 placeholder-ink-400 transition-colors hover:border-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 scrollbar-thin dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:placeholder-ink-500 dark:hover:border-ink-600 dark:focus:border-brand-400 dark:focus:ring-brand-900/40"
        style={{ minHeight: 280 }}
      />
    </div>
  );
}
