import { CheckCircle2, AlertTriangle, CircleDashed } from 'lucide-react';
import type { AnalysisItem } from '@/lib/ai';

interface AnalysisItemRowProps {
  item: AnalysisItem;
}

const severityConfig = {
  good: {
    icon: CheckCircle2,
    iconColor: 'text-mint-600',
    bg: 'bg-mint-50',
    border: 'border-mint-100',
    label: 'Clear',
    labelColor: 'text-mint-700 bg-mint-50',
  },
  needs_attention: {
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    label: 'Could improve',
    labelColor: 'text-amber-700 bg-amber-50',
  },
  missing: {
    icon: CircleDashed,
    iconColor: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    label: 'Missing',
    labelColor: 'text-rose-700 bg-rose-50',
  },
};

const categoryLabels: Record<string, string> = {
  goal: 'Goal',
  context: 'Context',
  target_user: 'Target user',
  task: 'Task',
  input: 'Input',
  expected_output: 'Expected output',
  constraints: 'Constraints',
  examples: 'Examples',
  technical: 'Technology',
  ambiguity: 'Ambiguity',
};

export function AnalysisItemRow({ item }: AnalysisItemRowProps) {
  const cfg = severityConfig[item.severity];
  const Icon = cfg.icon;

  return (
    <div
      className={`flex gap-3 rounded-xl border ${cfg.border} ${cfg.bg} px-3.5 py-3`}
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${cfg.iconColor}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink-900">
            {categoryLabels[item.category] ?? item.category}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.labelColor}`}
          >
            {cfg.label}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-ink-700">
          {item.explanation}
        </p>
        {item.suggestion && (
          <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
            <span className="font-medium text-ink-600">Suggestion: </span>
            {item.suggestion}
          </p>
        )}
      </div>
    </div>
  );
}
