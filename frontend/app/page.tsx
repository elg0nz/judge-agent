'use client';

import { useState } from 'react';
import { judgeContent } from './lib/api';
import type { JudgeResponse } from './lib/types';
import { ApiError } from './lib/types';

function ScoreDisplay({ score }: { score: number }): React.ReactElement {
  const color =
    score < 30 ? 'text-red-500' : score < 70 ? 'text-yellow-500' : 'text-green-500';
  const label =
    score < 30 ? 'Likely AI' : score < 70 ? 'Ambiguous' : 'Likely Human';

  return (
    <div className="text-center py-8">
      <div className={`text-8xl font-bold ${color}`}>{score}</div>
      <div className={`text-xl mt-2 font-medium ${color}`}>{label}</div>
      <div className="text-sm text-gray-500 mt-1">humanness score (0=AI, 100=Human)</div>
    </div>
  );
}

function SignalsList({ signals }: { signals: string[] }): React.ReactElement {
  return (
    <div className="mt-4">
      <h3 className="font-semibold text-gray-700 mb-2">Signals</h3>
      <ul className="list-disc list-inside space-y-1">
        {signals.map((signal, i) => (
          <li key={i} className="text-gray-600 text-sm">{signal}</li>
        ))}
      </ul>
    </div>
  );
}

export default function Home(): React.ReactElement {
  const [text, setText] = useState('');
  const [result, setResult] = useState<JudgeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Judge Agent</h1>
        <p className="text-gray-500 mb-8">Paste text to detect if it was written by AI or a human.</p>

        <textarea
          className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
          placeholder="Paste text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          className="mt-4 w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={handleJudge}
          disabled={loading || !text.trim()}
        >
          {loading ? 'Judging...' : 'Judge'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <ScoreDisplay score={result.score} />
            <SignalsList signals={result.signals} />
            <div className="mt-4">
              <h3 className="font-semibold text-gray-700 mb-2">Explanation</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{result.explanation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
