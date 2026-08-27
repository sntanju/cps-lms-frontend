'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await register(name, email, password);
      router.replace('/dashboard');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Registration failed');
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-sm p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Create an account</h1>

        {error && (
          <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="rounded border border-gray-300 p-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="rounded border border-gray-300 p-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            /* Mirrors the backend rule in src/api/auth/services/auth.ts. The
               server stays the authority; this just avoids a wasted request. */
            minLength={8}
            className="rounded border border-gray-300 p-2"
          />
          <span className="text-xs text-gray-500">At least 8 characters.</span>
        </label>

        {/* No role picker: every self-registration becomes a Student. The
            backend hardcodes it, since assigning roles is Admin-only. */}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-black p-2 text-white disabled:opacity-50"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
