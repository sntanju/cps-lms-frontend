'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { BlogPost } from '@/lib/types';

export default function BlogPostPage({
  params,
}: PageProps<'/blog/[documentId]'>) {
  const { documentId } = use(params);

  const [post, setPost] = useState<BlogPost | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    async function loadPost() {
      try {
        const response = await apiFetch(`/api/blog-posts/${documentId}`);

        if (!response.ok) {
          setStatus('missing');
          return;
        }

        setPost((await response.json()).data);
        setStatus('ready');
      } catch {
        setStatus('missing');
      }
    }

    loadPost();
  }, [documentId]);

  if (status === 'loading') {
    return <p className="mx-auto w-full max-w-3xl p-8 text-sm text-gray-500">Loading…</p>;
  }

  if (status === 'missing' || !post) {
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <h1 className="text-xl font-semibold">Post not found</h1>
        <Link href="/blog" className="mt-4 inline-block text-sm underline">
          Back to the blog
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <Link href="/blog" className="text-sm text-gray-500 hover:underline">
        ← Blog
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">{post.title}</h1>

      <p className="mt-1 text-sm text-gray-500">
        {post.author?.fullName ?? 'Unknown author'} ·{' '}
        {new Date(post.createdAt).toLocaleDateString()}
        {post.postStatus === 'draft' && (
          <span className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
            Draft
          </span>
        )}
      </p>

      {post.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element 
        <img
          src={post.coverImageUrl}
          alt=""
          className="mt-6 w-full rounded border border-gray-200"
        />
      )}

      <div className="mt-6 whitespace-pre-wrap text-gray-800">{post.body}</div>
    </main>
  );
}
