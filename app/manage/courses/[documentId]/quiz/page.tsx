'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { QuestionEditor } from '@/components/question-editor';
import { AuthoredQuiz, Course } from '@/lib/types';

export default function QuizBuilderPage({
  params,
}: PageProps<'/manage/courses/[documentId]/quiz'>) {
  const { documentId } = use(params);

  const [course, setCourse] = useState<Course | null>(null);
  const [quiz, setQuiz] = useState<AuthoredQuiz | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);

  const load = useCallback(async () => {
    const courseResponse = await apiFetch(`/api/courses/${documentId}`);

    if (!courseResponse.ok) {
      setError(await readError(courseResponse, 'Could not load this course'));
      setStatus('failed');
      return;
    }

    const { data: courseData }: { data: Course } = await courseResponse.json();
    setCourse(courseData);

    if (!courseData.quiz) {
      setQuiz(null);
      setStatus('ready');
      return;
    }

    const quizResponse = await apiFetch(`/api/quizzes/${courseData.quiz.documentId}`);

    if (!quizResponse.ok) {
      setError(await readError(quizResponse, 'Could not load this quiz'));
      setStatus('failed');
      return;
    }

    setQuiz((await quizResponse.json()).data);
    setStatus('ready');
  }, [documentId]);

  useEffect(() => {
    async function run() {
      try {
        await load();
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    run();
  }, [load]);

  async function handleCreateQuiz() {
    if (!title.trim() || !course) {
      setError('Give the quiz a title.');
      return;
    }

    setCreating(true);
    setError('');

    const response = await apiFetch('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify({ data: { title: title.trim(), course: course.id } }),
    });

    if (!response.ok) {
      setError(
        response.status === 403
          ? 'You do not have permission to add a quiz to this course.'
          : await readError(response, 'Could not create this quiz'),
      );
      setCreating(false);
      return;
    }

    await load();
    setCreating(false);
  }

  async function handleQuestionSaved() {
    setAddingQuestion(false);
 
    await load();
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <Link href="/manage/courses" className="text-sm text-gray-500 hover:underline">
        ← Manage courses
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Quiz</h1>
      {course && <p className="mt-1 text-sm text-gray-600">{course.title}</p>}

      {error && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === 'loading' && <p className="mt-6 text-sm text-gray-500">Loading…</p>}

      {status === 'ready' && !quiz && (
        <div className="mt-6 max-w-md">
          <p className="text-sm text-gray-600">This course has no quiz yet.</p>

          <label htmlFor="title" className="mt-4 block text-sm font-medium">
            Quiz title
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="End of course quiz"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />

          <button
            onClick={handleCreateQuiz}
            disabled={creating}
            className="mt-3 rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create quiz'}
          </button>
        </div>
      )}

      {status === 'ready' && quiz && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">{quiz.title}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {quiz.questions.length}{' '}
            {quiz.questions.length === 1 ? 'question' : 'questions'}
          </p>

          <div className="mt-6 space-y-4">
            {quiz.questions.map((question, index) => (
              <QuestionEditor
                key={question.documentId}
                question={question}
                quizId={quiz.id}
                index={index + 1}
                onSaved={handleQuestionSaved}
              />
            ))}

            {addingQuestion && (
              <QuestionEditor
                question={null}
                quizId={quiz.id}
                index={quiz.questions.length + 1}
                onSaved={handleQuestionSaved}
                onCancel={() => setAddingQuestion(false)}
              />
            )}
          </div>

          {!addingQuestion && (
            <button
              onClick={() => setAddingQuestion(true)}
              className="mt-4 rounded border border-gray-300 px-4 py-2 text-sm"
            >
              Add question
            </button>
          )}
        </div>
      )}
    </main>
  );
}
