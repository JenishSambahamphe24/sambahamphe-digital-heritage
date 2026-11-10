"use client";

import { useSyncExternalStore } from "react";

const TOKEN_PATTERN = /[#&]token=([\w-]+)/;
const HASH_CHANGE_EVENT = "hashchange";

export type THashToken =
  { status: "reading" } | { status: "missing" } | { status: "found"; token: string };

function subscribe(onChange: () => void): () => void {
  window.addEventListener(HASH_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(HASH_CHANGE_EVENT, onChange);
}

// The token travels after "#" so it never reaches any server log (ADR-006),
// which also means only the browser can read it: the server snapshot is null.
export function useHashToken(): THashToken {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => null,
  );
  if (hash === null) {
    return { status: "reading" };
  }
  const token = TOKEN_PATTERN.exec(hash)?.[1];
  return token ? { status: "found", token } : { status: "missing" };
}
