'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { startTransition, useEffect, type ComponentType } from 'react';
import {
  Button,
  Spinner,
  cn,
} from 'ui-common';
import {
  RiRestaurant2Line,
  RiStore2Line,
} from '@remixicon/react';

import { useAuthSession, type User } from '@flavor-map/ui-module-auth';
import { AccountMenu } from './account-menu';

type NavLink = {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const navigationLinks: NavLink[] = [
  {
    href: '/restaurants',
    label: 'Restaurants',
    description: 'Browse reviewed places',
    icon: RiRestaurant2Line,
  },
  {
    href: '/auth/sign-up?role=owner',
    label: 'For owners',
    description: 'Manage your listing',
    icon: RiStore2Line,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    status,
    isSigningOut,
    loadCurrentUser,
    patchUser,
    signOut,
  } = useAuthSession((state) => ({
    user: state.user,
    status: state.status,
    isSigningOut: state.isSigningOut,
    loadCurrentUser: state.loadCurrentUser,
    patchUser: state.patchUser,
    signOut: state.signOut,
  }));

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser, pathname]);

  useEffect(() => {
    function handleProfileUpdated(event: Event) {
      const updatedProfile = (event as CustomEvent<Partial<User>>).detail;

      patchUser(updatedProfile);
    }

    window.addEventListener('flavormap:profile-updated', handleProfileUpdated);

    return () => {
      window.removeEventListener('flavormap:profile-updated', handleProfileUpdated);
    };
  }, [patchUser]);

  if (pathname.startsWith('/owner/dashboard') || pathname.startsWith('/auth')) {
    return null;
  }

  const displayName =
    user?.display_name?.trim() || user?.username || user?.email.split('@')[0] || null;
  const roleLabel = user ? (user.role === 'owner' ? 'Owner account' : 'Reviewer account') : null;

  async function handleSignOut() {
    try {
      await signOut();
      startTransition(() => {
        router.push('/');
        router.refresh();
      });
    } catch {
      // Store owns the error state. Keep the menu open and avoid navigating.
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/92 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-background shadow-sm">
            <RiRestaurant2Line className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-tight text-foreground">
              FlavorMap
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              Restaurants and review workflows
            </span>
          </span>
        </Link>

        <nav className="ml-3 hidden items-center gap-1 lg:flex">
          {navigationLinks.map((link) => (
            <HeaderLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={isActive(pathname, link.href)}
            />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/restaurants"
            className="hidden rounded-full border border-border/70 px-3 py-2 text-sm text-muted-foreground transition hover:border-border hover:bg-muted/60 hover:text-foreground md:inline-flex"
          >
            Explore restaurants
          </Link>

          {status === 'idle' || status === 'loading' ? (
            <Button variant="ghost" size="sm" className="gap-2 rounded-full" disabled>
              <Spinner className="size-4" />
              Account
            </Button>
          ) : user ? (
            <AccountMenu
              user={user}
              displayName={displayName}
              roleLabel={roleLabel}
              onSignOut={handleSignOut}
              isSigningOut={isSigningOut}
              onNavigate={(href) => router.push(href)}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link href="/auth/sign-up">Create account</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function HeaderLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground',
        active && 'bg-foreground text-background hover:bg-foreground hover:text-background',
      )}
    >
      {label}
    </Link>
  );
}


function isActive(pathname: string, href: string): boolean {
  if (href === '/restaurants' && pathname.startsWith('/restaurants')) {
    return true;
  }

  return pathname === href;
}
