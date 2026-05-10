'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  RiArrowRightLine,
  RiBarChart2Line,
  RiSideBarLine,
  RiRestaurantLine,
  RiStarLine,
  RiStore2Line,
} from '@remixicon/react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from 'ui-common';

import {
  OwnerDashboardProvider,
  useOwnerDashboard,
} from './owner-dashboard-context';

export function OwnerDashboardShell({ children }: { children: ReactNode }) {
  const [sidebarMode, setSidebarMode] = useState<'expanded' | 'compact'>('expanded');

  return (
    <OwnerDashboardProvider>
      <OwnerDashboardContent
        sidebarMode={sidebarMode}
        onToggleSidebarMode={() =>
          setSidebarMode((current) => (current === 'expanded' ? 'compact' : 'expanded'))
        }
      >
        {children}
      </OwnerDashboardContent>
    </OwnerDashboardProvider>
  );
}

function OwnerDashboardContent({
  children,
  sidebarMode,
  onToggleSidebarMode,
}: {
  children: ReactNode;
  sidebarMode: 'expanded' | 'compact';
  onToggleSidebarMode: () => void;
}) {
  const { loadState, error } = useOwnerDashboard();

  if (loadState === 'loading') {
    return (
      <OwnerDashboardState
        title="Loading dashboard"
        description="Fetching your owner workspace."
      />
    );
  }

  if (loadState === 'access-denied') {
    return (
      <OwnerDashboardState
        title="Owner access required"
        description="Sign in with a restaurant owner account to manage listings."
      >
        <Button asChild>
          <Link href="/auth/sign-in" className="inline-flex items-center gap-1">
            Open owner sign in
            <RiArrowRightLine className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </OwnerDashboardState>
    );
  }

  if (loadState === 'error') {
    return (
      <OwnerDashboardState
        title="Dashboard unavailable"
        description={error ?? 'Unable to load dashboard.'}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-foreground">
      <div
        className="grid min-h-screen grid-cols-1 md:grid-cols-[var(--dashboard-sidebar-width)_minmax(0,1fr)]"
        style={
          {
            '--dashboard-sidebar-width': sidebarMode === 'expanded' ? 'clamp(18rem, 19vw, 20rem)' : '72px',
          } as CSSProperties
        }
      >
        <OwnerSidebarNav mode={sidebarMode} onToggleMode={onToggleSidebarMode} />
        <div className="min-w-0 border-l border-border/70 bg-background">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 bg-background/90 px-4 backdrop-blur sm:px-8">
            <Button asChild variant="ghost" size="icon-sm" aria-label="Open public listings">
              <Link href="/restaurants">
                <RiArrowRightLine className="size-4 rotate-180" aria-hidden="true" />
              </Link>
            </Button>
            <span className="text-sm font-medium text-muted-foreground">Restaurants</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-sm font-semibold">Owner workspace</span>
          </header>

          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">{children}</div>
        </div>
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

function OwnerSidebarNav({
  mode,
  onToggleMode,
}: {
  mode: 'expanded' | 'compact';
  onToggleMode: () => void;
}) {
  const pathname = usePathname();
  const items = useMemo(
    () => [
    {
      label: 'Overview',
      href: '/owner/dashboard/overview',
      icon: <RiRestaurantLine className="size-5" aria-hidden="true" />,
      description: 'Workspace summary',
    },
    {
      label: 'Listings',
      href: '/owner/dashboard/listings',
      icon: <RiStore2Line className="size-5" aria-hidden="true" />,
      description: 'Restaurant details',
    },
    {
      label: 'Menu',
      href: '/owner/dashboard/menu',
      icon: <RiRestaurantLine className="size-5" aria-hidden="true" />,
      description: 'Dishes and availability',
    },
    {
      label: 'Reviews',
      href: '/owner/dashboard/reviews',
      icon: <RiStarLine className="size-5" aria-hidden="true" />,
      description: 'Reply to guests',
    },
    {
      label: 'Analytics',
      href: '/owner/dashboard/analytics',
      icon: <RiBarChart2Line className="size-5" aria-hidden="true" />,
      description: 'Trends and reviewer stats',
    },
  ],
    [],
  );

  function isActive(href: string) {
    if (href === '/owner/dashboard/overview') {
      return pathname === href || pathname === '/owner/dashboard';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className="hidden min-h-screen border-r border-border/70 bg-card md:block"
      data-mode={mode}
    >
      <div className="flex h-16 items-center justify-between gap-2 border-b border-border/70 px-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <RiRestaurantLine className="size-5" aria-hidden="true" />
          </span>
          {mode === 'expanded' && (
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-none">Owner workspace</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Restaurant management</p>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={mode === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
          onClick={onToggleMode}
        >
          <RiSideBarLine className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <nav
        className={cn(
          'py-4',
          mode === 'expanded' ? 'space-y-1 px-3' : 'flex flex-col items-center gap-3',
        )}
        aria-label="Owner workspace"
      >
        {items.map((item) => (
          <Link
            key={item.label}
            aria-label={item.label}
            aria-current={isActive(item.href) ? 'page' : undefined}
            href={item.href}
            className={cn(
              'group flex rounded-xl text-muted-foreground transition-colors',
              mode === 'expanded'
                ? 'items-start gap-3 px-3 py-2.5'
                : 'size-11 items-center justify-center',
              isActive(item.href) ? 'bg-primary text-primary-foreground shadow-sm' : 'opacity-65 hover:opacity-100',
            )}
            title={item.label}
          >
            <span className={cn(mode === 'expanded' && 'mt-0.5')}>{item.icon}</span>
            {mode === 'expanded' && (
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-none">{item.label}</span>
                <span className="mt-1 block text-[11px] text-current/70">{item.description}</span>
              </span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
