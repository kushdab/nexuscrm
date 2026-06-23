'use client';
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-8">
      <div className="text-6xl mb-6">📡</div>
      <h1 className="text-3xl font-bold mb-3">You're offline</h1>
      <p className="text-slate-400 text-center max-w-md mb-8">
        NexusCRM needs an internet connection to sync your data.
        Your changes have been queued and will sync automatically when you're back online.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-indigo-600 rounded-xl font-semibold hover:bg-indigo-500 transition"
      >
        Try again
      </button>
    </div>
  );
}
