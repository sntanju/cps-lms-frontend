import { RequireAuth } from '@/components/require-auth';

export default function MyResultsLayout({ children }: LayoutProps<'/my-results'>) {
  return <RequireAuth roles={['Student']}>{children}</RequireAuth>;
}
