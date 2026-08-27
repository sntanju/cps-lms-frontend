import { RequireAuth } from '@/components/require-auth';

// Admin-only. Feature work goes in the pages under here; the gate stays here.
export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return <RequireAuth roles={['Admin']}>{children}</RequireAuth>;
}
