'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { relativeTime } from '../lib/helpers';
import type { RunSummary } from '../lib/types';
import ResultCard from './ResultCard';

export default function HistoryRow({ run }: { run: RunSummary }): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const isAI = run.output.origin.prediction === 'AI-generated';
  return (
    <div className="border border-zinc-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-zinc-50 transition-colors text-left"
      >
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
        <span className={cn(
          'shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border',
          isAI ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
        )}>
          {isAI ? 'AI' : 'Human'}
        </span>
        <span className="flex-1 text-xs text-zinc-600 truncate">{run.input_preview}</span>
        <span className="shrink-0 text-xs text-zinc-400">{relativeTime(run.created_at)}</span>
      </button>
      {expanded && (
        <div className="border-t border-zinc-100 p-4 bg-zinc-50">
          <ResultCard result={run.output} judgeRequestId={run.id} contentType="text" />
        </div>
      )}
    </div>
  );
}
