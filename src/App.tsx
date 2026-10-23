import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ToastProvider } from '@/components/Toast';
import { AppShell } from '@/components/AppShell';
import { LandingPage } from '@/pages/LandingPage';
import { EditorPage } from '@/pages/EditorPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AuthPage } from '@/pages/AuthPage';
import type { ReactNode } from 'react';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/login" element={<AuthPage mode="login" />} />
          <Route path="/auth/signup" element={<AuthPage mode="signup" />} />

          {/* Authenticated app routes */}
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<EditorPage />} />
            <Route path="history" element={<HistoryPage />} />
          </Route>

          <Route
            path="/settings"
            element={
              <RequireAuth>
                <AppShell>
                  <SettingsPage />
                </AppShell>
              </RequireAuth>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <div className="flex flex-col items-center gap-3 text-ink-400">
          <span className="h-8 w-8 animate-pulse rounded-lg bg-brand-200" />
          <p className="text-sm">Loading Promptly...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  return <>{children}</>;
}
