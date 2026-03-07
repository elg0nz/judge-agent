import { cn } from '../lib/utils';
import { reactionColor } from '../lib/helpers';
import type { DistributionSegment } from '../lib/types';

export default function DistributionRow({ seg }: { seg: DistributionSegment }): React.ReactElement {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-zinc-50 last:border-0">
      <div className="w-40 shrink-0 text-sm font-medium text-zinc-800">{seg.segment}</div>
      <div className="flex-1 flex flex-wrap gap-1.5">
        {seg.platforms.map((p, i) => (
          <span key={i} className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded px-2 py-0.5">{p}</span>
        ))}
      </div>
      <span className={cn('shrink-0 text-xs font-medium px-2 py-0.5 rounded border capitalize', reactionColor(seg.reaction))}>
        {seg.reaction}
      </span>
    </div>
  );
}
