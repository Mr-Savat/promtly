/**
 * Promptly heuristic engine (offline fallback)
 * --------------------------------------------
 * Used when the LLM path is disabled, times out, is rate-limited, or returns
 * unusable output. It produces the SAME shapes as the LLM path, and its
 * output is passed through the same rules in `aiRules.ts`.
 *
 * Prompts are built from a `PromptSpec`, so the instant rewrite and the
 * answer-merge (`refineLocally`) share one renderer and stay consistent.
 */

import {
  buildSummary,
  computeScore,
  defaultQuestionsFor,
  type NormalizedAnalysisCore,
} from './aiRules';
import type { AnalysisCategory, DimensionMap, UserAnswer } from './types';

/* ------------------------------------------------------------------ */
/* Lexicons                                                            */
/* ------------------------------------------------------------------ */

const AUDIENCE = [
  'beginner', 'student', 'teacher', 'kid', 'child', 'children', 'developer',
  'designer', 'team', 'manager', 'executive', 'client', 'customer', 'users',
  'audience', 'reader', 'senior', 'junior', 'non-technical', 'engineer',
  'marketer', 'researcher', 'year-old', 'stakeholder', 'investor',
];
const OUTPUT = [
  'list', 'bullet', 'table', 'json', 'markdown', 'html', 'code', 'snippet',
  'summary', 'essay', 'email', 'report', 'outline', 'steps', 'numbered',
  'format', 'document', 'diagram', 'guide', 'tutorial', 'paragraph', 'slide',
];
const TECH = [
  'react', 'next.js', 'nextjs', 'vue', 'svelte', 'angular', 'node', 'python',
  'django', 'flask', 'fastapi', 'java', 'kotlin', 'swift', 'golang', 'rust',
  'ruby', 'rails', 'php', 'laravel', 'c#', '.net', 'typescript', 'javascript',
  'tailwind', 'sql', 'postgres', 'mysql', 'mongodb', 'supabase', 'firebase',
  'aws', 'docker', 'kubernetes', 'flutter',
];
const CONSTRAINTS = [
  'must', 'should', 'avoid', "don't", 'do not', 'limit', 'maximum', 'minimum',
  'under ', 'within', 'less than', 'more than', 'exactly', 'only', 'at least',
  'tone', 'formal', 'casual', 'professional', 'friendly', 'concise',
  'detailed', 'budget', 'deadline', 'words', 'characters', 'sentences',
];
const EXAMPLES = ['example', 'e.g.', 'such as', 'like this', 'sample', 'similar to'];
const CONTEXT = [
  'because', 'since', 'context', 'background', 'currently', 'already',
  'previously', 'in order to', 'so that', 'problem is', 'we are', 'i am',
  "i'm", 'my team', 'our company', 'i have', 'we have',
];
const VAGUE = [
  'stuff', 'things', 'something', 'whatever', 'nice', 'cool', 'awesome',
  'better', 'good', 'some', 'various', 'etc', 'kind of', 'sort of', 'a lot',
];
const TASK_VERBS = [
  'create', 'build', 'make', 'write', 'generate', 'explain', 'design',
  'develop', 'implement', 'analyze', 'analyse', 'summarize', 'translate',
  'convert', 'review', 'debug', 'fix', 'refactor', 'optimize', 'plan',
  'draft', 'compose', 'describe', 'compare', 'evaluate', 'research',
  'outline', 'teach', 'list', 'suggest', 'brainstorm',
];
const INPUT_HINTS = [
  'this text', 'this code', 'this data', 'this article', 'this email',
  'this document', 'this file', 'the following', 'below', 'attached', 'dataset',
];

type RequestKind = 'code' | 'creative' | 'explanation' | 'analysis' | 'general';

