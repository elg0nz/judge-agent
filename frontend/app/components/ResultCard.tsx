import type { JudgeResponse } from '../lib/types';
import SectionLabel from './SectionLabel';
import OriginSection from './OriginSection';
import ViralitySection from './ViralitySection';
import DistributionRow from './DistributionRow';
import FeedbackRow from './FeedbackRow';

export default function ResultCard({
  result,
  judgeRequestId,
  contentType,
}: {
  result: JudgeResponse;
  judgeRequestId: string;
  contentType: 'text' | 'video';
}): React.ReactElement {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <OriginSection origin={result.origin} />
      <ViralitySection virality={result.virality} />
      <div className="p-6 border-b border-zinc-100">
        <SectionLabel>Distribution</SectionLabel>
        {result.distribution.map((seg, i) => <DistributionRow key={i} seg={seg} />)}
      </div>
      <div className="p-6 border-b border-zinc-100">
        <SectionLabel>Analysis</SectionLabel>
        <p className="text-sm text-zinc-600 leading-relaxed">{result.explanation}</p>
      </div>
      <FeedbackRow judgeRequestId={judgeRequestId} contentType={contentType} />
    </div>
  );
}
