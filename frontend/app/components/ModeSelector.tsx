import { FileText, Video } from 'lucide-react';

export default function ModeSelector({ onSelect }: { onSelect: (mode: 'text' | 'video') => void }): React.ReactElement {
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
