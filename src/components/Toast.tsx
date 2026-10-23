import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, Info, AlertTriangle, X, XCircle } from 'lucide-react';

type ToastVariant = 'success' | 'info' | 'warning' | 'error';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  notify: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((t) => [...t, { id, message, variant }]);
      setTimeout(() => remove(id), 3800);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => remove(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const variantConfig: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; ring: string; iconColor: string }
> = {
  success: { icon: CheckCircle2, ring: 'border-mint-200 dark:border-mint-800/80', iconColor: 'text-mint-600 dark:text-mint-400' },
  info: { icon: Info, ring: 'border-sky-200 dark:border-sky-800/80', iconColor: 'text-sky-600 dark:text-sky-400' },
  warning: { icon: AlertTriangle, ring: 'border-amber-200 dark:border-amber-800/80', iconColor: 'text-amber-600 dark:text-amber-400' },
  error: { icon: XCircle, ring: 'border-rose-200 dark:border-rose-800/80', iconColor: 'text-rose-600 dark:text-rose-400' },
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const cfg = variantConfig[toast.variant];
  const Icon = cfg.icon;
  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${cfg.ring} bg-white dark:bg-ink-900 px-4 py-3 shadow-pop animate-slide-up`}
      role="status"
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${cfg.iconColor}`} />
      <p className="flex-1 text-sm text-ink-800 dark:text-ink-100">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-200"
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  );
}
