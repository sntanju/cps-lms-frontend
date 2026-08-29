'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { BlogPost } from '@/lib/types';

function excerpt(body: string) {
  return body.length > 220 ? `${body.slice(0, 220)}…` : body;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPosts() {
      try {
        const response = await apiFetch('/api/blog-posts?sort=createdAt:desc');

        if (!response.ok) {
          setError(await readError(response, 'Could not load the blog'));
          setStatus('failed');
          return;
        }

        setPosts((await response.json()).data);
        setStatus('ready');
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    loadPosts();
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Blog</h1>

      {status === 'loading' && <p className="mt-6 text-sm text-gray-500">Loading…</p>}

      {status === 'failed' && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === 'ready' && posts.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">
          There are no published posts yet.
        </p>
      )}

      {status === 'ready' && posts.length > 0 && (
        <ul className="mt-6 divide-y divide-gray-100 border-y border-gray-100">
          {posts.map((post) => (
            <li key={post.documentId} className="py-5">
              <h2 className="text-lg font-medium">
                <Link href={`/blog/${post.documentId}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {post.author?.fullName ?? 'Unknown author'} ·{' '}
                {new Date(post.createdAt).toLocaleDateString()}
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {excerpt(post.body)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
