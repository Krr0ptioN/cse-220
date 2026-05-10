'use client';

import { useEffect } from 'react';
import { useAuthSession } from '@flavor-map/ui-module-auth';

export type FavoriteAccessState = {
  isLoading: boolean;
  canFavorite: boolean;
};

export function useFavoriteSession(): FavoriteAccessState {
  const { user, status, loadCurrentUser } = useAuthSession((state) => ({
    user: state.user,
    status: state.status,
    loadCurrentUser: state.loadCurrentUser,
  }));

  useEffect(() => {
    if (status === 'idle') {
      void loadCurrentUser();
    }
  }, [loadCurrentUser, status]);

  return {
    isLoading: status === 'idle' || status === 'loading',
    canFavorite: Boolean(user),
  };
}

export function __resetFavoriteSessionForTests() {
  // Session state is owned by @flavor-map/ui-module-auth.
}
