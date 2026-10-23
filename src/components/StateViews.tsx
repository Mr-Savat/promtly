import { AlertTriangle, RotateCcw, Sparkles } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-6' : 'py-12'
      }`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-full bg-rose-50 text-rose-600 ${
          compact ? 'h-10 w-10' : 'h-12 w-12'
        }`}
      >
        <AlertTriangle size={compact ? 18 : 22} />
      </span>
      <h3
        className={`mt-3 font-semibold text-ink-900 ${
          compact ? 'text-sm' : 'text-base'
        }`}
      >
        {title}
      </h3>
      <p
        className={`mt-1 max-w-sm text-ink-500 ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        {message}
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-4">
          <RotateCcw size={14} />
          Try again
        </button>
      )}
    </div>
  );
}

interface LoadingStateProps {
  label?: string;
  compact?: boolean;
}

export function LoadingState({
  label = 'Working on it...',
  compact = false,
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-6' : 'py-12'
      }`}
    >
      <span className="relative inline-flex h-10 w-10 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-200 opacity-60" />
        <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white">
          <Sparkles size={18} className="animate-spark-pulse" />
        </span>
      </span>
      <p
        className={`mt-3 font-medium text-ink-700 ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        {label}
      </p>
      {!compact && (
        <div className="mt-3 h-1 w-32 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full w-1/2 animate-shimmer rounded-full bg-brand-500" />
        </div>
      )}
    </div>
  );
}
