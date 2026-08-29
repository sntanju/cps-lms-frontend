'use client';

import Link from 'next/link';
import { Role, useAuth } from '@/lib/auth-context';

const DESTINATIONS: {
  href: string;
  title: string;
  description: string;
  roles: Role[];
}[] = [
  {
    href: '/courses',
    title: 'Browse courses',
    description: 'The full catalogue.',
    roles: ['Admin', 'Content Manager', 'Instructor', 'Student'],
  },
  {
    href: '/my-courses',
    title: 'My courses',
    description: 'Everything you are enrolled in, with your progress.',
    roles: ['Student'],
  },
  {
    href: '/my-results',
    title: 'My quiz results',
    description: 'Every quiz you have taken, newest first.',
    roles: ['Student'],
  },
  {
    href: '/manage/courses',
    title: 'Manage courses',
    description: 'Create courses, add lessons, build quizzes, see student progress.',
    roles: ['Admin', 'Content Manager', 'Instructor'],
  },
  {
    href: '/manage/blog',
    title: 'Manage blog',
    description: 'Write posts, and publish or unpublish them.',
    roles: ['Admin', 'Content Manager'],
  },
  {
    href: '/admin',
    title: 'Admin panel',
    description: 'Platform statistics, and every user with their role.',
    roles: ['Admin'],
  },
  {
    href: '/blog',
    title: 'Blog',
    description: 'Published posts, readable by anyone.',
    roles: ['Admin', 'Content Manager', 'Instructor', 'Student'],
  },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();

  // The layout's guard guarantees a user by the time this renders.
  if (!user) {
    return null;
  }

  const destinations = DESTINATIONS.filter((destination) =>
    destination.roles.includes(user.role),
  );

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {user.fullName}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Signed in as {user.email} — role: <strong>{user.role}</strong>
          </p>
        </div>

        <button
          onClick={logout}
          className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {destinations.map((destination) => (
          <li key={destination.href}>
            <Link
              href={destination.href}
              className="block h-full rounded border border-gray-200 p-4 hover:border-gray-400"
            >
              <h2 className="font-medium">{destination.title}</h2>
              <p className="mt-1 text-sm text-gray-600">
                {destination.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
