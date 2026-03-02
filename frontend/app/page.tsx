'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, Zap } from 'lucide-react';
import { judgeContent } from './lib/api';
import type { JudgeResponse } from './lib/types';
import { ApiError } from './lib/types';
import { cn } from './lib/utils';

// ── Score utilities ──────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score < 30) return 'text-rose-500';
  if (score < 70) return 'text-amber-500';
  return 'text-emerald-500';
}

function scoreBg(score: number): string {
  if (score < 30) return 'bg-rose-500';
  if (score < 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function scoreLabel(score: number): string {
  if (score < 30) return 'Likely AI-generated';
  if (score < 70) return 'Ambiguous';
  return 'Likely human-written';
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Header(): React.ReactElement {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-100">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">FeltSense</span>
        </div>
        <span className="text-xs text-zinc-400 font-medium tracking-wide uppercase">Content Intelligence</span>
      </div>
    </header>
  );
}

function ScoreGauge({ score }: { score: number }): React.ReactElement {
  return (
    <div className="flex items-end gap-6">
      <div>
        <div className={cn('text-7xl font-bold tabular-nums leading-none', scoreColor(score))}>
          {score}
        </div>
        <div className="text-xs text-zinc-400 mt-1.5 font-medium">out of 100</div>
      </div>
      <div className="pb-1 flex-1">
        <div className={cn('text-sm font-semibold mb-2', scoreColor(score))}>
          {scoreLabel(score)}
        </div>
        <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700', scoreBg(score))}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-zinc-400">AI</span>
          <span className="text-[10px] text-zinc-400">Human</span>
        </div>
      </div>
    </div>
  );
}

function SignalPill({ signal }: { signal: string }): React.ReactElement {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
      {signal}
    </span>
  );
}

function ResultCard({ result }: { result: JudgeResponse }): React.ReactElement {
  return (
    <div className="mt-8 rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {/* Score section */}
      <div className="p-6 border-b border-zinc-100">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Humanness Score
        </div>
        <ScoreGauge score={result.score} />
      </div>

      {/* Signals */}
      <div className="p-6 border-b border-zinc-100">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Detection Signals
        </div>
        <div className="flex flex-wrap gap-2">
          {result.signals.map((signal, i) => (
            <SignalPill key={i} signal={signal} />
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div className="p-6">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Analysis
        </div>
        <p className="text-sm text-zinc-600 leading-relaxed">{result.explanation}</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Home(): React.ReactElement {
  const [text, setText] = useState('');
  const [result, setResult] = useState<JudgeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  async function handleJudge(): Promise<void> {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await judgeContent(text);
      setResult(response);
    } catch (err) {
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
    <>
      <Header />

      <main className="min-h-screen bg-zinc-50 pt-14">
        <div className="max-w-2xl mx-auto px-6 py-16">

          {/* Hero */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight leading-tight">
              Is this AI-generated?
            </h1>
            <p className="mt-2 text-zinc-500 text-base leading-relaxed">
              Paste any text — an article, email, social post, or essay — and get a
              humanness score, the signals that drove it, and an explanation.
            </p>
          </div>

          {/* Input */}
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

          {/* CTA */}
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleJudge}
              disabled={loading || !text.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  Analyze
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {result && <ResultCard result={result} />}

        </div>
      </main>
    </>
  );
}
