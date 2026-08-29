'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { Enrollment } from '@/lib/types';
import { ProgressBar } from '@/components/progress-bar';

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    
    async function loadEnrollments() {
      try {
        const response = await apiFetch('/api/enrollments/mine');

        if (!response.ok) {
          setError(await readError(response, 'Could not load your courses'));
          setStatus('failed');
          return;
        }

        const body = await response.json();
        setEnrollments(body.data);
        setStatus('ready');
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    loadEnrollments();
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <h1 className="text-2xl font-semibold">My courses</h1>
      <p className="mt-1 text-sm text-gray-600">
        The courses you have enrolled in.{' '}
        <Link href="/my-results" className="underline">
          See your quiz results
        </Link>
        .
      </p>

      {status === 'loading' && (
        <p className="mt-6 text-sm text-gray-500">Loading…</p>
      )}

      {status === 'failed' && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === 'ready' && enrollments.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">
          You have not enrolled in any courses yet.{' '}
          <Link href="/courses" className="underline">
            Browse the catalogue
          </Link>
          .
        </p>
      )}

      {status === 'ready' && enrollments.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {enrollments.map((enrollment) => (
            <li
              key={enrollment.documentId}
              className="overflow-hidden rounded border border-gray-200"
            >
              {enrollment.course.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={enrollment.course.coverImageUrl}
                  alt=""
                  className="h-36 w-full object-cover"
                />
              )}

              <div className="p-4">
                <h2 className="font-medium">
                  <Link
                    href={`/courses/${enrollment.course.documentId}`}
                    className="hover:underline"
                  >
                    {enrollment.course.title}
                  </Link>
                </h2>

                {enrollment.course.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                    {enrollment.course.description}
                  </p>
                )}

                {enrollment.course.instructor && (
                  <p className="mt-3 text-xs text-gray-500">
                    Instructor: {enrollment.course.instructor.fullName}
                  </p>
                )}

                <div className="mt-4">
                  <ProgressBar
                    completed={enrollment.progress.completed}
                    total={enrollment.progress.total}
                    percentage={enrollment.progress.percentage}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
