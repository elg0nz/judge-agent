import { cn } from '../lib/utils';
import { confidenceColor } from '../lib/helpers';
import type { JudgeResponse } from '../lib/types';
import SectionLabel from './SectionLabel';

export default function OriginSection({ origin }: { origin: JudgeResponse['origin'] }): React.ReactElement {
  const isAI = origin.prediction === 'AI-generated';
  return (
    <div className="p-6 border-b border-zinc-100">
      <SectionLabel>Origin</SectionLabel>
      <div className="flex items-center gap-3 mb-4">
        <span className={cn(
          'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
          isAI ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        )}>
          {origin.prediction}
        </span>
        <span className="text-sm text-zinc-500">{Math.round(origin.confidence * 100)}% confidence</span>
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
