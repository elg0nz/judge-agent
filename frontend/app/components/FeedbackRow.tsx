'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { submitFeedback } from '../lib/api';
import type { FeedbackRequest } from '../lib/types';

export default function FeedbackRow({
  judgeRequestId,
  contentType,
}: {
  judgeRequestId: string;
  contentType: 'text' | 'video';
}): React.ReactElement {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState<'up' | 'down' | null>(null);

  async function handleRating(rating: 'up' | 'down'): Promise<void> {
    if (submitted || loading) return;
    setLoading(rating);
    const req: FeedbackRequest = {
      judge_request_id: judgeRequestId,
      rating,
      content_type: contentType,
    };
    try {
      await submitFeedback(req);
    } catch {
      // Non-fatal: feedback submission failure should not disrupt UX
    } finally {
      setLoading(null);
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="px-6 py-4 border-t border-zinc-100 flex items-center gap-2 text-xs text-zinc-500">
        Thanks &mdash; this helps us improve.
      </div>
    );
  }

  return (
    <div className="px-6 py-4 border-t border-zinc-100 flex items-center gap-3">
      <span className="text-xs text-zinc-500">Was this analysis accurate?</span>
      <button
        onClick={() => handleRating('up')}
        disabled={submitted || loading !== null}
        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
        aria-label="Thumbs up"
      >
        {loading === 'up' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" /> : '👍'}
      </button>
      <button
        onClick={() => handleRating('down')}
        disabled={submitted || loading !== null}
        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
        aria-label="Thumbs down"
      >
        {loading === 'down' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" /> : '👎'}
      </button>
    </div>
  );
}
