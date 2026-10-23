import { useState, useEffect } from 'react';
import {
  ArrowRight,
  RotateCcw,
  Pencil,
  Sparkles,
  CheckCircle2,
  Wand2,
} from 'lucide-react';
import { CopyButton } from './CopyButton';

export interface PromptResultProps {
  originalText: string;
  improvedPrompt: string;
  summary: string;
  changes: string[];
  onEdit: () => void;
  onStartOver: () => void;
  isRealTimeUpdating?: boolean;
}

export function PromptResult({
  originalText,
  improvedPrompt,
  summary,
  changes,
  onEdit,
  onStartOver,
  isRealTimeUpdating = false,
}: PromptResultProps) {
  const [highlight, setHighlight] = useState(false);

  // Trigger pulse effect when improved prompt content updates
  useEffect(() => {
    setHighlight(true);
    const timer = setTimeout(() => setHighlight(false), 800);
    return () => clearTimeout(timer);
  }, [improvedPrompt]);

  return (
    <div className="animate-slide-up space-y-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-2 border-b border-ink-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shadow-soft">
            <Sparkles size={14} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink-900 leading-tight">
              Enhanced Prompt
            </h3>
            <span className="text-[11px] text-ink-500">
              Structured for high-precision model execution
            </span>
          </div>
        </div>
        {changes.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} />
            {changes.length} {changes.length === 1 ? 'enhancement' : 'enhancements'}
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed text-ink-600">{summary}</p>

      {/* Before vs After Comparison Card */}
      <div className="grid gap-2 sm:grid-cols-2 text-xs">
        <div className="rounded-xl border border-ink-200/80 bg-ink-50/70 p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
            Raw Input
          </p>
          <p className="leading-relaxed text-ink-600 line-clamp-4 font-mono text-[11px]">
            {originalText}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/40 p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Optimized Intent
          </p>
          <p className="leading-relaxed text-ink-800 line-clamp-4 font-medium">
            {improvedPrompt.split('\n\n')[0] || improvedPrompt}
          </p>
        </div>
      </div>

      {/* Live Final Prompt Container */}
      <div
        className={`relative rounded-2xl border bg-white p-4 shadow-soft transition-all duration-300 ${
          highlight
            ? 'border-brand-500 ring-2 ring-brand-100'
            : 'border-ink-200/90'
        }`}
      >
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              Production Prompt
            </p>
          </div>
          <CopyButton text={improvedPrompt} size="sm" />
        </div>

        <div className="max-h-72 overflow-y-auto rounded-lg bg-ink-50/50 p-3 scrollbar-thin border border-ink-100">
          <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-ink-800 selection:bg-brand-100">
            {improvedPrompt}
          </pre>
        </div>
      </div>

      {/* Changes list */}
      {changes.length > 0 && (
        <div className="rounded-xl border border-ink-200/80 bg-white p-3.5 shadow-soft">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400 flex items-center gap-1.5">
            <Wand2 size={12} className="text-brand-500" />
            What changed in this revision:
          </p>
          <ul className="space-y-1.5">
            {changes.map((change, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-xs text-ink-700 animate-fade-in"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-ink-100">
        <button
          type="button"
          onClick={onEdit}
          className="btn-primary py-2 px-3.5 text-xs"
        >
          <Pencil size={13} />
          <span>Apply to Editor</span>
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="btn-ghost py-2 px-3 text-xs text-ink-500"
        >
          <RotateCcw size={13} />
          <span>Start over</span>
        </button>
      </div>
    </div>
  );
}
