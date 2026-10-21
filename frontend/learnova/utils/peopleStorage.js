import { useSyncExternalStore } from "react";
import { teachers } from "../data/operations";
import { readProfile } from "./profileStorage";
import { getStudents } from "./studentDirectory";
const key = "learnova_teacher_directory";
export function getTeachers() { let rows; try { rows = JSON.parse(localStorage.getItem(key)); } catch {} return (Array.isArray(rows) ? rows : teachers).map(row => readProfile(row.id, row)); }
function subscribe(fn) { window.addEventListener("storage", fn); window.addEventListener("learnova:profile-updated", fn); return () => { window.removeEventListener("storage", fn); window.removeEventListener("learnova:profile-updated", fn); }; }
export function usePeople(kind = "teachers") { const text = useSyncExternalStore(subscribe, () => JSON.stringify(kind === "teachers" ? getTeachers() : getStudents())); return JSON.parse(text); }
export function saveTeachers(rows) { localStorage.setItem(key, JSON.stringify(rows)); window.dispatchEvent(new Event("learnova:profile-updated")); }
