import { getTeachers } from "./peopleStorage";
import { getCourses, COURSE_STORAGE_KEY } from "./courseStorage";
import { getBatchState, BATCH_STORAGE_KEY } from "./batchStorage";

const directoryKey = "learnova_teacher_directory";

function commit(changes) {
  const previous = changes.map(([key]) => [key, localStorage.getItem(key)]);
  try {
    for (const [key, value] of changes) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    for (const [key, value] of previous) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
    throw error;
  }
  window.dispatchEvent(new StorageEvent("storage", { key: null }));
  window.dispatchEvent(new Event("learnova:profile-updated"));
}

function persistTeacher(original, updated, rows) {
  const state = getBatchState();
  const matches = row => row.teacherId === original.id || (!row.teacherId && (row.teacher === original.name || row.teacherName === original.name));
  if ((!updated || updated.id !== original.id || updated.status !== "Active") && state.classes.some(row => matches(row) && row.status === "Live")) {
    throw new Error("End this teacher's live class before changing their ID, deactivating or deleting them.");
  }
  const courses = getCourses().map(course => course.instructorId === original.id || (!course.instructorId && course.instructor === original.name)
    ? { ...course, instructorId: updated?.id || "", instructor: updated?.name || "" } : course);
  const nextState = Object.fromEntries(Object.entries(state).map(([key, value]) => [key, Array.isArray(value) ? value.map(row => {
    if (!row || typeof row !== "object" || !matches(row)) return row;
    return { ...row, teacherId: updated?.id || null,
      ...("teacher" in row ? { teacher: updated?.name || "Unassigned" } : {}),
      ...("teacherName" in row ? { teacherName: updated?.name || "Unassigned" } : {}) };
  }) : value]));
  const changes = [
    [directoryKey, updated ? rows.map(row => row.id === original.id ? updated : row) : rows.filter(row => row.id !== original.id)],
    [COURSE_STORAGE_KEY, courses], [BATCH_STORAGE_KEY, nextState],
    [`learnova_profile_${original.id}`, null],
  ];
  if (updated) {
    if (updated.id === original.id) changes.pop();
    changes.push([`learnova_profile_${updated.id}`, updated]);
  }
  commit(changes);
  return updated;
}

export function updateTeacher(id, draft) {
  const rows = getTeachers();
  const original = rows.find(row => row.id === id);
  if (!original) throw new Error("This teacher no longer exists.");
  const updated = { ...original };
  for (const key of ["id", "name", "email", "username", "phone", "specialization", "experience", "bio", "image", "status", "joinedDate"]) {
    if (typeof draft[key] === "string") updated[key] = draft[key].trim();
  }
  if (!/^[a-zA-Z0-9_-]{3,40}$/.test(updated.id)) throw new Error("ID must be 3 to 40 letters, numbers, hyphens or underscores.");
  if (!updated.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updated.email)) throw new Error("Enter a name and valid email.");
  if (updated.username && !/^[a-zA-Z0-9._-]{3,30}$/.test(updated.username)) throw new Error("Username must be 3 to 30 letters, numbers, dots, hyphens or underscores.");
  if (!["Active", "Inactive"].includes(updated.status)) throw new Error("Select a valid status.");
  if (rows.some(row => row.id !== id && (row.id.toLowerCase() === updated.id.toLowerCase() || row.email?.toLowerCase() === updated.email.toLowerCase() || (updated.username && row.username?.toLowerCase() === updated.username.toLowerCase())))) throw new Error("Another teacher already uses this ID, email or username.");
  return persistTeacher(original, updated, rows);
}

export function deleteTeacher(id) {
  const rows = getTeachers();
  const original = rows.find(row => row.id === id);
  if (!original) throw new Error("This teacher no longer exists.");
  persistTeacher(original, null, rows);
}
