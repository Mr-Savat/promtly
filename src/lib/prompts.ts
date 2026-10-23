import { supabase } from './supabase';
import type {
  PromptAnalysisRow,
  PromptQuestionRow,
  PromptRow,
  PromptStatus,
} from './types';
import type { AnalysisItem, CollectedAnswer, PromptAnalysis } from './ai';

export interface CreatePromptInput {
  originalText: string;
}

export async function createPrompt(input: CreatePromptInput): Promise<PromptRow> {
  const { data, error } = await supabase
    .from('prompts')
    .insert({ original_text: input.originalText, status: 'draft' })
    .select()
    .single();

  if (error) throw new Error('Could not save your prompt. Please try again.');
  return data as PromptRow;
}

export async function updatePrompt(
  id: string,
  patch: Partial<
    Pick<PromptRow, 'original_text' | 'improved_text' | 'status' | 'quality_score'>
  >
): Promise<void> {
  const { error } = await supabase
    .from('prompts')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error('Could not update your prompt.');
}

export async function saveAnalyses(
  promptId: string,
  analysis: PromptAnalysis
): Promise<void> {
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
  const { error } = await supabase.from('prompt_analyses').insert(rows);
  if (error) throw new Error('Could not save analysis.');
}

export async function saveQuestion(
  promptId: string,
  question: string
): Promise<PromptQuestionRow> {
  const { data, error } = await supabase
    .from('prompt_questions')
    .insert({ prompt_id: promptId, question })
    .select()
    .single();
  if (error) throw new Error('Could not save the question.');
  return data as PromptQuestionRow;
}

export async function answerQuestion(
  questionId: string,
  answer: string
): Promise<void> {
  const { error } = await supabase
    .from('prompt_questions')
    .update({ answer, answered_at: new Date().toISOString() })
    .eq('id', questionId);
  if (error) throw new Error('Could not save your answer.');
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
  const { data, error } = await supabase
    .from('prompts')
    .select(
      'id, original_text, improved_text, status, quality_score, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error('Could not load your history.');
  return (data ?? []) as PromptHistoryItem[];
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
