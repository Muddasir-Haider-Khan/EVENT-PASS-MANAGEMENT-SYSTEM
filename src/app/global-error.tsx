'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-950 text-ink-50 flex flex-col items-center justify-center p-6 text-center antialiased">
        <div className="max-w-md w-full bg-ink-900 border border-ink-800 rounded-2xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-negative-500/10 border border-negative-500/20 text-negative-400 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
            !
          </div>
          <h2 className="text-2xl font-bold text-ink-100 mb-2">Critical Application Error</h2>
          <p className="text-ink-400 text-sm mb-6">
            The application encountered an unexpected layout failure.
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-accent-600 hover:bg-accent-500 text-white font-medium text-sm rounded-xl transition shadow-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            Reload System
          </button>
        </div>
      </body>
    </html>
  );
}
