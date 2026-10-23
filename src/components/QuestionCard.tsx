import { useState, useEffect, useRef } from 'react';
import {
  Check,
  ChevronRight,
  CornerDownLeft,
  Sparkles,
  Edit3,
  X,
  FastForward,
} from 'lucide-react';
import type { Question } from '@/lib/ai';

export interface QuestionCardProps {
  question: Question;
  step: number;
  total: number;
  selectedAnswer?: string;
  onAnswer: (answer: string) => void;
  onSkip?: () => void;
  onPrev?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  goal: '🎯',
  target_user: '👥',
  task: '⚡',
  expected_output: '📄',
  constraints: '🛡️',
  context: '💡',
  technical: '⚙️',
  input: '📥',
  ambiguity: '🔍',
  examples: '✨',
};

const CATEGORY_TITLES: Record<string, string> = {
  goal: 'Primary Goal',
  target_user: 'Target Audience',
  task: 'Task Action',
  expected_output: 'Output Format',
  constraints: 'Constraints & Style',
  context: 'Background Context',
  technical: 'Technology Stack',
  input: 'Input Material',
  ambiguity: 'Clarity & Specifics',
  examples: 'Output Examples',
};

export function QuestionCard({
  question,
  step,
  total,
  selectedAnswer,
  onAnswer,
  onSkip,
  onPrev,
}: QuestionCardProps) {
  const [customText, setCustomText] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync if selectedAnswer changes or step changes
  useEffect(() => {
    setShowCustom(false);
    setCustomText('');
  }, [question.id]);

  useEffect(() => {
    if (showCustom && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCustom]);

  const handleSelectOption = (value: string) => {
    onAnswer(value);
  };

  const submitCustom = () => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    onAnswer(trimmed);
    setCustomText('');
    setShowCustom(false);
  };

  const catKey = question.category || 'task';
  const iconEmoji = CATEGORY_ICONS[catKey] || '💡';
  const categoryTitle = CATEGORY_TITLES[catKey] || catKey.replace('_', ' ');

  return (
    <div className="animate-fade-in rounded-2xl border border-ink-200/90 bg-white p-5 shadow-card transition-all dark:border-ink-800 dark:bg-ink-900">
      {/* Header bar: Step & Category Badge */}
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 pb-3 mb-4 dark:border-ink-800">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-sm dark:bg-brand-950/60">
            {iconEmoji}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            {categoryTitle}
          </span>
          <span className="h-1 w-1 rounded-full bg-ink-300 dark:bg-ink-700" />
          <span className="text-xs font-medium text-ink-500 dark:text-ink-400">
            Step {step} of {total}
          </span>
        </div>

        {/* Action controls: Prev & Skip */}
        <div className="flex items-center gap-2">
          {onPrev && step > 1 && (
            <button
              type="button"
              onClick={onPrev}
              className="text-xs font-medium text-ink-400 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200 transition-colors px-1.5 py-0.5 rounded"
            >
              Back
            </button>
          )}
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              title="Use default AI assumption for this dimension"
              className="group inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-200 transition-colors"
            >
              <span>Skip</span>
              <FastForward size={12} className="text-ink-400 group-hover:text-ink-600 dark:text-ink-500 dark:group-hover:text-ink-300" />
            </button>
          )}
        </div>
      </div>

      {/* Question Prompt */}
      <div className="mb-4">
        <h3 className="text-base font-semibold leading-snug text-ink-900 dark:text-white tracking-tight">
          {question.prompt}
        </h3>
        {question.helper && (
          <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
            {question.helper}
          </p>
        )}
      </div>

      {/* Quick-Select Pill Options */}
      {question.options && question.options.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            Select an option:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {question.options.map((opt) => {
              const isSelected = selectedAnswer === opt.value || selectedAnswer === opt.label;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectOption(opt.value)}
                  onMouseEnter={() => setHoveredOption(opt.value)}
                  onMouseLeave={() => setHoveredOption(null)}
                  className={`group relative flex items-center justify-between rounded-xl border p-3 text-left transition-all duration-150 active:scale-[0.98] ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/70 text-brand-900 shadow-sm ring-1 ring-brand-500 dark:border-brand-500 dark:bg-brand-950/70 dark:text-brand-200'
                      : 'border-ink-200/90 bg-white text-ink-800 hover:border-brand-300 hover:bg-brand-50/30 hover:shadow-soft dark:border-ink-800 dark:bg-ink-950/80 dark:text-ink-200 dark:hover:border-brand-600 dark:hover:bg-brand-950/40'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="block text-sm font-semibold text-ink-900 group-hover:text-brand-900 dark:text-ink-100 dark:group-hover:text-brand-300">
                      {opt.label}
                    </span>
                    {opt.value !== opt.label && (
                      <span className="mt-0.5 block truncate text-[11px] text-ink-500 dark:text-ink-400">
                        {opt.value}
                      </span>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isSelected ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white shadow-soft">
                        <Check size={12} strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-ink-200 bg-ink-50/50 text-ink-400 group-hover:border-brand-400 group-hover:text-brand-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-400 dark:group-hover:border-brand-500 dark:group-hover:text-brand-300 transition-colors">
                        <ChevronRight size={12} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Inline Other / Custom Input */}
      {question.allowCustom && (
        <div className="mt-4 pt-3 border-t border-ink-100/80 dark:border-ink-800">
          {!showCustom ? (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors rounded-lg px-2 py-1.5 hover:bg-brand-50 dark:hover:bg-brand-950/40"
            >
              <Edit3 size={13} />
              <span>Type your own custom answer...</span>
            </button>
          ) : (
            <div className="animate-fade-in space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`custom-input-${question.id}`}
                  className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400"
                >
                  Your specific requirement:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustom(false);
                    setCustomText('');
                  }}
                  className="text-xs text-ink-400 hover:text-ink-600 dark:text-ink-400 dark:hover:text-ink-200 inline-flex items-center gap-0.5"
                >
                  <X size={12} />
                  Cancel
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    id={`custom-input-${question.id}`}
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitCustom();
                      }
                      if (e.key === 'Escape') {
                        setShowCustom(false);
                      }
                    }}
                    placeholder={question.placeholder || 'e.g. Next.js App Router with TypeScript'}
                    className="input pr-8 text-sm py-2"
                  />
                  {customText && (
                    <button
                      type="button"
                      onClick={() => setCustomText('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:text-ink-400 dark:hover:text-ink-200"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={submitCustom}
                  disabled={!customText.trim()}
                  className="btn-primary py-2 px-3.5 shrink-0"
                >
                  <span>Apply</span>
                  <CornerDownLeft size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress track at bottom */}
      <div className="mt-4 flex items-center justify-between pt-2">
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 === step
                  ? 'w-6 bg-brand-600'
                  : i + 1 < step
                  ? 'w-3 bg-emerald-500'
                  : 'w-2 bg-ink-200 dark:bg-ink-700'
              }`}
            />
          ))}
        </div>
        <span className="text-[10px] text-ink-400 font-medium">
          Press Enter or click any option
        </span>
      </div>
    </div>
  );
}
