'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Role, useAuth } from '@/lib/auth-context';


export function RequireAuth({
  roles,
  children,
}: {
  roles?: Role[];
  children: React.ReactNode;
}) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Remember where they were headed so login can send them back.
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  // Auth state is only known after hydration. Redirecting during 'loading' would bounce signed-in users to the login page on every refresh.
  if (status === 'loading') {
    return <p className="p-8 text-sm text-gray-500">Loading…</p>;
  }

  if (status === 'unauthenticated' || !user) {
    return null;
  }

  // Signed in but with the wrong role: say so rather than redirect, so the user understands what happened instead of being bounced somewhere unexplained.
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Not authorised</h1>
        <p className="mt-2 text-sm text-gray-600">
          This page is for {roles.join(' or ')}. You are signed in as{' '}
          {user.role}.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
