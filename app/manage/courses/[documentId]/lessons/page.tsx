'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { CourseLessons, Lesson } from '@/lib/types';


function byOrder(lessons: Lesson[]) {
  return [...lessons].sort((a, b) => a.order - b.order);
}

export default function ManageLessonsPage({
  params,
}: PageProps<'/manage/courses/[documentId]/lessons'>) {
  const { documentId } = use(params);

  const [course, setCourse] = useState<CourseLessons | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'failed'>(
    'loading',
  );
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    
    async function loadCourse() {
      try {
        
        const response = await apiFetch(`/api/courses/${documentId}/lessons`);

        if (response.status === 404) {
          setStatus('missing');
          return;
        }

        if (!response.ok) {
          setError(await readError(response, 'Could not load this course'));
          setStatus('failed');
          return;
        }

        // { data: lessons, meta: { course } }
        const body = await response.json();
        setCourse({ course: body.meta.course, lessons: body.data });
        setStatus('ready');
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    loadCourse();
  }, [documentId, reloadCount]);

  async function handleDelete(lesson: Lesson) {
    if (!window.confirm(`Delete "${lesson.title}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(lesson.documentId);
    setError('');

    const response = await apiFetch(`/api/lessons/${lesson.documentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      setError(
        response.status === 403
          ? 'You do not have permission to delete lessons in this course.'
          : await readError(response, 'Could not delete this lesson'),
      );
      setDeleting(null);
      return;
    }

    setReloadCount((count) => count + 1);
    setDeleting(null);
  }

  if (status === 'loading') {
    return <p className="mx-auto w-full max-w-4xl p-8 text-sm text-gray-500">Loading…</p>;
  }

  if (status === 'missing') {
    return (
      <main className="mx-auto w-full max-w-4xl p-8">
        <h1 className="text-xl font-semibold">Course not found</h1>
        <Link href="/manage/courses" className="mt-4 inline-block text-sm underline">
          Back to manage courses
        </Link>
      </main>
    );
  }

  if (status === 'failed' || !course) {
    return (
      <main className="mx-auto w-full max-w-4xl p-8">
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      </main>
    );
  }

  const lessons = byOrder(course.lessons);

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href="/manage/courses" className="text-sm text-gray-500 hover:underline">
        ← Manage courses
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Lessons</h1>
          <p className="mt-1 text-sm text-gray-600">{course.course.title}</p>
        </div>

        <Link
          href={`/manage/courses/${course.course.documentId}/lessons/new`}
          className="shrink-0 rounded bg-black px-4 py-2 text-sm text-white"
        >
          Add lesson
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {lessons.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">
          This course has no lessons yet. Add the first one to get started.
        </p>
      )}

      {lessons.length > 0 && (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-600">
            <tr>
              <th className="w-16 py-2">#</th>
              <th className="py-2">Title</th>
              <th className="py-2">Content</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {lessons.map((lesson) => (
              <tr key={lesson.documentId} className="border-b border-gray-100">
                <td className="py-3 text-gray-500">{lesson.order}</td>
                <td className="py-3">
                  <Link
                    href={`/courses/${course.course.documentId}/lessons/${lesson.documentId}`}
                    className="font-medium hover:underline"
                  >
                    {lesson.title}
                  </Link>
                </td>
                <td className="py-3 text-gray-600">
                  {[lesson.content && 'Text', lesson.videoUrl && 'Video']
                    .filter(Boolean)
                    .join(' + ') || '—'}
                </td>
                <td className="py-3 text-right">
                  <Link
                    href={`/manage/courses/${course.course.documentId}/lessons/${lesson.documentId}/edit`}
                    className="mr-4 hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(lesson)}
                    disabled={deleting === lesson.documentId}
                    className="text-red-700 hover:underline disabled:opacity-50"
                  >
                    {deleting === lesson.documentId ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
