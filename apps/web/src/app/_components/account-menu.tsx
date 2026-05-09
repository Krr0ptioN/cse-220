import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui-common';
import {
  RiDashboardLine,
  RiLogoutBoxLine,
  RiRestaurant2Line,
} from '@remixicon/react';

import { destinationForRole } from '@/app/(auth)/auth/_lib/auth-flow';
import { type User } from '@/lib/restaurants';

function getInitials(value: string): string {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2) || 'FM'
  );
}

export function AccountMenu({
  user,
  displayName,
  roleLabel,
  onNavigate,
  onSignOut,
  isSigningOut,
}: {
  user: User;
  displayName: string | null;
  roleLabel: string | null;
  onNavigate: (href: string) => void;
  onSignOut: () => Promise<void>;
  isSigningOut: boolean;
}) {
  const initials = getInitials(displayName || user.username || user.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto gap-3 rounded-full border border-border/70 px-3 py-2 text-left shadow-sm hover:bg-background"
        >
          <Avatar size="sm">
            <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-sm font-medium text-foreground">
              {displayName}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {roleLabel}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem className="flex items-center gap-3" onSelect={() => onNavigate('/profile')}>
          <Avatar size="sm">
            <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onNavigate('/restaurants')}>
          <RiRestaurant2Line className="size-4" aria-hidden="true" />
          Restaurants
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            onNavigate(user.role === 'owner' ? '/owner/dashboard' : destinationForRole(user.role))
          }
        >
          <RiDashboardLine className="size-4" aria-hidden="true" />
          {user.role === 'owner' ? 'Owner dashboard' : 'My restaurants'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={(event) => {
            event.preventDefault();
            void onSignOut();
          }}
          disabled={isSigningOut}
        >
          <RiLogoutBoxLine className="size-4" aria-hidden="true" />
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
