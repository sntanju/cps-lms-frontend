'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { scoreLine } from '@/lib/quiz';
import { Course, QuizAttempt, StudentQuiz } from '@/lib/types';

export default function TakeQuizPage({
  params,
}: PageProps<'/courses/[documentId]/quiz'>) {
  const { documentId } = use(params);

  const [course, setCourse] = useState<Course | null>(null);
  const [quiz, setQuiz] = useState<StudentQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');

  const loadHistory = useCallback(async (quizId: string) => {
    const response = await apiFetch(`/api/quizzes/${quizId}/my-results`);

    if (!response.ok) {
      return;
    }

    setHistory((await response.json()).data);
  }, []);

  useEffect(() => {
    
    async function load() {
      try {
        const courseResponse = await apiFetch(`/api/courses/${documentId}`);

        if (!courseResponse.ok) {
          setError(await readError(courseResponse, 'Could not load this course'));
          setStatus('failed');
          return;
        }

        const { data: courseData }: { data: Course } = await courseResponse.json();
        setCourse(courseData);

        if (!courseData.quiz) {
          setStatus('ready');
          return;
        }

        const quizId = courseData.quiz.documentId;
        const quizResponse = await apiFetch(`/api/quizzes/${quizId}/take`);

        if (!quizResponse.ok) {
          setError(await readError(quizResponse, 'Could not load this quiz'));
          setStatus('failed');
          return;
        }

        setQuiz((await quizResponse.json()).data);
        await loadHistory(quizId);
        setStatus('ready');
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    load();
  }, [documentId, loadHistory]);

  async function handleSubmit() {
    if (!quiz) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await apiFetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, selectedIndex]) => ({
            questionId,
            selectedIndex,
          })),
        }),
      });

      if (!response.ok) {
        setError(await readError(response, 'Could not submit this quiz'));
        setSubmitting(false);
        return;
      }

      setResult((await response.json()).data);
      await loadHistory(quiz.id);
    } catch {
      setError('Could not reach the server. Is the backend running?');
    }

    setSubmitting(false);
  }

  function handleRetake() {
    setResult(null);
    setAnswers({});
  }

  if (status === 'loading') {
    return (
      <p className="mx-auto w-full max-w-3xl p-8 text-sm text-gray-500">Loading…</p>
    );
  }

  const unanswered = quiz ? quiz.questions.length - Object.keys(answers).length : 0;

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <Link
        href={`/courses/${documentId}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← Back to the course
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">{quiz?.title ?? 'Quiz'}</h1>
      {course && <p className="mt-1 text-sm text-gray-600">{course.title}</p>}

      {error && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === 'ready' && !quiz && (
        <p className="mt-6 text-sm text-gray-600">
          This course does not have a quiz yet.
        </p>
      )}

      {quiz && quiz.questions.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">
          This quiz has no questions yet.
        </p>
      )}

      {quiz && quiz.questions.length > 0 && !result && (
        <div className="mt-6">
          <ol className="space-y-6">
            {quiz.questions.map((question, index) => (
              <li key={question.id} className="rounded border border-gray-200 p-4">
                <p className="font-medium">
                  {index + 1}. {question.text}
                </p>

                <div className="mt-3 space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={answers[question.id] === optionIndex}
                        onChange={() =>
                          setAnswers({ ...answers, [question.id]: optionIndex })
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          {unanswered > 0 && (
            <p className="mt-6 text-sm text-gray-600">
              You have not answered {unanswered}{' '}
              {unanswered === 1 ? 'question' : 'questions'}. Submitting now counts
              {unanswered === 1 ? ' it' : ' them'} as wrong.
            </p>
          )}

          <button
            onClick={handleSubmit}
            // Disabled while the request is in flight: a double click would
            // store two attempts.
            disabled={submitting}
            className="mt-4 rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit answers'}
          </button>
        </div>
      )}

      {quiz && result && (
        <div className="mt-6">
          <div className="rounded border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Your score</p>
            <p className="text-2xl font-semibold">
              {scoreLine(result.score, result.totalQuestions)}
            </p>
          </div>

          <ol className="mt-6 space-y-4">
            {quiz.questions.map((question, index) => {
              const graded = result.answers.find(
                (answer) => answer.questionId === question.id,
              );

              return (
                <li key={question.id} className="rounded border border-gray-200 p-4">
                  <p className="font-medium">
                    {index + 1}. {question.text}{' '}
                    <span
                      className={
                        graded?.correct ? 'text-green-700' : 'text-red-700'
                      }
                    >
                      {graded?.correct ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    {graded?.selectedIndex === null || graded === undefined
                      ? 'You did not answer this question.'
                      : `You answered: ${question.options[graded.selectedIndex]}`}
                  </p>
                </li>
              );
            })}
          </ol>

          <button
            onClick={handleRetake}
            className="mt-6 rounded border border-gray-300 px-4 py-2 text-sm"
          >
            Retake quiz
          </button>
        </div>
      )}

      {history.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Your attempts</h2>
          <ul className="mt-3 divide-y divide-gray-100 border-y border-gray-100">
            {history.map((attempt) => (
              <li
                key={attempt.documentId}
                className="flex items-baseline justify-between gap-4 py-3 text-sm"
              >
                <span>{scoreLine(attempt.score, attempt.totalQuestions)}</span>
                <span className="text-gray-500">
                  {new Date(attempt.submittedAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>

          <Link href="/my-results" className="mt-3 inline-block text-sm underline">
            All of your quiz results
          </Link>
        </section>
      )}
    </main>
  );
}
