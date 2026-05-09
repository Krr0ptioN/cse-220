// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('ui-common', () => ({
  Avatar: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  AvatarFallback: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  AvatarImage: (props: any) => <img {...props} />,
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  DropdownMenu: ({ children }: any) => <>{children}</>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
}));

vi.mock('@remixicon/react', () => ({
  RiDashboardLine: () => <svg />,
  RiLogoutBoxLine: () => <svg />,
  RiRestaurant2Line: () => <svg />,
}));

vi.mock('@/app/(auth)/auth/_lib/auth-flow', () => ({
  destinationForRole: () => '/profile',
}));

import { AccountMenu } from './account-menu';

describe('AccountMenu', () => {
  beforeEach(() => {
    vi.stubGlobal('React', React);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the user profile picture in the trigger and menu summary', () => {
    render(
      <AccountMenu
        user={{
          id: 'user-1',
          email: 'ada@example.com',
          username: 'ada',
          display_name: 'Ada Lovelace',
          avatar_url: 'data:image/png;base64,avatar-data',
          role: 'user',
        }}
        displayName="Ada Lovelace"
        roleLabel="Reviewer account"
        onNavigate={vi.fn()}
        onSignOut={vi.fn()}
        isSigningOut={false}
      />,
    );

    const images = screen.getAllByRole('img', { name: /ada lovelace/i });

    expect(images).toHaveLength(2);
    expect(images[0]?.getAttribute('src')).toBe('data:image/png;base64,avatar-data');
    expect(images[1]?.getAttribute('src')).toBe('data:image/png;base64,avatar-data');
  });
});
