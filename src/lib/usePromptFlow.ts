import { useCallback, useRef, useState } from 'react';
import {
  analyzePrompt,
  generateQuestions,
  improvePrompt,
  type CollectedAnswer,
  type PromptAnalysis,
  type Question,
  type ImproveResult,
} from '@/lib/ai';

export type EditorPhase =
  | 'empty'
  | 'typing'
  | 'analyzing'
  | 'analyzed'
  | 'asking'
  | 'improving'
  | 'result'
  | 'error';

interface UsePromptFlowState {
  phase: EditorPhase;
  text: string;
  analysis: PromptAnalysis | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: CollectedAnswer[];
  result: ImproveResult | null;
  error: string | null;
}

export interface UsePromptFlowResult extends UsePromptFlowState {
  setText: (text: string) => void;
  analyze: () => Promise<void>;
  askQuestions: () => Promise<void>;
  answerQuestion: (answer: string) => Promise<void>;
  skipQuestion: () => Promise<void>;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  improveNow: () => Promise<void>;
  reset: () => void;
  dismissError: () => void;
}

const GENERIC_ERROR =
  'Prompt analysis is temporarily unavailable. Please try again.';

export function usePromptFlow(): UsePromptFlowResult {
  const [state, setState] = useState<UsePromptFlowState>({
    phase: 'empty',
    text: '',
    analysis: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    result: null,
    error: null,
  });

  // Keep latest text accessible inside async callbacks without stale closures
  const textRef = useRef('');
  const analysisRef = useRef<PromptAnalysis | null>(null);
  const answersRef = useRef<CollectedAnswer[]>([]);
  const questionsRef = useRef<Question[]>([]);

  const setText = useCallback((text: string) => {
    textRef.current = text;
    setState((s) => ({
      ...s,
      text,
      phase: text.trim() ? 'typing' : 'empty',
      // Reset analysis when text changes after a result
      analysis: s.phase === 'result' || s.phase === 'analyzed' ? null : s.analysis,
      result: null,
      error: null,
    }));
  }, []);

  const analyze = useCallback(async () => {
    const text = textRef.current.trim();
    if (!text) return;
    setState((s) => ({ ...s, phase: 'analyzing', error: null }));
    try {
      const analysis = await analyzePrompt(text);
      analysisRef.current = analysis;

      // Extract instant improved prompt if available
      const instantResult: ImproveResult | null = analysis.package?.instant_improved_prompt
        ? {
            improvedPrompt: analysis.package.instant_improved_prompt,
            summary: 'Instant draft based on standard best practices.',
            changes: ['Applied production structure, role, task, and requirements.'],
          }
        : null;

      setState((s) => ({
        ...s,
        phase: 'analyzed',
        analysis,
        result: instantResult,
        questions: [],
        answers: [],
        currentQuestionIndex: 0,
      }));
    } catch {
      setState((s) => ({ ...s, phase: 'error', error: GENERIC_ERROR }));
    }
  }, []);

  const runImprove = useCallback(async (customAnswers?: CollectedAnswer[]) => {
    const analysis = analysisRef.current;
    const text = textRef.current.trim();
    if (!analysis || !text) return;
    setState((s) => ({ ...s, phase: 'improving', error: null }));
    try {
      const activeAnswers = customAnswers ?? answersRef.current;
      const result = await improvePrompt(text, analysis, activeAnswers);
      setState((s) => ({ ...s, phase: 'result', result }));
    } catch {
      setState((s) => ({ ...s, phase: 'error', error: GENERIC_ERROR }));
    }
  }, []);

  const askQuestions = useCallback(async () => {
    const analysis = analysisRef.current;
    const text = textRef.current.trim();
    if (!analysis || !text) return;
    setState((s) => ({ ...s, phase: 'analyzing', error: null }));
    try {
      const questions = await generateQuestions(text, analysis, []);
      questionsRef.current = questions;
      answersRef.current = [];

      // Pre-calculate baseline instant result
      let baselineResult = state.result;
      if (!baselineResult) {
        baselineResult = await improvePrompt(text, analysis, []);
      }

      setState((s) => ({
        ...s,
        phase: questions.length > 0 ? 'asking' : 'improving',
        questions,
        currentQuestionIndex: 0,
        answers: [],
        result: baselineResult,
      }));

      if (questions.length === 0) {
        await runImprove([]);
      }
    } catch {
      setState((s) => ({ ...s, phase: 'error', error: GENERIC_ERROR }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.result, runImprove]);

  const answerQuestion = useCallback(
    async (answer: string) => {
      const questions = questionsRef.current;
      const idx = state.currentQuestionIndex;
      const current = questions[idx];
      if (!current) return;

      const collected: CollectedAnswer = {
        questionId: current.id,
        category: current.category,
        answer,
      };

      // Upsert: replace if this question was already answered, or append
      const existingIdx = answersRef.current.findIndex((a) => a.questionId === current.id);
      const newAnswers =
        existingIdx >= 0
          ? answersRef.current.map((a, i) => (i === existingIdx ? collected : a))
          : [...answersRef.current, collected];

      answersRef.current = newAnswers;

      const analysis = analysisRef.current;
      const text = textRef.current.trim();

      // Real-time update of result as each pill is selected
      let liveResult: ImproveResult | null = null;
      if (analysis && text) {
        try {
          liveResult = await improvePrompt(text, analysis, newAnswers);
        } catch {
          // Keep previous result if refinement fails
          liveResult = state.result;
        }
      }

      const nextIdx = idx + 1;
      if (nextIdx < questions.length) {
        setState((s) => ({
          ...s,
          answers: newAnswers,
          currentQuestionIndex: nextIdx,
          result: liveResult ?? s.result,
        }));
      } else {
        // All questions addressed
        setState((s) => ({
          ...s,
          answers: newAnswers,
          phase: 'result',
          result: liveResult ?? s.result,
        }));
      }
    },
    [state.currentQuestionIndex, state.result]
  );

  const skipQuestion = useCallback(async () => {
    const questions = questionsRef.current;
    const nextIdx = state.currentQuestionIndex + 1;

    if (nextIdx < questions.length) {
      setState((s) => ({ ...s, currentQuestionIndex: nextIdx }));
    } else {
      // Completed last question via skip
      const analysis = analysisRef.current;
      const text = textRef.current.trim();
      if (!analysis || !text) return;
      setState((s) => ({ ...s, phase: 'improving' }));
      try {
        const result = await improvePrompt(text, analysis, answersRef.current);
        setState((s) => ({ ...s, phase: 'result', result }));
      } catch {
        setState((s) => ({ ...s, phase: 'error', error: GENERIC_ERROR }));
      }
    }
  }, [state.currentQuestionIndex]);

  const prevQuestion = useCallback(() => {
    setState((s) => ({
      ...s,
      currentQuestionIndex: Math.max(0, s.currentQuestionIndex - 1),
    }));
  }, []);

  const goToQuestion = useCallback((index: number) => {
    const questions = questionsRef.current;
    if (index >= 0 && index < questions.length) {
      setState((s) => ({ ...s, currentQuestionIndex: index, phase: 'asking' }));
    }
  }, []);

  const improveNow = useCallback(async () => {
    const analysis = analysisRef.current;
    const text = textRef.current.trim();
    if (!analysis || !text) return;
    setState((s) => ({ ...s, phase: 'improving', error: null }));
    try {
      const result = await improvePrompt(text, analysis, answersRef.current);
      setState((s) => ({ ...s, phase: 'result', result }));
    } catch {
      setState((s) => ({ ...s, phase: 'error', error: GENERIC_ERROR }));
    }
  }, []);

  const reset = useCallback(() => {
    textRef.current = '';
    analysisRef.current = null;
    answersRef.current = [];
    questionsRef.current = [];
    setState({
      phase: 'empty',
      text: '',
      analysis: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      result: null,
      error: null,
    });
  }, []);

  const dismissError = useCallback(() => {
    setState((s) => ({
      ...s,
      phase: s.text.trim() ? 'typing' : 'empty',
      error: null,
    }));
  }, []);

  return {
    ...state,
    setText,
    analyze,
    askQuestions,
    answerQuestion,
    skipQuestion,
    prevQuestion,
    goToQuestion,
    improveNow,
    reset,
    dismissError,
  };
}
