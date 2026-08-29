'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Course } from '@/lib/types';

export default function ManageCoursesPage() {
  const { user } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    
    async function loadCourses() {
      try {
        const response = await apiFetch('/api/managed-courses');

        if (!response.ok) {
          setError(await readError(response, 'Could not load your courses'));
          setStatus('failed');
          return;
        }

        const body = await response.json();
        setCourses(body.data);
        setStatus('ready');
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    loadCourses();
  }, [reloadCount]);

  async function handleDelete(course: Course) {
    
    if (!window.confirm(`Delete "${course.title}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(course.documentId);
    setError('');

    const response = await apiFetch(`/api/courses/${course.documentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      setError(
        response.status === 403
          ? 'You do not have permission to delete this course.'
          : await readError(response, 'Could not delete this course'),
      );
      setDeleting(null);
      return;
    }

    setReloadCount((count) => count + 1);
    setDeleting(null);
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Manage courses</h1>
          <p className="mt-1 text-sm text-gray-600">
            {user?.role === 'Instructor'
              ? 'The courses you own.'
              : 'Every course on the platform.'}
          </p>
        </div>

        <Link
          href="/manage/courses/new"
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          New course
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === 'loading' && (
        <p className="mt-6 text-sm text-gray-500">Loading…</p>
      )}

      {status === 'ready' && courses.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">
          You do not have any courses yet. Create one to get started.
        </p>
      )}

      {status === 'ready' && courses.length > 0 && (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-600">
            <tr>
              <th className="py-2">Title</th>
              <th className="py-2">Instructor</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.documentId} className="border-b border-gray-100">
                <td className="py-3">
                  <Link
                    href={`/courses/${course.documentId}`}
                    className="font-medium hover:underline"
                  >
                    {course.title}
                  </Link>
                </td>
                <td className="py-3 text-gray-600">
                  {course.instructor?.fullName ?? '—'}
                </td>
                <td className="py-3 text-right">
                  <Link
                    href={`/manage/courses/${course.documentId}/lessons`}
                    className="mr-4 hover:underline"
                  >
                    Lessons
                  </Link>
                  <Link
                    href={`/manage/courses/${course.documentId}/students`}
                    className="mr-4 hover:underline"
                  >
                    Students
                  </Link>
                  <Link
                    href={`/manage/courses/${course.documentId}/quiz`}
                    className="mr-4 hover:underline"
                  >
                    Quiz
                  </Link>
                  <Link
                    href={`/manage/courses/${course.documentId}/edit`}
                    className="mr-4 hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(course)}
                    disabled={deleting === course.documentId}
                    className="text-red-700 hover:underline disabled:opacity-50"
                  >
                    {deleting === course.documentId ? 'Deleting…' : 'Delete'}
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
