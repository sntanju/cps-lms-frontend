'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { Course } from '@/lib/types';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCourses() {
      try {
        // No populate parameter for the instructor: the API attaches it already,
        // because a populated user relation gets stripped by Strapi's content
        // API sanitizer. See src/api/course/controllers/course.ts in the backend.
        const response = await apiFetch('/api/courses?sort=createdAt:desc');

        if (!response.ok) {
          setError(await readError(response, 'Could not load courses'));
          setStatus('failed');
          return;
        }

        const body = await response.json();
        setCourses(body.data);
        setStatus('ready');
      } catch {
        // A thrown fetch means the network failed or the API is unreachable —
        // distinct from the API answering with an error above.
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    loadCourses();
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <h1 className="text-2xl font-semibold">Courses</h1>
      <p className="mt-1 text-sm text-gray-600">
        Browse the catalogue and open a course to see what it covers.
      </p>

      {status === 'loading' && (
        <p className="mt-6 text-sm text-gray-500">Loading courses…</p>
      )}

      {status === 'failed' && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* An empty catalogue is a normal state, not an error — say so rather
          than rendering a blank page. */}
      {status === 'ready' && courses.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">No courses yet.</p>
      )}

      {status === 'ready' && courses.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <li
              key={course.documentId}
              className="rounded border border-gray-200 p-4"
            >
              <h2 className="font-medium">
                <Link
                  href={`/courses/${course.documentId}`}
                  className="hover:underline"
                >
                  {course.title}
                </Link>
              </h2>

              {course.description && (
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                  {course.description}
                </p>
              )}

              {course.instructor && (
                <p className="mt-3 text-xs text-gray-500">
                  Instructor: {course.instructor.fullName}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
