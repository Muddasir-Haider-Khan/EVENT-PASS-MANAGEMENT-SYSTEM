import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-ink-900/80 border border-ink-800 rounded-2xl p-8 shadow-2xl">
        <div className="w-16 h-16 bg-accent-500/10 border border-accent-500/20 text-accent-400 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
          404
        </div>
        <h2 className="text-2xl font-bold text-ink-100 mb-2">Page Not Found</h2>
        <p className="text-ink-400 text-sm mb-6">
          The requested route or event portal does not exist or may have been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-accent-600 hover:bg-accent-500 text-white font-medium text-sm rounded-xl transition shadow-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-ink-950"
        >
          Return to Portal Root
        </Link>
      </div>
    </div>
  );
}
