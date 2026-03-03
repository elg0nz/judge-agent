'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, Loader2, Zap, ChevronDown, ChevronRight, LogOut, FileText, Video, ArrowLeft, Upload } from 'lucide-react';
import { judgeContent, judgeVideo, signup, getHistory, uploadFile, getFrames, submitFeedback } from './lib/api';
import type { JudgeResponse, DistributionSegment, UserProfile, RunSummary, UploadResponse, FrameInfo, FeedbackRequest } from './lib/types';
import { ApiError } from './lib/types';
import { cn } from './lib/utils';

const STORAGE_KEY = 'feltsense_user';

type Mode = 'select' | 'text' | 'video';

// ── Helpers ───────────────────────────────────────────────────────────────────

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-zinc-900';
  if (confidence >= 0.6) return 'bg-zinc-600';
  return 'bg-zinc-400';
}

function reactionColor(reaction: string): string {
  switch (reaction) {
    case 'share': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'save': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'comment': return 'bg-amber-100 text-amber-700 border-amber-200';
    default: return 'bg-zinc-100 text-zinc-500 border-zinc-200';
  }
}

function viralityColor(score: number): string {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-rose-500';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Result sections ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
      {children}
    </div>
  );
}

// ── Feedback row ──────────────────────────────────────────────────────────────

