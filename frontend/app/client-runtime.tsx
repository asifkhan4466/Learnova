"use client";
import { useSyncExternalStore, type ReactNode } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

// The original application initializes browser storage while rendering.
// Mount its existing UI only after hydration to preserve those initializers.
export default function ClientRuntime({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return mounted ? children : null;
}
