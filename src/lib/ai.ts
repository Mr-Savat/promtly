/**
 * Promptly AI Service Layer ("Grammarly for Prompts")
 * ----------------------------------------------------
 * High-speed One-Shot Architecture:
 * - Analyzes all 10 prompt dimensions in a single pass.
 * - Produces quality score (0-100), diagnosis, 1-3 targeted questions,
 *   and an instant improved prompt in under 1.5s.
 * - Backed by modern LLM APIs (OpenAI / Anthropic / Gemini / Supabase Edge)
 *   with strict Structured JSON output and automatic offline heuristic fallback.
 */

import {
  ANALYSIS_DIMENSIONS,
  type AnalysisCategory,
  type AnalysisSeverity,
  type PromptAnalysisPackage,
  type ClarifyingQuestion,
  type UserAnswer,
  type RefinedPrompt,
  type AnalysisMeta,
} from './types';
import {
  normalizeAnalysisPayload,
  normalizeRefinePayload,
  HIGH_QUALITY_THRESHOLD,
} from './aiRules';
import { analyzeHeuristically, refineLocally } from './aiHeuristics';
import {
  getActiveProviderConfig,
  callOpenAI,
  callGemini,
  callAnthropic,
  callSupabaseEdgeFunction,
  callLlmRefinement,
  type ProviderConfig,
} from './llmProviders';

/* ------------------------------------------------------------------ */
/* Re-exported Core Types & Legacy UI Contracts                        */
/* ------------------------------------------------------------------ */

export type {
  PromptAnalysisPackage,
  ClarifyingQuestion,
  UserAnswer,
  RefinedPrompt,
  AnalysisMeta,
};

export interface AnalysisItem {
  category: AnalysisCategory;
  severity: AnalysisSeverity;
  explanation: string;
  suggestion: string;
}

export interface PromptAnalysis {
  score: number;
  items: AnalysisItem[];
  missing: AnalysisItem[];
  needsAttention: AnalysisItem[];
  good: AnalysisItem[];
  summary: string;
  /** Attached one-shot package for instant downstream question & rewrite access */
  package?: PromptAnalysisPackage;
}

export interface QuestionOption {
  label: string;
  value: string;
}

export interface Question {
  id: string;
  category: AnalysisCategory;
  prompt: string;
  helper?: string;
  options?: QuestionOption[];
  allowCustom: boolean;
  placeholder?: string;
}

export interface CollectedAnswer {
  questionId: string;
  category: AnalysisCategory;
  answer: string;
}

export interface ImproveResult {
  improvedPrompt: string;
  summary: string;
  changes: string[];
}

export interface AiCallOptions {
  forceHeuristic?: boolean;
  timeoutMs?: number;
}

/* ------------------------------------------------------------------ */
/* Fast In-Memory Session Cache                                        */
/* ------------------------------------------------------------------ */

const packageCache = new Map<string, PromptAnalysisPackage>();

function getCacheKey(text: string): string {
  return text.trim().toLowerCase();
}

/* ------------------------------------------------------------------ */
/* One-Shot Analysis Engine                                            */
/* ------------------------------------------------------------------ */

/**
 * Analyzes the prompt in one single high-speed round-trip.
 * Returns dimensions, quality score, clarification questions (max 3),
 * and instant improved prompt.
 */
