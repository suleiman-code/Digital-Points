'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Oops!</h2>
        <p className="text-slate-600 mb-6">Something went wrong while loading the page.</p>
        
        <div className="bg-slate-100 rounded-lg p-4 mb-6 text-left">
          <p className="text-xs text-slate-500 font-mono truncate">
            {error?.message || 'Unknown error occurred'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-3 px-5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full py-3 px-5 bg-slate-200 text-slate-900 font-bold rounded-lg hover:bg-slate-300 transition block text-center"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
