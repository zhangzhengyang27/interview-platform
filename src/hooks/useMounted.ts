"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns `true` after the component has hydrated on the client.
 * Uses useSyncExternalStore to avoid the set-state-in-effect warning.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,   // client snapshot
    () => false   // server snapshot
  );
}
