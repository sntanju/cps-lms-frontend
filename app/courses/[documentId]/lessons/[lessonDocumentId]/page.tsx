'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { CourseLessons } from '@/lib/types';

export default function LessonPage({
  params,
}: PageProps<'/courses/[documentId]/lessons/[lessonDocumentId]'>) {
  const { documentId, lessonDocumentId } = use(params);

  const [data, setData] = useState<CourseLessons | null>(null);
  const [status, setStatus] = useState<
    'loading' | 'ready' | 'forbidden' | 'missing' | 'failed'
  >('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    
    async function loadLessons() {
      try {
        const response = await apiFetch(`/api/courses/${documentId}/lessons`);

        if (response.status === 403) {
          setStatus('forbidden');
          return;
        }

        if (response.status === 404) {
          setStatus('missing');
          return;
        }

        if (!response.ok) {
          setError(await readError(response, 'Could not load this lesson'));
          setStatus('failed');
          return;
        }

        const body = await response.json();
        setData({ course: body.meta.course, lessons: body.data });
        setStatus('ready');
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    loadLessons();
  }, [documentId]);

  if (status === 'loading') {
    return <p className="mx-auto w-full max-w-5xl p-8 text-sm text-gray-500">Loading…</p>;
  }

  if (status === 'forbidden') {
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <h1 className="text-xl font-semibold">Enrol to view this lesson</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enrol in this course to view its lessons.
        </p>
        <Link
          href={`/courses/${documentId}`}
          className="mt-4 inline-block rounded bg-black px-4 py-2 text-sm text-white"
        >
          Go to the course
        </Link>
      </main>
    );
  }

  if (status === 'missing' || (status === 'ready' && data?.lessons.length === 0)) {
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <h1 className="text-xl font-semibold">Lesson not found</h1>
        <Link href={`/courses/${documentId}`} className="mt-4 inline-block text-sm underline">
          Back to the course
        </Link>
      </main>
    );
  }

  if (status === 'failed' || !data) {
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      </main>
    );
  }

  // The lessons arrive sorted by order, so the neighbours are just the array positions either side.
  const index = data.lessons.findIndex(
    (lesson) => lesson.documentId === lessonDocumentId,
  );
  const lesson = data.lessons[index];
  const previous = index > 0 ? data.lessons[index - 1] : null;
  const next = index < data.lessons.length - 1 ? data.lessons[index + 1] : null;

  
  if (!lesson) {
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <h1 className="text-xl font-semibold">Lesson not found</h1>
        <Link href={`/courses/${documentId}`} className="mt-4 inline-block text-sm underline">
          Back to {data.course.title}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <Link
        href={`/courses/${documentId}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← {data.course.title}
      </Link>

      <div className="mt-4 grid gap-8 sm:grid-cols-[220px_1fr]">
        {/* The sequence, so "in sequence" is visible rather than implied. */}
        <nav className="order-2 sm:order-1">
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Lessons
          </h2>
          <ol className="mt-2 space-y-1">
            {data.lessons.map((item, itemIndex) => (
              <li key={item.documentId}>
                <Link
                  href={`/courses/${documentId}/lessons/${item.documentId}`}
                  className={
                    item.documentId === lesson.documentId
                      ? 'block rounded bg-gray-100 px-2 py-1.5 text-sm font-medium'
                      : 'block rounded px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50'
                  }
                >
                  {itemIndex + 1}. {item.title}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <article className="order-1 sm:order-2">
          <p className="text-sm text-gray-500">
            Lesson {index + 1} of {data.lessons.length}
          </p>
          <h1 className="text-2xl font-semibold">{lesson.title}</h1>

          {lesson.videoUrl && (
            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm underline"
            >
              Watch the video
            </a>
          )}

          {lesson.content && (
            <p className="mt-6 whitespace-pre-wrap text-gray-700">{lesson.content}</p>
          )}

          {!lesson.content && !lesson.videoUrl && (
            <p className="mt-6 text-sm text-gray-600">This lesson has no content yet.</p>
          )}

          {/* "Mark complete" will write here. */}

          <div className="mt-10 flex items-center justify-between border-t border-gray-100 pt-4">
            {previous ? (
              <Link
                href={`/courses/${documentId}/lessons/${previous.documentId}`}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm"
              >
                ← Previous
              </Link>
            ) : (
              <span className="rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-400">
                ← Previous
              </span>
            )}

            {next ? (
              <Link
                href={`/courses/${documentId}/lessons/${next.documentId}`}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm"
              >
                Next →
              </Link>
            ) : (
              <span className="rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-400">
                Next →
              </span>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
