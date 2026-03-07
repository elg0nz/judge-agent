'use client';

import { useState } from 'react';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { judgeContent } from '../lib/api';
import type { JudgeResponse, RunSummary, UserProfile } from '../lib/types';
import { ApiError } from '../lib/types';
import ResultCard from './ResultCard';
import HistoryPanel from './HistoryPanel';

export default function TextAnalysis({
  onBack,
  user,
  runs,
  historyLoading,
  onSignOut,
}: {
  onBack: () => void;
  user: UserProfile;
  runs: RunSummary[];
  historyLoading: boolean;
  onNewRun: (run: RunSummary) => void;
  onSignOut: () => void;
}): React.ReactElement {
  const [text, setText] = useState('');
  const [result, setResult] = useState<JudgeResponse | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  async function handleJudge(): Promise<void> {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setRunId(null);
    try {
      const response = await judgeContent(text, user.uuid);
      setResult(response);
      setRunId(response.run_id ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        onSignOut();
        return;
      }
      if (err instanceof ApiError) {
        setError(`Error ${err.status}: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight leading-tight">
          Content Intelligence
        </h1>
        <p className="mt-2 text-zinc-500 text-base leading-relaxed">
          Paste any text and get origin detection, virality score, audience distribution, and a full explanation.
        </p>
      </div>

      <div className="relative">
        <textarea
          className="w-full h-52 px-4 py-3.5 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 font-mono resize-none shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
          placeholder="Paste text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {wordCount > 0 && (
          <div className="absolute bottom-3 right-3 text-xs text-zinc-400 pointer-events-none">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={handleJudge}
          disabled={loading || !text.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
          ) : (
            <>Analyze <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8">
          <ResultCard
            result={result}
            judgeRequestId={runId ?? user.uuid}
            contentType="text"
          />
        </div>
      )}

      <HistoryPanel runs={runs} loading={historyLoading} />
    </div>
  );
}
