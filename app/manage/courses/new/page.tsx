'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CourseForm,
  CourseFormValues,
  saveCourse,
} from '@/components/course-form';

export default function NewCoursePage() {
  const router = useRouter();

  async function handleSubmit(values: CourseFormValues) {
    await saveCourse('/api/courses', 'POST', values);
    router.push('/manage/courses');
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href="/manage/courses" className="text-sm text-gray-500 hover:underline">
        ← Manage courses
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">New course</h1>

      <CourseForm
        initialValues={{
          title: '',
          description: '',
          coverImageUrl: '',
          instructorId: null,
        }}
        submitLabel="Create course"
        onSubmit={handleSubmit}
      />
    </main>
  );
}
