import { RequireAuth } from '@/components/require-auth';


export default function CoursesLayout({ children }: LayoutProps<'/courses'>) {
  return <RequireAuth>{children}</RequireAuth>;
}