function FeedbackRow({
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

// ── Frame report ──────────────────────────────────────────────────────────────

const FRAME_TYPE_LABEL: Record<string, string> = {
  scene: 'Scene',
  uniform: 'Uniform',
  keyframe: 'Keyframe',
};

function FrameReport({ uploadId }: { uploadId: string }): React.ReactElement | null {
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
          <div key={i} className="relative rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
            <img
              src={frame.url}
              alt={`Frame ${i + 1}`}
              className="w-full aspect-video object-cover block"
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

function OriginSection({ origin }: { origin: JudgeResponse['origin'] }): React.ReactElement {
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

function ViralitySection({ virality }: { virality: JudgeResponse['virality'] }): React.ReactElement {
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

function DistributionRow({ seg }: { seg: DistributionSegment }): React.ReactElement {
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

function ResultCard({
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

// ── History ───────────────────────────────────────────────────────────────────

function HistoryRow({ run }: { run: RunSummary }): React.ReactElement {
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

function HistoryPanel({ runs, loading }: { runs: RunSummary[]; loading: boolean }): React.ReactElement {
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

// ── Login screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (user: UserProfile) => void }): React.ReactElement {
  const [username, setUsername] = useState('');

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const name = username.trim();
    if (!name) return;
    // PoC: try to register with backend; fall back to local UUID if unreachable.
    let user: UserProfile;
    try {
      user = await signup(name);
    } catch {
      user = { username: name, uuid: crypto.randomUUID() };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    onLogin(user);
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">FeltSense</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">Welcome</h1>
        <p className="text-sm text-zinc-500 mb-6">Enter a username to get started. No password needed.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={64}
            className="px-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
          />
          <button
            type="submit"
            disabled={!username.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Start <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Mode selector ─────────────────────────────────────────────────────────────

function ModeSelector({ onSelect }: { onSelect: (mode: 'text' | 'video') => void }): React.ReactElement {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight leading-tight">
          Content Intelligence
        </h1>
        <p className="mt-2 text-zinc-500 text-base leading-relaxed">
          Choose how you want to analyze content.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onSelect('text')}
          className="group flex flex-col items-start gap-4 p-6 rounded-xl border border-zinc-200 bg-white shadow-sm hover:border-zinc-400 hover:shadow-md transition-all text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-zinc-200 flex items-center justify-center transition-colors">
            <FileText className="w-5 h-5 text-zinc-700" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-900 mb-1">Text</div>
            <div className="text-xs text-zinc-500 leading-relaxed">Paste or type content to analyze</div>
          </div>
        </button>

        <button
          onClick={() => onSelect('video')}
          className="group flex flex-col items-start gap-4 p-6 rounded-xl border border-zinc-200 bg-white shadow-sm hover:border-zinc-400 hover:shadow-md transition-all text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-zinc-200 flex items-center justify-center transition-colors">
            <Video className="w-5 h-5 text-zinc-700" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-900 mb-1">Video</div>
            <div className="text-xs text-zinc-500 leading-relaxed">Upload a video file to analyze</div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ── Video upload ──────────────────────────────────────────────────────────────

function VideoUpload({ onBack, user }: { onBack: () => void; user: UserProfile }): React.ReactElement {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [judging, setJudging] = useState(false);
  const [judgeResult, setJudgeResult] = useState<JudgeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);

  const VIDEO_TYPES = ['.mp4', '.mov', '.webm'];
  const SUBTITLE_TYPES = ['.srt', '.vtt', '.txt'];

  function isVideoFile(file: File): boolean {
    return VIDEO_TYPES.some(ext => file.name.toLowerCase().endsWith(ext));
  }

  function isSubtitleFile(file: File): boolean {
    return SUBTITLE_TYPES.some(ext => file.name.toLowerCase().endsWith(ext));
  }

  function handleFiles(files: FileList): void {
    for (const file of Array.from(files)) {
      if (isVideoFile(file)) {
        setVideoFile(file);
      } else if (isSubtitleFile(file)) {
        setSubtitleFile(file);
      }
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  function handleVideoInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }

  function handleSubtitleInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    if (e.target.files && e.target.files.length > 0) {
      setSubtitleFile(e.target.files[0]);
    }
  }

  async function handleUpload(): Promise<void> {
    if (!videoFile) return;
    setUploading(true);
    setError(null);
    setUploadResult(null);
    setJudgeResult(null);
    try {
      const uploadRes = await uploadFile(videoFile, subtitleFile ?? undefined);
      setUploadResult(uploadRes);
      // Proceed to judge the uploaded video
      setUploading(false);
      setJudging(true);
      try {
        const judgeRes = await judgeVideo(uploadRes.upload_id, user.uuid);
        setJudgeResult(judgeRes);
      } catch (judgeErr) {
        if (judgeErr instanceof ApiError) {
          setError(`Analysis failed — Error ${judgeErr.status}: ${judgeErr.message}`);
        } else {
          setError(judgeErr instanceof Error ? judgeErr.message : 'Analysis failed');
        }
      } finally {
        setJudging(false);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error ${err.status}: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
      setUploading(false);
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight leading-tight">
          Video Analysis
        </h1>
        <p className="mt-2 text-zinc-500 text-base leading-relaxed">
          Upload a video file and we'll analyze it for origin, virality, and audience distribution.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => videoInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-white cursor-pointer transition-all',
          'px-6 py-12',
          isDraggingOver
            ? 'border-zinc-500 bg-zinc-50'
            : 'border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/50'
        )}
      >
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
          isDraggingOver ? 'bg-zinc-200' : 'bg-zinc-100'
        )}>
          <Upload className="w-5 h-5 text-zinc-600" />
        </div>
        {videoFile ? (
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-900">{videoFile.name}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{formatBytes(videoFile.size)}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-700">Drop video file here or click to browse</p>
            <p className="text-xs text-zinc-400 mt-1">.mp4, .mov, .webm</p>
          </div>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
          className="sr-only"
          onChange={handleVideoInputChange}
          onClick={e => e.stopPropagation()}
        />
      </div>

      {/* Dev mode notice */}
      <p className="mt-3 text-xs text-zinc-400">
        Dev mode: files stored in <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-600">./tmp/</code>. Production will use S3.
      </p>

      {/* Subtitle info */}
      <div className="mt-4 px-4 py-3.5 rounded-lg bg-zinc-50 border border-zinc-200">
        <p className="text-xs text-zinc-600 leading-relaxed">
          Drop a subtitle file (<span className="font-mono text-zinc-500">.srt</span>, <span className="font-mono text-zinc-500">.vtt</span>) and we'll use it directly. No subtitle file? We'll generate one automatically using ElevenLabs.
        </p>
        {subtitleFile ? (
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-xs font-medium text-zinc-700">{subtitleFile.name}</span>
              <span className="text-xs text-zinc-400">{formatBytes(subtitleFile.size)}</span>
            </div>
            <button
              onClick={() => setSubtitleFile(null)}
              className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={() => subtitleInputRef.current?.click()}
            className="mt-2.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 underline underline-offset-2 transition-colors"
          >
            Add subtitle file
          </button>
        )}
        <input
          ref={subtitleInputRef}
          type="file"
          accept=".srt,.vtt,.txt"
          className="sr-only"
          onChange={handleSubtitleInputChange}
        />
      </div>

      {/* Upload button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={uploading || judging || !videoFile}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
          ) : judging ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
          ) : (
            <>Upload <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {uploadResult && !judgeResult && !judging && (
        <div className="mt-4 px-4 py-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700 mb-1">Upload successful</p>
          <div className="flex items-center gap-2 text-xs text-emerald-600">
            <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded">{uploadResult.upload_id}</span>
            {uploadResult.has_subtitles && (
              <span className="text-emerald-500">subtitles included</span>
            )}
          </div>
        </div>
      )}

      {judgeResult && uploadResult && (
        <div className="mt-8">
          <FrameReport uploadId={uploadResult.upload_id} />
          <div className="mt-6">
            <ResultCard
              result={judgeResult}
              judgeRequestId={uploadResult.upload_id}
              contentType="video"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Text analysis ─────────────────────────────────────────────────────────────

function TextAnalysis({
  onBack,
  user,
  runs,
  historyLoading,
  onSignOut,
}: {
  onBack: () => void;
  user: UserProfile;
  runs: RunSummary[];
  historyLoading: boolean;
  onNewRun: (run: RunSummary) => void;
  onSignOut: () => void;
}): React.ReactElement {
  const [text, setText] = useState('');
  const [result, setResult] = useState<JudgeResponse | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  async function handleJudge(): Promise<void> {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setRunId(null);
    try {
      const response = await judgeContent(text, user.uuid);
      setResult(response);
      setRunId(response.run_id ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Stale user_uuid — force re-login
        onSignOut();
        return;
      }
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
    <div>
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight leading-tight">
          Content Intelligence
        </h1>
        <p className="mt-2 text-zinc-500 text-base leading-relaxed">
          Paste any text and get origin detection, virality score, audience distribution, and a full explanation.
        </p>
      </div>

      <div className="relative">
        <textarea
          className="w-full h-52 px-4 py-3.5 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 font-mono resize-none shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
          placeholder="Paste text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {wordCount > 0 && (
          <div className="absolute bottom-3 right-3 text-xs text-zinc-400 pointer-events-none">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={handleJudge}
          disabled={loading || !text.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
          ) : (
            <>Analyze <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8">
          <ResultCard
            result={result}
            judgeRequestId={runId ?? user.uuid}
            contentType="text"
          />
        </div>
      )}

      <HistoryPanel runs={runs} loading={historyLoading} />
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header({ user, onSignOut }: { user: UserProfile | null; onSignOut: () => void }): React.ReactElement {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-100">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">FeltSense</span>
        </div>
        {user && (
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            <span className="font-medium">@{user.username}</span>
            <LogOut className="w-3 h-3" />
          </button>
        )}
      </div>
    </header>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home(): React.ReactElement {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>('select');
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Hydrate user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setReady(true);
  }, []);

  // Load history when user is known
  useEffect(() => {
    if (!user) return;
    setHistoryLoading(true);
    getHistory(user.uuid)
      .then(setRuns)
      .catch(() => {/* non-fatal */})
      .finally(() => setHistoryLoading(false));
  }, [user]);

  function handleSignOut(): void {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setRuns([]);
    setMode('select');
  }

  function handleLogin(u: UserProfile): void {
    setUser(u);
    setMode('select');
  }

  function handleNewRun(run: RunSummary): void {
    setRuns(prev => [run, ...prev]);
  }

  // Wait for localStorage hydration to avoid flash
  if (!ready) return <div className="min-h-screen bg-zinc-50" />;

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <>
      <Header user={user} onSignOut={handleSignOut} />

      <main className="min-h-screen bg-zinc-50 pt-14">
        <div className="max-w-2xl mx-auto px-6 py-16">
          {mode === 'select' && (
            <ModeSelector onSelect={setMode} />
          )}
          {mode === 'text' && (
            <TextAnalysis
              onBack={() => setMode('select')}
              user={user}
              runs={runs}
              historyLoading={historyLoading}
              onNewRun={handleNewRun}
              onSignOut={handleSignOut}
            />
          )}
          {mode === 'video' && (
            <VideoUpload onBack={() => setMode('select')} user={user} />
          )}
        </div>
      </main>
    </>
  );
}
