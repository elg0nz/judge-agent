export function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-zinc-900';
  if (confidence >= 0.6) return 'bg-zinc-600';
  return 'bg-zinc-400';
}

export function reactionColor(reaction: string): string {
  switch (reaction) {
    case 'share': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'save': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'comment': return 'bg-amber-100 text-amber-700 border-amber-200';
    default: return 'bg-zinc-100 text-zinc-500 border-zinc-200';
  }
}

export function viralityColor(score: number): string {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-rose-500';
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
