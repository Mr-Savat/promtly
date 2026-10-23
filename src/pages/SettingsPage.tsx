import { useState, type ReactNode } from 'react';
import {
  Bell,
  Chrome,
  Cpu,
  LogOut,
  Shield,
  Sun,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [detailLevel, setDetailLevel] = useState<'concise' | 'detailed'>('detailed');
  const [askFirst, setAskFirst] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);

  const email = user?.email ?? '';
  const initials = email.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    notify('Signed out.', 'info');
    navigate('/');
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Manage your profile, AI preferences, and privacy.
        </p>
      </div>

      <div className="w-full space-y-6">
        {/* Profile */}
        <Section
          icon={UserIcon}
          title="Profile"
          description="Your account information."
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                {email}
              </p>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Member since {new Date(user?.created_at ?? Date.now()).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </Section>

        {/* Appearance */}
        <Section
          icon={Sun}
          title="Appearance"
          description="Customize your interface theme mode."
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Interface Theme</p>
                <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                  Choose between light mode, dark mode, or match your system preferences.
                </p>
              </div>
              <ThemeToggle variant="segmented" />
            </div>

            <div className="border-t border-ink-100 dark:border-ink-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Interface Language</p>
                <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                  Select your preferred language (English or ភាសាខ្មែរ).
                </p>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </Section>

        {/* AI preferences */}
        <Section
          icon={Cpu}
          title="AI preferences"
          description="How Promptly assists you."
        >
          <Toggle
            label="Ask before improving"
            description="When something is missing, Promptly asks quick questions before rewriting your prompt."
            checked={askFirst}
            onChange={setAskFirst}
          />
          <div className="border-t border-ink-100 dark:border-ink-800 pt-4">
            <p className="text-sm font-medium text-ink-800 dark:text-ink-200">Explanation detail</p>
            <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
              How much reasoning Promptly shows with each suggestion.
            </p>
            <div className="mt-3 flex gap-2">
              {(['concise', 'detailed'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDetailLevel(level)}
                  className={`rounded-lg border px-3.5 py-2 text-sm font-medium capitalize transition-all ${
                    detailLevel === level
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-ink-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Privacy */}
        <Section
          icon={Shield}
          title="Privacy"
          description="How your text is handled."
        >
          <div className="rounded-xl border border-mint-200 bg-mint-50/50 p-4 dark:border-mint-900/50 dark:bg-mint-950/40">
            <p className="text-sm font-medium text-mint-800 dark:text-mint-300">
              Promptly only analyzes text when you ask it to.
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-mint-700 dark:text-mint-400">
              The editor sends your request to Promptly only when you click
              Analyze. The Chrome extension never reads text from a page until
              you click the Promptly button on a supported input field.
            </p>
          </div>
          <div className="mt-3 space-y-2 text-sm text-ink-600 dark:text-ink-300">
            <p>• Your prompts are stored under your account and visible only to you.</p>
            <p>• You can delete any prompt from your history at any time.</p>
            <p>• We do not train models on your prompts.</p>
          </div>
        </Section>

        {/* Extension */}
        <Section
          icon={Chrome}
          title="Extension"
          description="Use Promptly inside ChatGPT, Claude, and Gemini."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-ink-800 dark:text-ink-200">
                Chrome extension
              </p>
              <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                Adds a small Promptly button to supported AI text fields.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              Coming soon
            </span>
          </div>
        </Section>

        {/* Notifications */}
        <Section
          icon={Bell}
          title="Notifications"
          description="Optional product updates."
        >
          <Toggle
            label="Product updates"
            description="Occasional emails about new features."
            checked={notifEnabled}
            onChange={setNotifEnabled}
          />
        </Section>

        {/* Account */}
        <Section
          icon={LogOut}
          title="Account"
          description="Sign out of Promptly."
        >
          <button
            type="button"
            onClick={handleSignOut}
            className="btn-secondary text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:border-rose-900/50"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof UserIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
          <Icon size={17} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-ink-900 dark:text-ink-100">{title}</h2>
          <p className="text-xs text-ink-500 dark:text-ink-400">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-brand-600' : 'bg-ink-200 dark:bg-ink-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
