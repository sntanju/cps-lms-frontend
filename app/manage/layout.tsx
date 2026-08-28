import { RequireAuth } from '@/components/require-auth';

// Everything an author touches lives under /manage: courses now, lessons and
// quizzes in later phases. Students are kept out here, and again by Strapi on
// every request the pages make.
export default function ManageLayout({ children }: LayoutProps<'/manage'>) {
  return (
    <RequireAuth roles={['Admin', 'Content Manager', 'Instructor']}>
      {children}
    </RequireAuth>
  );
}
