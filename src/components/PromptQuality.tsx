import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  CircleDashed,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { AnalysisCategory, AnalysisSeverity, DimensionMap } from '@/lib/types';
import type { AnalysisItem } from '@/lib/ai';

export interface PromptQualityProps {
  score: number;
  missingCount: number;
  attentionCount: number;
  goodCount: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'circular' | 'linear';
  showDimensionBadges?: boolean;
  dimensions?: DimensionMap;
  items?: AnalysisItem[];
  onSelectDimension?: (category: AnalysisCategory) => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  goal: 'Goal',
  target_user: 'Audience',
  task: 'Task',
  expected_output: 'Format',
  constraints: 'Constraints',
  context: 'Context',
  technical: 'Tech Stack',
  input: 'Input',
  ambiguity: 'Clarity',
  examples: 'Examples',
};

export function getScoreTheme(score: number) {
  if (score > 80) {
    return {
      tier: 'high',
      label: 'Production Ready',
      grade: 'High Quality',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
      borderColor: 'border-emerald-200 dark:border-emerald-800/60',
      ringColor: 'stroke-emerald-500',
      fillColor: 'text-emerald-500',
      barColor: 'bg-emerald-500',
    };
  }
  if (score >= 50) {
    return {
      tier: 'medium',
      label: 'Workable with Gaps',
      grade: 'Needs Attention',
      textColor: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/60',
      borderColor: 'border-amber-200 dark:border-amber-800/60',
      ringColor: 'stroke-amber-500',
      fillColor: 'text-amber-500',
      barColor: 'bg-amber-500',
    };
  }
  return {
    tier: 'low',
    label: 'Vague or Incomplete',
    grade: 'Needs Detail',
    textColor: 'text-rose-700 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/60',
    borderColor: 'border-rose-200 dark:border-rose-800/60',
    ringColor: 'stroke-rose-500',
    fillColor: 'text-rose-500',
    barColor: 'bg-rose-500',
  };
}

export function PromptQuality({
  score,
  missingCount,
  attentionCount,
  goodCount,
  size = 'md',
  variant = 'circular',
  showDimensionBadges = true,
  dimensions,
  items,
  onSelectDimension,
}: PromptQualityProps) {
  const [expanded, setExpanded] = useState(false);
  const theme = getScoreTheme(score);

  // SVG circle calculations
  const radius = size === 'sm' ? 20 : size === 'lg' ? 32 : 26;
  const stroke = size === 'sm' ? 4 : size === 'lg' ? 6 : 5;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;
  const viewBoxSize = (radius + stroke) * 2;
  const center = viewBoxSize / 2;

  // Normalized dimension items for badges
  const badgeList: Array<{
    category: AnalysisCategory;
    status: AnalysisSeverity;
    label: string;
    tip?: string;
  }> = [];

  if (dimensions) {
    (Object.keys(dimensions) as AnalysisCategory[]).forEach((cat) => {
      badgeList.push({
        category: cat,
        status: dimensions[cat].status,
        label: CATEGORY_NAMES[cat] || cat,
        tip: dimensions[cat].tip,
      });
    });
  } else if (items) {
    items.forEach((item) => {
      badgeList.push({
        category: item.category,
        status: item.severity,
        label: CATEGORY_NAMES[item.category] || item.category,
        tip: item.explanation,
      });
    });
  }

  return (
    <div className="rounded-2xl border border-ink-200/80 bg-white p-4 shadow-soft transition-all duration-200 dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center justify-between gap-4">
        {/* Visual Gauge */}
        {variant === 'circular' ? (
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <svg
                width={viewBoxSize}
                height={viewBoxSize}
                viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                className="-rotate-90 transition-transform"
                role="img"
                aria-label={`Prompt quality score: ${normalizedScore} out of 100`}
              >
                {/* Background track */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  strokeWidth={stroke}
                  className="stroke-ink-100 dark:stroke-ink-800"
                />
                {/* Score arc */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className={`${theme.ringColor} transition-all duration-700 ease-out`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`font-mono text-base font-bold leading-none ${theme.textColor}`}>
                  {normalizedScore}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-ink-400 font-semibold">
                  /100
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-semibold text-ink-900 dark:text-white">Prompt Quality</h4>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${theme.bgColor} ${theme.textColor}`}
                >
                  {theme.grade}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{theme.label}</p>
            </div>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-ink-900 dark:text-white">Quality Score</span>
              <span className={`text-sm font-bold font-mono ${theme.textColor}`}>
                {normalizedScore}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
              <div
                className={`h-full rounded-full ${theme.barColor} transition-all duration-500 ease-out`}
                style={{ width: `${normalizedScore}%` }}
              />
            </div>
          </div>
        )}

        {/* Counter Summary Pills */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 font-medium border border-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60">
            <CheckCircle2 size={12} className="text-emerald-500" />
            {goodCount} Clear
          </span>
          {attentionCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-amber-700 font-medium border border-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60">
              <AlertTriangle size={12} className="text-amber-500" />
              {attentionCount} Review
            </span>
          )}
          {missingCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-2 py-1 text-ink-600 font-medium border border-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:border-ink-700">
              <CircleDashed size={12} className="text-ink-500" />
              {missingCount} Missing
            </span>
          )}
        </div>
      </div>

      {showDimensionBadges && badgeList.length > 0 && (
        <div className="mt-3.5 border-t border-ink-100/80 pt-3 dark:border-ink-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              Evaluated Dimensions ({badgeList.length})
            </span>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              {expanded ? 'Show less' : 'View all'}
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          <div
            className={`flex flex-wrap gap-1.5 transition-all ${
              expanded ? '' : 'max-h-[58px] overflow-hidden'
            }`}
          >
            {badgeList.map((item) => {
              const isGood = item.status === 'good';
              const isAttention = item.status === 'needs_attention';

              const badgeStyle = isGood
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-emerald-900/60'
                : isAttention
                ? 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/70 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60 dark:hover:bg-amber-900/60'
                : 'bg-ink-100 text-ink-600 border-ink-200/80 hover:bg-ink-200/60 dark:bg-ink-800 dark:text-ink-300 dark:border-ink-700 dark:hover:bg-ink-700';

              const Icon = isGood
                ? CheckCircle2
                : isAttention
                ? AlertTriangle
                : CircleDashed;

              return (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => onSelectDimension?.(item.category)}
                  title={item.tip || item.label}
                  className={`group inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-150 active:scale-95 ${badgeStyle}`}
                >
                  <Icon
                    size={12}
                    className={
                      isGood
                        ? 'text-emerald-500'
                        : isAttention
                        ? 'text-amber-500'
                        : 'text-ink-400'
                    }
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
