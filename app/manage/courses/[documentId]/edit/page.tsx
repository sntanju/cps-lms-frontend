'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import {
  CourseForm,
  CourseFormValues,
  saveCourse,
} from '@/components/course-form';

export default function EditCoursePage({
  params,
}: PageProps<'/manage/courses/[documentId]/edit'>) {
  const { documentId } = use(params);
  const router = useRouter();

  const [initialValues, setInitialValues] = useState<CourseFormValues | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'failed'>(
    'loading',
  );
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCourse() {
      try {
        const response = await apiFetch(`/api/courses/${documentId}`);

        if (response.status === 404) {
          setStatus('missing');
          return;
        }

        if (!response.ok) {
          setError(await readError(response, 'Could not load this course'));
          setStatus('failed');
          return;
        }

        const { data } = await response.json();

        setInitialValues({
          title: data.title ?? '',
          description: data.description ?? '',
          coverImageUrl: data.coverImageUrl ?? '',
          instructorId: data.instructor?.id ?? null,
        });
        setStatus('ready');
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    loadCourse();
  }, [documentId]);

  async function handleSubmit(values: CourseFormValues) {
    await saveCourse(`/api/courses/${documentId}`, 'PUT', values);
    router.push('/manage/courses');
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href="/manage/courses" className="text-sm text-gray-500 hover:underline">
        ← Manage courses
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Edit course</h1>

      {status === 'loading' && <p className="mt-6 text-sm text-gray-500">Loading…</p>}

      {status === 'missing' && (
        <p className="mt-6 text-sm text-gray-600">Course not found.</p>
      )}

      {status === 'failed' && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* The form renders for anyone who can reach this URL — including an
          instructor who does not own this course. Saving is what fails, with the
          403 from the ownership policy shown in the form. That is deliberate:
          the backend is the gate, not this page. */}
      {status === 'ready' && initialValues && (
        <CourseForm
          initialValues={initialValues}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}
