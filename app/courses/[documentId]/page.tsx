'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { canManageCourse } from '@/lib/permissions';
import { Course, Lesson } from '@/lib/types';

function byOrder(lessons: Lesson[]) {
  return [...lessons].sort((a, b) => a.order - b.order);
}

export default function CourseDetailPage({
  params,
}: PageProps<'/courses/[documentId]'>) {
  // params is a Promise in this version of Next, unwrapped with React's use().
  const { documentId } = use(params);
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'failed'>(
    'loading',
  );
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCourse() {
      try {
        // ?populate=lessons brings the lesson list along in the same request.
        
        const response = await apiFetch(
          `/api/courses/${documentId}?populate=lessons`,
        );

        
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

  const lessons = byOrder(course.lessons ?? []);

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <Link href="/courses" className="text-sm text-gray-500 hover:underline">
        ← All courses
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">{course.title}</h1>

        
        {canManageCourse(user, course.instructor?.id) && (
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/manage/courses/${course.documentId}/lessons`}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm"
            >
              Manage lessons
            </Link>
            <Link
              href={`/manage/courses/${course.documentId}/edit`}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm"
            >
              Edit course
            </Link>
          </div>
        )}
      </div>

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

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Lessons</h2>

        {lessons.length === 0 && (
          <p className="mt-2 text-sm text-gray-600">
            This course does not have any lessons yet.
          </p>
        )}

        {lessons.length > 0 && (
          <ol className="mt-3 divide-y divide-gray-100 border-y border-gray-100">
            {lessons.map((lesson) => (
              <li key={lesson.documentId}>
                <Link
                  href={`/courses/${course.documentId}/lessons/${lesson.documentId}`}
                  className="flex items-baseline gap-3 py-3 hover:underline"
                >
                  <span className="w-6 text-sm text-gray-500">{lesson.order}</span>
                  <span className="font-medium">{lesson.title}</span>
                  {lesson.videoUrl && (
                    <span className="text-xs text-gray-500">Video</span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

    </main>
  );
}
