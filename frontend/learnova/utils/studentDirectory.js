import { students } from "../data/operations";
import { readProfile, saveProfile } from "./profileStorage";
import { hasPermission, currentSubAdminId } from "./adminPermissions";

function readList(key) {
  try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
}
export function deletedStudentIds() { return readList("learnova_deleted_students"); }
export function getStudents() {
  const deleted = new Set(deletedStudentIds());
  return [...students, ...readList("learnova_admin_student_additions")].filter(row => !deleted.has(row.id)).map(row => readProfile(row.id, row));
}
export function batchStudents(batch, enrollments) {
  if (!batch) return [];
  const directory = getStudents();
  const deleted = new Set(deletedStudentIds());
  const linked = enrollments.filter(row => row.batchId === batch.id && row.courseId === batch.courseId);
  const ids = new Set([...linked.map(row => row.studentId), ...directory.filter(row => row.batchId ? row.batchId === batch.id : row.batch === batch.name && row.course === batch.course).map(row => row.id)]);
  return [...ids].filter(id => id && !deleted.has(id)).map(id => {
    const enrollment = linked.find(row => row.studentId === id);
    return { ...readProfile(id, { id, name: enrollment?.student || id }), ...directory.find(row => row.id === id), enrollments: linked.filter(row => row.studentId === id) };
  });
}
function requireAccess(role) {
  if (!hasPermission(role, currentSubAdminId, "students")) throw new Error("You are not allowed to manage students.");
}
export function updateStudentProfile(id, profile, role) {
  requireAccess(role);
  if (deletedStudentIds().includes(id)) throw new Error("This student has been deleted.");
  if (getStudents().some(row => row.id !== id && profile.email && row.email?.toLowerCase() === profile.email.trim().toLowerCase())) throw new Error("This email belongs to another student.");
  const changes = { ...profile };
  if (!changes.username?.trim()) delete changes.username;
  return saveProfile(id, changes);
}
export function deleteStudent(id, role) {
  requireAccess(role);
  localStorage.setItem("learnova_deleted_students", JSON.stringify([...new Set([...deletedStudentIds(), id])]));
  window.dispatchEvent(new Event("learnova:profile-updated"));
}
