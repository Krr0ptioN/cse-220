import { type ReactNode } from 'react';

import { OwnerDashboardShell } from './_components/owner-dashboard-shell';

export default function OwnerDashboardLayout({ children }: { children: ReactNode }) {
  return <OwnerDashboardShell>{children}</OwnerDashboardShell>;
}
