import { RequireAuth } from '@/components/require-auth';

// Protects every page under /dashboard in one place, for any signed-in role.
export default function DashboardLayout({ children }: LayoutProps<'/dashboard'>) {
  return <RequireAuth>{children}</RequireAuth>;
}