export async function analyzePromptOneShot(
  text: string,
  options: AiCallOptions = {}
): Promise<PromptAnalysisPackage> {
  const trimmed = text.trim();
  const cacheKey = getCacheKey(trimmed);

  if (!trimmed) {
    const emptyPkg: PromptAnalysisPackage = {
      score: 0,
      summary: 'Write something first to analyze.',
      dimensions: {
        goal: { status: 'missing', tip: 'Start with an action verb and state what you want to achieve.' },
        target_user: { status: 'missing', tip: 'Specify who this is for.' },
        task: { status: 'missing', tip: 'Define the specific action required.' },
        expected_output: { status: 'missing', tip: 'State the expected output format.' },
        constraints: { status: 'missing', tip: 'Set any constraints, style, or length limits.' },
        context: { status: 'missing', tip: 'Provide relevant context or background.' },
        technical: { status: 'missing', tip: 'Mention relevant technologies if applicable.' },
        input: { status: 'good', tip: 'No input provided.' },
        ambiguity: { status: 'missing', tip: 'Add details to avoid ambiguity.' },
        examples: { status: 'needs_attention', tip: 'Examples help clarify the expected result.' },
      },
      questions: [],
      instant_improved_prompt: '',
      meta: { source: 'heuristic', latency_ms: 0, cached: false },
    };
    return emptyPkg;
  }

  // Return cached result if prompt text hasn't changed
  if (packageCache.has(cacheKey)) {
    const cached = packageCache.get(cacheKey)!;
    return {
      ...cached,
      meta: { ...cached.meta, cached: true },
    };
  }

  const startTime = performance.now();
  const providerConfig = getActiveProviderConfig();

  // If force heuristic or no API configured, run local heuristic engine instantly
  if (options.forceHeuristic || !providerConfig) {
    const heuristicCore = analyzeHeuristically(trimmed);
    const latency_ms = Math.round(performance.now() - startTime);
    const pkg: PromptAnalysisPackage = {
      ...heuristicCore,
      meta: {
        source: 'heuristic',
        latency_ms,
        cached: false,
      },
    };
    packageCache.set(cacheKey, pkg);
    return pkg;
  }

  // Attempt live LLM structured execution with graceful fallback
  try {
    let rawResult: unknown = null;

    if (providerConfig.provider === 'openai') {
      rawResult = await callOpenAI(trimmed, {
        ...providerConfig,
        timeoutMs: options.timeoutMs ?? 5000,
      });
    } else if (providerConfig.provider === 'gemini') {
      rawResult = await callGemini(trimmed, {
        ...providerConfig,
        timeoutMs: options.timeoutMs ?? 5000,
      });
    } else if (providerConfig.provider === 'anthropic') {
      rawResult = await callAnthropic(trimmed, {
        ...providerConfig,
        timeoutMs: options.timeoutMs ?? 5000,
      });
    } else {
      // Try Supabase edge function
      rawResult = await callSupabaseEdgeFunction('promptly-analyze', { prompt: trimmed });
    }

    const normalized = normalizeAnalysisPayload(rawResult, trimmed);
    const latency_ms = Math.round(performance.now() - startTime);

    const pkg: PromptAnalysisPackage = {
      ...normalized,
      meta: {
        source: 'llm',
        provider: providerConfig.provider,
        model: providerConfig.model,
        latency_ms,
        cached: false,
      },
    };

    packageCache.set(cacheKey, pkg);
    return pkg;
  } catch (error) {
    console.warn('[Promptly AI] LLM call failed or timed out. Falling back to heuristic engine:', error);
    const heuristicCore = analyzeHeuristically(trimmed);
    const latency_ms = Math.round(performance.now() - startTime);

    const pkg: PromptAnalysisPackage = {
      ...heuristicCore,
      meta: {
        source: 'heuristic',
        fallback_reason: 'provider_error',
        latency_ms,
        cached: false,
      },
    };

    packageCache.set(cacheKey, pkg);
    return pkg;
  }
}

/* ------------------------------------------------------------------ */
/* Progressive Refinement Engine                                      */
/* ------------------------------------------------------------------ */

/**
 * Refines the prompt by incorporating answers from the clarification loop.
 */
export async function refinePromptWithAnswers(
  originalPrompt: string,
  analysis: PromptAnalysisPackage,
  userAnswers: UserAnswer[],
  options: AiCallOptions = {}
): Promise<RefinedPrompt> {
  const trimmed = originalPrompt.trim();
  const startTime = performance.now();

  // If no answers were provided, return instant improved prompt immediately
  if (!userAnswers || userAnswers.length === 0) {
    return {
      improved_prompt: analysis.instant_improved_prompt || trimmed,
      changes: ['Structured the prompt with clear role, objective, output format, and requirements.'],
      meta: { source: analysis.meta.source, latency_ms: 0, cached: true },
    };
  }

  const providerConfig = getActiveProviderConfig();

  // If force heuristic or no provider configured, use local refine engine
  if (options.forceHeuristic || !providerConfig) {
    const local = refineLocally(trimmed, userAnswers);
    return {
      improved_prompt: local.improved_prompt,
      changes: local.changes,
      meta: {
        source: 'heuristic',
        latency_ms: Math.round(performance.now() - startTime),
        cached: false,
      },
    };
  }

  try {
    const rawResult = await callLlmRefinement(trimmed, userAnswers, providerConfig);
    const normalized = normalizeRefinePayload(rawResult);
    return {
      improved_prompt: normalized.improved_prompt,
      changes: normalized.changes,
      meta: {
        source: 'llm',
        provider: providerConfig.provider,
        model: providerConfig.model,
        latency_ms: Math.round(performance.now() - startTime),
        cached: false,
      },
    };
  } catch (err) {
    console.warn('[Promptly AI] LLM refinement failed. Falling back to local refinement:', err);
    const local = refineLocally(trimmed, userAnswers);
    return {
      improved_prompt: local.improved_prompt,
      changes: local.changes,
      meta: {
        source: 'heuristic',
        fallback_reason: 'provider_error',
        latency_ms: Math.round(performance.now() - startTime),
        cached: false,
      },
    };
  }
}

