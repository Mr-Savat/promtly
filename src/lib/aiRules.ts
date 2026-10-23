/**
 * Promptly AI rules & validation
 * ------------------------------
 * Single source of truth for the product rules, applied to BOTH LLM output
 * and heuristic output so the UI never sees an inconsistent package:
 *
 *  - all 10 dimensions present with a valid status and a 1-sentence tip
 *  - score computed deterministically from statuses (not trusted from model)
 *  - max 3 questions, only for non-"good" dimensions, highest leverage first
 *  - 3-4 pill options per question
 *  - zero questions when score > 85
 *
 * LLM output is treated as untrusted input: anything malformed throws
 * `InvalidAiResponseError`, which the caller turns into a heuristic fallback.
 */

import {
  ANALYSIS_DIMENSIONS,
  type AnalysisCategory,
  type AnalysisSeverity,
  type ClarifyingQuestion,
  type DimensionMap,
  type DimensionResult,
  type PillOption,
} from './types';

export const MAX_QUESTIONS = 3;
export const MIN_OPTIONS = 3;
export const MAX_OPTIONS = 4;
export const HIGH_QUALITY_THRESHOLD = 85;
export const MAX_PROMPT_CHARS = 8000;

export class InvalidAiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAiResponseError';
  }
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

/**
 * Weights sum to 100. Core intent dimensions dominate; optional ones
 * (examples, input) barely move the score, because most good prompts
 * legitimately omit them.
 */
export const DIMENSION_WEIGHTS: Record<AnalysisCategory, number> = {
  goal: 16,
  expected_output: 14,
  task: 12,
  target_user: 10,
  context: 10,
  constraints: 10,
  ambiguity: 10,
  technical: 8,
  input: 5,
  examples: 5,
};

const STATUS_FACTOR: Record<AnalysisSeverity, number> = {
  good: 1,
  needs_attention: 0.5,
  missing: 0,
};

