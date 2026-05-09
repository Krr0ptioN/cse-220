'use client';

import { useEffect, useRef, useState } from 'react';

export function useDebouncedExclusiveAction(delayMs = 400) {
  const lockedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  async function runExclusive(action: () => Promise<void>) {
    if (lockedRef.current) {
      return false;
    }

    lockedRef.current = true;
    setIsLocked(true);
    const startedAt = window.performance.now();

    try {
      await action();
      return true;
    } finally {
      const elapsed = window.performance.now() - startedAt;
      const remaining = Math.max(0, delayMs - elapsed);

      timerRef.current = window.setTimeout(() => {
        lockedRef.current = false;
        setIsLocked(false);
        timerRef.current = null;
      }, remaining);
    }
  }

  return { isLocked, runExclusive };
}
