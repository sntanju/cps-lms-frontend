import { RequireAuth } from '@/components/require-auth';

// Gates every page under /courses in one place. The catalogue is for signed-in
// users of any role: a student browses it to find something to enroll in, and
// the other three roles browse it to manage what they own.
export default function CoursesLayout({ children }: LayoutProps<'/courses'>) {
  return <RequireAuth>{children}</RequireAuth>;
}
