'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { LessonForm, LessonFormValues, saveLesson } from '@/components/lesson-form';
import { Course } from '@/lib/types';

export default function NewLessonPage({
  params,
}: PageProps<'/manage/courses/[documentId]/lessons/new'>) {
  const { documentId } = use(params);
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    
    async function loadCourse() {
      try {
        const response = await apiFetch(`/api/courses/${documentId}`);

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

  const lessonsHref = `/manage/courses/${documentId}/lessons`;

  async function handleSubmit(values: LessonFormValues) {
    await saveLesson('/api/lessons', 'POST', values, course!.id);
    router.push(lessonsHref);
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href={lessonsHref} className="text-sm text-gray-500 hover:underline">
        ← Lessons
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">New lesson</h1>
      {course && <p className="mt-1 text-sm text-gray-600">{course.title}</p>}

      {status === 'loading' && <p className="mt-6 text-sm text-gray-500">Loading…</p>}

      {status === 'failed' && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      
      {status === 'ready' && course && (
        <LessonForm
          initialValues={{ title: '', content: '', videoUrl: '', order: '' }}
          submitLabel="Create lesson"
          cancelHref={lessonsHref}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}
