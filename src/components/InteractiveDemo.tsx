import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';

type Phase = 'idle' | 'typing' | 'analyzing' | 'issues' | 'improving' | 'done';

const RAW_INPUT = 'Create a dashboard for my school';

const ISSUES = [
  { label: 'Target user', text: 'Who is the dashboard for?' },
  { label: 'Required features', text: 'What should users be able to see and do?' },
  { label: 'Technology', text: 'What stack should be used?' },
];

const IMPROVED = `Create a teacher dashboard for a school using Next.js.

It is for teachers who need to track student attendance and grades across their classes.

The result should be a complete, working page with:
- A class selector
- A student roster with attendance status
- A grades table per assignment
- Summary cards for class averages

Use a clean, modern UI with a sidebar for navigation. If any requirement is ambiguous, ask me one focused question before producing the result.`;

export function InteractiveDemo() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [typed, setTyped] = useState('');
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const run = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setPhase('typing');
    setTyped('');
    setCopied(false);

    // Type out the text
    let i = 0;
    const typeStep = () => {
      i += 1;
      setTyped(RAW_INPUT.slice(0, i));
      if (i < RAW_INPUT.length) {
        timerRef.current = window.setTimeout(typeStep, 55);
      } else {
        timerRef.current = window.setTimeout(() => setPhase('analyzing'), 650);
      }
    };
    typeStep();

    // Analyzing -> issues
    timerRef.current = window.setTimeout(() => {
      setPhase('issues');
    }, 650 + RAW_INPUT.length * 55 + 1600);

    // issues -> improving (after user "clicks improve")
    timerRef.current = window.setTimeout(() => {
      setPhase('improving');
    }, 650 + RAW_INPUT.length * 55 + 1600 + 2600);

    // improving -> done
    timerRef.current = window.setTimeout(() => {
      setPhase('done');
    }, 650 + RAW_INPUT.length * 55 + 1600 + 2600 + 1500);
  };

  useEffect(() => {
    const t = window.setTimeout(run, 600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(IMPROVED);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-pop">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/60 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-mint-300" />
        <span className="ml-3 text-xs font-medium text-ink-400">
          promptly.app / editor
        </span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
          <Sparkles size={10} /> Live preview
        </span>
      </div>

      <div className="grid gap-0 md:grid-cols-[1.4fr_1fr]">
        {/* Editor pane */}
        <div className="min-h-[360px] border-b border-ink-100 p-5 md:border-b-0 md:border-r">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              New Prompt
            </span>
            {phase === 'typing' || phase === 'idle' ? (
              <span className="text-[11px] text-ink-400">typing...</span>
            ) : phase === 'analyzing' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600">
                <Sparkles size={11} className="animate-spark-pulse" />
                Analyzing...
              </span>
            ) : phase === 'issues' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                <TriangleAlert size={11} />
                Missing info
              </span>
            ) : phase === 'improving' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600">
                <Sparkles size={11} className="animate-spark-pulse" />
                Improving...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-mint-600">
                <Check size={11} />
                Ready
              </span>
            )}
          </div>

          <div className="min-h-[180px] rounded-xl border border-ink-200 bg-white p-4">
            {typed ? (
              <p className="text-[15px] leading-relaxed text-ink-800">
                {typed}
                {(phase === 'typing' || phase === 'idle') && (
                  <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-brand-500 align-middle" />
                )}
              </p>
            ) : (
              <p className="text-[15px] leading-relaxed text-ink-300">
                Tell AI what you want to accomplish...
              </p>
            )}
          </div>

          {phase === 'issues' && (
            <div className="mt-4 animate-fade-in rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <p className="text-xs font-semibold text-amber-800">
                Potentially missing
              </p>
              <ul className="mt-2 space-y-1.5">
                {ISSUES.map((issue) => (
                  <li
                    key={issue.label}
                    className="flex items-start gap-2 text-sm text-ink-700"
                  >
                    <TriangleAlert
                      size={14}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />
                    <span>
                      <span className="font-medium">{issue.label}</span>
                      <span className="text-ink-500"> — {issue.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white">
                  <Sparkles size={11} /> Ask me
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-700">
                  Improve
                </span>
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className="mt-4 animate-fade-in rounded-xl border border-mint-200 bg-mint-50/70 p-4">
              <div className="flex items-center gap-2">
                <Check size={15} className="text-mint-600" />
                <p className="text-sm font-semibold text-mint-800">
                  Your prompt is ready
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Assistant pane */}
        <div className="min-h-[360px] bg-ink-50/40 p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Sparkles size={14} />
            </span>
            <span className="text-sm font-semibold text-ink-900">
              Prompt Assistant
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {(phase === 'idle' || phase === 'typing') && (
              <p className="text-sm text-ink-400">
                Start typing to see how Promptly helps...
              </p>
            )}

            {phase === 'analyzing' && (
              <div className="space-y-2.5 animate-fade-in">
                <div className="h-3 w-3/4 rounded-full bg-ink-100 shimmer" />
                <div className="h-3 w-1/2 rounded-full bg-ink-100 shimmer" />
                <div className="h-3 w-2/3 rounded-full bg-ink-100 shimmer" />
                <p className="pt-2 text-xs text-ink-400">
                  Reading your request...
                </p>
              </div>
            )}

            {phase === 'issues' && (
              <div className="animate-fade-in space-y-3">
                <p className="text-sm text-ink-700">
                  Your request is understandable, but some important details are
                  missing.
                </p>
                <div className="space-y-2">
                  {ISSUES.map((issue) => (
                    <div
                      key={issue.label}
                      className="flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2"
                    >
                      <TriangleAlert
                        size={13}
                        className="shrink-0 text-amber-600"
                      />
                      <span className="text-sm text-ink-700">
                        {issue.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {phase === 'improving' && (
              <div className="space-y-2.5 animate-fade-in">
                <p className="text-sm text-ink-600">
                  Combining your answers into a clearer prompt...
                </p>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded-full bg-ink-100 shimmer" />
                  <div className="h-3 w-5/6 rounded-full bg-ink-100 shimmer" />
                  <div className="h-3 w-4/6 rounded-full bg-ink-100 shimmer" />
                </div>
              </div>
            )}

            {phase === 'done' && (
              <div className="animate-slide-up space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-mint-700">
                  Improved prompt
                </p>
                <div className="rounded-xl border border-ink-200 bg-white p-3.5">
                  <p className="line-clamp-[12] whitespace-pre-wrap text-[13px] leading-relaxed text-ink-800">
                    {IMPROVED}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    copied
                      ? 'bg-mint-100 text-mint-700'
                      : 'bg-brand-600 text-white hover:bg-brand-700'
                  }`}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy prompt'}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={run}
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            <ArrowRight size={12} />
            Replay demo
          </button>
        </div>
      </div>
    </div>
  );
}
