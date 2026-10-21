import { useMemo, useSyncExternalStore } from "react";
import { permissionSnapshot, readAdminPermissions, subscribePermissions } from "./adminPermissions";

export default function usePermissions() {
  const snapshot = useSyncExternalStore(subscribePermissions, permissionSnapshot);
  return useMemo(() => readAdminPermissions(snapshot), [snapshot]);
}
