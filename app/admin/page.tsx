'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, readError } from '@/lib/api';
import { PlatformStats } from '@/lib/types';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-gray-200 p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await apiFetch('/api/admin-panel/stats');

        if (!response.ok) {
          setError(await readError(response, 'Could not load the statistics'));
          setStatus('failed');
          return;
        }

        setStats((await response.json()).data);
        setStatus('ready');
      } catch {
        setError('Could not reach the server. Is the backend running?');
        setStatus('failed');
      }
    }

    loadStats();
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <h1 className="text-2xl font-semibold">Admin panel</h1>
      <p className="mt-1 text-sm text-gray-600">
        Platform oversight. Only the Admin role can open this page or call the
        endpoints behind it.
      </p>

      {status === 'loading' && <p className="mt-6 text-sm text-gray-500">Loading…</p>}

      {status === 'failed' && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === 'ready' && stats && (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Users by role</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-4">
              {stats.usersByRole.map((row) => (
                <StatCard key={row.role} label={row.role} value={row.count} />
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Platform</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <StatCard label="Users" value={stats.totalUsers} />
              <StatCard label="Courses" value={stats.totalCourses} />
              <StatCard label="Lessons" value={stats.totalLessons} />
              <StatCard label="Enrolments" value={stats.totalEnrollments} />
              <StatCard label="Blog posts" value={stats.totalBlogPosts} />
            </div>
          </section>
        </>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Manage</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link href="/admin/users" className="underline">
              Users and roles
            </Link>
          </li>
          <li>
            <Link href="/manage/courses" className="underline">
              All courses and lessons
            </Link>
          </li>
          <li>
            <Link href="/manage/blog" className="underline">
              All blog posts
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
