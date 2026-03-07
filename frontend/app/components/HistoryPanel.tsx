import { Loader2 } from 'lucide-react';
import type { RunSummary } from '../lib/types';
import HistoryRow from './HistoryRow';

export default function HistoryPanel({ runs, loading }: { runs: RunSummary[]; loading: boolean }): React.ReactElement {
  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold text-zinc-700">Your runs</span>
        {runs.length > 0 && (
          <span className="text-xs font-medium bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-200">
            {runs.length}
          </span>
        )}
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : runs.length === 0 ? (
        <p className="text-sm text-zinc-400 py-4">No runs yet. Paste something above.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {runs.map(run => <HistoryRow key={run.id} run={run} />)}
        </div>
      )}
    </div>
  );
}
