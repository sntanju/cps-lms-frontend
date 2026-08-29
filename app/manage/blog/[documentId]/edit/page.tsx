'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import {
  BlogPostForm,
  BlogPostFormValues,
  saveBlogPost,
} from '@/components/blog-post-form';
import { BlogPost } from '@/lib/types';

export default function EditBlogPostPage({
  params,
}: PageProps<'/manage/blog/[documentId]/edit'>) {
  const { documentId } = use(params);
  const router = useRouter();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPost() {
      try {
        const response = await apiFetch(`/api/blog-posts/${documentId}`);

        if (!response.ok) {
          setError(await readError(response, 'Could not load this post'));
          setStatus('failed');
          return;
        }

        setPost((await response.json()).data);
        setStatus('ready');
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    loadPost();
  }, [documentId]);

  async function handleSubmit(
    values: BlogPostFormValues,
    postStatus: 'draft' | 'published',
  ) {
    await saveBlogPost(`/api/blog-posts/${documentId}`, 'PUT', values, postStatus);
    router.push('/manage/blog');
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href="/manage/blog" className="text-sm text-gray-500 hover:underline">
        ← Blog posts
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Edit post</h1>

      {status === 'loading' && <p className="mt-6 text-sm text-gray-500">Loading…</p>}

      {status === 'failed' && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === 'ready' && post && (
        <BlogPostForm
          initialValues={{
            title: post.title,
            body: post.body,
            coverImageUrl: post.coverImageUrl ?? '',
          }}
          currentStatus={post.postStatus}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}
