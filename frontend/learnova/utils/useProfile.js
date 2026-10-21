import { useSyncExternalStore } from 'react';
export function subscribe(listener) {
  window.addEventListener('learnova:profile-updated', listener);
  window.addEventListener('storage', listener);
  return () => { window.removeEventListener('learnova:profile-updated', listener); window.removeEventListener('storage', listener); };
}
export default function useProfile(id) {
  const snapshot = useSyncExternalStore(subscribe, () => { try { return localStorage.getItem(`learnova_profile_${id}`) || '{}'; } catch { return '{}'; } }, () => '{}');
  try { return JSON.parse(snapshot); } catch { return {}; }
}
