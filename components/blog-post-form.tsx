'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';

export type BlogPostFormValues = {
  title: string;
  body: string;
  coverImageUrl: string;
};

export function BlogPostForm({
  initialValues,
  currentStatus,
  onSubmit,
}: {
  initialValues: BlogPostFormValues;
  currentStatus: 'draft' | 'published' | null;
  onSubmit: (
    values: BlogPostFormValues,
    postStatus: 'draft' | 'published',
  ) => Promise<void>;
}) {
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isPublished = currentStatus === 'published';

  async function submitAs(postStatus: 'draft' | 'published') {
    setError('');

    if (!values.title.trim()) {
      setError('A post needs a title.');
      return;
    }

    if (!values.body.trim()) {
      setError('A post needs a body.');
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(values, postStatus);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not save this post',
      );
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="mt-6 max-w-2xl space-y-4"
    >
      {error && (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          value={values.title}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium">
          Body
        </label>
        <textarea
          id="body"
          rows={14}
          value={values.body}
          onChange={(e) => setValues({ ...values, body: e.target.value })}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          Plain text. Line breaks are kept; HTML is shown as text, not rendered.
        </p>
      </div>

      <div>
        <label htmlFor="coverImageUrl" className="block text-sm font-medium">
          Cover image URL <span className="text-gray-500">(optional)</span>
        </label>
        <input
          id="coverImageUrl"
          value={values.coverImageUrl}
          onChange={(e) => setValues({ ...values, coverImageUrl: e.target.value })}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => submitAs(isPublished ? 'published' : 'draft')}
          disabled={submitting}
          className="rounded border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
        >
          {isPublished ? 'Save changes' : 'Save as draft'}
        </button>

        <button
          type="button"
          onClick={() => submitAs(isPublished ? 'draft' : 'published')}
          disabled={submitting}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isPublished ? 'Unpublish' : 'Publish'}
        </button>

        <Link href="/manage/blog" className="text-sm text-gray-600 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}

export async function saveBlogPost(
  path: string,
  method: 'POST' | 'PUT',
  values: BlogPostFormValues,
  postStatus: 'draft' | 'published',
) {
  const response = await apiFetch(path, {
    method,
    body: JSON.stringify({
      data: {
        title: values.title.trim(),
        body: values.body,
        coverImageUrl: values.coverImageUrl.trim() || null,
        postStatus,
      },
    }),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('You do not have permission to write blog posts.');
    }

    throw new Error(await readError(response, 'Could not save this post'));
  }

  return response.json();
}
