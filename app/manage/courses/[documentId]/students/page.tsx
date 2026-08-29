'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { ProgressBar } from '@/components/progress-bar';
import { scoreLine } from '@/lib/quiz';
import { CourseQuizResult, StudentProgress } from '@/lib/types';

export default function CourseStudentsPage({
  params,
}: PageProps<'/manage/courses/[documentId]/students'>) {
  const { documentId } = use(params);

  const [course, setCourse] = useState<{ documentId: string; title: string } | null>(
    null,
  );
  const [rows, setRows] = useState<StudentProgress[]>([]);

  const [latestScores, setLatestScores] = useState<Map<number, CourseQuizResult>>(
    new Map(),
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    
    async function loadStudents() {
      try {
        const response = await apiFetch(`/api/courses/${documentId}/students-progress`);

        if (!response.ok) {
          setError(await readError(response, 'Could not load this roster'));
          setStatus('failed');
          return;
        }

        const body = await response.json();
        setCourse(body.meta.course);
        setRows(body.data);
        setStatus('ready');

        await loadQuizScores();
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    async function loadQuizScores() {
      const response = await apiFetch(`/api/courses/${documentId}/quiz-results`);

      if (!response.ok) {
        return;
      }

      const body: { data: CourseQuizResult[] } = await response.json();
      const latest = new Map<number, CourseQuizResult>();

      for (const result of body.data) {
        if (!latest.has(result.student.id)) {
          latest.set(result.student.id, result);
        }
      }

      setLatestScores(latest);
    }

    loadStudents();
  }, [documentId]);

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href="/manage/courses" className="text-sm text-gray-500 hover:underline">
        ← Manage courses
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Student progress</h1>
      {course && <p className="mt-1 text-sm text-gray-600">{course.title}</p>}

      {status === 'loading' && <p className="mt-6 text-sm text-gray-500">Loading…</p>}

      {status === 'failed' && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === 'ready' && rows.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">
          No students have enrolled in this course yet.
        </p>
      )}

      {status === 'ready' && rows.length > 0 && (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-600">
            <tr>
              <th className="py-2">Student</th>
              <th className="py-2">Email</th>
              <th className="py-2 w-24">Lessons</th>
              <th className="py-2 w-48">Progress</th>
              <th className="py-2 w-32">Quiz score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.student.id} className="border-b border-gray-100">
                <td className="py-3 font-medium">{row.student.fullName}</td>
                <td className="py-3 text-gray-600">{row.student.email}</td>
                <td className="py-3 text-gray-600">
                  {row.completed} / {row.total}
                </td>
                <td className="py-3">
                  <ProgressBar
                    completed={row.completed}
                    total={row.total}
                    percentage={row.percentage}
                  />
                </td>
                <td className="py-3 text-gray-600">
                  {latestScores.has(row.student.id)
                    ? scoreLine(
                        latestScores.get(row.student.id)!.score,
                        latestScores.get(row.student.id)!.totalQuestions,
                      )
                    : 'Not taken'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
