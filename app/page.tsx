'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const ROLES = [
  {
    name: 'Admin',
    description: 'Full control, including every user’s role.',
  },
  {
    name: 'Content Manager',
    description: 'Courses, lessons and blog posts across the platform.',
  },
  {
    name: 'Instructor',
    description: 'Their own courses, and the progress of students in them.',
  },
  {
    name: 'Student',
    description: 'Enrol, read lessons, take quizzes, track progress.',
  },
];

export default function HomePage() {
  const { user, status } = useAuth();

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <h1 className="text-3xl font-semibold">CPS LMS</h1>
      <p className="mt-2 max-w-xl text-gray-600">
        A learning management system: courses and lessons, enrolment, progress
        tracking, auto-graded quizzes, and a blog — with what you can do decided by
        your role.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {status === 'loading' && <p className="text-sm text-gray-500">Loading…</p>}

        {status === 'unauthenticated' && (
          <>
            <Link href="/login" className="rounded bg-black px-4 py-2 text-white">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
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

        {/* Published posts are readable without an account. */}
        <Link href="/blog" className="text-sm underline">
          Read the blog
        </Link>
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Four roles</h2>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2">
          {ROLES.map((role) => (
            <li key={role.name} className="rounded border border-gray-200 p-4">
              <h3 className="font-medium">{role.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{role.description}</p>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm text-gray-500">
          New accounts are created as Students. An Admin assigns any other role.
        </p>
      </section>
    </main>
  );
}