function has(lower: string, words: string[]): boolean {
  return words.some((w) => lower.includes(w));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function classify(lower: string): RequestKind {
  if (/\b(code|function|component|api|app|dashboard|website|landing page|page|feature|bug|error|refactor|implement|script|database|backend|frontend)\b/.test(lower))
    return 'code';
  if (/\b(analy[sz]e|summari[sz]e|dataset|data|trends|metrics|report on|compare)\b/.test(lower))
    return 'analysis';
  if (/\b(explain|what is|how does|teach|define|why does)\b/.test(lower)) return 'explanation';
  if (/\b(write|story|poem|essay|email|article|post|caption|headline|copy|blog|script)\b/.test(lower))
    return 'creative';
  return 'general';
}

/* ------------------------------------------------------------------ */
/* Analysis                                                            */
/* ------------------------------------------------------------------ */

export function analyzeHeuristically(text: string): NormalizedAnalysisCore {
  const prompt = text.trim();
  const lower = prompt.toLowerCase();
  const words = wordCount(prompt);
  const kind = classify(lower);
  const hasVerb = has(lower, TASK_VERBS);
  const needsSource = /\b(summari[sz]e|translate|review|proofread|analy[sz]e this|fix this|rewrite)\b/.test(lower);

  const d = {} as DimensionMap;

  d.goal =
    hasVerb && words >= 4
      ? { status: 'good', tip: 'The core intent of your request is clear.' }
      : words < 4
        ? { status: 'missing', tip: 'State the end result you want in one sentence, starting with a verb.' }
        : { status: 'needs_attention', tip: 'Say what "done" looks like so the AI knows the target outcome.' };

  d.task = hasVerb
    ? { status: 'good', tip: 'The action you want is explicit.' }
    : { status: 'missing', tip: 'Use a clear action verb such as build, explain, summarize, or review.' };

  const audienceRelevant = kind !== 'analysis' || words > 10;
  d.target_user =
    has(lower, AUDIENCE) || /\bfor (my|our) \w+/.test(lower)
      ? { status: 'good', tip: 'You named who this is for.' }
      : audienceRelevant
        ? {
            status: kind === 'general' ? 'needs_attention' : 'missing',
            tip: 'Name the audience; it changes tone, depth, and assumptions.',
          }
        : { status: 'good', tip: 'Audience is not critical for this kind of request.' };

  d.expected_output = has(lower, OUTPUT) || /\bas an? \w+/.test(lower)
    ? { status: 'good', tip: 'You described the shape of the output.' }
    : {
        status: kind === 'general' ? 'needs_attention' : 'missing',
        tip: 'Describe the output format: a list, a table, full code, a short email, etc.',
      };

  d.constraints = has(lower, CONSTRAINTS)
    ? { status: 'good', tip: 'You set limits or style requirements.' }
    : { status: 'needs_attention', tip: 'Add limits such as length, tone, or things to avoid.' };

  d.context =
    has(lower, CONTEXT) || words > 25
      ? { status: 'good', tip: 'You gave useful background.' }
      : {
          status: words < 6 ? 'missing' : 'needs_attention',
          tip: 'Add one sentence on why you need this or what you already have.',
        };

  d.technical =
    kind !== 'code'
      ? { status: 'good', tip: 'No specific technology is needed for this request.' }
      : has(lower, TECH)
        ? { status: 'good', tip: 'You specified the technology stack.' }
        : { status: 'missing', tip: 'Name the language or framework so the AI does not guess.' };

  d.input = has(lower, INPUT_HINTS) || /```/.test(prompt)
    ? { status: 'good', tip: 'You referenced the material to work from.' }
    : needsSource
      ? { status: 'missing', tip: 'Paste the text, code, or data the AI should work on.' }
      : { status: 'good', tip: 'No source material is required for this request.' };

  const vague = VAGUE.filter((w) => new RegExp(`\\b${w}\\b`).test(lower));
  d.ambiguity =
    words < 4
      ? { status: 'missing', tip: 'The request is too short to interpret reliably; add specifics.' }
      : vague.length > 0
        ? {
            status: 'needs_attention',
            tip: `Replace vague words (${vague.slice(0, 3).map((w) => `"${w}"`).join(', ')}) with concrete details.`,
          }
        : { status: 'good', tip: 'Wording is specific and unambiguous.' };

  d.examples = has(lower, EXAMPLES)
    ? { status: 'good', tip: 'You included an example, which sharpens the output.' }
    : { status: 'needs_attention', tip: 'Optional: a short example of the desired result improves accuracy.' };

  const score = computeScore(d);
  return {
    score,
    summary: buildSummary(score, d),
    dimensions: d,
    questions: defaultQuestionsFor(d, score),
    instant_improved_prompt: renderSpec(buildSpec(prompt, kind)),
  };
}

/* ------------------------------------------------------------------ */
/* Prompt spec + renderer                                              */
/* ------------------------------------------------------------------ */

interface PromptSpec {
  role: string;
  task: string;
  audience?: string;
  context?: string;
  technical?: string;
  input?: string;
  output: string;
  constraints: string[];
  examples?: string;
}

const KIND_DEFAULTS: Record<RequestKind, { role: string; output: string; constraints: string[] }> = {
  code: {
    role: 'a senior software engineer',
    output: 'Complete, runnable code with a brief explanation of key decisions.',
    constraints: ['Follow current best practices for readability and accessibility.', 'Note any assumptions you make.'],
  },
  creative: {
    role: 'an experienced professional writer',
    output: 'Polished, ready-to-use text.',
    constraints: ['Keep the tone consistent and the language clear.'],
  },
  explanation: {
    role: 'a patient expert teacher',
    output: 'A clear explanation that builds from fundamentals, with one concrete example.',
    constraints: ['Avoid unexplained jargon.'],
  },
  analysis: {
    role: 'a meticulous data analyst',
    output: 'Key findings as bullet points, followed by a short conclusion.',
    constraints: ['Separate facts from interpretation.', 'Flag any data quality issues.'],
  },
  general: {
    role: 'a knowledgeable assistant',
    output: 'A well-structured, concise answer.',
    constraints: ['Be specific and actionable.'],
  },
};

function buildSpec(original: string, kind: RequestKind = classify(original.toLowerCase())): PromptSpec {
  const defaults = KIND_DEFAULTS[kind];
  const task = original.replace(/\s+/g, ' ').trim().replace(/[.!]?$/, '.');
  return {
    role: defaults.role,
    task: task.charAt(0).toUpperCase() + task.slice(1),
    output: defaults.output,
    constraints: [...defaults.constraints],
  };
}

function renderSpec(spec: PromptSpec): string {
  const lines = [`You are ${spec.role}.`, '', `Task: ${spec.task}`];
  if (spec.audience) lines.push(`Audience: ${spec.audience}`);
  if (spec.context) lines.push(`Context: ${spec.context}`);
  if (spec.technical) lines.push(`Technology: ${spec.technical}`);
  if (spec.input) lines.push(`Input: ${spec.input}`);
  lines.push(`Output format: ${spec.output}`);
  if (spec.examples) lines.push(`Examples: ${spec.examples}`);
  if (spec.constraints.length) {
    lines.push('', 'Requirements:', ...spec.constraints.map((c) => `- ${c}`));
  }
  lines.push('', 'If anything important is unclear, ask me one focused question before answering.');
  return lines.join('\n');
}

function sentence(s: string): string {
  const t = s.trim().replace(/[.!]?$/, '.');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Deterministic merge of user answers into the spec (refine fallback). */
export function refineLocally(
  originalPrompt: string,
  answers: UserAnswer[]
): { improved_prompt: string; changes: string[] } {
  const spec = buildSpec(originalPrompt);
  const changes: string[] = [];
  const apply: Record<AnalysisCategory, (v: string) => void> = {
    goal: (v) => { spec.task = `${sentence(v)} (Original request: ${spec.task})`; changes.push('Clarified the main goal.'); },
    task: (v) => { spec.task = `${sentence(v)}: ${spec.task}`; changes.push(`Made the action explicit: ${v}.`); },
    target_user: (v) => { spec.audience = sentence(v); changes.push(`Added the target audience: ${v}.`); },
    expected_output: (v) => { spec.output = sentence(v); changes.push(`Specified the output format: ${v}.`); },
    constraints: (v) => { spec.constraints.unshift(sentence(v)); changes.push(`Added a constraint: ${v}.`); },
    context: (v) => { spec.context = sentence(v); changes.push('Added background context.'); },
    technical: (v) => { spec.technical = sentence(v); changes.push(`Specified the technology: ${v}.`); },
    input: (v) => { spec.input = sentence(v); changes.push('Clarified the input material.'); },
    ambiguity: (v) => { spec.constraints.unshift(sentence(v)); changes.push(`Resolved ambiguity: ${v}.`); },
    examples: (v) => { spec.examples = sentence(v); changes.push('Clarified the use of examples.'); },
  };

  for (const a of answers) {
    const value = a.value.trim();
    if (value) apply[a.dimension](value);
  }
  if (changes.length === 0) {
    changes.push('Added a role, explicit output format, and requirements.');
  }
  return { improved_prompt: renderSpec(spec), changes };
}
