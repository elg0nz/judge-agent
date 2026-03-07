'use client';

import { useState, useRef, useCallback } from 'react';
import { ArrowRight, ArrowLeft, Loader2, Upload, FileText } from 'lucide-react';
import { judgeVideo, uploadFile } from '../lib/api';
import type { JudgeResponse, UploadResponse, UserProfile } from '../lib/types';
import { ApiError } from '../lib/types';
import { cn } from '../lib/utils';
import ResultCard from './ResultCard';
import FrameReport from './FrameReport';

const VIDEO_TYPES = ['.mp4', '.mov', '.webm'];
const SUBTITLE_TYPES = ['.srt', '.vtt', '.txt'];

function isVideoFile(file: File): boolean {
  return VIDEO_TYPES.some(ext => file.name.toLowerCase().endsWith(ext));
}

function isSubtitleFile(file: File): boolean {
  return SUBTITLE_TYPES.some(ext => file.name.toLowerCase().endsWith(ext));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VideoUpload({ onBack, user }: { onBack: () => void; user: UserProfile }): React.ReactElement {
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
          Upload a video file and we&apos;ll analyze it for origin, virality, and audience distribution.
        </p>
      </div>

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

      <p className="mt-3 text-xs text-zinc-400">
        Dev mode: files stored in <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-600">./tmp/</code>. Production will use S3.
      </p>

      <div className="mt-4 px-4 py-3.5 rounded-lg bg-zinc-50 border border-zinc-200">
        <p className="text-xs text-zinc-600 leading-relaxed">
          Drop a subtitle file (<span className="font-mono text-zinc-500">.srt</span>, <span className="font-mono text-zinc-500">.vtt</span>) and we&apos;ll use it directly. No subtitle file? We&apos;ll generate one automatically using ElevenLabs.
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
