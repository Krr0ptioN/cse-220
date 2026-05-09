import type { ReactNode } from 'react';
import {
  RiBarChart2Line,
  RiCalendarLine,
  RiRestaurantLine,
  RiStarLine,
  RiStore2Line,
} from '@remixicon/react';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from 'ui-common';

export function OwnerDashboardShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-foreground">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[72px_minmax(0,1fr)]">
        <OwnerSidebarNav />
        <div className="min-w-0 border-l border-border/70 bg-background">{children}</div>
      </div>
    </main>
  );
}

export function OwnerDashboardState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10">
      <Card className="w-full border border-border/70">
        <CardHeader className="space-y-2">
          <Badge variant="secondary">Owner dashboard</Badge>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {children && <CardContent>{children}</CardContent>}
      </Card>
    </main>
  );
}

function OwnerSidebarNav() {
  const items = [
    { label: 'Overview', icon: <RiRestaurantLine className="size-5" aria-hidden="true" />, active: true },
    { label: 'Listings', icon: <RiStore2Line className="size-5" aria-hidden="true" /> },
    { label: 'Menu', icon: <RiRestaurantLine className="size-5" aria-hidden="true" /> },
    { label: 'Hours', icon: <RiCalendarLine className="size-5" aria-hidden="true" /> },
    { label: 'Reviews', icon: <RiStarLine className="size-5" aria-hidden="true" /> },
    { label: 'Analytics', icon: <RiBarChart2Line className="size-5" aria-hidden="true" /> },
  ];

  return (
    <aside className="hidden min-h-screen border-r border-border/70 bg-card md:block">
      <div className="flex h-16 items-center justify-center border-b border-border/70">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <RiRestaurantLine className="size-5" aria-hidden="true" />
        </span>
      </div>
      <nav className="flex flex-col items-center gap-3 py-5" aria-label="Owner workspace">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            aria-label={item.label}
            aria-current={item.active ? 'page' : undefined}
            disabled={!item.active}
            className={cn(
              'flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors',
              item.active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-55',
            )}
          >
            {item.icon}
          </button>
        ))}
      </nav>
    </aside>
  );
}
