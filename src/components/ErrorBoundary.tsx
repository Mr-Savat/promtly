import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    // Clear translation cookie if translation caused the crash
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    this.setState({ hasError: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink-50 p-6 text-center dark:bg-ink-950">
          <div className="max-w-md rounded-2xl border border-ink-200 bg-white p-8 shadow-card dark:border-ink-800 dark:bg-ink-900">
            <h2 className="text-xl font-bold text-ink-900 dark:text-white">Something went wrong</h2>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
              An unexpected render issue occurred. Click below to reload cleanly.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="btn-primary mt-6 inline-flex items-center gap-2"
            >
              <RotateCcw size={15} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
