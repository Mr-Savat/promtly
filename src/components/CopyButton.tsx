import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function CopyButton({
  text,
  label = 'Copy',
  copiedLabel = 'Copied',
  className = '',
  size = 'md',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Fallback for browsers without clipboard API
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
  };

  const sizing = size === 'sm' ? 'btn-sm' : '';

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn ${
        copied
          ? 'bg-mint-50 text-mint-700 border border-mint-200 dark:bg-mint-950/60 dark:text-mint-300 dark:border-mint-800/60'
          : 'bg-brand-600 text-white hover:bg-brand-700'
      } ${sizing} ${className}`}
      aria-label={copied ? copiedLabel : label}
      aria-live="polite"
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
