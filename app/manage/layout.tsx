import { RequireAuth } from '@/components/require-auth';

export default function ManageLayout({ children }: LayoutProps<'/manage'>) {
  return (
    <RequireAuth roles={['Admin', 'Content Manager', 'Instructor']}>
      {children}
    </RequireAuth>
  );
}
