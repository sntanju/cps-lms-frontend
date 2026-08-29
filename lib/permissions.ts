import { AuthUser } from '@/lib/auth-context';

export function canManageCourse(
  user: AuthUser | null,
  instructorId: number | null | undefined,
) {
  if (!user) {
    return false;
  }

  if (user.role === 'Admin' || user.role === 'Content Manager') {
    return true;
  }

  return user.role === 'Instructor' && user.id === instructorId;
}

export function canAssignInstructor(user: AuthUser | null) {
  return user?.role === 'Admin' || user?.role === 'Content Manager';
}
