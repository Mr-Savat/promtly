import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AOS from 'aos';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Chrome,
  CircleHelp,
  HelpCircle,
  ListChecks,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Wand2,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  ChromeBadge,
  FeatureIcon,
  MarketingFooter,
  MarketingHeader,
} from '@/components/Marketing';
import { InteractiveDemo } from '@/components/InteractiveDemo';
import { useAuth } from '@/lib/auth';

const PROBLEM_EXAMPLES = [
  {
    id: 'dashboard',
    label: 'School Dashboard',
    input: '“Create a dashboard for my school”',
    aiFlaw: 'The AI guesses blindly: student or teacher? which database? dark mode or light?',
    promptlyFix: 'Promptly asks: "Who is the primary user?" and "What key metrics should appear on the overview?".',
    score: '96%',
  },
  {
    id: 'email',
    label: 'Team Email',
    input: '“Write an email to my team about deadlines”',
    aiFlaw: 'The AI writes a generic, robotic corporate memo with the wrong tone.',
    promptlyFix: 'Promptly extracts project context, team size, urgency level, and preferred communication style.',
    score: '94%',
  },
  {
    id: 'code',
    label: 'Code Explanation',
    input: '“Explain this complex recursive function”',
    aiFlaw: 'The AI outputs academic jargon without knowing if you are a student or a senior engineer.',
    promptlyFix: 'Promptly anchors the target audience, asks for depth preference, and adds real-world analogy constraints.',
    score: '98%',
  },
  {
    id: 'landing',
    label: 'Product Landing Page',
    input: '“Make a SaaS landing page for my product”',
    aiFlaw: 'The AI creates generic placeholder text with no value proposition or user flow.',
    promptlyFix: 'Promptly structures target customer persona, tech stack (Next.js/Tailwind), and call-to-action sections.',
    score: '95%',
  },
];

const FAQS = [
  {
    q: 'Do I need to sign up to use Promptly?',
    a: 'Not at all! You can explore the full editor, analysis engine, and prompt generator immediately using our 1-click Demo Account without registering an email or password.',
  },
  {
    q: 'Does Promptly record or keylog what I type?',
    a: 'Never. Privacy is our core foundation. Promptly operates on-demand only. It never reads or sends your browser content unless you explicitly click the Promptly trigger.',
  },
  {
    q: 'How does Promptly differ from prompt template directories?',
    a: 'Prompt marketplaces sell static, cookie-cutter templates that rarely match your exact scenario. Promptly is an intelligent NLP assistant that listens to your original words, detects missing dimensions, and refines your actual intent.',
  },
  {
    q: 'Does it work directly inside ChatGPT, Claude, and Gemini?',
    a: 'Yes! With the Promptly Chrome extension (Manifest V3), a floating assistant icon appears natively in ChatGPT, Claude, and Google Gemini input fields so you never have to switch tabs.',
  },
];

