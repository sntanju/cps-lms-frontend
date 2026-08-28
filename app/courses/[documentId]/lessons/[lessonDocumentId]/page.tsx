'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { Lesson } from '@/lib/types';

export default function LessonPage({
  params,
}: PageProps<'/courses/[documentId]/lessons/[lessonDocumentId]'>) {
  const { documentId, lessonDocumentId } = use(params);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'failed'>(
    'loading',
  );
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLesson() {
      try {
        const response = await apiFetch(`/api/lessons/${lessonDocumentId}`);

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
        setLesson(body.data);
        setStatus('ready');
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    loadLesson();
  }, [lessonDocumentId]);

  if (status === 'loading') {
    return <p className="mx-auto w-full max-w-3xl p-8 text-sm text-gray-500">Loading…</p>;
  }

  if (status === 'missing') {
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <h1 className="text-xl font-semibold">Lesson not found</h1>
        <Link href={`/courses/${documentId}`} className="mt-4 inline-block text-sm underline">
          Back to the course
        </Link>
      </main>
    );
  }

  if (status === 'failed' || !lesson) {
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
      <Link
        href={`/courses/${documentId}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← Back to the course
      </Link>

      <p className="mt-4 text-sm text-gray-500">Lesson {lesson.order}</p>
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
        <p className="mt-6 text-sm text-gray-600">
          This lesson has no content yet.
        </p>
      )}

      
    </main>
  );
}