/* ------------------------------------------------------------------ */
/* Adapters for Seamless UI & Backward Compatibility                  */
/* ------------------------------------------------------------------ */

export function packageToPromptAnalysis(pkg: PromptAnalysisPackage): PromptAnalysis {
  const items: AnalysisItem[] = ANALYSIS_DIMENSIONS.map((category) => {
    const dim = pkg.dimensions[category];
    return {
      category,
      severity: dim.status,
      explanation: dim.tip,
      suggestion: dim.status === 'good' ? '' : dim.tip,
    };
  });

  return {
    score: pkg.score,
    items,
    missing: items.filter((i) => i.severity === 'missing'),
    needsAttention: items.filter((i) => i.severity === 'needs_attention'),
    good: items.filter((i) => i.severity === 'good'),
    summary: pkg.summary,
    package: pkg,
  };
}

export function clarifyingQuestionToQuestion(q: ClarifyingQuestion): Question {
  return {
    id: q.id,
    category: q.dimension,
    prompt: q.question,
    helper: `Clarifying your ${q.dimension.replace('_', ' ')} helps the AI give accurate results.`,
    options: q.options.map((opt) => ({ label: opt.label, value: opt.value })),
    allowCustom: q.allow_custom,
    placeholder: 'Type your custom answer...',
  };
}

/* ------------------------------------------------------------------ */
/* Legacy API Functions (Powering usePromptFlow without changes)      */
/* ------------------------------------------------------------------ */

/**
 * 1. analyzePrompt: Calls One-Shot analysis and caches full package.
 */
export async function analyzePrompt(text: string): Promise<PromptAnalysis> {
  const pkg = await analyzePromptOneShot(text);
  return packageToPromptAnalysis(pkg);
}

/**
 * 2. generateQuestions: Returns pre-generated questions from the one-shot package in 0ms!
 */
export async function generateQuestions(
  text: string,
  analysis: PromptAnalysis,
  alreadyAnswered: AnalysisCategory[] = []
): Promise<Question[]> {
  const cacheKey = getCacheKey(text);
  const pkg = analysis.package || packageCache.get(cacheKey) || (await analyzePromptOneShot(text));

  const answeredSet = new Set(alreadyAnswered);
  const remaining = pkg.questions.filter((q) => !answeredSet.has(q.dimension));

  // If score > 85, no questions are generated per product specification
  if (pkg.score > HIGH_QUALITY_THRESHOLD) {
    return [];
  }

  return remaining.map(clarifyingQuestionToQuestion);
}

/**
 * 3. improvePrompt: Progressive enhancement using answers or instant synthesis.
 */
export async function improvePrompt(
  originalText: string,
  analysis: PromptAnalysis,
  answers: CollectedAnswer[]
): Promise<ImproveResult> {
  const cacheKey = getCacheKey(originalText);
  const pkg = analysis.package || packageCache.get(cacheKey) || (await analyzePromptOneShot(originalText));

  const userAnswers: UserAnswer[] = answers.map((a) => ({
    question_id: a.questionId,
    dimension: a.category,
    value: a.answer,
  }));

  const refined = await refinePromptWithAnswers(originalText, pkg, userAnswers);

  const summary =
    answers.length === 0
      ? 'Polished your request with clear structure and production-grade requirements.'
      : `Combined your request with ${answers.length} ${
          answers.length === 1 ? 'clarification' : 'clarifications'
        } into a high-performing prompt.`;

  return {
    improvedPrompt: refined.improved_prompt,
    summary,
    changes: refined.changes,
  };
}
