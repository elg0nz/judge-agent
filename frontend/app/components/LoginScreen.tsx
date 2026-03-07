'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { signup } from '../lib/api';
import type { UserProfile } from '../lib/types';
import { STORAGE_KEY } from '../lib/constants';

export default function LoginScreen({ onLogin }: { onLogin: (user: UserProfile) => void }): React.ReactElement {
  const [username, setUsername] = useState('');

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const name = username.trim();
    if (!name) return;
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
          <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center text-sm leading-none">
            <span role="img" aria-label="sparkles logo">✨</span>
          </div>
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">GloSense</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">Welcome</h1>
        <p className="text-sm text-zinc-500 mb-6">Enter a username to get started. No password needed.</p>
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 leading-relaxed">
          Right now you&apos;re in dev mode.
          <br />
          <br />
          Auth is basically vibes — insecure and not wired up.
          <br />
          <br />
          Yes, that&apos;s intentional. This is a take-home, so I optimized for signal over ceremony. Ship the core. Skip the theater.
          <br />
          <br />
          If we were pushing to prod, we&apos;d lock it down properly.
        </div>
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
