import { useSyncExternalStore } from "react";
import { getBatchState, subscribeBatches } from "./batchStorage";
import useCourses from "./useCourses";

export default function useBatches() {
  useCourses(); // Recheck course assignments when the shared catalog changes.
  return useSyncExternalStore(subscribeBatches, getBatchState, getBatchState);
}
