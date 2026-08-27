'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user, status } = useAuth();

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <h1 className="text-3xl font-semibold">CPS LMS</h1>
      <p className="mt-2 text-gray-600">
        Courses, lessons, quizzes and progress tracking.
      </p>

      <div className="mt-6 flex gap-3">
        {status === 'loading' && (
          <p className="text-sm text-gray-500">Loading…</p>
        )}

        {status === 'unauthenticated' && (
          <>
            <Link href="/login" className="rounded bg-black px-4 py-2 text-white">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded border border-gray-300 px-4 py-2"
            >
              Create account
            </Link>
          </>
        )}

        {status === 'authenticated' && user && (
          <Link href="/dashboard" className="rounded bg-black px-4 py-2 text-white">
            Go to dashboard
          </Link>
        )}
      </div>
    </main>
  );
}
