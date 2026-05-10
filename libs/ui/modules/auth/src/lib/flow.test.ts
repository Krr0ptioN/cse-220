import { describe, expect, it } from 'vitest';

import {
  buildRegisterPayload,
  destinationForRole,
  getCookieValue,
  normalizeApiError,
  authVariantFromRoleParam,
  roleForAuthVariant,
  usernameFromEmail,
} from './flow';
import { getApiBaseUrl } from 'ui-common';

function resolveApiAssetUrl(url?: string | null): string {
  if (!url) {
    return '';
  }

  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) {
    return url;
  }

  return new URL(url, getApiBaseUrl()).toString();
}

describe('auth-flow utilities', () => {
  it('routes owners to the restaurant dashboard', () => {
    expect(destinationForRole('owner')).toBe('/owner/dashboard');
  });

  it('routes normal users to restaurant discovery', () => {
    expect(destinationForRole('user')).toBe('/restaurants');
    expect(destinationForRole('reviewer')).toBe('/restaurants');
    expect(destinationForRole(undefined)).toBe('/restaurants');
  });

  it('maps customized auth variants to backend roles', () => {
    expect(roleForAuthVariant('owner')).toBe('owner');
    expect(roleForAuthVariant('reviewer')).toBe('user');
  });

  it('maps sign-up role search params to auth variants', () => {
    expect(authVariantFromRoleParam('owner')).toBe('owner');
    expect(authVariantFromRoleParam('reviewer')).toBe('reviewer');
    expect(authVariantFromRoleParam(undefined)).toBe('reviewer');
    expect(authVariantFromRoleParam(['owner', 'reviewer'])).toBe('owner');
    expect(authVariantFromRoleParam('unknown')).toBe('reviewer');
  });

  it('reads a named cookie from a cookie header', () => {
    expect(getCookieValue('theme=dark; csrftoken=abc123; sessionid=xyz', 'csrftoken')).toBe(
      'abc123',
    );
  });

  it('normalizes API error payloads', () => {
    expect(normalizeApiError({ error: { message: 'Invalid email' } })).toBe('Invalid email');
    expect(normalizeApiError(null)).toBe('Something went wrong. Please try again.');
  });

  it('builds a backend registration payload for customized auth pages', () => {
    expect(
      buildRegisterPayload({
        email: 'OWNER@Example.com ',
        password: 'password-123',
        displayName: '  Ada Bistro  ',
        variant: 'owner',
      }),
    ).toEqual({
      email: 'owner@example.com',
      username: 'owner',
      password: 'password-123',
      display_name: 'Ada Bistro',
      role: 'owner',
    });
  });

  it('creates stable fallback usernames from email addresses', () => {
    expect(usernameFromEmail('Jane.Food+reviews@example.com')).toBe('jane.food-reviews');
    expect(usernameFromEmail('not-an-email')).toBe('not-an-email');
    expect(usernameFromEmail('!!!@example.com')).toBe('flavormap-user');
  });

  it('uses the browser host for localhost API URLs during LAN development', () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      value: { location: { hostname: '192.168.1.118' } },
      configurable: true,
    });

    try {
      expect(getApiBaseUrl()).toBe('http://192.168.1.118:8020');
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
      });
    }
  });

  it('resolves relative API asset paths against the API base URL', () => {
    const apiBaseUrl = getApiBaseUrl();

    expect(resolveApiAssetUrl('/api/v1/files/asset-123')).toBe(
      `${apiBaseUrl}/api/v1/files/asset-123`,
    );
    expect(resolveApiAssetUrl('https://media.example.com/photo.jpg')).toBe(
      'https://media.example.com/photo.jpg',
    );
  });
});
