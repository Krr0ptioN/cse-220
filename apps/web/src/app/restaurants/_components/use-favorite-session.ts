'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/app/(auth)/auth/_lib/auth-api';

export type FavoriteAccessState = {
  isLoading: boolean;
  canFavorite: boolean;
};

let cachedFavoriteAccessState: FavoriteAccessState | null = null;
let pendingFavoriteAccessPromise: Promise<FavoriteAccessState> | null = null;

async function resolveFavoriteAccessState(): Promise<FavoriteAccessState> {
  try {
    await getCurrentUser();
    return { isLoading: false, canFavorite: true };
  } catch {
    return { isLoading: false, canFavorite: false };
  }
}

export function useFavoriteSession(): FavoriteAccessState {
  const [state, setState] = useState<FavoriteAccessState>(
    () => cachedFavoriteAccessState ?? { isLoading: true, canFavorite: false },
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      if (cachedFavoriteAccessState) {
        if (!cancelled) {
          setState(cachedFavoriteAccessState);
        }
        return;
      }

      if (!pendingFavoriteAccessPromise) {
        pendingFavoriteAccessPromise = resolveFavoriteAccessState();
      }

      const nextState = await pendingFavoriteAccessPromise;
      cachedFavoriteAccessState = nextState;

      if (!cancelled) {
        setState(nextState);
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function __resetFavoriteSessionForTests() {
  cachedFavoriteAccessState = null;
  pendingFavoriteAccessPromise = null;
}
