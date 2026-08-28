'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { canAssignInstructor } from '@/lib/permissions';
import { AssignableInstructor } from '@/lib/types';

export type CourseFormValues = {
  title: string;
  description: string;
  coverImageUrl: string;
  // null means "leave it to the backend", which assigns the creator.
  instructorId: number | null;
};


export function CourseForm({
  initialValues,
  submitLabel,
  onSubmit,
}: {
  initialValues: CourseFormValues;
  submitLabel: string;
  onSubmit: (values: CourseFormValues) => Promise<void>;
}) {
  const { user } = useAuth();

  const [values, setValues] = useState(initialValues);
  const [instructors, setInstructors] = useState<AssignableInstructor[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const showPicker = canAssignInstructor(user);

  useEffect(() => {
    // Only Admin and Content Manager can read this list — an Instructor asking for it would get a 403, so do not ask.
    if (!showPicker) {
      return;
    }

    async function loadInstructors() {
      const response = await apiFetch('/api/course-instructors');

      if (!response.ok) {
        return;
      }

      const body = await response.json();
      setInstructors(body.data);
    }

    loadInstructors();
  }, [showPicker]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!values.title.trim()) {
      setError('A course needs a title.');
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(values);
    } catch (submitError) {
      
      setError(
        submitError instanceof Error ? submitError.message : 'Could not save this course',
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
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          rows={5}
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="coverImageUrl" className="block text-sm font-medium">
          Cover image URL <span className="text-gray-500">(optional)</span>
        </label>
        <input
          id="coverImageUrl"
          value={values.coverImageUrl}
          onChange={(e) => setValues({ ...values, coverImageUrl: e.target.value })}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      {showPicker && (
        <div>
          <label htmlFor="instructor" className="block text-sm font-medium">
            Instructor
          </label>
          <select
            id="instructor"
            value={values.instructorId ?? ''}
            onChange={(e) =>
              setValues({
                ...values,
                instructorId: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Me ({user?.fullName})</option>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.fullName} — {instructor.role} ({instructor.email})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>

        <Link href="/manage/courses" className="text-sm text-gray-600 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}

// Sends the form to Strapi. Shared so the new and edit pages agree on the request shape and on how a failure turns into a message.
export async function saveCourse(
  path: string,
  method: 'POST' | 'PUT',
  values: CourseFormValues,
) {
  const data: Record<string, unknown> = {
    title: values.title.trim(),
    description: values.description.trim(),
    coverImageUrl: values.coverImageUrl.trim() || null,
  };

  
  if (values.instructorId !== null) {
    data.instructor = values.instructorId;
  }

  // Strapi's REST write shape wraps the payload — a flat body is a 400.
  const response = await apiFetch(path, {
    method,
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('You do not have permission to edit this course.');
    }

    throw new Error(await readError(response, 'Could not save this course'));
  }

  return response.json();
}
