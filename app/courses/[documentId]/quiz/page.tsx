'use client';

import { use } from 'react';
import Link from 'next/link';

export default function TakeQuizPage({
  params,
}: PageProps<'/courses/[documentId]/quiz'>) {
  const { documentId } = use(params);

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <Link
        href={`/courses/${documentId}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← Back to the course
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Taking the quiz</h1>
      <p className="mt-2 text-sm text-gray-600">
        Answering and grading arrive in the next step.
      </p>
    </main>
  );
}
