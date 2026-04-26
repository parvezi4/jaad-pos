'use client';

import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error.message || 'Unexpected application error.'}</p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => reset()} className="bg-blue-600 text-white px-5 py-2 rounded-lg">
              Try Again
            </button>
            <Link href="/" className="text-blue-600 underline">
              Back to Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}