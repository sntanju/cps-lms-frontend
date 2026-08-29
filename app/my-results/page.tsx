'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { scoreLine } from '@/lib/quiz';
import { MyQuizResult } from '@/lib/types';

export default function MyResultsPage() {
  const [results, setResults] = useState<MyQuizResult[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    
    async function loadResults() {
      try {
        const response = await apiFetch('/api/quiz-results/mine');

        if (!response.ok) {
          setError(await readError(response, 'Could not load your results'));
          setStatus('failed');
          return;
        }

        setResults((await response.json()).data);
        setStatus('ready');
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    loadResults();
  }, []);

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <h1 className="text-2xl font-semibold">My quiz results</h1>
      <p className="mt-1 text-sm text-gray-600">Every quiz you have taken, newest first.</p>

      {status === 'loading' && <p className="mt-6 text-sm text-gray-500">Loading…</p>}

      {status === 'failed' && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === 'ready' && results.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">
          You have not taken any quizzes yet.{' '}
          <Link href="/my-courses" className="underline">
            Go to your courses
          </Link>
          .
        </p>
      )}

      {status === 'ready' && results.length > 0 && (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-600">
            <tr>
              <th className="py-2">Course</th>
              <th className="py-2">Quiz</th>
              <th className="py-2 w-40">Score</th>
              <th className="py-2 w-48">Taken</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.documentId} className="border-b border-gray-100">
                <td className="py-3 font-medium">
                  {result.course ? (
                    <Link
                      href={`/courses/${result.course.documentId}`}
                      className="hover:underline"
                    >
                      {result.course.title}
                    </Link>
                  ) : (
                    <span className="text-gray-500">Course removed</span>
                  )}
                </td>
                <td className="py-3 text-gray-600">{result.quiz?.title ?? '—'}</td>
                <td className="py-3">{scoreLine(result.score, result.totalQuestions)}</td>
                <td className="py-3 text-gray-500">
                  {new Date(result.submittedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
