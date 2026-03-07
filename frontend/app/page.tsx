'use client';

import { useState, useEffect } from 'react';
import type { UserProfile, RunSummary } from './lib/types';
import { getHistory } from './lib/api';
import { STORAGE_KEY } from './lib/constants';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import ModeSelector from './components/ModeSelector';
import TextAnalysis from './components/TextAnalysis';
import VideoUpload from './components/VideoUpload';

type Mode = 'select' | 'text' | 'video';

export default function Home(): React.ReactElement {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>('select');
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    setHistoryLoading(true);
    getHistory(user.uuid)
      .then(setRuns)
      .catch(() => {/* non-fatal */})
      .finally(() => setHistoryLoading(false));
  }, [user]);

  function handleSignOut(): void {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setRuns([]);
    setMode('select');
  }

  function handleLogin(u: UserProfile): void {
    setUser(u);
    setMode('select');
  }

  function handleNewRun(run: RunSummary): void {
    setRuns(prev => [run, ...prev]);
  }

  if (!ready) return <div className="min-h-screen bg-zinc-50" />;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <>
      <Header user={user} onSignOut={handleSignOut} />
      <main className="min-h-screen bg-zinc-50 pt-14">
        <div className="max-w-2xl mx-auto px-6 py-16">
          {mode === 'select' && <ModeSelector onSelect={setMode} />}
          {mode === 'text' && (
            <TextAnalysis
              onBack={() => setMode('select')}
              user={user}
              runs={runs}
              historyLoading={historyLoading}
              onNewRun={handleNewRun}
              onSignOut={handleSignOut}
            />
          )}
          {mode === 'video' && <VideoUpload onBack={() => setMode('select')} user={user} />}
        </div>
      </main>
    </>
  );
}
