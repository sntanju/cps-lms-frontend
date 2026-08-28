'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';

export type LessonFormValues = {
  title: string;
  content: string;
  videoUrl: string;
  order: string;
};


export function LessonForm({
  initialValues,
  submitLabel,
  cancelHref,
  onSubmit,
}: {
  initialValues: LessonFormValues;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (values: LessonFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!values.title.trim()) {
      setError('A lesson needs a title.');
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(values);
    } catch (submitError) {
      
      setError(
        submitError instanceof Error ? submitError.message : 'Could not save this lesson',
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      {error && (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          value={values.title}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium">
          Content <span className="text-gray-500">(optional)</span>
        </label>
        <textarea
          id="content"
          rows={8}
          value={values.content}
          onChange={(e) => setValues({ ...values, content: e.target.value })}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="videoUrl" className="block text-sm font-medium">
          Video URL <span className="text-gray-500">(optional)</span>
        </label>
        <input
          id="videoUrl"
          value={values.videoUrl}
          onChange={(e) => setValues({ ...values, videoUrl: e.target.value })}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          A lesson can have text, a video, or both.
        </p>
      </div>

      <div>
        <label htmlFor="order" className="block text-sm font-medium">
          Order <span className="text-gray-500">(optional)</span>
        </label>
        <input
          id="order"
          type="number"
          min={1}
          value={values.order}
          onChange={(e) => setValues({ ...values, order: e.target.value })}
          className="mt-1 w-32 rounded border border-gray-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          Left empty on a new lesson, the backend puts it at the end.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>

        <Link href={cancelHref} className="text-sm text-gray-600 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}


export async function saveLesson(
  path: string,
  method: 'POST' | 'PUT',
  values: LessonFormValues,
  courseId: number,
) {
  const data: Record<string, unknown> = {
    title: values.title.trim(),
    content: values.content.trim() || null,
    videoUrl: values.videoUrl.trim() || null,
    course: courseId,
  };

  
  if (values.order.trim()) {
    data.order = Number(values.order);
  }

  const response = await apiFetch(path, {
    method,
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('You do not have permission to edit lessons in this course.');
    }

    throw new Error(await readError(response, 'Could not save this lesson'));
  }

  return response.json();
}
