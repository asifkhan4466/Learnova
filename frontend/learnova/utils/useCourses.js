import { useSyncExternalStore } from "react";
import { getCourses, subscribeCourses } from "./courseStorage";

export default function useCourses() {
  return useSyncExternalStore(subscribeCourses, getCourses, getCourses);
}
