'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  // Prefix match so a lesson or edit page still highlights its section.
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'font-medium text-gray-900 underline underline-offset-4'
          : 'text-gray-600 hover:text-gray-900'
      }
    >
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const { user, status, logout } = useAuth();

  const canManage =
    user?.role === 'Admin' ||
    user?.role === 'Content Manager' ||
    user?.role === 'Instructor';

  const canWriteBlog = user?.role === 'Admin' || user?.role === 'Content Manager';

  return (
    <header className="border-b border-gray-200">
      <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-5 gap-y-2 p-4">
        <Link href="/" className="text-lg font-semibold">
          CPS LMS
        </Link>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {/* Readable by anyone, so it is not inside the signed-in block. */}
          <NavLink href="/blog">Blog</NavLink>

          {status === 'loading' && <span className="text-gray-500">…</span>}

          {status === 'unauthenticated' && (
            <>
              <NavLink href="/login">Sign in</NavLink>
              <Link
                href="/register"
                className="rounded bg-black px-3 py-1.5 text-white"
              >
                Create account
              </Link>
            </>
          )}

          {status === 'authenticated' && user && (
            <>
              <NavLink href="/courses">Courses</NavLink>
              <NavLink href="/dashboard">Dashboard</NavLink>

              {user.role === 'Student' && (
                <>
                  <NavLink href="/my-courses">My Courses</NavLink>
                  <NavLink href="/my-results">My Results</NavLink>
                </>
              )}

              {canManage && <NavLink href="/manage/courses">Manage</NavLink>}

              {canWriteBlog && <NavLink href="/manage/blog">Manage blog</NavLink>}

              {user.role === 'Admin' && <NavLink href="/admin">Admin</NavLink>}

              <span className="flex items-center gap-2 text-gray-500">
                {user.fullName}
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                  {user.role}
                </span>
              </span>

              <button
                onClick={logout}
                className="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
