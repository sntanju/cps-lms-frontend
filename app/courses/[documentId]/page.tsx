'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { canManageCourse } from '@/lib/permissions';
import { Course, CourseProgress, Enrollment, Lesson } from '@/lib/types';
import { ProgressBar } from '@/components/progress-bar';

function byOrder(lessons: Lesson[]) {
  return [...lessons].sort((a, b) => a.order - b.order);
}

export default function CourseDetailPage({
  params,
}: PageProps<'/courses/[documentId]'>) {
  
  const { documentId } = use(params);
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [progress, setProgress] = useState<CourseProgress | null>(null);
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

  const isStudent = user?.role === 'Student';

  useEffect(() => {
    // Only a Student can enrol, so only a Student needs to know whether they already have. Anyone else would get a 403 from this endpoint.
    if (!isStudent) {
      return;
    }

    async function loadEnrollment() {
      const response = await apiFetch('/api/enrollments/mine');

      if (!response.ok) {
        return;
      }

      const body: { data: Enrollment[] } = await response.json();
      setEnrolled(
        body.data.some((enrollment) => enrollment.course.documentId === documentId),
      );
    }

    loadEnrollment();
  }, [documentId, isStudent]);

  useEffect(() => {
    // Only meaningful once enrolled; before that the endpoint answers 403.
    if (!enrolled) {
      return;
    }

    async function loadProgress() {
      const response = await apiFetch(`/api/courses/${documentId}/progress`);

      if (!response.ok) {
        return;
      }

      setProgress((await response.json()).data);
    }

    loadProgress();
  }, [documentId, enrolled]);

  async function handleEnroll() {
    setEnrolling(true);
    setEnrollError('');

    try {
      const response = await apiFetch('/api/enrollments/enroll', {
        method: 'POST',
        body: JSON.stringify({ courseId: documentId }),
      });

      if (!response.ok) {
        setEnrollError(await readError(response, 'Could not enrol'));
        setEnrolling(false);
        return;
      }

      setEnrolled(true);
    } catch {
      setEnrollError('Could not reach the server. Is the backend running?');
    }

    setEnrolling(false);
  }

  if (status === 'loading') {
    return <p className="mx-auto w-full max-w-3xl p-8 text-sm text-gray-500">Loading…</p>;
  }

  if (status === 'missing') {
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <h1 className="text-xl font-semibold">Course not found</h1>
        <Link href="/courses" className="mt-4 inline-block text-sm underline">
          Back to all courses
        </Link>
      </main>
    );
  }

  if (status === 'failed' || !course) {
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      </main>
    );
  }

  const lessons = byOrder(course.lessons ?? []);
  // Mirrors canAccessContent on the backend: enrolled students, plus anyone who could manage the course.
  const canOpenLessons = enrolled || canManageCourse(user, course.instructor?.id);

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <Link href="/courses" className="text-sm text-gray-500 hover:underline">
        ← All courses
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">{course.title}</h1>

        
        {canManageCourse(user, course.instructor?.id) && (
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/manage/courses/${course.documentId}/lessons`}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm"
            >
              Manage lessons
            </Link>
            <Link
              href={`/manage/courses/${course.documentId}/quiz`}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm"
            >
              Quiz
            </Link>
            <Link
              href={`/manage/courses/${course.documentId}/edit`}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm"
            >
              Edit course
            </Link>
          </div>
        )}
      </div>

      {course.instructor && (
        <p className="mt-1 text-sm text-gray-600">
          Taught by {course.instructor.fullName}
        </p>
      )}

      {course.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={course.coverImageUrl}
          alt=""
          className="mt-4 max-h-72 w-full rounded border border-gray-200 object-cover"
        />
      )}

      {course.description && (
        <p className="mt-4 whitespace-pre-wrap text-gray-700">
          {course.description}
        </p>
      )}

      {isStudent && (
        <div className="mt-6 rounded border border-gray-200 p-4">
          {enrollError && (
            <p className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {enrollError}
            </p>
          )}

          {enrolled ? (
            <div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">You are enrolled</p>

              {lessons.length > 0 && (
                <Link
                  href={`/courses/${course.documentId}/lessons/${lessons[0].documentId}`}
                  className="rounded bg-black px-4 py-2 text-sm text-white"
                >
                  Start the first lesson
                </Link>
                )}
              </div>

              {progress && (
                <div className="mt-4">
                  <ProgressBar
                    completed={progress.completed}
                    total={progress.total}
                    percentage={progress.percentage}
                  />
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleEnroll}
              // Disabled while the request is in flight, so a double-click cannot send a second enrolment.
              disabled={enrolling}
              className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {enrolling ? 'Enrolling…' : 'Enrol in this course'}
            </button>
          )}
        </div>
      )}

      {course.quiz && (
        <section className="mt-8 rounded border border-gray-200 p-4">
          <h2 className="text-lg font-semibold">{course.quiz.title}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {course.quiz.questionCount}{' '}
            {course.quiz.questionCount === 1 ? 'question' : 'questions'}
          </p>

          
          {isStudent && enrolled && (
            <Link
              href={`/courses/${course.documentId}/quiz`}
              className="mt-3 inline-block rounded bg-black px-4 py-2 text-sm text-white"
            >
              Take the quiz
            </Link>
          )}

          {isStudent && !enrolled && (
            <p className="mt-3 text-sm text-gray-600">
              Enrol in this course to take the quiz.
            </p>
          )}

          {canManageCourse(user, course.instructor?.id) && (
            <Link
              href={`/manage/courses/${course.documentId}/quiz`}
              className="mt-3 inline-block rounded border border-gray-300 px-3 py-1.5 text-sm"
            >
              Edit the quiz
            </Link>
          )}
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Lessons</h2>

        {lessons.length === 0 && (
          <p className="mt-2 text-sm text-gray-600">
            This course does not have any lessons yet.
          </p>
        )}

        {lessons.length > 0 && (
          <ol className="mt-3 divide-y divide-gray-100 border-y border-gray-100">
            {lessons.map((lesson, index) => (
              <li key={lesson.documentId}>
                
                {canOpenLessons ? (
                  <Link
                    href={`/courses/${course.documentId}/lessons/${lesson.documentId}`}
                    className="flex items-baseline gap-3 py-3 hover:underline"
                  >
                    <span className="w-6 text-sm text-gray-500">{index + 1}</span>
                    <span className="font-medium">{lesson.title}</span>
                    {progress?.completedLessonIds.includes(lesson.documentId) && (
                      <span className="text-sm text-green-700">✓</span>
                    )}
                  </Link>
                ) : (
                  <div className="flex items-baseline gap-3 py-3 text-gray-600">
                    <span className="w-6 text-sm text-gray-500">{index + 1}</span>
                    <span>{lesson.title}</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}

        {lessons.length > 0 && !canOpenLessons && isStudent && (
          <p className="mt-3 text-sm text-gray-600">
            Enrol in this course to read its lessons.
          </p>
        )}
      </section>

    </main>
  );
}
