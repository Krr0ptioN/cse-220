import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  __resetAuthSessionStoreForTests,
  authSessionStoreApi,
} from './session-store';

const ownerUser = {
  id: 'owner-1',
  email: 'owner@example.com',
  username: 'owner',
  display_name: 'Ada Owner',
  role: 'owner' as const,
};

describe('auth session store', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    __resetAuthSessionStoreForTests();
  });

  it('stores and clears the current authenticated user', () => {
    authSessionStoreApi.getState().setUser(ownerUser);

    expect(authSessionStoreApi.getState()).toMatchObject({
      user: ownerUser,
      status: 'authenticated',
      error: null,
    });

    authSessionStoreApi.getState().clearSession();

    expect(authSessionStoreApi.getState()).toMatchObject({
      user: null,
      status: 'anonymous',
      error: null,
    });
  });

  it('signs in and stores the returned user', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: { csrf_token: 'csrf-123' } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: ownerUser }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
    );

    await expect(
      authSessionStoreApi.getState().signIn({
        email: 'OWNER@Example.com ',
        password: 'password-123',
      }),
    ).resolves.toEqual(ownerUser);

    expect(authSessionStoreApi.getState()).toMatchObject({
      user: ownerUser,
      status: 'authenticated',
      error: null,
    });
  });
});
