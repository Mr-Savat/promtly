import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronDown,
  CircleHelp,
  Lightbulb,
  ListChecks,
  RefreshCw,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import { PromptEditor } from '@/components/PromptEditor';
import { PromptQuality } from '@/components/PromptQuality';
import { AnalysisItemRow } from '@/components/AnalysisItemRow';
import { QuestionCard } from '@/components/QuestionCard';
import { PromptResult } from '@/components/PromptResult';
import { LoadingState, ErrorState } from '@/components/StateViews';
import { usePromptFlow } from '@/lib/usePromptFlow';
import { useToast } from '@/components/Toast';
import {
  createPrompt,
  saveAnalyses,
  updatePrompt,
} from '@/lib/prompts';
import type { PromptAnalysis } from '@/lib/ai';

const EXAMPLES = [
  'Build a landing page for a coffee subscription startup',
  'Explain recursion to a junior developer',
  'Write an email asking my team for project updates',
  'Create a dashboard for my school',
  'Analyze this dataset and summarize the trends',
];

type AssistantPanelTab = 'analysis' | 'questions' | 'result';

export function EditorPage() {
  const flow = usePromptFlow();
  const { notify } = useToast();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { initialPrompt?: string } | null;
    if (state?.initialPrompt && !flow.text) {
      flow.setText(state.initialPrompt);
    }
  }, [location.state, flow]);

  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantTab, setAssistantTab] = useState<AssistantPanelTab>('analysis');
  const [savedPromptId, setSavedPromptId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [persisted, setPersisted] = useState(false);
  const lastSavedRef = useRef<string>('');

  // Decide which tab is relevant given the current phase
  useEffect(() => {
    if (flow.phase === 'asking') setAssistantTab('questions');
    else if (flow.phase === 'result') setAssistantTab('result');
    else if (flow.phase === 'analyzed') setAssistantTab('analysis');
  }, [flow.phase]);

  // Auto-open the assistant once analysis lands
  useEffect(() => {
    if (flow.phase === 'analyzed') setShowAssistant(true);
    if (flow.phase === 'result') setShowAssistant(true);
  }, [flow.phase]);

  // Persist the final improved prompt to history once
  useEffect(() => {
    if (flow.phase !== 'result' || !flow.result) return;
    const snapshot = flow.result.improvedPrompt;
    if (persisted || snapshot === lastSavedRef.current) return;
    lastSavedRef.current = snapshot;
    void persistPrompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.phase, flow.result]);

  const persistPrompt = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const text = flow.text.trim();
      if (!text) return;
      let promptId = savedPromptId;
      if (!promptId) {
        const created = await createPrompt({ originalText: text });
        promptId = created.id;
        setSavedPromptId(created.id);
      }
      if (flow.analysis) {
        await saveAnalyses(promptId, flow.analysis);
      }
      await updatePrompt(promptId, {
        improved_text: flow.result?.improvedPrompt ?? null,
        status: 'ready',
        quality_score: flow.analysis?.score ?? null,
      });
      setPersisted(true);
      notify('Prompt saved to your history.', 'success');
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Could not save your prompt.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!flow.text.trim()) {
      notify('Write something first, then analyze.', 'info');
      return;
    }
    setPersisted(false);
    setSavedPromptId(null);
    lastSavedRef.current = '';
    await flow.analyze();
  };

  const handleAskMe = async () => {
    setAssistantTab('questions');
    await flow.askQuestions();
  };

  const handleImproveNow = async () => {
    await flow.improveNow();
  };

  const handleExample = (example: string) => {
    flow.setText(example);
    setShowAssistant(false);
  };

  const handleStartOver = () => {
    flow.reset();
    setSavedPromptId(null);
    setPersisted(false);
    lastSavedRef.current = '';
    setShowAssistant(false);
    setAssistantTab('analysis');
  };

  const handleEditResult = () => {
    // Send the improved prompt text back into the editor for further editing
    if (flow.result) {
      flow.setText(flow.result.improvedPrompt);
      setShowAssistant(false);
    }
  };

  const assistantOpen = showAssistant && (flow.phase === 'analyzed' || flow.phase === 'asking' || flow.phase === 'improving' || flow.phase === 'result' || flow.phase === 'analyzing');

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
            New Prompt
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Tell AI what you want. Promptly helps you say it clearly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {flow.text.trim() && (
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={flow.phase === 'analyzing'}
              className="btn-primary"
            >
              <Sparkles size={15} />
              {flow.phase === 'analyzing' ? 'Analyzing...' : 'Analyze'}
            </button>
          )}
        </div>
      </div>

      {/* Main workspace */}
      <div className="grid flex-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Editor column */}
        <div className="flex flex-col gap-4">
          <PromptEditor
            value={flow.text}
            onChange={flow.setText}
            onAnalyze={handleAnalyze}
            autoFocus
          />

          {/* Inline spark indicator (appears while typing, before analysis) */}
          {flow.phase === 'typing' && flow.text.trim().length > 6 && (
            <button
              type="button"
              onClick={handleAnalyze}
              className="group inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-2 text-sm font-medium text-brand-700 shadow-soft transition-all hover:border-brand-300 hover:bg-brand-50 animate-fade-in dark:border-brand-900/60 dark:bg-ink-900 dark:text-brand-300 dark:hover:bg-brand-950/40"
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                <Sparkles
                  size={14}
                  className="animate-spark-pulse text-brand-600 dark:text-brand-400"
                />
              </span>
              Analyze with Promptly
              <span className="ml-1 hidden rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500 sm:inline dark:bg-ink-800 dark:text-ink-400">
                ⌘ + ⏎
              </span>
            </button>
          )}

          {/* Empty-state examples */}
          {flow.phase === 'empty' && (
            <div className="animate-fade-in">
              <p className="mb-3 text-sm font-medium text-ink-600 dark:text-ink-300">
                Start with what you want to accomplish. Try one:
              </p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => handleExample(ex)}
                    className="rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-left text-sm text-ink-700 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:scale-[0.98] dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-brand-600 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inline mobile assistant trigger */}
          {assistantOpen && (
            <MobileAssistantTrigger
              phase={flow.phase}
              missingCount={flow.analysis?.missing.length ?? 0}
              onClick={() => setShowAssistant(true)}
            />
          )}
        </div>

        {/* Assistant panel (desktop) */}
        <div className="hidden lg:block">
          <AssistantPanel
            open={assistantOpen}
            phase={flow.phase}
            analysis={flow.analysis}
            questions={flow.questions}
            currentQuestionIndex={flow.currentQuestionIndex}
            answers={flow.answers}
            result={flow.result}
            error={flow.error}
            tab={assistantTab}
            onTabChange={setAssistantTab}
            onAskMe={handleAskMe}
            onImproveNow={handleImproveNow}
            onAnswer={flow.answerQuestion}
            onSkip={flow.skipQuestion}
            onPrev={flow.prevQuestion}
            onGoToQuestion={flow.goToQuestion}
            onRetry={flow.analyze}
            onDismissError={flow.dismissError}
            onEdit={handleEditResult}
            onStartOver={handleStartOver}
            originalText={flow.text}
          />
        </div>
      </div>

      {/* Mobile bottom-sheet assistant */}
      {assistantOpen && (
        <MobileAssistantSheet
          open={assistantOpen}
          phase={flow.phase}
          analysis={flow.analysis}
          questions={flow.questions}
          currentQuestionIndex={flow.currentQuestionIndex}
          answers={flow.answers}
          result={flow.result}
          error={flow.error}
          tab={assistantTab}
          onTabChange={setAssistantTab}
          onAskMe={handleAskMe}
          onImproveNow={handleImproveNow}
          onAnswer={flow.answerQuestion}
          onSkip={flow.skipQuestion}
          onPrev={flow.prevQuestion}
          onGoToQuestion={flow.goToQuestion}
          onRetry={flow.analyze}
          onDismissError={flow.dismissError}
          onEdit={handleEditResult}
          onStartOver={handleStartOver}
          originalText={flow.text}
          onClose={() => setShowAssistant(false)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Assistant panel                                                     */
/* ------------------------------------------------------------------ */

interface AssistantPanelProps {
  open: boolean;
  phase: string;
  analysis: PromptAnalysis | null;
  questions: import('@/lib/ai').Question[];
  currentQuestionIndex: number;
  answers: import('@/lib/ai').CollectedAnswer[];
  result: import('@/lib/ai').ImproveResult | null;
  error: string | null;
  tab: AssistantPanelTab;
  onTabChange: (tab: AssistantPanelTab) => void;
  onAskMe: () => void;
  onImproveNow: () => void;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
  onPrev?: () => void;
  onGoToQuestion?: (index: number) => void;
  onRetry: () => void;
  onDismissError: () => void;
  onEdit: () => void;
  onStartOver: () => void;
  originalText: string;
}

function AssistantPanel(props: AssistantPanelProps) {
  if (!props.open) {
    return (
      <div className="sticky top-24 rounded-2xl border border-dashed border-ink-200 bg-white/50 p-6 text-center dark:border-ink-800 dark:bg-ink-900/60">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-300">
          <Sparkles size={18} />
        </span>
        <p className="mt-3 text-sm font-semibold text-ink-700 dark:text-ink-200">
          Promptly Assistant
        </p>
        <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
          Write a request and click Analyze. The assistant will show what's
          missing and help you fix it.
        </p>
      </div>
    );
  }

  return (
    <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900">
      <PanelHeader
        tab={props.tab}
        onTabChange={props.onTabChange}
        phase={props.phase}
        analysis={props.analysis}
        result={props.result}
      />
      <div className="max-h-[calc(100vh-14rem)] overflow-y-auto px-5 py-4 scrollbar-thin">
        <PanelBody {...props} />
      </div>
    </div>
  );
}

function PanelHeader({
  tab,
  onTabChange,
  phase,
  analysis,
  result,
}: {
  tab: AssistantPanelTab;
  onTabChange: (t: AssistantPanelTab) => void;
  phase: string;
  analysis: PromptAnalysis | null;
  result: import('@/lib/ai').ImproveResult | null;
}) {
  const tabs: { id: AssistantPanelTab; label: string; show: boolean }[] = [
    { id: 'analysis', label: 'Analysis', show: !!analysis },
    { id: 'questions', label: 'Questions', show: phase === 'asking' },
    { id: 'result', label: 'Result', show: !!result },
  ];
  const visible = tabs.filter((t) => t.show);

  return (
    <div className="border-b border-ink-100 px-5 py-3.5 dark:border-ink-800">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Sparkles size={14} />
        </span>
        <span className="text-sm font-semibold text-ink-900 dark:text-white">
          Prompt Assistant
        </span>
      </div>
      {visible.length > 1 && (
        <div className="mt-3 flex gap-1">
          {visible.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                tab === t.id
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                  : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PanelBody(props: AssistantPanelProps) {
  if (props.phase === 'analyzing' && !props.analysis) {
    return <LoadingState label="Analyzing your request..." />;
  }
  if (props.phase === 'improving') {
    return <LoadingState label="Writing your improved prompt..." />;
  }
  if (props.phase === 'error' && props.error) {
    return (
      <ErrorState
        message={props.error}
        onRetry={props.onRetry}
        compact
      />
    );
  }
  if (props.tab === 'questions' && props.phase === 'asking') {
    const q = props.questions[props.currentQuestionIndex];
    if (!q) {
      return (
        <p className="text-sm text-ink-500 dark:text-ink-400">
          No more questions. Generating your improved prompt...
        </p>
      );
    }
    const currentAnswer = props.answers.find((a) => a.questionId === q.id);

    return (
      <div className="space-y-4">
        {/* Step indicator bar */}
        {props.questions.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {props.questions.map((quest, i) => {
              const isAnswered = props.answers.some((a) => a.questionId === quest.id);
              const isCurrent = i === props.currentQuestionIndex;
              return (
                <button
                  key={quest.id}
                  type="button"
                  onClick={() => props.onGoToQuestion?.(i)}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                    isCurrent
                      ? 'bg-brand-600 text-white shadow-soft font-semibold'
                      : isAnswered
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-400 dark:hover:bg-ink-700'
                  }`}
                >
                  <span>Q{i + 1}</span>
                  {isAnswered && <span className="text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>
        )}

        <QuestionCard
          question={q}
          step={props.currentQuestionIndex + 1}
          total={props.questions.length}
          selectedAnswer={currentAnswer?.answer}
          onAnswer={props.onAnswer}
          onSkip={props.onSkip}
          onPrev={props.onPrev}
        />

        {/* Real-time Live Preview Draft Widget */}
        {props.result && (
          <div className="rounded-xl border border-ink-200/80 bg-ink-50/50 p-3.5 transition-all dark:border-ink-800 dark:bg-ink-950/60">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-600 dark:text-ink-400">
                  Live Preview Draft
                </span>
              </div>
              <button
                type="button"
                onClick={props.onImproveNow}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                <span>Finish now</span>
                <Sparkles size={11} />
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-ink-800 line-clamp-3 dark:text-ink-200">
              {props.result.improvedPrompt}
            </pre>
          </div>
        )}
      </div>
    );
  }
  if (props.tab === 'result' && props.result) {
    return (
      <PromptResult
        originalText={props.originalText}
        improvedPrompt={props.result.improvedPrompt}
        summary={props.result.summary}
        changes={props.result.changes}
        onEdit={props.onEdit}
        onStartOver={props.onStartOver}
      />
    );
  }
  if (props.analysis) {
    return (
      <AnalysisView
        analysis={props.analysis}
        onAskMe={props.onAskMe}
        onImprove={props.onImproveNow}
      />
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Analysis view                                                       */
/* ------------------------------------------------------------------ */

function AnalysisView({
  analysis,
  onAskMe,
  onImprove,
}: {
  analysis: PromptAnalysis;
  onAskMe: () => void;
  onImprove: () => void;
}) {
  const hasMissing = analysis.missing.length > 0;
  const hasAttention = analysis.needsAttention.length > 0;
  const allClear = !hasMissing && !hasAttention;

  return (
    <div className="space-y-5">
      <PromptQuality
        score={analysis.score}
        missingCount={analysis.missing.length}
        attentionCount={analysis.needsAttention.length}
        goodCount={analysis.good.length}
        dimensions={analysis.package?.dimensions}
        items={analysis.items}
        showDimensionBadges={true}
      />

      <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">{analysis.summary}</p>

      {hasMissing && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <AlertTriangle size={12} />
            Potentially missing
          </p>
          <div className="space-y-2">
            {analysis.missing.map((item) => (
              <AnalysisItemRow key={item.category} item={item} />
            ))}
          </div>
        </div>
      )}

      {hasAttention && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Lightbulb size={12} />
            Could be clearer
          </p>
          <div className="space-y-2">
            {analysis.needsAttention.map((item) => (
              <AnalysisItemRow key={item.category} item={item} />
            ))}
          </div>
        </div>
      )}

      {analysis.good.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-mint-600 dark:text-mint-400">
            <ListChecks size={12} />
            Already clear
          </p>
          <div className="space-y-2">
            {analysis.good.map((item) => (
              <AnalysisItemRow key={item.category} item={item} />
            ))}
          </div>
        </div>
      )}

      {allClear && (
        <div className="rounded-xl border border-mint-200 bg-mint-50/60 p-4 dark:border-mint-900/50 dark:bg-mint-950/40">
          <p className="text-sm font-medium text-mint-800 dark:text-mint-300">
            Your request looks clear.
          </p>
          <p className="mt-1 text-xs text-mint-700 dark:text-mint-400">
            You can still ask Promptly to refine the wording, or copy this
            prompt as-is.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-4 dark:border-ink-800">
        {hasMissing && (
          <button type="button" onClick={onAskMe} className="btn-primary">
            <CircleHelp size={15} />
            Ask me
          </button>
        )}
        <button
          type="button"
          onClick={onImprove}
          className={hasMissing ? 'btn-secondary' : 'btn-primary'}
        >
          <Wand2 size={15} />
          {hasMissing ? 'Improve now' : 'Improve prompt'}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile bottom sheet                                                 */
/* ------------------------------------------------------------------ */

function MobileAssistantSheet(
  props: AssistantPanelProps & { onClose: () => void }
) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close assistant"
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in"
        onClick={props.onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-hidden rounded-t-2xl border-t border-ink-200 bg-white shadow-pop animate-slide-up dark:border-ink-800 dark:bg-ink-900">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-ink-800">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Sparkles size={14} />
            </span>
            <span className="text-sm font-semibold text-ink-900 dark:text-white">
              Prompt Assistant
            </span>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4 scrollbar-thin">
          <PanelBody {...props} />
        </div>
      </div>
    </div>
  );
}

function MobileAssistantTrigger({
  phase,
  missingCount,
  onClick,
}: {
  phase: string;
  missingCount: number;
  onClick: () => void;
}) {
  const label = useMemo(() => {
    if (phase === 'result') return 'View improved prompt';
    if (phase === 'asking') return 'Continue answering';
    if (phase === 'improving') return 'Improving...';
    if (phase === 'analyzing') return 'Analyzing...';
    if (missingCount > 0) return `${missingCount} things missing — tap to fix`;
    return 'View analysis';
  }, [phase, missingCount]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-2 text-sm font-medium text-brand-700 shadow-soft lg:hidden dark:border-brand-900/50 dark:bg-ink-900 dark:text-brand-300"
    >
      <Sparkles size={14} />
      {label}
      <ChevronDown size={14} />
    </button>
  );
}
