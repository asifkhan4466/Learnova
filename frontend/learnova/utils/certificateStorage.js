import { getCourses } from "./courseStorage";

export const CERTIFICATE_KEY = "learnova_certificates";
export const DEMO_STUDENT_ID = "STU-1001";
const listeners = new Set();
let textCache;
let cache;
const defaults = {
  template: null,
  authorizedName: "Learnova Administration",
  // Certificate-only demo completion source. Other panels currently have static mock data.
  enrollments: [
    { id: "STU-1001-1", studentId: "STU-1001", studentName: "Ahmed Khan", courseId: 1, progress: 75, status: "Active" },
    { id: "STU-1001-2", studentId: "STU-1001", studentName: "Ahmed Khan", courseId: 2, progress: 45, status: "Active" },
    { id: "STU-1001-3", studentId: "STU-1001", studentName: "Ahmed Khan", courseId: 3, progress: 100, status: "Completed", completionDate: "2026-08-28" },
    { id: "STU-1005-3", studentId: "STU-1005", studentName: "Usman Ali", courseId: 3, progress: 100, status: "Completed", completionDate: "2026-09-06" },
  ],
  certificates: [],
};

export const isEligible = enrollment => enrollment.progress === 100 || enrollment.status === "Completed";

export function getCertificateState() {
  try {
    const text = localStorage.getItem(CERTIFICATE_KEY);
    if (cache && text === textCache) return cache;
    const parsed = text ? JSON.parse(text) : structuredClone(defaults);
    if (!parsed || !Array.isArray(parsed.enrollments) || !Array.isArray(parsed.certificates)) throw new Error("Invalid certificate data");
    cache = parsed;
    textCache = text;
    return cache;
  } catch {
    if (!cache) cache = structuredClone(defaults);
    return cache;
  }
}

function save(state) {
  try { localStorage.setItem(CERTIFICATE_KEY, JSON.stringify(state)); }
  catch { throw new Error("Unable to save certificates in this browser. Try a smaller template or free some browser storage."); }
  cache = state;
  textCache = JSON.stringify(state);
  listeners.forEach(listener => listener());
}

export function syncCertificates() {
  const state = getCertificateState();
  const certificates = [...state.certificates];
  const courses = getCourses();
  for (const enrollment of state.enrollments) {
    if (!isEligible(enrollment) || certificates.some(c => c.enrollmentId === enrollment.id)) continue;
    if (!courses.some(c => String(c.id) === String(enrollment.courseId))) continue;
    const completionDate = enrollment.completionDate || new Date().toISOString().slice(0, 10);
    certificates.push({ enrollmentId: enrollment.id, certificateId: `LRN-${String(enrollment.courseId).toUpperCase()}-${completionDate.slice(0,4)}-${crypto.randomUUID()}`, completionDate, issuedAt: null });
  }
  if (certificates.length !== state.certificates.length || textCache === null) save({ ...state, certificates });
}

// Integration point for a future frontend completion source; no manual issuance override.
export function updateCertificateEnrollment(id, updates) {
  const state = getCertificateState();
  if (!state.enrollments.some(e => e.id === id)) throw new Error("Enrollment not found.");
  if (updates.progress !== undefined && (!Number.isFinite(updates.progress) || updates.progress < 0 || updates.progress > 100)) throw new Error("Progress must be between 0 and 100.");
  save({ ...state, enrollments: state.enrollments.map(e => e.id === id ? { ...e, ...updates, id: e.id, studentId: e.studentId, courseId: e.courseId } : e) });
  syncCertificates();
}

export function getCertificateRecords(state = getCertificateState()) {
  const courses = getCourses();
  return state.enrollments.map(enrollment => {
    const course = courses.find(c => String(c.id) === String(enrollment.courseId));
    const certificate = state.certificates.find(c => c.enrollmentId === enrollment.id);
    const eligible = isEligible(enrollment) && !!course;
    return { ...enrollment, courseName: course?.title || "Course unavailable", instructorName: course?.instructor || "Unavailable", authorizedName: state.authorizedName, completionDate: eligible ? certificate?.completionDate : null, certificateId: eligible ? certificate?.certificateId : null, status: eligible && certificate ? certificate.issuedAt ? "Issued" : "Available" : "Locked" };
  });
}

export function markCertificateDownloaded(enrollmentId) {
  const state = getCertificateState();
  if (getCertificateRecords(state).find(r => r.id === enrollmentId)?.status === "Locked") throw new Error("Course completion is required.");
  const certificate = state.certificates.find(c => c.enrollmentId === enrollmentId);
  if (!certificate) throw new Error("Certificate not available.");
  save({ ...state, certificates: state.certificates.map(c => c === certificate ? { ...c, issuedAt: c.issuedAt || new Date().toISOString() } : c) });
}

export function saveCertificateTemplate(template) { save({ ...getCertificateState(), template }); }

export function subscribeCertificates(listener) {
  listeners.add(listener);
  const onStorage = event => { if (event.key === CERTIFICATE_KEY || event.key === null) listener(); };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}

export async function readCertificateTemplate(file) {
  if (!file || !["image/png", "image/jpeg"].includes(file.type)) throw new Error("Choose a PNG or JPG/JPEG image.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Choose an image smaller than 2 MB for browser storage.");
  const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("The image could not be read.")); reader.readAsDataURL(file); });
  const image = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error("The file is not a readable image.")); img.src = dataUrl; });
  if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > 6000 || image.naturalHeight > 6000) throw new Error("Use a template up to 6000 pixels on each side.");
  const ratio = image.naturalHeight / image.naturalWidth;
  if (ratio < .125 || ratio > 6.25) throw new Error("Use a standard portrait or landscape certificate image.");
  return { name: file.name, dataUrl, width: image.naturalWidth, height: image.naturalHeight, uploadedAt: new Date().toISOString() };
}
