'use client';
import { usePWA } from '@/hooks/usePWA';
import { useState } from 'react';

export function InstallBanner() {
  const { installPrompt, promptInstall, isInstalled } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed || !installPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50
                    bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-4 flex items-start gap-4">
      <div className="text-3xl">📲</div>
      <div className="flex-1">
        <p className="font-semibold text-white text-sm">Install NexusCRM</p>
        <p className="text-slate-400 text-xs mt-0.5">
          Get the full app experience — works offline, instant launch.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={promptInstall}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs
                       rounded-lg font-semibold transition"
          >
            Install
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-1.5 text-slate-400 hover:text-white text-xs transition"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
