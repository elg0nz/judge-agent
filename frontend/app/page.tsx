'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, Zap } from 'lucide-react';
import { judgeContent } from './lib/api';
import type { JudgeResponse, DistributionSegment } from './lib/types';
import { ApiError } from './lib/types';
import { cn } from './lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-zinc-900';
  if (confidence >= 0.6) return 'bg-zinc-600';
  return 'bg-zinc-400';
}

function reactionColor(reaction: string): string {
  switch (reaction) {
    case 'share': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'save': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'comment': return 'bg-amber-100 text-amber-700 border-amber-200';
    default: return 'bg-zinc-100 text-zinc-500 border-zinc-200';
  }
}

function viralityColor(score: number): string {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-rose-500';
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

function SectionLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
      {children}
    </div>
  );
}

function OriginSection({ origin }: { origin: JudgeResponse['origin'] }): React.ReactElement {
  const isAI = origin.prediction === 'AI-generated';
  return (
    <div className="p-6 border-b border-zinc-100">
      <SectionLabel>Origin</SectionLabel>
      <div className="flex items-center gap-3 mb-4">
        <span className={cn(
          'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
          isAI
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        )}>
          {origin.prediction}
        </span>
        <span className="text-sm text-zinc-500">
          {Math.round(origin.confidence * 100)}% confidence
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden mb-4">
        <div
          className={cn('h-full rounded-full transition-all duration-700', confidenceColor(origin.confidence))}
          style={{ width: `${origin.confidence * 100}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {origin.signals.map((signal, i) => (
          <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
            {signal}
          </span>
        ))}
      </div>
    </div>
  );
}

function ViralitySection({ virality }: { virality: JudgeResponse['virality'] }): React.ReactElement {
  return (
    <div className="p-6 border-b border-zinc-100">
      <SectionLabel>Virality</SectionLabel>
      <div className="flex items-end gap-4 mb-4">
        <div className={cn('text-6xl font-bold tabular-nums leading-none', viralityColor(virality.score))}>
          {virality.score}
        </div>
        <div className="pb-1 text-xs text-zinc-400 font-medium">/ 100</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {virality.drivers.map((driver, i) => (
          <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
            {driver}
          </span>
        ))}
      </div>
    </div>
  );
}

function DistributionRow({ seg }: { seg: DistributionSegment }): React.ReactElement {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-zinc-50 last:border-0">
      <div className="w-40 shrink-0 text-sm font-medium text-zinc-800">{seg.segment}</div>
      <div className="flex-1 flex flex-wrap gap-1.5">
        {seg.platforms.map((p, i) => (
          <span key={i} className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded px-2 py-0.5">{p}</span>
        ))}
      </div>
      <span className={cn(
        'shrink-0 text-xs font-medium px-2 py-0.5 rounded border capitalize',
        reactionColor(seg.reaction)
      )}>
        {seg.reaction}
      </span>
    </div>
  );
}

function DistributionSection({ distribution }: { distribution: JudgeResponse['distribution'] }): React.ReactElement {
  return (
    <div className="p-6 border-b border-zinc-100">
      <SectionLabel>Distribution</SectionLabel>
      <div className="divide-y divide-zinc-50">
        {distribution.map((seg, i) => (
          <DistributionRow key={i} seg={seg} />
        ))}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: JudgeResponse }): React.ReactElement {
  return (
    <div className="mt-8 rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <OriginSection origin={result.origin} />
      <ViralitySection virality={result.virality} />
      <DistributionSection distribution={result.distribution} />
      <div className="p-6">
        <SectionLabel>Analysis</SectionLabel>
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
              Content Intelligence
            </h1>
            <p className="mt-2 text-zinc-500 text-base leading-relaxed">
              Paste any text — an article, email, social post, or essay — and get origin detection,
              virality score, audience distribution, and a full explanation.
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
