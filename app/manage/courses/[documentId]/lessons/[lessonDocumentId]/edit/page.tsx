'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { LessonForm, LessonFormValues, saveLesson } from '@/components/lesson-form';
import { Course, Lesson } from '@/lib/types';

export default function EditLessonPage({
  params,
}: PageProps<'/manage/courses/[documentId]/lessons/[lessonDocumentId]/edit'>) {
  const { documentId, lessonDocumentId } = use(params);
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [initialValues, setInitialValues] = useState<LessonFormValues | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'failed'>(
    'loading',
  );
  const [error, setError] = useState('');

  useEffect(() => {
    
    async function load() {
      try {
        const [courseResponse, lessonResponse] = await Promise.all([
          apiFetch(`/api/courses/${documentId}`),
          apiFetch(`/api/lessons/${lessonDocumentId}`),
        ]);

        if (courseResponse.status === 404 || lessonResponse.status === 404) {
          setStatus('missing');
          return;
        }

        if (!courseResponse.ok || !lessonResponse.ok) {
          const failed = courseResponse.ok ? lessonResponse : courseResponse;
          setError(await readError(failed, 'Could not load this lesson'));
          setStatus('failed');
          return;
        }

        const { data: courseData }: { data: Course } = await courseResponse.json();
        const { data: lesson }: { data: Lesson } = await lessonResponse.json();

        setCourse(courseData);
        setInitialValues({
          title: lesson.title ?? '',
          content: lesson.content ?? '',
          videoUrl: lesson.videoUrl ?? '',
          // A string, because it feeds a text input. Turned back into a number
          // in saveLesson.
          order: lesson.order != null ? String(lesson.order) : '',
        });
        setStatus('ready');
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    load();
  }, [documentId, lessonDocumentId]);

  const lessonsHref = `/manage/courses/${documentId}/lessons`;

  async function handleSubmit(values: LessonFormValues) {
    await saveLesson(`/api/lessons/${lessonDocumentId}`, 'PUT', values, course!.id);
    router.push(lessonsHref);
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href={lessonsHref} className="text-sm text-gray-500 hover:underline">
        ← Lessons
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Edit lesson</h1>
      {course && <p className="mt-1 text-sm text-gray-600">{course.title}</p>}

      {status === 'loading' && <p className="mt-6 text-sm text-gray-500">Loading…</p>}

      {status === 'missing' && (
        <p className="mt-6 text-sm text-gray-600">Lesson not found.</p>
      )}

      {status === 'failed' && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === 'ready' && initialValues && course && (
        <LessonForm
          initialValues={initialValues}
          submitLabel="Save changes"
          cancelHref={lessonsHref}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}
