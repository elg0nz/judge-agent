import { cn } from '../lib/utils';
import { viralityColor } from '../lib/helpers';
import type { JudgeResponse } from '../lib/types';
import SectionLabel from './SectionLabel';

export default function ViralitySection({ virality }: { virality: JudgeResponse['virality'] }): React.ReactElement {
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
