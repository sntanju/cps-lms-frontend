'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export function SiteHeader() {
  const { user, status, logout } = useAuth();

  return (
    <header className="border-b border-gray-200">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 p-4">
        <Link href="/" className="text-lg font-semibold">
          CPS LMS
        </Link>

        <div className="flex items-center gap-4 text-sm">
      
          {status === 'loading' && <span className="text-gray-500">…</span>}

          {status === 'unauthenticated' && (
            <>
              <Link href="/login" className="hover:underline">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded bg-black px-3 py-1.5 text-white"
              >
                Create account
              </Link>
            </>
          )}

          {status === 'authenticated' && user && (
            <>
              <Link href="/courses" className="hover:underline">
                Courses
              </Link>
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>

              {user.role === 'Student' && (
                <>
                  <Link href="/my-courses" className="hover:underline">
                    My Courses
                  </Link>
                  <Link href="/my-results" className="hover:underline">
                    My Results
                  </Link>
                </>
              )}

              {(user.role === 'Admin' ||
                user.role === 'Content Manager' ||
                user.role === 'Instructor') && (
                <Link href="/manage/courses" className="hover:underline">
                  Manage
                </Link>
              )}

              {user.role === 'Admin' && (
                <Link href="/admin" className="hover:underline">
                  Admin
                </Link>
              )}

              <span className="text-gray-500">{user.fullName}</span>

              <button
                onClick={logout}
                className="rounded border border-gray-300 px-3 py-1.5"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
