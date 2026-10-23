import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CircleDashed,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { fetchPromptHistory, type PromptHistoryItem } from '@/lib/prompts';
import { useToast } from '@/components/Toast';
import { CopyButton } from '@/components/CopyButton';
import { ErrorState, LoadingState } from '@/components/StateViews';

export function HistoryPage() {
  const [items, setItems] = useState<PromptHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPromptHistory();
        if (mounted) setItems(data);
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : 'Could not load history.'
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const reload = () => {
    setLoading(true);
    fetchPromptHistory()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load history.'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Prompt history
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Your recent prompts, newest first.
          </p>
        </div>
        <Link to="/app" className="btn-primary">
          <Sparkles size={15} />
          New prompt
        </Link>
      </div>

      {loading && <LoadingState label="Loading your prompts..." />}

      {!loading && error && (
        <ErrorState message={error} onRetry={reload} />
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyHistory />
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => (
            <HistoryRow key={item.id} item={item} onDeleted={reload} notify={notify} />
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyHistory() {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Clock size={22} />
      </span>
      <h2 className="mt-4 text-base font-semibold text-ink-900">
        No prompts yet
      </h2>
      <p className="mt-1.5 max-w-sm text-sm text-ink-500">
        Write your first request and Promptly will help you turn it into a
        prompt AI can understand.
      </p>
      <Link to="/app" className="btn-primary mt-5">
        <Sparkles size={15} />
        Write your first prompt
      </Link>
    </div>
  );
}

function HistoryRow({
  item,
  notify,
}: {
  item: PromptHistoryItem;
  onDeleted: () => void;
  notify: (m: string, v: 'success' | 'info' | 'warning' | 'error') => void;
}) {
  const date = new Date(item.created_at);
  const dateLabel = formatRelative(date);

  const StatusBadge = () => {
    if (item.status === 'ready' && item.improved_text) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-2 py-0.5 text-[10px] font-semibold text-mint-700">
          <CheckCircle2 size={10} /> Improved
        </span>
      );
    }
    if (item.status === 'needs_info') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          <TriangleAlert size={10} /> Needs info
        </span>
      );
    }
    if (item.status === 'error') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
          <CircleDashed size={10} /> Error
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600">
        Draft
      </span>
    );
  };

  return (
    <li className="card p-5 transition-shadow hover:shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusBadge />
            <span className="text-xs text-ink-400">{dateLabel}</span>
            {item.quality_score != null && (
              <span className="text-xs font-medium text-ink-500">
                · quality {item.quality_score}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-ink-900 line-clamp-2">
            {item.original_text}
          </p>
          {item.improved_text && (
            <div className="mt-3 rounded-lg border border-ink-100 bg-ink-50/50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-mint-700">
                Improved
              </p>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                {item.improved_text}
              </p>
            </div>
          )}
        </div>
        {item.improved_text && (
          <CopyButton
            text={item.improved_text}
            size="sm"
            label="Copy"
          />
        )}
      </div>
    </li>
  );
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
