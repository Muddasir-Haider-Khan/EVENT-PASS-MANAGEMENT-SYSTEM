'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-ink-900/80 border border-ink-800 rounded-2xl p-8 shadow-2xl">
        <div className="w-16 h-16 bg-negative-500/10 border border-negative-500/20 text-negative-400 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
          !
        </div>
        <h2 className="text-2xl font-bold text-ink-100 mb-2">Something went wrong</h2>
        <p className="text-ink-400 text-sm mb-6">
          An unexpected error occurred. Our team has been notified and we are resolving the issue.
        </p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="bg-ink-950/80 border border-ink-800 rounded-lg p-3 text-left mb-6 overflow-x-auto text-xs text-negative-300 font-mono">
            {error.message}
          </div>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-accent-600 hover:bg-accent-500 active:bg-accent-700 text-white font-medium text-sm rounded-xl transition shadow-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-ink-950"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 bg-ink-800 hover:bg-ink-700 text-ink-200 font-medium text-sm rounded-xl transition border border-ink-700 focus:outline-none focus:ring-2 focus:ring-ink-500 focus:ring-offset-2 focus:ring-offset-ink-950"
          >
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
}
