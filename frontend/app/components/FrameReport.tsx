'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { getFrames } from '../lib/api';
import type { FrameInfo } from '../lib/types';
import { API_BASE_URL } from '../lib/constants';

const FRAME_TYPE_LABEL: Record<string, string> = {
  scene: 'Scene',
  uniform: 'Uniform',
  keyframe: 'Keyframe',
};

export default function FrameReport({ uploadId }: { uploadId: string }): React.ReactElement | null {
  const [frames, setFrames] = useState<FrameInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFrames(uploadId)
      .then((data) => {
        if (!cancelled) setFrames(data.slice(0, 9));
      })
      .catch(() => {
        // 404 or network error — render nothing
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [uploadId]);

  if (loading) {
    return (
      <div className="mt-6 flex items-center gap-2 text-xs text-zinc-400 py-3">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading frames&hellip;
      </div>
    );
  }

  if (frames.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
        Frame samples
      </div>
      <div className="grid grid-cols-3 gap-2">
        {frames.map((frame, i) => (
          <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
            <Image
              src={`${API_BASE_URL}${frame.url}`}
              alt={`Frame ${i + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-zinc-900/60">
              <span className="text-xs text-white font-medium">
                {FRAME_TYPE_LABEL[frame.type] ?? frame.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