export function computeScore(dimensions: DimensionMap): number {
  let score = 0;
  for (const dim of ANALYSIS_DIMENSIONS) {
    score += DIMENSION_WEIGHTS[dim] * STATUS_FACTOR[dimensions[dim].status];
  }
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function buildSummary(score: number, dimensions: DimensionMap): string {
  const missing = ANALYSIS_DIMENSIONS.filter((d) => dimensions[d].status === 'missing').length;
  const attention = ANALYSIS_DIMENSIONS.filter(
    (d) => dimensions[d].status === 'needs_attention'
  ).length;

  if (score > HIGH_QUALITY_THRESHOLD) {
    return 'Your request is clear and complete. Promptly only polished the wording.';
  }
  if (missing > 0) {
    return `Your request is understandable, but ${missing} important ${
      missing === 1 ? 'detail is' : 'details are'
    } missing. Answer a few quick questions to fill the gaps.`;
  }
  return `Your request is on the right track. ${attention} ${
    attention === 1 ? 'area could' : 'areas could'
  } be clearer for better results.`;
}

/* ------------------------------------------------------------------ */
/* Default pill options (used to repair / pad LLM questions)           */
/* ------------------------------------------------------------------ */

export const DEFAULT_QUESTIONS: Record<
  AnalysisCategory,
  { question: string; options: PillOption[] }
> = {
  goal: {
    question: 'What is the main outcome you want?',
    options: [
      { label: 'Build something', value: 'build a working solution' },
      { label: 'Explain a topic', value: 'explain the topic clearly' },
      { label: 'Write content', value: 'write polished content' },
      { label: 'Analyze data', value: 'analyze the data and report findings' },
    ],
  },
  target_user: {
    question: 'Who will use or read this?',
    options: [
      { label: 'Developers', value: 'developers' },
      { label: 'Beginners', value: 'beginners with no prior experience' },
      { label: 'Executives', value: 'busy executives' },
      { label: 'General public', value: 'a non-technical general audience' },
    ],
  },
  task: {
    question: 'Which action should the AI take?',
    options: [
      { label: 'Create', value: 'create' },
      { label: 'Explain', value: 'explain' },
      { label: 'Summarize', value: 'summarize' },
      { label: 'Review', value: 'review and critique' },
    ],
  },
  expected_output: {
    question: 'What should the result look like?',
    options: [
      { label: 'Step-by-step list', value: 'a numbered step-by-step list' },
      { label: 'Full working code', value: 'complete, runnable code' },
      { label: 'Short summary', value: 'a short summary of 3-5 sentences' },
      { label: 'Table', value: 'a Markdown table' },
    ],
  },
  constraints: {
    question: 'Any limits or style requirements?',
    options: [
      { label: 'Concise', value: 'keep it concise' },
      { label: 'Detailed', value: 'be thorough and detailed' },
      { label: 'Professional tone', value: 'use a professional tone' },
      { label: 'Friendly tone', value: 'use a friendly, conversational tone' },
    ],
  },
  context: {
    question: 'What is the situation behind this request?',
    options: [
      { label: 'Personal project', value: 'this is for a personal side project' },
      { label: 'Work task', value: 'this is for a work deliverable' },
      { label: 'Learning', value: 'I am learning this topic' },
      { label: 'Client request', value: 'this is for a client' },
    ],
  },
  technical: {
    question: 'Which technology or stack should be used?',
    options: [
      { label: 'React', value: 'React with TypeScript' },
      { label: 'Next.js', value: 'Next.js (App Router) with TypeScript' },
      { label: 'Python', value: 'Python 3' },
      { label: 'Not sure', value: 'a modern, widely supported stack of your choice' },
    ],
  },
  input: {
    question: 'What material should the AI work from?',
    options: [
      { label: 'I will paste it', value: 'I will paste the source material below' },
      { label: 'Use general knowledge', value: 'use general knowledge, no source material' },
      { label: 'A file / dataset', value: 'a file or dataset I will provide' },
    ],
  },
  ambiguity: {
    question: 'Which quality matters most here?',
    options: [
      { label: 'Accuracy', value: 'prioritize factual accuracy' },
      { label: 'Simplicity', value: 'prioritize simplicity and clarity' },
      { label: 'Creativity', value: 'prioritize originality and creativity' },
      { label: 'Speed', value: 'prioritize a fast, practical answer' },
    ],
  },
  examples: {
    question: 'Should the AI follow a reference style?',
    options: [
      { label: 'Include examples', value: 'include 2-3 concrete examples' },
      { label: 'No examples', value: 'no examples needed' },
      { label: 'I will give one', value: 'I will provide a reference example' },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Normalization                                                       */
/* ------------------------------------------------------------------ */

const STATUSES: readonly AnalysisSeverity[] = ['good', 'needs_attention', 'missing'];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function cleanText(v: unknown, maxLen: number): string {
  if (typeof v !== 'string') return '';
  return v.replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

function isDimension(v: unknown): v is AnalysisCategory {
  return typeof v === 'string' && (ANALYSIS_DIMENSIONS as readonly string[]).includes(v);
}

/**
 * Strip accidental Markdown code fences / prose around a JSON payload.
 * Structured output modes should never produce these, but some providers
 * and proxies still do; this keeps us at "zero markdown wraps".
 */
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const body = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(body);
  } catch {
    const start = body.indexOf('{');
    const end = body.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(body.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    throw new InvalidAiResponseError('Response is not valid JSON.');
  }
}

/** Remove a Markdown code fence wrapped around a whole prompt string. */
export function stripFence(text: string): string {
  const m = text.trim().match(/^```[a-z]*\s*([\s\S]*?)\s*```$/i);
  return (m ? m[1] : text).trim();
}

export function normalizeDimensions(raw: unknown): DimensionMap {
  if (!isRecord(raw)) throw new InvalidAiResponseError('`dimensions` must be an object.');
  const out = {} as DimensionMap;
  for (const dim of ANALYSIS_DIMENSIONS) {
    const entry = raw[dim];
    if (!isRecord(entry)) throw new InvalidAiResponseError(`Missing dimension "${dim}".`);
    const status = entry.status;
    if (typeof status !== 'string' || !STATUSES.includes(status as AnalysisSeverity)) {
      throw new InvalidAiResponseError(`Invalid status for "${dim}".`);
    }
    const tip = cleanText(entry.tip, 220);
    out[dim] = {
      status: status as AnalysisSeverity,
      tip: tip || DEFAULT_QUESTIONS[dim].question,
    } satisfies DimensionResult;
  }
  return out;
}

function normalizeOptions(raw: unknown, dim: AnalysisCategory): PillOption[] {
  const seen = new Set<string>();
  const options: PillOption[] = [];
  if (Array.isArray(raw)) {
    for (const o of raw) {
      if (!isRecord(o)) continue;
      const label = cleanText(o.label, 40);
      const value = cleanText(o.value, 160) || label;
      const key = label.toLowerCase();
      if (!label || seen.has(key)) continue;
      seen.add(key);
      options.push({ label, value });
      if (options.length === MAX_OPTIONS) break;
    }
  }
  // Pad from defaults so every question has at least MIN_OPTIONS pills.
  for (const fallback of DEFAULT_QUESTIONS[dim].options) {
    if (options.length >= MIN_OPTIONS) break;
    if (seen.has(fallback.label.toLowerCase())) continue;
    seen.add(fallback.label.toLowerCase());
    options.push(fallback);
  }
  return options;
}

/**
 * Leverage order used to rank questions: a missing core dimension beats a
 * vague optional one.
 */
function leverage(dim: AnalysisCategory, dims: DimensionMap): number {
  const severityBoost = dims[dim].status === 'missing' ? 2 : 1;
  return DIMENSION_WEIGHTS[dim] * severityBoost;
}

export function normalizeQuestions(
  raw: unknown,
  dimensions: DimensionMap,
  score: number
): ClarifyingQuestion[] {
  if (score > HIGH_QUALITY_THRESHOLD) return [];

  const used = new Set<AnalysisCategory>();
  const questions: ClarifyingQuestion[] = [];

  if (Array.isArray(raw)) {
    for (const q of raw) {
      if (!isRecord(q) || !isDimension(q.dimension)) continue;
      const dim = q.dimension;
      // Never ask about something that is already clear, never ask twice.
      if (dimensions[dim].status === 'good' || used.has(dim)) continue;
      const question = cleanText(q.question, 160) || DEFAULT_QUESTIONS[dim].question;
      used.add(dim);
      questions.push({
        id: `q-${dim}`,
        dimension: dim,
        question,
        options: normalizeOptions(q.options, dim),
        allow_custom: typeof q.allow_custom === 'boolean' ? q.allow_custom : true,
      });
    }
  }

  questions.sort((a, b) => leverage(b.dimension, dimensions) - leverage(a.dimension, dimensions));
  return questions.slice(0, MAX_QUESTIONS);
}

/** Build questions purely from dimension statuses (heuristic path). */
export function defaultQuestionsFor(
  dimensions: DimensionMap,
  score: number
): ClarifyingQuestion[] {
  if (score > HIGH_QUALITY_THRESHOLD) return [];
  const candidates = ANALYSIS_DIMENSIONS.filter((d) => dimensions[d].status !== 'good')
    // Don't interrogate users about optional dimensions they merely skipped.
    .filter((d) => dimensions[d].status === 'missing' || DIMENSION_WEIGHTS[d] >= 10)
    .sort((a, b) => leverage(b, dimensions) - leverage(a, dimensions))
    .slice(0, MAX_QUESTIONS);

  return candidates.map((dim) => ({
    id: `q-${dim}`,
    dimension: dim,
    question: DEFAULT_QUESTIONS[dim].question,
    options: DEFAULT_QUESTIONS[dim].options.slice(0, MAX_OPTIONS),
    allow_custom: true,
  }));
}

export interface NormalizedAnalysisCore {
  score: number;
  summary: string;
  dimensions: ReturnType<typeof normalizeDimensions>;
  questions: ClarifyingQuestion[];
  instant_improved_prompt: string;
}

/** Validate + repair a raw LLM analysis payload. Throws on unusable data. */
export function normalizeAnalysisPayload(
  raw: unknown,
  originalPrompt: string
): NormalizedAnalysisCore {
  if (!isRecord(raw)) throw new InvalidAiResponseError('Payload must be an object.');
  const dimensions = normalizeDimensions(raw.dimensions);
  const score = computeScore(dimensions);
  const questions = normalizeQuestions(raw.questions, dimensions, score);

  const improved =
    typeof raw.instant_improved_prompt === 'string'
      ? stripFence(raw.instant_improved_prompt).slice(0, MAX_PROMPT_CHARS)
      : '';

  return {
    score,
    summary: buildSummary(score, dimensions),
    dimensions,
    questions,
    // An empty rewrite is useless; keep the original rather than nothing.
    instant_improved_prompt: improved || originalPrompt,
  };
}

export function normalizeRefinePayload(raw: unknown): {
  improved_prompt: string;
  changes: string[];
} {
  if (!isRecord(raw)) throw new InvalidAiResponseError('Payload must be an object.');
  const improved =
    typeof raw.improved_prompt === 'string'
      ? stripFence(raw.improved_prompt).slice(0, MAX_PROMPT_CHARS)
      : '';
  if (!improved) throw new InvalidAiResponseError('`improved_prompt` is empty.');
  const changes = Array.isArray(raw.changes)
    ? raw.changes.map((c) => cleanText(c, 200)).filter(Boolean).slice(0, 8)
    : [];
  return { improved_prompt: improved, changes };
}
