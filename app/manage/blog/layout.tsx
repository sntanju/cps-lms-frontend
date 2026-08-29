import { RequireAuth } from '@/components/require-auth';

export default function ManageBlogLayout({ children }: LayoutProps<'/manage/blog'>) {
  return (
    <RequireAuth roles={['Admin', 'Content Manager']}>{children}</RequireAuth>
  );
}
