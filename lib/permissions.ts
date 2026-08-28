import { AuthUser } from '@/lib/auth-context';

// Whether to show this user the controls for editing a course.
//
// This is presentation only. It deliberately mirrors the rule in the backend's
// src/api/course/policies/is-course-owner.ts so the UI can decide what to
// render — but the policy is what actually enforces it. If the two ever
// disagree, the backend wins: the button appears, the request comes back 403,
// and the form shows that error.
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

// Whether this user may assign a course to somebody else, which is what decides
// if the course form shows an instructor picker. Matches CAN_ASSIGN_ROLES in the
// backend controller.
export function canAssignInstructor(user: AuthUser | null) {
  return user?.role === 'Admin' || user?.role === 'Content Manager';
}
