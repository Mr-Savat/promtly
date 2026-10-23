export type PromptStatus = 'draft' | 'analyzing' | 'needs_info' | 'ready' | 'error';

export type AnalysisCategory =
  | 'goal'
  | 'context'
  | 'target_user'
  | 'task'
  | 'input'
  | 'expected_output'
  | 'constraints'
  | 'examples'
  | 'technical'
  | 'ambiguity';

export type AnalysisSeverity = 'good' | 'needs_attention' | 'missing';

export interface PromptRow {
  id: string;
  user_id: string;
  original_text: string;
  improved_text: string | null;
  status: PromptStatus;
  quality_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface PromptAnalysisRow {
  id: string;
  prompt_id: string;
  category: AnalysisCategory;
  severity: AnalysisSeverity;
  explanation: string;
  suggestion: string | null;
}

export interface PromptQuestionRow {
  id: string;
  prompt_id: string;
  question: string;
  answer: string | null;
  created_at: string;
  answered_at: string | null;
}

export interface PromptWithRelations extends PromptRow {
  analyses?: PromptAnalysisRow[];
  questions?: PromptQuestionRow[];
}

/* ------------------------------------------------------------------ */
/* AI wire contract                                                    */
/* Shapes returned by the `promptly-analyze` edge function (snake_case */
/* to match the JSON schema the LLM is constrained to).                */
/* ------------------------------------------------------------------ */

/** All 10 dimensions, in the order they are evaluated and displayed. */
export const ANALYSIS_DIMENSIONS = [
  'goal',
  'target_user',
  'task',
  'expected_output',
  'constraints',
  'context',
  'technical',
  'input',
  'ambiguity',
  'examples',
] as const satisfies readonly AnalysisCategory[];

export interface DimensionResult {
  status: AnalysisSeverity;
  /** One concise sentence: what is wrong (or right) and how to fix it. */
  tip: string;
}

export type DimensionMap = Record<AnalysisCategory, DimensionResult>;

export interface PillOption {
  /** Short text shown on the pill (1-4 words). */
  label: string;
  /** Phrase merged into the prompt when the pill is selected. */
  value: string;
}

export interface ClarifyingQuestion {
  id: string;
  dimension: AnalysisCategory;
  question: string;
  /** 3-4 quick-select pills. */
  options: PillOption[];
  allow_custom: boolean;
}

export type AnalysisSource = 'llm' | 'heuristic';

export type LlmProvider = 'openai' | 'anthropic' | 'gemini';

export interface AnalysisMeta {
  source: AnalysisSource;
  provider?: LlmProvider;
  model?: string;
  /** Round-trip time measured on the client. */
  latency_ms: number;
  cached: boolean;
  /** Set when `source === 'heuristic'` because the LLM path failed. */
  fallback_reason?: AiErrorCode;
}

/** The full one-shot result: analysis + questions + instant rewrite. */
export interface PromptAnalysisPackage {
  /** 0-100, computed deterministically from dimension statuses. */
  score: number;
  summary: string;
  dimensions: DimensionMap;
  /** 0-3 questions; always empty when score > 85. */
  questions: ClarifyingQuestion[];
  /** Rewrite using sensible defaults, available before any answers. */
  instant_improved_prompt: string;
  meta: AnalysisMeta;
}

export interface UserAnswer {
  question_id: string;
  dimension: AnalysisCategory;
  /** Pill `value` or free-text custom answer. */
  value: string;
}

export interface RefinedPrompt {
  improved_prompt: string;
  /** Human-readable changelog, one sentence per item. */
  changes: string[];
  meta: AnalysisMeta;
}

export type AiErrorCode =
  | 'disabled'
  | 'timeout'
  | 'rate_limited'
  | 'unauthorized'
  | 'invalid_input'
  | 'provider_error'
  | 'invalid_response'
  | 'network';
