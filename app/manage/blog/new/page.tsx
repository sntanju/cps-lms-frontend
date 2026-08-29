'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BlogPostForm,
  BlogPostFormValues,
  saveBlogPost,
} from '@/components/blog-post-form';

export default function NewBlogPostPage() {
  const router = useRouter();

  async function handleSubmit(
    values: BlogPostFormValues,
    postStatus: 'draft' | 'published',
  ) {
    await saveBlogPost('/api/blog-posts', 'POST', values, postStatus);
    router.push('/manage/blog');
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href="/manage/blog" className="text-sm text-gray-500 hover:underline">
        ← Blog posts
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">New post</h1>

      <BlogPostForm
        initialValues={{ title: '', body: '', coverImageUrl: '' }}
        currentStatus={null}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