export function LandingPage() {
  const { signInAsDemo } = useAuth();
  const navigate = useNavigate();
  const [selectedProblem, setSelectedProblem] = useState(PROBLEM_EXAMPLES[0]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Initialize AOS animation library
  useEffect(() => {
    AOS.init({
      duration: 650,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50,
    });
    AOS.refresh();
  }, []);

  const handleDemoAccess = () => {
    signInAsDemo();
    navigate('/app');
  };

  const handleLaunchWithPrompt = (promptText: string) => {
    signInAsDemo();
    navigate('/app', { state: { initialPrompt: promptText } });
  };

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950 text-ink-900 dark:text-ink-100 overflow-x-hidden transition-colors duration-200">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Background gradient decorative glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-brand-100/60 via-ink-50/40 to-transparent dark:from-brand-950/40 dark:via-ink-950/40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-12 -z-10 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-600/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 top-40 -z-10 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-600/10"
        />

        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            {/* Left Column: Hero Copy */}
            <div data-aos="fade-right">
              <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-ink-900 dark:text-white sm:text-5xl lg:text-6xl">
                Don't learn prompt engineering.
                <span className="block text-brand-600 dark:text-brand-400 mt-1">
                  Just tell AI what you want.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-pretty text-base sm:text-lg leading-relaxed text-ink-600 dark:text-ink-300">
                Promptly finds what's missing from your request, asks targeted clarification questions, and writes prompts ChatGPT, Claude, and Gemini understand accurately.
              </p>

              {/* Action Buttons */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleDemoAccess}
                  className="btn-primary text-base px-5 py-3 shadow-card hover:shadow-pop transition-all group"
                >
                  <Sparkles size={16} className="transition-transform group-hover:rotate-12" />
                  <span>Try Demo (No Login)</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </button>
                <Link to="/auth/signup" className="btn-secondary text-base px-5 py-3">
                  Sign Up Free
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-500 dark:text-ink-400">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Zero-Keylogging Privacy
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Chrome size={14} className="text-brand-600 dark:text-brand-400" />
                  ChatGPT, Claude & Gemini
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Zap size={14} className="text-amber-500 dark:text-amber-400" />
                  1-Click Optimization
                </span>
              </div>
            </div>

            {/* Right Column: Live Interactive Demo */}
            <div data-aos="fade-left" data-aos-delay="150" className="relative">
              <InteractiveDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Problem / Comparison Section */}
      <section className="border-y border-ink-200/80 bg-white py-16 lg:py-24 dark:border-ink-800 dark:bg-ink-900 transition-colors duration-200">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center" data-aos="fade-up">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              The Real Problem
            </span>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
              You know what you want. AI doesn't.
            </h2>
            <p className="mt-3 text-pretty text-base text-ink-600 dark:text-ink-300">
              When humans ask AI for help, key constraints stay trapped in their minds. Promptly uncovers them before you prompt.
            </p>
          </div>

          {/* Interactive Problem Switcher Tabs */}
          <div className="mt-10 flex flex-wrap justify-center gap-2" data-aos="fade-up" data-aos-delay="100">
            {PROBLEM_EXAMPLES.map((example) => (
              <button
                key={example.id}
                type="button"
                onClick={() => setSelectedProblem(example)}
                className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  selectedProblem.id === example.id
                    ? 'bg-brand-600 text-white shadow-soft'
                    : 'bg-ink-100 text-ink-700 hover:bg-ink-200/70 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700'
                }`}
              >
                {example.label}
              </button>
            ))}
          </div>

          {/* Active Comparison Card */}
          <div
            className="mt-8 overflow-hidden rounded-2xl border border-ink-200 bg-ink-50/50 p-6 sm:p-8 shadow-card dark:border-ink-800 dark:bg-ink-950/60"
            data-aos="zoom-in"
            data-aos-delay="200"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-ink-200/80 pb-4 dark:border-ink-800">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
                  Raw User Request
                </span>
                <p className="mt-1 text-lg sm:text-xl font-bold text-ink-900 dark:text-white">
                  {selectedProblem.input}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                Prompt Clarity: {selectedProblem.score}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Flaw Box */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-5 dark:border-rose-900/60 dark:bg-rose-950/40">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-semibold text-sm">
                  <XCircle size={16} className="text-rose-600 dark:text-rose-400" />
                  <span>Without Promptly (Vague Guessing)</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-700 dark:text-ink-300">
                  {selectedProblem.aiFlaw}
                </p>
              </div>

              {/* Fix Box */}
              <div className="rounded-xl border border-brand-200 bg-brand-50/70 p-5 dark:border-brand-900/60 dark:bg-brand-950/40">
                <div className="flex items-center gap-2 text-brand-900 dark:text-brand-300 font-semibold text-sm">
                  <Sparkles size={16} className="text-brand-600 dark:text-brand-400" />
                  <span>With Promptly (Intelligent Guidance)</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-800 dark:text-ink-200">
                  {selectedProblem.promptlyFix}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => handleLaunchWithPrompt(selectedProblem.input.replace(/“|”/g, ''))}
                className="btn-primary text-xs py-2 inline-flex items-center gap-1.5"
              >
                <span>Optimize this prompt in demo</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="scroll-mt-24 bg-ink-50 dark:bg-ink-950 py-16 lg:py-24 transition-colors duration-200">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center" data-aos="fade-up">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              How Promptly Works
            </span>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
              From vague idea to prompt AI understands
            </h2>
            <p className="mt-3 text-pretty text-base text-ink-600 dark:text-ink-300">
              Four calm steps. No prompt engineering textbooks required.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: '01',
                icon: MessageSquareText,
                title: 'Write what you want',
                desc: 'Type your raw thought in plain words. No complicated formulas or jargon.',
                delay: 100,
              },
              {
                n: '02',
                icon: CircleHelp,
                title: 'See what\'s missing',
                desc: 'Promptly identifies ambiguities across 10 NLP dimensions in milliseconds.',
                delay: 200,
              },
              {
                n: '03',
                icon: ListChecks,
                title: 'Quick 1-click answers',
                desc: 'Pick pre-generated options with 1 tap or type custom instructions.',
                delay: 300,
              },
              {
                n: '04',
                icon: Wand2,
                title: 'Instant engineered prompt',
                desc: 'Copy your polished prompt into ChatGPT, Claude, or Gemini for accurate results.',
                delay: 400,
              },
            ].map((step) => (
              <div
                key={step.n}
                data-aos="fade-up"
                data-aos-delay={step.delay}
                className="group relative rounded-2xl border border-ink-200 bg-white p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-card hover:border-brand-200 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brand-700"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-brand-300 group-hover:text-brand-500 dark:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                    STEP {step.n}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950/60 dark:text-brand-400 dark:group-hover:bg-brand-600 dark:group-hover:text-white">
                    <step.icon size={19} />
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-400">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Promptly is different */}
      <section id="why" className="scroll-mt-24 border-y border-ink-200/80 bg-white py-16 lg:py-24 dark:border-ink-800 dark:bg-ink-900 transition-colors duration-200">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div className="lg:sticky lg:top-24" data-aos="fade-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Why Promptly
              </span>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
                A prompt assistant, not a prompt marketplace.
              </h2>
              <p className="mt-4 text-pretty text-base leading-relaxed text-ink-600 dark:text-ink-300">
                Promptly doesn't sell libraries of someone else's templates. It reads your actual request, reasons about what's missing, and helps you communicate with AI with total precision.
              </p>
              <button
                type="button"
                onClick={handleDemoAccess}
                className="btn-primary mt-6 inline-flex items-center gap-2"
              >
                <Sparkles size={15} />
                <span>Try Demo Free</span>
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="space-y-4" data-aos="fade-left">
              <div className="rounded-2xl border border-ink-200/90 bg-ink-50/60 p-5 transition-all hover:bg-white hover:shadow-soft dark:border-ink-800 dark:bg-ink-950/60 dark:hover:bg-ink-950">
                <FeatureIcon
                  icon={CircleHelp}
                  title="Contextual, not checklist"
                  description="Promptly only flags dimensions that actually matter. An explanation for a beginner won't get dinged for missing database schemas."
                />
              </div>

              <div className="rounded-2xl border border-ink-200/90 bg-ink-50/60 p-5 transition-all hover:bg-white hover:shadow-soft dark:border-ink-800 dark:bg-ink-950/60 dark:hover:bg-ink-950">
                <FeatureIcon
                  icon={ListChecks}
                  title="Targeted leverage questions"
                  description="Only 1 to 3 high-impact questions, not 15 tedious forms. Promptly decides what is essential and leaves trivial details to AI."
                />
              </div>

              <div className="rounded-2xl border border-ink-200/90 bg-ink-50/60 p-5 transition-all hover:bg-white hover:shadow-soft dark:border-ink-800 dark:bg-ink-950/60 dark:hover:bg-ink-950">
                <FeatureIcon
                  icon={ShieldCheck}
                  title="Private by design"
                  description="Promptly never monitors your keystrokes or uploads visited URLs. Only explicit requests are processed."
                />
              </div>

              <div className="rounded-2xl border border-ink-200/90 bg-ink-50/60 p-5 transition-all hover:bg-white hover:shadow-soft dark:border-ink-800 dark:bg-ink-950/60 dark:hover:bg-ink-950">
                <FeatureIcon
                  icon={Chrome}
                  title="Chrome extension ready"
                  description="Seamlessly injects into ChatGPT, Claude, and Gemini with Shadow DOM isolation so your styles and privacy stay untouched."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chrome extension section */}
      <section id="extension" className="scroll-mt-24 bg-ink-50 dark:bg-ink-950 py-16 lg:py-24 transition-colors duration-200">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div
            className="overflow-hidden rounded-3xl border border-ink-200 bg-gradient-to-br from-white via-brand-50/30 to-brand-100/20 p-8 shadow-card lg:p-12 dark:border-ink-800 dark:from-ink-900 dark:via-ink-900/90 dark:to-brand-950/30"
            data-aos="fade-up"
          >
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <ChromeBadge />
                <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
                  Bring Promptly directly into ChatGPT, Claude, and Gemini.
                </h2>
                <p className="mt-4 text-pretty text-base text-ink-600 dark:text-ink-300">
                  The extension adds a sleek Promptly button inside AI text fields. Click it, review missing details, and paste the improved prompt in 1 click without leaving your tab.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-ink-700 dark:text-ink-300">
                  {[
                    'Safe DOM injection with Shadow DOM CSS isolation',
                    'Compatible with Lexical & ProseMirror contenteditable editors',
                    'Zero latency local analysis heuristic fallback',
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-100 text-mint-700 dark:bg-mint-950/60 dark:text-mint-300">
                        <CheckCircle2 size={13} />
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Extension UI Preview Card */}
              <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card dark:border-ink-800 dark:bg-ink-950" data-aos="zoom-in" data-aos-delay="150">
                <div className="flex items-center gap-2 border-b border-ink-100 pb-3 dark:border-ink-800">
                  <span className="text-sm font-extrabold text-ink-900 dark:text-white">
                    Promptly<span className="text-brand-600 dark:text-brand-400">.</span>
                  </span>
                  <span className="ml-auto text-[11px] font-mono text-ink-400 dark:text-ink-500">
                    chatgpt.com / in-page trigger
                  </span>
                </div>
                <div className="mt-4 rounded-lg border border-ink-200 bg-ink-50/70 p-3 text-sm text-ink-700 font-mono dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300">
                  build a modern dashboard for school teachers
                </div>
                <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-900/60 dark:bg-brand-950/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-brand-900 dark:text-brand-300">
                      3 Clarifications Detected
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Score: 92%
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-ink-700 dark:text-ink-300">
                    <li>• Target user: Primary school educators</li>
                    <li>• Stack: Next.js + Tailwind CSS</li>
                    <li>• Key modules: Attendance, Gradebook, Class Averages</li>
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
                      <Sparkles size={11} /> Replace in ChatGPT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section className="border-t border-ink-200/80 bg-white py-16 lg:py-24 dark:border-ink-800 dark:bg-ink-900 transition-colors duration-200">
        <div className="mx-auto max-w-4xl px-5 lg:px-8">
          <div className="text-center" data-aos="fade-up">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Got Questions?
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-10 space-y-3" data-aos="fade-up" data-aos-delay="100">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-xl border border-ink-200 bg-ink-50/50 transition-all hover:border-brand-300 dark:border-ink-800 dark:bg-ink-950/60 dark:hover:border-brand-700"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-ink-900 dark:text-white transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={17}
                      className={`text-ink-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300 animate-fade-in border-t border-ink-200/60 dark:border-ink-800">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-b from-white to-brand-50/50 py-16 lg:py-24 border-t border-ink-200/80 dark:from-ink-900 dark:to-ink-950 dark:border-ink-800 transition-colors duration-200">
        <div className="mx-auto max-w-4xl px-5 text-center lg:px-8" data-aos="zoom-in-up">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl lg:text-5xl">
            Stop wrestling with prompts.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base sm:text-lg text-ink-600 dark:text-ink-300">
            Tell Promptly what you want. It will help you say it clearly so AI actually delivers what you need.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleDemoAccess}
              className="btn-primary text-base px-6 py-3 shadow-card"
            >
              <Sparkles size={16} />
              <span>Try Demo (No Login Needed)</span>
              <ArrowRight size={16} />
            </button>
            <Link to="/auth/signup" className="btn-secondary text-base px-6 py-3">
              Sign Up Free
            </Link>
            <Link to="/auth/login" className="btn-ghost text-base text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white">
              Log In
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
