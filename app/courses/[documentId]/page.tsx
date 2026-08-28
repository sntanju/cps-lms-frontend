'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { Course } from '@/lib/types';

export default function CourseDetailPage({
  params,
}: PageProps<'/courses/[documentId]'>) {
  // params is a Promise in this version of Next, unwrapped with React's use().
  const { documentId } = use(params);

  const [course, setCourse] = useState<Course | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'failed'>(
    'loading',
  );
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCourse() {
      try {
        const response = await apiFetch(`/api/courses/${documentId}`);

        // A course that does not exist is an expected outcome of a typed or
        // stale URL, so it gets its own state rather than an error banner.
        if (response.status === 404) {
          setStatus('missing');
          return;
        }

        if (!response.ok) {
          setError(await readError(response, 'Could not load this course'));
          setStatus('failed');
          return;
        }

        const body = await response.json();
        setCourse(body.data);
        setStatus('ready');
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    loadCourse();
  }, [documentId]);

  if (status === 'loading') {
    return <p className="mx-auto w-full max-w-3xl p-8 text-sm text-gray-500">Loading…</p>;
  }

  if (status === 'missing') {
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <h1 className="text-xl font-semibold">Course not found</h1>
        <Link href="/courses" className="mt-4 inline-block text-sm underline">
          Back to all courses
        </Link>
      </main>
    );
  }

  if (status === 'failed' || !course) {
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <Link href="/courses" className="text-sm text-gray-500 hover:underline">
        ← All courses
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">{course.title}</h1>

      {course.instructor && (
        <p className="mt-1 text-sm text-gray-600">
          Taught by {course.instructor.fullName}
        </p>
      )}

      {course.description && (
        <p className="mt-4 whitespace-pre-wrap text-gray-700">
          {course.description}
        </p>
      )}

      {/* Lessons land here in Phase 3, and the enroll button in Phase 4. */}
    </main>
  );
}
