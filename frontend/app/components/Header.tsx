'use client';

import { LogOut } from 'lucide-react';
import type { UserProfile } from '../lib/types';

export default function Header({ user, onSignOut }: { user: UserProfile | null; onSignOut: () => void }): React.ReactElement {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-100">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center text-sm leading-none">
            <span role="img" aria-label="sparkles logo">✨</span>
          </div>
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">GloSense</span>
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
