import { RequireAuth } from '@/components/require-auth';

export default function MyCoursesLayout({ children }: LayoutProps<'/my-courses'>) {
  return <RequireAuth roles={['Student']}>{children}</RequireAuth>;
}
