import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Chrome,
  CircleHelp,
  ListChecks,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react';
import {
  ChromeBadge,
  FeatureIcon,
  MarketingFooter,
  MarketingHeader,
} from '@/components/Marketing';
import { InteractiveDemo } from '@/components/InteractiveDemo';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-50">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-gradient-to-b from-brand-50/70 via-ink-50 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-10 -z-10 h-72 w-72 rounded-full bg-mint-100/40 blur-3xl"
        />
        <div className="mx-auto max-w-6xl px-5 pb-12 pt-14 lg:px-8 lg:pb-20 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-soft">
                <Sparkles size={12} />
                Your AI Prompt Assistant
              </span>
              <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.08] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
                Don't learn prompt engineering.
                <span className="block text-brand-600">
                  Just tell AI what you want.
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-ink-600">
                Promptly finds what's missing from your request, asks the right
                questions, and helps you create a prompt AI can actually
                understand.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/auth/signup" className="btn-primary text-base">
                  Try Promptly
                  <ArrowRight size={16} />
                </Link>
                <a href="#how-it-works" className="btn-secondary text-base">
                  See how it works
                </a>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-mint-600" />
                  Private by design
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Chrome size={13} className="text-brand-600" />
                  Works in ChatGPT, Claude & Gemini
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap size={13} className="text-amber-500" />
                  No prompt engineering needed
                </span>
              </div>
            </div>

            <div className="relative">
              <InteractiveDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-ink-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                The problem
              </p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                You know what you want. AI doesn't.
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-ink-600">
                Most people have a clear idea in their head. But when they type
                it into ChatGPT or Claude, the result misses the mark — wrong
                audience, wrong stack, wrong format. The fix was never to learn
                prompt engineering. It was to be asked the right questions.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  k: '“Create a dashboard for my school”',
                  v: 'Who is it for? What features? What stack? The AI guesses.',
                },
                {
                  k: '“Write an email to my team”',
                  v: 'About what? What tone? What outcome? Unclear.',
                },
                {
                  k: '“Explain this code”',
                  v: 'To a junior or a senior? In what depth?',
                },
                {
                  k: '“Make a landing page”',
                  v: 'For what product? In what style? Selling what?',
                },
              ].map((item) => (
                <div
                  key={item.k}
                  className="rounded-xl border border-ink-200 bg-ink-50/50 p-4"
                >
                  <p className="text-sm font-semibold text-ink-900">{item.k}</p>
                  <p className="mt-1.5 text-sm text-ink-500">{item.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-ink-50">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              How Promptly works
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              From vague idea to prompt AI understands
            </h2>
            <p className="mt-4 text-pretty text-lg text-ink-600">
              Four calm steps. No prompt engineering required from you.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: '01',
                icon: MessageSquareText,
                title: 'Write what you want',
                desc: 'Type your request in plain words. No special structure needed.',
              },
              {
                n: '02',
                icon: CircleHelp,
                title: 'See what\'s missing',
                desc: 'Promptly detects gaps and explains why they matter — in context.',
              },
              {
                n: '03',
                icon: ListChecks,
                title: 'Answer a few questions',
                desc: 'Only the necessary ones. Two questions, not ten.',
              },
              {
                n: '04',
                icon: Wand2,
                title: 'Get a clearer prompt',
                desc: 'Copy it into ChatGPT, Claude, or Gemini and get better results.',
              },
            ].map((step) => (
              <div
                key={step.n}
                className="relative rounded-2xl border border-ink-200 bg-white p-6 shadow-soft transition-shadow hover:shadow-card"
              >
                <span className="text-xs font-bold text-brand-300">
                  {step.n}
                </span>
                <span className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <step.icon size={20} />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink-900">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Promptly is different */}
      <section id="why" className="border-y border-ink-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                Why Promptly
              </p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                A prompt assistant, not a prompt marketplace.
              </h2>
              <p className="mt-4 text-pretty text-lg text-ink-600">
                Promptly doesn't hand you a library of someone else's templates.
                It reads your request, reasons about what's missing, and helps
                you say what you actually meant.
              </p>
              <Link to="/auth/signup" className="btn-primary mt-6">
                Try it free
                <ArrowRight size={15} />
              </Link>
            </div>
            <div className="space-y-5">
              <FeatureIcon
                icon={CircleHelp}
                title="Contextual, not checklist"
                description="Promptly only flags categories that actually matter for your request. An explanation for a 10-year-old won't get dinged for missing a tech stack."
              />
              <FeatureIcon
                icon={ListChecks}
                title="Asks the minimum"
                description="Two useful questions, not ten. Promptly decides which gaps are worth filling and which are fine to leave to the AI."
              />
              <FeatureIcon
                icon={ShieldCheck}
                title="Private by design"
                description="Promptly only analyzes text when you ask it to. Nothing is sent automatically from pages you visit."
              />
              <FeatureIcon
                icon={Chrome}
                title="Where you already work"
                description="The Chrome extension brings the same assistant into ChatGPT, Claude, and Gemini — so you don't switch tabs."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Chrome extension */}
      <section id="extension" className="bg-ink-50">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="overflow-hidden rounded-3xl border border-ink-200 bg-gradient-to-br from-white to-brand-50/40 p-8 shadow-soft lg:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <ChromeBadge />
                <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                  Bring Promptly into ChatGPT, Claude, and Gemini.
                </h2>
                <p className="mt-4 text-pretty text-lg text-ink-600">
                  The extension adds a small Promptly button next to supported AI
                  text fields. Click it, get the same analysis, and insert the
                  improved prompt — without leaving the page.
                </p>
                <ul className="mt-6 space-y-2.5 text-sm text-ink-700">
                  {[
                    'Only activates on supported input fields',
                    'Never reads text until you click Promptly',
                    'Same assistant, same reasoning, in-page',
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-100 text-mint-700">
                        <ShieldCheck size={12} />
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
                <div className="flex items-center gap-2 border-b border-ink-100 pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-white">
                    <Sparkles size={12} />
                  </span>
                  <span className="text-sm font-semibold text-ink-800">
                    Promptly
                  </span>
                  <span className="ml-auto text-[10px] text-ink-400">
                    chatgpt.com
                  </span>
                </div>
                <div className="mt-4 rounded-lg border border-ink-200 bg-ink-50/60 p-3 text-sm text-ink-500">
                  make dashboard for school
                </div>
                <div className="mt-3 animate-fade-in rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                  <p className="text-sm font-semibold text-brand-800">
                    This request may be too broad.
                  </p>
                  <p className="mt-1 text-xs text-ink-600">Potentially missing:</p>
                  <ul className="mt-1.5 space-y-1 text-xs text-ink-700">
                    <li>• Target user</li>
                    <li>• Features</li>
                    <li>• Technology</li>
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                      <Sparkles size={10} /> Improve
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-ink-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-700">
                      Ask me
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center lg:px-8 lg:py-24">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl lg:text-5xl">
            Stop wrestling with prompts.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-ink-600">
            Tell Promptly what you want. It will help you say it clearly.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth/signup" className="btn-primary text-base">
              Try Promptly
              <ArrowRight size={16} />
            </Link>
            <Link to="/auth/login" className="btn-secondary text-base">
              Log in
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
