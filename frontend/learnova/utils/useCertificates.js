import { useEffect, useState, useSyncExternalStore } from "react";
import useCourses from "./useCourses";
import { getCertificateState, getCertificateRecords, subscribeCertificates, syncCertificates } from "./certificateStorage";

export default function useCertificates() {
  const courses = useCourses();
  const state = useSyncExternalStore(subscribeCertificates, getCertificateState, getCertificateState);
  const [error, setError] = useState("");
  useEffect(() => {
    // Sync the external demo store after mount; defer error reporting to avoid a nested render.
    let active = true;
    Promise.resolve().then(() => { if (!active) return; try { syncCertificates(); setError(""); } catch (failure) { setError(failure.message); } });
    return () => { active = false; };
  }, [state.enrollments, courses]);
  return { state, records: getCertificateRecords(state), error };
}
