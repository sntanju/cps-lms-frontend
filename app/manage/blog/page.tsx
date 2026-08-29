'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { BlogPost } from '@/lib/types';

function StatusBadge({ postStatus }: { postStatus: BlogPost['postStatus'] }) {
  const published = postStatus === 'published';

  return (
    <span
      className={`rounded px-2 py-0.5 text-xs ${
        published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

export default function ManageBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await apiFetch('/api/blog-posts?sort=createdAt:desc');

      if (!response.ok) {
        setError(await readError(response, 'Could not load the posts'));
        setStatus('failed');
        return;
      }

      setPosts((await response.json()).data);
      setStatus('ready');
    } catch {
      setError('Could not reach the server. Is the backend running?');
      setStatus('failed');
    }
  }, []);

  useEffect(() => {
    async function run() {
      await load();
    }

    run();
  }, [load]);

  async function handleDelete(post: BlogPost) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) {
      return;
    }

    const response = await apiFetch(`/api/blog-posts/${post.documentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      setError(await readError(response, 'Could not delete this post'));
      return;
    }

    await load();
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Blog posts</h1>

        <Link
          href="/manage/blog/new"
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          New post
        </Link>
      </div>

      {status === 'loading' && <p className="mt-6 text-sm text-gray-500">Loading…</p>}

      {error && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === 'ready' && posts.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">No posts yet.</p>
      )}

      {status === 'ready' && posts.length > 0 && (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-600">
            <tr>
              <th className="py-2">Title</th>
              <th className="py-2 w-28">Status</th>
              <th className="py-2 w-32">Created</th>
              <th className="py-2 w-40">Author</th>
              <th className="py-2 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.documentId} className="border-b border-gray-100">
                <td className="py-3 font-medium">
                  <Link href={`/blog/${post.documentId}`} className="hover:underline">
                    {post.title}
                  </Link>
                </td>
                <td className="py-3">
                  <StatusBadge postStatus={post.postStatus} />
                </td>
                <td className="py-3 text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 text-gray-600">
                  {post.author?.fullName ?? '—'}
                </td>
                <td className="py-3">
                  <div className="flex gap-3">
                    <Link
                      href={`/manage/blog/${post.documentId}/edit`}
                      className="underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(post)}
                      className="text-red-700 underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
