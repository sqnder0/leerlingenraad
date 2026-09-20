"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tracks which one of possibly several buttons in a list is mid-request
 * (pendingKey) or just finished successfully (confirmedKey), so a click
 * gets visible feedback beyond the eventual optimistic re-render: the
 * clicked button disables + shows a spinner, then briefly shows a
 * checkmark once the server action resolves.
 */
export function useConfirmFlash(durationMs = 1200) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [confirmedKey, setConfirmedKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const confirm = useCallback(
    (key: string) => {
      setPendingKey(null);
      setConfirmedKey(key);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setConfirmedKey(null), durationMs);
    },
    [durationMs],
  );

  return { pendingKey, setPendingKey, confirmedKey, confirm };
}
