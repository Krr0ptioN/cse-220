'use client';

import { createShallowStore } from '@okyrychenko-dev/react-zustand-toolkit';
import { type StoreApi } from 'zustand';

import {
  buildRegisterPayload,
  destinationForRole,
  type AuthRole,
  type RegisterFormInput,
} from './flow';
import { getCurrentUser, loginUser, logoutUser, registerUser } from './api';
import { type User } from './types';

export type AuthSessionStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'anonymous'
  | 'error';

export interface LoginFormInput {
  email: string;
  password: string;
}

export interface AuthSessionStore {
  user: User | null;
  status: AuthSessionStatus;
  error: string | null;
  isSigningOut: boolean;
  setUser: (user: User | null) => void;
  patchUser: (profile: Partial<User>) => void;
  clearSession: () => void;
  setError: (message: string | null) => void;
  loadCurrentUser: () => Promise<User | null>;
  signIn: (input: LoginFormInput) => Promise<User>;
  signUp: (input: RegisterFormInput) => Promise<User>;
  signOut: () => Promise<void>;
}

export interface AuthSessionHook {
  (): AuthSessionStore;
  <T>(
    selector: (state: AuthSessionStore) => T,
    equalityFn?: (a: T, b: T) => boolean,
  ): T;
}

export interface AuthSessionPlainHook {
  (): AuthSessionStore;
  <T>(selector: (state: AuthSessionStore) => T): T;
}

let pendingCurrentUserRequest: Promise<User | null> | null = null;

function authenticatedState(user: User) {
  return {
    user,
    status: 'authenticated' as const,
    error: null,
  };
}

function anonymousState() {
  return {
    user: null,
    status: 'anonymous' as const,
    error: null,
  };
}

const authSessionToolkit = createShallowStore<AuthSessionStore>((set, get) => ({
  user: null,
  status: 'idle',
  error: null,
  isSigningOut: false,

  setUser: (user) => {
    if (user) {
      set(authenticatedState(user));
      return;
    }

    set(anonymousState());
  },

  patchUser: (profile) => {
    const currentUser = get().user;
    if (!currentUser || (profile.id && profile.id !== currentUser.id)) {
      return;
    }

    set(authenticatedState({ ...currentUser, ...profile }));
  },

  clearSession: () => {
    pendingCurrentUserRequest = null;
    set(anonymousState());
  },

  setError: (message) => {
    set({ error: message, status: message ? 'error' : get().status });
  },

  loadCurrentUser: async () => {
    if (!pendingCurrentUserRequest) {
      set({ status: 'loading', error: null });
      pendingCurrentUserRequest = getCurrentUser()
        .then((user) => {
          set(authenticatedState(user));
          return user;
        })
        .catch(() => {
          set(anonymousState());
          return null;
        })
        .finally(() => {
          pendingCurrentUserRequest = null;
        });
    }

    return pendingCurrentUserRequest;
  },

  signIn: async (input) => {
    set({ status: 'loading', error: null });
    try {
      const user = await loginUser(input);
      set(authenticatedState(user));
      return user;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to sign in.';
      set({ user: null, status: 'error', error: message });
      throw caught;
    }
  },

  signUp: async (input) => {
    set({ status: 'loading', error: null });
    try {
      const user = await registerUser(buildRegisterPayload(input));
      set(authenticatedState(user));
      return user;
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Unable to create account.';
      set({ user: null, status: 'error', error: message });
      throw caught;
    }
  },

  signOut: async () => {
    set({ isSigningOut: true, error: null });
    try {
      await logoutUser();
      pendingCurrentUserRequest = null;
      set({ ...anonymousState(), isSigningOut: false });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to sign out.';
      set({ isSigningOut: false, error: message });
      throw caught;
    }
  },
}));

export const useAuthSession: AuthSessionHook = authSessionToolkit.useStore;
export const useAuthSessionPlain: AuthSessionPlainHook =
  authSessionToolkit.useStorePlain;
export const authSessionStoreApi: StoreApi<AuthSessionStore> =
  authSessionToolkit.useStoreApi;

export function destinationForSessionRole(role: AuthRole | string | undefined): string {
  return destinationForRole(role);
}

export function __resetAuthSessionStoreForTests() {
  pendingCurrentUserRequest = null;
  authSessionStoreApi.setState({
    user: null,
    status: 'idle',
    error: null,
    isSigningOut: false,
  });
}
