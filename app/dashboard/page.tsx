'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  // The layout's guard guarantees a user by the time this renders.
  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {user.fullName}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Signed in as {user.email} — role: <strong>{user.role}</strong>
          </p>
        </div>

        <button
          onClick={logout}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          Sign out
        </button>
      </div>

      {/* Only the Admin sees this link. The /admin page checks the role again,
          and Strapi checks it a third time — hiding a link is not access
          control, it is just tidier. */}
      {user.role === 'Admin' && (
        <Link href="/admin" className="mt-6 inline-block underline">
          Admin panel
        </Link>
      )}
    </main>
  );
}
