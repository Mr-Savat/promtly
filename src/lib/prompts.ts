import { supabase } from './supabase';
import type {
  PromptAnalysisRow,
  PromptQuestionRow,
  PromptRow,
  PromptStatus,
} from './types';
import type { AnalysisItem, CollectedAnswer, PromptAnalysis } from './ai';

const LOCAL_PROMPTS_KEY = 'promptly_local_prompts';

function getLocalPrompts(): PromptRow[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROMPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPrompts(prompts: PromptRow[]): void {
  try {
    localStorage.setItem(LOCAL_PROMPTS_KEY, JSON.stringify(prompts));
  } catch {}
}

export interface CreatePromptInput {
  originalText: string;
}

export async function createPrompt(input: CreatePromptInput): Promise<PromptRow> {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .insert({ original_text: input.originalText, status: 'draft' })
      .select()
      .single();

    if (!error && data) {
      return data as PromptRow;
    }
  } catch {}

  // Fallback for Demo mode or offline
  const localRow: PromptRow = {
    id: `demo-${Date.now()}`,
    user_id: 'demo-user-promptly',
    original_text: input.originalText,
    improved_text: null,
    status: 'draft',
    quality_score: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  saveLocalPrompts([localRow, ...getLocalPrompts()]);
  return localRow;
}

export async function updatePrompt(
  id: string,
  patch: Partial<
    Pick<PromptRow, 'original_text' | 'improved_text' | 'status' | 'quality_score'>
  >
): Promise<void> {
  try {
    const { error } = await supabase
      .from('prompts')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) return;
  } catch {}

  // Fallback for Demo mode
  const prompts = getLocalPrompts();
  const idx = prompts.findIndex((p) => p.id === id);
  if (idx !== -1) {
    prompts[idx] = {
      ...prompts[idx],
      ...patch,
      updated_at: new Date().toISOString(),
    };
    saveLocalPrompts(prompts);
  }
}

export async function saveAnalyses(
  promptId: string,
  analysis: PromptAnalysis
): Promise<void> {
  try {
    // Replace any existing analyses for this prompt
    await supabase.from('prompt_analyses').delete().eq('prompt_id', promptId);

    const rows: Omit<PromptAnalysisRow, 'id'>[] = analysis.items.map((item) => ({
      prompt_id: promptId,
      category: item.category,
      severity: item.severity,
      explanation: item.explanation,
      suggestion: item.suggestion || null,
    }));

    if (rows.length === 0) return;
    await supabase.from('prompt_analyses').insert(rows);
  } catch {}
}

export async function saveQuestion(
  promptId: string,
  question: string
): Promise<PromptQuestionRow> {
  try {
    const { data, error } = await supabase
      .from('prompt_questions')
      .insert({ prompt_id: promptId, question })
      .select()
      .single();
    if (!error && data) return data as PromptQuestionRow;
  } catch {}

  return {
    id: `local-q-${Date.now()}`,
    prompt_id: promptId,
    question,
    answer: null,
    answered_at: null,
    created_at: new Date().toISOString(),
  };
}

export async function answerQuestion(
  questionId: string,
  answer: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('prompt_questions')
      .update({ answer, answered_at: new Date().toISOString() })
      .eq('id', questionId);
    if (!error) return;
  } catch {}
}

export interface PromptHistoryItem {
  id: string;
  original_text: string;
  improved_text: string | null;
  status: PromptStatus;
  quality_score: number | null;
  created_at: string;
}

export async function fetchPromptHistory(): Promise<PromptHistoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select(
        'id, original_text, improved_text, status, quality_score, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data && data.length > 0) {
      return data as PromptHistoryItem[];
    }
  } catch {}

  // Fallback to local storage (Demo account items)
  const local = getLocalPrompts();
  if (local.length > 0) {
    return local.map((p) => ({
      id: p.id,
      original_text: p.original_text,
      improved_text: p.improved_text,
      status: p.status,
      quality_score: p.quality_score,
      created_at: p.created_at,
    }));
  }

  // If completely empty, provide starter demo history items for a great demo experience!
  return [
    {
      id: 'demo-sample-1',
      original_text: 'build landing page for coffee startup',
      improved_text:
        'Act as a Senior Frontend Engineer & UI Designer. Build a high-converting, modern landing page for an artisanal organic coffee subscription startup using React, Tailwind CSS, and Framer Motion with responsive hero, subscription tiers, and customer testimonials.',
      status: 'ready',
      quality_score: 94,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'demo-sample-2',
      original_text: 'explain recursion to a junior developer',
      improved_text:
        'Explain the concept of recursion in computer programming to a junior JavaScript developer. Use the metaphor of Russian nesting dolls, provide a clear base case vs recursive step code snippet, and explain how to prevent stack overflow errors.',
      status: 'ready',
      quality_score: 91,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}

export async function fetchPromptWithRelations(
  id: string
): Promise<{ prompt: PromptRow; analyses: PromptAnalysisRow[]; questions: PromptQuestionRow[] } | null> {
  const [promptRes, analysesRes, questionsRes] = await Promise.all([
    supabase.from('prompts').select('*').eq('id', id).maybeSingle(),
    supabase.from('prompt_analyses').select('*').eq('prompt_id', id),
    supabase.from('prompt_questions').select('*').eq('prompt_id', id).order('created_at', { ascending: true }),
  ]);

  if (promptRes.error || !promptRes.data) return null;
  return {
    prompt: promptRes.data as PromptRow,
    analyses: (analysesRes.data ?? []) as PromptAnalysisRow[],
    questions: (questionsRes.data ?? []) as PromptQuestionRow[],
  };
}

export function analysisItemToRow(
  promptId: string,
  item: AnalysisItem
): Omit<PromptAnalysisRow, 'id'> {
  return {
    prompt_id: promptId,
    category: item.category,
    severity: item.severity,
    explanation: item.explanation,
    suggestion: item.suggestion || null,
  };
}

export function answersToCollected(_answers: CollectedAnswer[]): CollectedAnswer[] {
  return _answers;
}
