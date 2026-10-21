import { getTeachers } from "./peopleStorage";
import { hasPermission, currentSubAdminId } from "./adminPermissions";
import { batches, enrollments, classes, content, recordings, teachers, students, payments } from "../data/operations";
import { getCourses } from "./courseStorage";
import { liveSignalingUrl } from "./liveSignaling";

export const BATCH_STORAGE_KEY = "learnova_batch_lifecycle";
// Existing frontend demo identities; this does not change the login flow.
export const studentId = "STU-1001";
export const teacherId = "TCH-1001";
const normalizeClassStatus = status => {
  const value = String(status || "").trim().toLowerCase();
  return value === "live" || value === "live now" ? "Live" : value === "completed" ? "Completed" : "Scheduled";
};
const listeners = new Set();
let cachedText;
let cachedState;
let directorySocket;
let directoryRetry;
const publishedClasses = new Map();

function syncLiveDirectory() {
  if (directorySocket?.readyState !== 1) return;
  const state = getBatchState();
  if (window.location.pathname.startsWith("/student")) directorySocket.send(JSON.stringify({ type: "watch-classes", studentId,
    enrollments: state.enrollments.filter(item => item.studentId === studentId && item.approved === true && item.status === "Active")
      .map(item => ({ courseId: item.courseId, batchId: item.batchId })) }));
  if (!window.location.pathname.startsWith("/teacher")) return;
  for (const item of state.classes.filter(item => item.teacherId === teacherId && item.startedAt && ["Live", "Completed"].includes(item.status))) {
    // Publish class discovery only; never transmit payments, credentials or files.
    const entry = Object.fromEntries(["id", "courseId", "course", "batchId", "batch", "teacherId", "teacher", "title", "lectureTitle", "duration", "date", "time", "status", "startedAt", "endedAt", "notification", "notificationRecipients"]
      .filter(key => item[key] !== undefined).map(key => [key, item[key]]));
    entry.activeSharedMaterial = item.activeSharedMaterial || null;
    entry.lectureMaterials = state.materials.filter(material => material.classId === item.id);
    const serialized = JSON.stringify(entry);
    if (publishedClasses.get(item.id) === serialized) continue;
    directorySocket.send(JSON.stringify({ type: "publish-class", entry }));
    publishedClasses.set(item.id, serialized);
  }
}

function connectLiveDirectory() {
  if (directorySocket || typeof WebSocket === "undefined" || !window.location) return;
  const socket = new WebSocket(liveSignalingUrl());
  directorySocket = socket;
  socket.onopen = () => { publishedClasses.clear(); syncLiveDirectory(); };
  socket.onmessage = event => {
    try {
      const data = JSON.parse(event.data);
      if (data.type !== "class-update" || !window.location.pathname.startsWith("/student")) return;
      const { lectureMaterials = [], ...item } = data.entry || {};
      const state = getBatchState();
      if (!item?.notificationRecipients?.includes(studentId) || !canJoinClass(studentId, { ...item, status: "Live" }, state)) return;
      const existing = state.classes.find(row => row.id === item.id);
      // Read markers and participant data belong to this browser, not discovery.
      const updated = { ...existing, ...item,
        notificationRecipients: [...new Set([...(existing?.notificationRecipients || []), ...item.notificationRecipients])],
        notificationReadBy: existing?.notificationReadBy || [] };
      const received = lectureMaterials.filter(material => material && material.classId === item.id && String(material.courseId) === String(item.courseId) && String(material.batchId) === String(item.batchId));
      const receivedById = new Map(received.map(material => [material.id, material]));
      const materials = state.materials.map(material => receivedById.get(material.id) || material);
      materials.push(...received.filter(material => !state.materials.some(existing => existing.id === material.id)));
      if (JSON.stringify(existing) === JSON.stringify(updated) && JSON.stringify(materials) === JSON.stringify(state.materials)) return;
      save({ ...state, materials, classes: existing ? state.classes.map(row => row.id === item.id ? updated : row) : [...state.classes, updated] }, false);
    } catch { /* Malformed discovery messages must not change local state. */ }
  };
  socket.onclose = () => {
    if (directorySocket !== socket) return;
    directorySocket = undefined;
    if (listeners.size) directoryRetry = window.setTimeout(connectLiveDirectory, 2000);
  };
  socket.onerror = () => socket.close();
}
const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");

function initialState() {
  const catalog = getCourses();
  const courseId = title => catalog.find(course => course.title === title)?.id ?? slug(title);
  const activeCourses = new Set();
  const batchRows = batches.map(batch => {
    const normalizedStatus = batch.status === "Active" && activeCourses.has(courseId(batch.course)) ? "Completed" : batch.status;
    if (normalizedStatus === "Active") activeCourses.add(courseId(batch.course));
    return {
      ...batch, id: slug(`${batch.course}-${batch.name}`), courseId: courseId(batch.course),
      teacherId: teachers.find(teacher => teacher.name === batch.teacher)?.id,
      status: normalizedStatus,
      approvedBy: normalizedStatus === "Active" ? "Super Admin" : null,
    };
  });
  const associate = item => {
    const batch = batchRows.find(batch => batch.course === item.course && batch.name === item.batch);
    return { ...item, courseId: courseId(item.course), batchId: batch?.id ?? null, teacherId: batch?.teacherId ?? null };
  };
  return {
    batches: batchRows,
    enrollments: enrollments.map((item, index) => ({ ...associate(item), id: `enrollment-${index + 1}`, approved: item.payment === "Paid" && ["Active", "Completed"].includes(item.status) })),
    classes: classes.map((item, index) => ({ ...associate(item), id: `live-${index + 1}` })),
    materials: [...content.map(item => ({ ...item, type: item.type || "Material" })), ...recordings.map(item => ({ ...item, type: "Recording / Notes" }))].map((item, index) => ({ ...associate(item), id: `material-${index + 1}` })),
    payments: payments.map(item => ({ ...item, courseId: courseId(item.course), courseTitle: item.course, studentName: item.student, paymentMethod: item.method, submittedAt: item.date })),
    notifications: [],
  };
}

function lightweightMaterial(material) {
  if (!material || typeof material !== "object") return material;
  const clean = { ...material };
  delete clean.fileData;
  delete clean.data;
  delete clean.content;
  delete clean.blob;
  delete clean.previewUrl;
  if (Array.isArray(clean.materials)) {
    clean.materials = clean.materials.map(lightweightMaterial);
  }
  for (const key of Object.keys(clean)) {
    if (key === "notes") continue;
    if (typeof clean[key] === "string" && (clean[key].startsWith("data:") || clean[key].startsWith("blob:") || clean[key].length > 1000)) {
      delete clean[key];
    }
  }
  return clean;
}

function sanitizeState(state) {
  const materials = (state.materials || []).map(lightweightMaterial);
  const materialById = new Map(materials.map(item => [item.id, item]));
  const classes = [];
  const duplicateIdMap = new Map();

  for (const item of state.classes || []) {
    let isDuplicate = false;

    if (item.status === "Live") {
      const itemTitle = String(item.lectureTitle || item.title || "").trim().toLowerCase();
      const itemTeacher = String(item.teacherId || item.teacher || "").trim();
      const itemCourse = String(item.courseId || item.course || item.courseTitle || "").trim();
      const itemBatch = String(item.batchId || item.batch || item.batchName || "").trim();
      const itemTime = new Date(item.actualStartTime || item.startedAt || item.createdAt || 0).getTime();

      const existing = classes.find(entry => {
        if (entry.status !== "Live") return false;
        const entryTeacher = String(entry.teacherId || entry.teacher || "").trim();
        const entryCourse = String(entry.courseId || entry.course || entry.courseTitle || "").trim();
        const entryBatch = String(entry.batchId || entry.batch || entry.batchName || "").trim();
        const entryTitle = String(entry.lectureTitle || entry.title || "").trim().toLowerCase();
        if (entryTeacher !== itemTeacher || entryCourse !== itemCourse || entryBatch !== itemBatch || entryTitle !== itemTitle) {
          return false;
        }
        const entryTime = new Date(entry.actualStartTime || entry.startedAt || entry.createdAt || 0).getTime();
        if (itemTime > 0 && entryTime > 0 && Math.abs(entryTime - itemTime) <= 60_000) {
          return true;
        }
        return entry.date === item.date && entry.time === item.time;
      });

      if (existing) {
        isDuplicate = true;
        duplicateIdMap.set(item.id, existing.id);
        existing.materialIds = [...new Set([...(existing.materialIds || []), ...(item.materialIds || [])])];
      }
    }

    if (!isDuplicate) {
      classes.push({
        ...item,
        materials: undefined,
        materialIds: (item.materialIds || []).filter(id => materialById.has(id)),
      });
    }
  }

  let updatedMaterials = materials;
  if (duplicateIdMap.size > 0) {
    updatedMaterials = materials.map(mat => {
      if (duplicateIdMap.has(mat.classId)) {
        return { ...mat, classId: duplicateIdMap.get(mat.classId) };
      }
      return mat;
    });
  }

  const notifications = (state.notifications || []).map(notif => {
    if (duplicateIdMap.has(notif.classId)) {
      return { ...notif, classId: duplicateIdMap.get(notif.classId) };
    }
    return notif;
  });

  return {
    ...state,
    classes,
    materials: updatedMaterials,
    notifications,
  };
}

export function getBatchState() {
  let text = null;
  try { text = localStorage.getItem(BATCH_STORAGE_KEY); } catch { /* In-memory fallback. */ }
  if (cachedState && text === cachedText) return cachedState;
  try {
    if (text === null) {
      const initial = initialState();
      const initialText = JSON.stringify(initial);
      try {
        localStorage.setItem(BATCH_STORAGE_KEY, initialText);
        text = initialText;
      } catch { /* The in-memory initial state remains usable. */ }
      cachedState = initial;
      cachedText = text ?? "__initial__";
      return cachedState;
    }
    const saved = JSON.parse(text);
    if (!["batches", "enrollments", "classes", "materials"].every(key => Array.isArray(saved?.[key]))) throw new Error();
    const sanitized = sanitizeState({
      ...saved,
      payments: Array.isArray(saved.payments) ? saved.payments : payments.map(item => ({
        ...item, courseId: getCourses().find(course => course.title === item.course)?.id,
        courseTitle: item.course, studentName: item.student, paymentMethod: item.method, submittedAt: item.date,
      })),
      notifications: Array.isArray(saved.notifications) ? saved.notifications : [],
    });
    const sanitizedText = JSON.stringify(sanitized);
    if (text !== sanitizedText) {
      try {
        localStorage.setItem(BATCH_STORAGE_KEY, sanitizedText);
        text = sanitizedText;
      } catch { /* The in-memory sanitized state remains usable. */ }
    }
    cachedState = sanitized;
    cachedText = text;
  } catch {
    if (!cachedState) {
      cachedState = initialState();
    }
    cachedText = text;
  }
  return cachedState;
}

function save(state, publish = true) {
  const previousState = cachedState;
  const previousText = cachedText;
  let text;
  try {
    text = JSON.stringify(state);
    localStorage.setItem(BATCH_STORAGE_KEY, text);
  } catch (error) {
    cachedState = previousState;
    cachedText = previousText;
    if (error?.name === "QuotaExceededError" || error?.code === 22 || error?.name === "NS_ERROR_DOM_QUOTA_REACHED" || error?.code === 1014) {
      throw new Error("Live class could not be saved. Browser storage is full.");
    }
    throw new Error("Live class could not be saved. Browser storage is full.");
  }
  cachedState = state;
  cachedText = text;
  listeners.forEach(listener => listener());
  if (publish) syncLiveDirectory();
}

export function subscribeBatches(listener) {
  listeners.add(listener);
  connectLiveDirectory();
  syncLiveDirectory();
  const changed = event => { if (event.key === BATCH_STORAGE_KEY || event.key === null) { listener(); syncLiveDirectory(); } };
  window.addEventListener("storage", changed);
  return () => {
    listeners.delete(listener); window.removeEventListener("storage", changed);
    if (!listeners.size) {
      window.clearTimeout(directoryRetry);
      const socket = directorySocket;
      directorySocket = undefined;
      socket?.close();
    }
  };
}

export function activateBatch(id, role) {
  if (role !== "admin") throw new Error("Only Super Admin can activate a batch.");
  const state = getBatchState();
  const selected = state.batches.find(batch => batch.id === id);
  if (selected?.status !== "Upcoming") throw new Error("Choose an upcoming batch.");
  const next = state.batches.map(batch => batch.id === id ? { ...batch, status: "Active", approvedBy: "Super Admin" } : batch.courseId === selected.courseId && batch.status === "Active" ? { ...batch, status: "Completed" } : batch);
  save({ ...state, batches: next, classes: state.classes.map(item => item.status === "Live" && next.some(batch => batch.id === item.batchId && batch.status === "Completed") ? { ...item, status: "Completed" } : item) });
}

export function assignBatch(enrollmentId, batchId, approved, role) {
  if (role !== "admin") throw new Error("Only Super Admin can approve batch assignments.");
  const state = getBatchState();
  const enrollment = state.enrollments.find(item => item.id === enrollmentId);
  const batch = state.batches.find(item => item.id === batchId);
  if (!enrollment || !batch || enrollment.courseId !== batch.courseId || batch.status === "Completed") throw new Error("Choose an active or upcoming batch for this course.");
  const history = enrollment.approved && enrollment.batchId && enrollment.batchId !== batchId
    ? [{ ...enrollment, id: crypto.randomUUID(), status: "Completed" }] : [];
  save({ ...state, enrollments: [...state.enrollments.map(item => item.id === enrollmentId ? {
    ...item, batchId, batch: batch.name, approved, status: approved ? "Active" : "Pending",
    enrollmentStatus: approved ? "Active" : "Pending",
  } : item), ...history] });
}

export function classStatus(item, state) {
  const batch = state.batches.find(batch => batch.id === item.batchId);
  return batch?.status === "Completed" ? "Completed" : normalizeClassStatus(item.status);
}

export function canJoinClass(id, item, state = getBatchState()) {
  if (!item?.courseId || !item?.batchId) return false;
  const batch = state.batches.find(batch => String(batch.id) === String(item.batchId) && String(batch.courseId) === String(item.courseId));
  return !!batch && batch.status === "Active" && !!batch.approvedBy && ["Scheduled", "Live"].includes(item.status)
    && state.enrollments.some(enrollment => enrollment.studentId === id && String(enrollment.courseId) === String(item.courseId) && String(enrollment.batchId) === String(item.batchId) && enrollment.approved === true && enrollment.status === "Active");
}

export function studentClasses(state, id = studentId) {
  return state.classes.filter(item => canJoinClass(id, item, state)).sort((first, second) => {
    const liveOrder = Number(second.status === "Live") - Number(first.status === "Live");
    if (liveOrder) return liveOrder;
    if (first.status === "Live") return (Date.parse(second.startedAt || "") || 0) - (Date.parse(first.startedAt || "") || 0);
    return 0;
  });
}

export function teacherCourses(catalog, id = teacherId) {
  if (!Array.isArray(catalog)) return [];
  const name = getTeachers().find(teacher => teacher.id === id)?.name;
  const currentBatches = getBatchState()?.batches;
  const batchesList = Array.isArray(currentBatches) ? currentBatches : [];
  return catalog.filter(course => course && (batchesList.some(b => b?.teacherId === id && b?.courseId === course.id) || (course.instructorId ? course.instructorId === id : !!name && course.instructor === name)));
}

export function teacherStudents(state, id = teacherId) {
  const assigned = teacherBatches(state, id);
  const enrollmentsList = Array.isArray(state?.enrollments) ? state.enrollments : [];
  return enrollmentsList.filter(item => item?.approved === true && ["Active", "Completed"].includes(item?.status)
    && assigned.some(batch => batch?.id === item.batchId && batch?.courseId === item.courseId))
    .map(item => {
      const student = students.find(student => student.id === item.studentId);
      return { ...item, name: item.student || student?.name || item.studentId, email: student?.email || "",
        progress: Number(item.progress ?? (student && student.course === item.course && student.batch === item.batch ? student.progress : 0)) || 0 };
    });
}

export function teacherBatches(state, id = teacherId) {
  const catalog = getCourses();
  const batchesList = Array.isArray(state?.batches) ? state.batches : [];
  const catalogList = Array.isArray(catalog) ? catalog : [];
  return batchesList.filter(batch => batch?.teacherId === id && catalogList.some(course => course?.id === batch.courseId));
}

export function teacherClasses(state, id = teacherId) {
  const assigned = teacherBatches(state, id);
  const classesList = Array.isArray(state?.classes) ? state.classes : [];
  return classesList.filter(item => item?.teacherId === id && assigned.some(batch => batch?.id === item.batchId && batch?.courseId === item.courseId));
}

export function startClass(id, assignedTeacher = teacherId) {
  const state = getBatchState();
  const selected = state.classes.find(item => item.id === id);
  if (!teacherClasses(state, assignedTeacher).some(item => item.id === id && classStatus(item, state) === "Scheduled")) throw new Error("This scheduled class is not assigned to you.");
  const actualStartTime = new Date().toISOString();
  const recipients = [...new Set(state.enrollments.filter(item => canJoinClass(item.studentId, selected, state)).map(item => item.studentId))];
  const notification = {
    id: `live-class-${id}`, classId: id, course: selected.course, batch: selected.batch,
    lectureTitle: selected.lectureTitle || selected.title, timestamp: actualStartTime,
    type: "live-class", read: false, message: "Your live lecture has started",
  };
  const monitoringNotification = {
    id: `live-class-monitor-${id}`, classId: id, audience: ["admin", "subadmin"],
    type: "live-class-monitoring", title: `Teacher ${selected.teacher} started a live class`,
    message: `${selected.course} | ${selected.batch} | ${selected.lectureTitle || selected.title}`,
    course: selected.course, batch: selected.batch, teacher: selected.teacher,
    lectureTitle: selected.lectureTitle || selected.title, timestamp: actualStartTime,
    read: false,
  };
  const updated = { ...selected, status: "Live", actualStartTime, startedAt: actualStartTime,
    teacherId: selected.teacherId, courseId: selected.courseId, batchId: selected.batchId,
    lectureTitle: selected.lectureTitle || selected.title, notification, notificationRecipients: recipients, notificationReadBy: [] };
  save({ ...state, classes: state.classes.map(item => item.id === id ? {
    ...item, status: "Live", actualStartTime, startedAt: actualStartTime,
    teacherId: item.teacherId, courseId: item.courseId, batchId: item.batchId,
    lectureTitle: item.lectureTitle || item.title, notification, notificationRecipients: recipients, notificationReadBy: [],
  } : item), notifications: [...state.notifications.filter(item => item.id !== monitoringNotification.id), monitoringNotification] });
  return updated;
}

export function startManualClass(form, assignedTeacher = teacherId, file = null) {
  const state = getBatchState();
  const catalog = getCourses();
  const course = catalog.find(item => String(item.id) === String(form.courseId));
  const batch = teacherBatches(state, assignedTeacher).find(item =>
    String(item.id) === String(form.batchId) &&
    String(item.courseId) === String(form.courseId) &&
    item.status === "Active" &&
    item.approvedBy
  );
  const teacher = getTeachers().find(item => item.id === assignedTeacher && item.status === "Active");
  const lectureTitle = String(form.lectureTitle || "").trim();
  const duration = String(form.duration || "").trim();
  if (!course || !teacher) throw new Error("The selected course or teacher is no longer available.");
  if (!batch) throw new Error("Choose an active batch assigned to you for this course.");
  if (!lectureTitle) throw new Error("Enter a lecture title.");
  if (!duration) throw new Error("Enter the class duration.");

  // Idempotency guard for rapid duplicate calls
  const recentDuplicate = state.classes.find(item =>
    item.status === "Live" &&
    String(item.teacherId) === String(assignedTeacher) &&
    String(item.courseId) === String(course.id) &&
    String(item.batchId) === String(batch.id) &&
    String(item.lectureTitle || item.title || "").trim().toLowerCase() === lectureTitle.toLowerCase() &&
    Math.abs(Date.now() - new Date(item.createdAt || item.startedAt || 0).getTime()) <= 15_000
  );
  if (recentDuplicate) {
    return recentDuplicate;
  }

  const id = `live-${crypto.randomUUID()}`;
  const actualStartTime = new Date().toISOString();
  const date = new Date(actualStartTime).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const time = new Date(actualStartTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const material = file ? {
    id: `material-${crypto.randomUUID()}`,
    classId: id,
    title: file.name,
    name: file.name,
    fileName: file.name,
    lecture: lectureTitle,
    course: course.title,
    courseId: course.id,
    batch: batch.name,
    batchId: batch.id,
    teacher: teacher.name,
    teacherId: assignedTeacher,
    type: "Lecture Material",
    fileType: file.type || "application/octet-stream",
    size: Number(file.size) || 0,
    fileSize: Number(file.size) || 0,
    notes: "",
    date,
    duration,
    status: "Available",
    uploadedAt: actualStartTime,
    createdAt: actualStartTime,
  } : null;

  const recipients = [...new Set(state.enrollments
    .filter(item => canJoinClass(item.studentId, { courseId: course.id, batchId: batch.id, status: "Live" }, state))
    .map(item => item.studentId))];

  const notification = {
    id: `live-class-${id}`, classId: id, course: course.title, batch: batch.name,
    lectureTitle, teacher: teacher.name, timestamp: actualStartTime,
    type: "live-class", read: false, message: "Your live lecture has started",
  };

  const monitoringNotification = {
    id: `live-class-monitor-${id}`, classId: id, audience: ["admin", "subadmin"],
    type: "live-class-monitoring", title: `Teacher ${teacher.name} started a live class`,
    message: `${course.title} | ${batch.name} | ${lectureTitle}`,
    course: course.title, batch: batch.name, teacher: teacher.name,
    lectureTitle, timestamp: actualStartTime, read: false,
  };

  const created = {
    id, courseId: course.id, course: course.title, courseTitle: course.title,
    batchId: batch.id, batch: batch.name, batchName: batch.name,
    teacherId: assignedTeacher, teacher: teacher.name, teacherName: teacher.name,
    title: lectureTitle, lectureTitle, duration, date, time,
    status: "Live", actualStartTime, startedAt: actualStartTime,
    createdAt: actualStartTime, createdBy: "Teacher", source: "ManualTeacherStart",
    materialIds: material ? [material.id] : [],
    notification, notificationRecipients: recipients, notificationReadBy: [],
    participants: [], chat: [], screenShareRequests: [],
  };

  save({
    ...state,
    classes: [...state.classes, created],
    materials: material ? [...state.materials, material] : state.materials,
    notifications: [...state.notifications.filter(item => item.id !== notification.id && item.id !== monitoringNotification.id), notification, monitoringNotification],
  });

  const verifiedState = getBatchState();
  const confirmed = verifiedState.classes.find(item => item.id === id);
  if (!confirmed || confirmed.status !== "Live") {
    throw new Error("Live class could not be saved. Browser storage is full.");
  }

  return confirmed;
}

export function endClass(id, assignedTeacher = teacherId) {
  const state = getBatchState();
  const selected = state.classes.find(item => item.id === id);
  if (!selected || selected.teacherId !== assignedTeacher || selected.status !== "Live") throw new Error("This live class is not available to end.");
  const endedAt = new Date().toISOString();
  const start = selected.startedAt ? new Date(selected.startedAt) : new Date(endedAt);
  const minutes = Math.max(1, Math.round((new Date(endedAt) - start) / 60000));
  const calculatedDuration = minutes >= 60 ? `${Math.floor(minutes / 60)} Hour${Math.floor(minutes / 60) === 1 ? "" : "s"}${minutes % 60 ? ` ${minutes % 60} Minutes` : ""}` : `${minutes} Minutes`;
  const classMaterials = state.materials.filter(item => item.classId === selected.id);
  const recording = {
    id: `recording-${selected.id}`, classId: selected.id, courseId: selected.courseId, courseTitle: selected.course,
    course: selected.course, batchId: selected.batchId, batchName: selected.batch, batch: selected.batch,
    teacherId: selected.teacherId, teacherName: selected.teacher, teacher: selected.teacher,
    lectureTitle: selected.lectureTitle || selected.title, title: selected.lectureTitle || selected.title,
    lecture: selected.lectureTitle || selected.title, date: selected.date,
    actualStartTime: selected.actualStartTime || selected.startedAt, startTime: selected.actualStartTime || selected.startedAt,
    actualEndTime: endedAt, endTime: endedAt, duration: calculatedDuration, calculatedDuration,
    materials: classMaterials, notes: selected.notes || "", recordingStatus: "Saved",
    type: "Recording / Notes", status: "Available", createdAt: selected.createdAt || endedAt,
  };
  save({
    ...state,
    classes: state.classes.map(item => item.id === id ? {
      ...item, status: "Completed", actualEndTime: endedAt, endedAt, calculatedDuration, duration: calculatedDuration,
    } : item),
    materials: [...state.materials.filter(item => item.id !== recording.id), recording],
  });
}

export async function uploadLectureMaterial(classId, file, notes = "", assignedTeacher = teacherId) {
  const state = getBatchState();
  const selected = state.classes.find(item => item.id === classId);
  if (!selected || selected.teacherId !== assignedTeacher || selected.status !== "Live") throw new Error("This live class is not available.");
  if (!(file instanceof File) || !file.size) throw new Error("Choose a lecture material file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Material files must be 10 MB or smaller.");
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/live-materials", { method: "POST", body: form });
  const uploaded = await response.json();
  if (!response.ok || !uploaded.fileUrl) throw new Error(uploaded.error || "Lecture material could not be uploaded.");
  const latest = getBatchState();
  if (!latest.classes.some(item => item.id === classId && item.status === "Live" && item.teacherId === assignedTeacher)) throw new Error("The class ended before this upload completed.");
  const material = {
    id: `material-${crypto.randomUUID()}`, classId: selected.id, title: file.name,
    lecture: selected.lectureTitle || selected.title, course: selected.course, courseId: selected.courseId,
    batch: selected.batch, batchId: selected.batchId, teacher: selected.teacher, teacherId: selected.teacherId,
    type: "Lecture Material", fileName: file.name, fileType: file.type || "application/octet-stream",
    fileSize: file.size, fileUrl: uploaded.fileUrl, notes: String(notes).trim(), date: selected.date,
    duration: selected.duration, status: "Available", createdAt: new Date().toISOString(),
  };
  save({
    ...latest,
    materials: [...latest.materials, material],
    classes: latest.classes.map(item => item.id === classId ? {
      ...item, materialIds: [...new Set([...(item.materialIds || []), material.id])],
      materials: undefined,
    } : item),
  });
  return material;
}

export function shareLectureMaterial(classId, materialId, assignedTeacher = teacherId) {
  const state = getBatchState();
  const selected = state.classes.find(item => item.id === classId);
  const material = state.materials.find(item => item.id === materialId && item.classId === classId);
  if (!selected || selected.teacherId !== assignedTeacher || selected.status !== "Live" || !material) throw new Error("This lecture material is not available to share.");
  const activeSharedMaterial = {
    materialId: material.id, name: material.fileName || material.title,
    type: material.fileType || material.type, sharedAt: new Date().toISOString(),
    sharedBy: selected.teacherId,
  };
  save({ ...state, classes: state.classes.map(item => item.id === classId ? { ...item, activeSharedMaterial } : item) });
}

export function stopSharingLectureMaterial(classId, assignedTeacher = teacherId) {
  const state = getBatchState();
  const selected = state.classes.find(item => item.id === classId);
  if (!selected || selected.teacherId !== assignedTeacher || selected.status !== "Live") throw new Error("This live class is not available.");
  save({ ...state, classes: state.classes.map(item => item.id === classId ? { ...item, activeSharedMaterial: null } : item) });
}

export function joinClass(id, assignedStudent = studentId) {
  const state = getBatchState();
  const item = state.classes.find(item => item.id === id);
  if (!item || item.status !== "Live" || !canJoinClass(assignedStudent, item, state)) throw new Error("This class is no longer available for your batch.");
  return item;
}

export function scheduleManagedClass(form, role) {
  if (!hasPermission(role, currentSubAdminId, "liveClasses")) throw new Error("Live class scheduling is not allowed.");
  const state = getBatchState();
  const course = getCourses().find(item => String(item.id) === String(form.courseId));
  const batch = state.batches.find(item => String(item.id) === String(form.batchId) && String(item.courseId) === String(form.courseId) && item.status === "Active" && item.approvedBy);
  const teacher = teachers.find(item => String(item.id) === String(form.teacherId) && item.status === "Active");
  if (!course || !batch || !teacher || String(batch.teacherId) !== String(teacher.id) || !form.lectureTitle?.trim() || !form.date || !form.time || !form.duration?.trim()) throw new Error("Choose a matching active batch, assigned teacher, lecture title, date, time and duration.");
  const item = {
    id: crypto.randomUUID(), courseId: course.id, courseTitle: course.title, course: course.title,
    batchId: batch.id, batchName: batch.name, batch: batch.name, teacherId: teacher.id, teacherName: teacher.name,
    teacher: teacher.name, lectureTitle: form.lectureTitle.trim(), title: form.lectureTitle.trim(),
    date: form.date, time: form.time, duration: form.duration.trim(), status: "Scheduled", createdAt: new Date().toISOString(), students: batch.students,
  };
  save({ ...state, classes: [...state.classes, item] });
}

export function requestScreenShare(classId, student = studentId) {
  const state = getBatchState();
  const item = state.classes.find(entry => entry.id === classId);
  if (!item || !canJoinClass(student, item, state)) throw new Error("You cannot request screen sharing for this class.");
  save({ ...state, classes: state.classes.map(entry => entry.id === classId ? { ...entry, screenShareRequests: [...new Set([...(entry.screenShareRequests || []), student])] } : entry) });
}

export function resolveScreenShare(classId, student, approved, assignedTeacher = teacherId) {
  const state = getBatchState();
  const item = state.classes.find(entry => entry.id === classId);
  if (!item || item.teacherId !== assignedTeacher || item.status !== "Live") throw new Error("This class is not available.");
  save({ ...state, classes: state.classes.map(entry => entry.id === classId ? {
    ...entry,
    screenShareRequests: (entry.screenShareRequests || []).filter(id => id !== student),
    screenShareApproved: approved ? [...new Set([...(entry.screenShareApproved || []), student])] : (entry.screenShareApproved || []).filter(id => id !== student),
    participants: (entry.participants || []).map(participant => participant.id === student ? { ...participant, screenShare: approved } : participant),
  } : entry) });
}

export function joinLiveSession(classId, participantId, participantName, role) {
  const state = getBatchState();
  const selected = state.classes.find(item => item.id === classId);
  if (!selected || selected.status !== "Live") throw new Error("This live class is no longer active.");
  const participant = { id: participantId, name: participantName, role, joinedAt: new Date().toISOString(), leftAt: null, mic: true, camera: true, screenShare: false };
  save({ ...state, classes: state.classes.map(item => item.id === classId ? {
    ...item, participants: [...(item.participants || []).filter(entry => entry.id !== participantId), participant],
  } : item) });
}

export function leaveLiveSession(classId, participantId) {
  const state = getBatchState();
  save({ ...state, classes: state.classes.map(item => item.id === classId ? {
    ...item, participants: (item.participants || []).map(entry => entry.id === participantId ? { ...entry, leftAt: new Date().toISOString(), screenShare: false } : entry),
  } : item) });
}

export function updateLiveParticipant(classId, participantId, updates) {
  const state = getBatchState();
  save({ ...state, classes: state.classes.map(item => item.id === classId ? {
    ...item, participants: (item.participants || []).map(entry => entry.id === participantId ? { ...entry, ...updates } : entry),
  } : item) });
}

export function sendLiveChat(classId, senderId, senderName, senderRole, message) {
  const text = String(message || "").trim();
  if (!text) throw new Error("Enter a chat message.");
  const state = getBatchState();
  const selected = state.classes.find(item => item.id === classId);
  if (!selected) throw new Error("This live class could not be found.");
  const chatMessage = { id: crypto.randomUUID(), classId, senderId, senderName, senderRole, message: text, timestamp: new Date().toISOString() };
  save({ ...state, classes: state.classes.map(item => item.id === classId ? { ...item, chat: [...(item.chat || []), chatMessage] } : item) });
}

export function studentMaterials(state, id = studentId) {
  return state.materials.filter(item => ["Published", "Available"].includes(item.status) && state.batches.some(batch => batch.id === item.batchId && batch.courseId === item.courseId && ["Active", "Completed"].includes(batch.status))
    && state.enrollments.some(enrollment => enrollment.studentId === id && enrollment.courseId === item.courseId && enrollment.batchId === item.batchId && enrollment.approved === true && ["Active", "Completed"].includes(enrollment.status)));
}

export function paymentRecords(state) {
  return state.payments ?? payments;
}

export function approvePayment(transactionId, role) {
  if (!hasPermission(role, currentSubAdminId, "payments")) throw new Error("Payment approval is not allowed.");
  const state = getBatchState();
  const records = paymentRecords(state);
  const payment = records.find(item => item.transactionId === transactionId);
  if (!payment || payment.status !== "Pending") throw new Error("Choose a pending payment.");
  const course = getCourses().find(item => payment.courseId != null ? item.id === payment.courseId : item.title === payment.course);
  if (!course || !payment.studentId) throw new Error("This payment needs a valid student and course.");
  const batch = state.batches.find(item => item.courseId === course.id && (payment.batchId ? item.id === payment.batchId : item.name === payment.batch));
  const existing = state.enrollments.find(item => item.studentId === payment.studentId && item.courseId === course.id && (batch ? item.batchId === batch.id : !item.batchId));
  const approved = !!batch;
  const enrollment = { ...existing, id: existing?.id ?? `enrollment-${payment.id || transactionId}`,
    student: payment.studentName || payment.student, studentId: payment.studentId, course: course.title, courseId: course.id,
    batchId: batch?.id ?? null, batch: batch?.name ?? "Awaiting assignment", paymentId: payment.id || transactionId,
    payment: "Paid", paymentStatus: "Verified", approved, status: existing?.status === "Completed" ? "Completed" : approved ? "Active" : "Pending",
    enrollmentStatus: existing?.status === "Completed" ? "Completed" : approved ? "Active" : "Pending",
    enrollmentDate: existing?.enrollmentDate ?? new Date().toISOString() };
  const notification = { id: `enrollment-approved-${payment.id || transactionId}`, studentId: payment.studentId, type: "enrollment", title: "Your enrollment has been approved", message: approved ? `Your enrollment in ${course.title} is now active.` : `Your payment for ${course.title} was verified. A batch assignment is still required.` };
  save({ ...state, payments: records.map(item => item.transactionId === transactionId ? { ...item, status: "Approved", paymentStatus: "Verified", verifiedAt: new Date().toISOString() } : item),
    enrollments: existing ? state.enrollments.map(item => item.id === existing.id ? enrollment : item) : [...state.enrollments, enrollment],
    notifications: [...state.notifications.filter(item => item.id !== notification.id), notification] });
}

export function studentLiveNotifications(state, id = studentId) {
  const live = state.classes.filter(item => item.startedAt && item.notificationRecipients?.includes(id)).map(item => ({
    ...(item.notification || {}),
    id: item.notification?.id || `live-class-${item.id}`, classId: item.id,
    title: "Your live lecture has started",
    message: `${item.title} - ${item.course}, ${item.batch}. Your teacher has started the lecture.`,
    time: new Date(item.startedAt).toLocaleString(), type: "live-class",
    unread: !item.notificationReadBy?.includes(id),
    live: item.status === "Live" && canJoinClass(id, item, state),
  }));
  const general = (state.notifications || []).filter(item => item.studentId === id).map(item => ({
    ...item, time: new Date(item.timestamp || Date.now()).toLocaleString(),
    unread: item.read !== true, live: false,
  }));
  return [...general, ...live];
}
export function readLiveNotifications(id = studentId) {
  const state = getBatchState();
  save({
    ...state,
    notifications: (state.notifications || []).map(item => item.studentId === id ? { ...item, read: true } : item),
    classes: state.classes.map(item => item.notificationRecipients?.includes(id)
      ? { ...item, notificationReadBy: [...new Set([...(item.notificationReadBy || []), id])] } : item),
  });
}

function normalizeReceivingAccount(account, index = 0) {
 const createdAt = account.createdAt || new Date().toISOString();
 return {
   ...account,
   id: account.id || `legacy-account-${index + 1}`,
   accountHolderName: account.accountHolderName || account.owner || "",
   providerName: account.providerName || account.provider || "",
   accountNumber: account.accountNumber || account.number || "",
   paymentMethod: account.paymentMethod || account.method || "",
   status: account.status || "Active",
   createdAt,
   updatedAt: account.updatedAt || createdAt,
   owner: account.accountHolderName || account.owner || "",
   provider: account.providerName || account.provider || "",
   number: account.accountNumber || account.number || "",
   method: account.paymentMethod || account.method || "",
 };
}
export function receivingAccounts(state, activeOnly = false) {
 const accounts = (Array.isArray(state.receivingAccounts) ? state.receivingAccounts : state.receivingAccount ? [state.receivingAccount] : [])
   .map(normalizeReceivingAccount);
 return activeOnly ? accounts.filter(account => account.status === "Active") : accounts;
}
export function saveReceivingAccount(account, role) {
 if(!hasPermission(role,currentSubAdminId,"payments")) throw new Error("Payment management permission is required to change the receiving account.");
 const now = new Date().toISOString();
 const clean = normalizeReceivingAccount({
   ...account,
   accountHolderName: String(account.accountHolderName || account.owner || "").trim(),
   accountNumber: String(account.accountNumber || account.number || "").trim(),
   providerName: String(account.providerName || account.provider || "").trim(),
   paymentMethod: String(account.paymentMethod || account.method || "").trim(),
   status: account.status || "Active",
   createdAt: account.createdAt || now,
   updatedAt: now,
 });
 if([clean.accountHolderName, clean.accountNumber, clean.providerName, clean.paymentMethod].some(value=>!value)) throw new Error("Complete all account details.");
 if(!["Active","Inactive"].includes(clean.status)) throw new Error("Choose a valid account status.");
 const state=getBatchState(), accounts=receivingAccounts(state);
 if(account.id && !accounts.some(item=>item.id===account.id)) throw new Error("Account no longer exists.");
 if(accounts.some(item=>item.id!==account.id && item.accountNumber.replace(/\s/g, "").toLowerCase()===clean.accountNumber.replace(/\s/g, "").toLowerCase() && item.providerName.toLowerCase()===clean.providerName.toLowerCase())) throw new Error("This account is already saved.");
 const added={...clean,id:account.id || crypto.randomUUID()};
 const updated=account.id ? accounts.map(item=>item.id===account.id ? added : item) : [...accounts,added];
 save({...state,receivingAccounts:updated,receivingAccount:updated[0] || null});
}
export function deleteReceivingAccount(id, role) {
 if(!hasPermission(role,currentSubAdminId,"payments")) throw new Error("Payment management permission is required.");
 const state=getBatchState(), updated=receivingAccounts(state).filter(account=>account.id!==id);
 save({...state,receivingAccounts:updated,receivingAccount:updated[0] || null});
}
export function setReceivingAccountStatus(id, status, role) {
 if(!hasPermission(role,currentSubAdminId,"payments")) throw new Error("Payment management permission is required.");
 if(!["Active","Inactive"].includes(status)) throw new Error("Choose a valid account status.");
 const state=getBatchState(), now=new Date().toISOString();
 const updated=receivingAccounts(state).map(account=>account.id===id ? {...account,status,updatedAt:now}:account);
 if(!updated.some(account=>account.id===id)) throw new Error("Account no longer exists.");
 save({...state,receivingAccounts:updated,receivingAccount:updated[0] || null});
}
export function submitPayment(form, name, id=studentId) {
 const state=getBatchState();const course=getCourses().find(item=>String(item.id)===String(form.courseId));
 if(!course || course.status!=="Published" || course.availability==="Unavailable") throw new Error("Choose an available published course.");
 const accounts=receivingAccounts(state, true);
 const receiver=accounts.find(account=>account.id===form.receivingAccountId) || (!form.receivingAccountId && accounts.length===1 ? accounts[0] : null);
 if(!receiver) throw new Error("Select the receiving account used for your payment.");
 const transactionId=String(form.transactionId||"").trim();
 if(!transactionId || !String(form.senderName||"").trim() || !String(form.senderAccount||"").trim() || !Number.isFinite(Number(form.amount)) || Number(form.amount)<=0) throw new Error("Complete the sender, transaction and amount details.");
 if(paymentRecords(state).some(item=>item.transactionId.toLowerCase()===transactionId.toLowerCase())) throw new Error("Transaction ID already submitted.");
 if(paymentRecords(state).some(item=>item.studentId===id && (item.courseId===course.id || item.course===course.title) && ["Pending","Approved"].includes(item.status))) throw new Error("A pending or approved request already exists for this course.");
 if(state.enrollments.some(item=>item.studentId===id && item.courseId===course.id && ["Pending","Active"].includes(item.status))) throw new Error("You already have an active enrollment request for this course.");
 const batch=state.batches.find(item=>item.id===form.batchId && item.courseId===course.id && ["Active","Upcoming"].includes(item.status));
 if(form.batchId && !batch) throw new Error("Choose a valid course batch.");
 const submittedAt = new Date().toISOString();
 const paymentId = `payment-${transactionId}`;
 const payment={id:paymentId,paymentId,transactionId,studentTransactionId:transactionId,studentId:id,student:name,studentName:name,courseId:course.id,course:course.title,courseTitle:course.title,instructor:course.instructor,batchId:batch?.id||null,batch:batch?.name||"Awaiting assignment",senderName:form.senderName.trim(),senderAccount:form.senderAccount.trim(),amount:`PKR ${Number(form.amount)}`,method:receiver.paymentMethod,paymentMethod:receiver.paymentMethod,receivingAccountId:receiver.id,receivingAccountProvider:receiver.providerName,receivingAccountNumber:receiver.accountNumber,receiver:JSON.stringify(receiver),date:new Date().toLocaleDateString(),paymentDate:form.paymentDate || new Date().toISOString().slice(0,10),submittedAt,receipt:form.receipt || null,status:"Pending",paymentStatus:"Pending"};
 const enrollment = state.enrollments.find(item => item.studentId === id && item.courseId === course.id && ["Pending", "Active"].includes(item.status));
 const pendingEnrollment = enrollment || { id:`enrollment-${paymentId}`, student:name, studentId:id, course:course.title, courseId:course.id, batchId:batch?.id || null, batch:batch?.name || "Awaiting assignment", paymentId, enrollmentDate:submittedAt, paymentStatus:"Pending", enrollmentStatus:"Pending", payment:"Pending", approved:false, status:"Pending" };
 const notification = { id:`payment-submitted-${paymentId}`, studentId:id, type:"payment", title:"Payment submitted for verification", message:`Your payment for ${course.title} was submitted for verification.`, timestamp:submittedAt, read:false };
 save({...state,payments:[...paymentRecords(state),payment], enrollments:enrollment ? state.enrollments : [...state.enrollments,pendingEnrollment], notifications:[...state.notifications.filter(item => item.id !== notification.id),notification]});
}
export function rejectPayment(transactionId, role) {
 if(!hasPermission(role,currentSubAdminId,"payments")) throw new Error("Payment review is not allowed.");
 const state=getBatchState();const records=paymentRecords(state);
 if(!records.some(item=>item.transactionId===transactionId && item.status==="Pending")) throw new Error("Choose a pending request.");
 const payment = records.find(item => item.transactionId === transactionId);
 const notification = { id:`payment-rejected-${payment?.id || transactionId}`, studentId:payment?.studentId, type:"payment", title:"Your payment/enrollment was rejected", message:`Your payment for ${payment?.courseTitle || payment?.course || "the selected course"} was rejected.`, timestamp:new Date().toISOString(), read:false };
 save({...state,payments:records.map(item=>item.transactionId===transactionId?{...item,status:"Rejected",paymentStatus:"Rejected"}:item), enrollments:state.enrollments.map(item=>item.paymentId === (payment?.id || transactionId) ? {...item, approved:false,status:"Cancelled",enrollmentStatus:"Cancelled",paymentStatus:"Rejected"} : item), notifications:[...state.notifications.filter(item => item.id !== notification.id),notification]});
}

export function createManagedBatch(form, role) {
 if (!hasPermission(role,currentSubAdminId,"batches")) throw new Error("Batch management is not allowed.");
 const state=getBatchState(), course=getCourses().find(c=>String(c.id)===String(form.courseId)), teacher=getTeachers().find(t=>t.id===form.teacherId && t.status==="Active");
 if(!course || !teacher || !form.name?.trim()) throw new Error("Enter a batch name and select a course and active instructor.");
 if(state.batches.some(b=>b.courseId===course.id && b.name.toLowerCase()===form.name.trim().toLowerCase())) throw new Error("Batch name already exists for this course.");
 validateBatchDatesAndMode(form);
 const batch={id:crypto.randomUUID(),name:form.name.trim(),courseId:course.id,course:course.title,teacherId:teacher.id,teacher:teacher.name,status:"Upcoming",students:0,startDate:form.startDate || "",endDate:form.endDate || "",mode:form.mode || "Online"};
 save({...state,batches:[...state.batches,batch]});
 return batch;
}

function validateBatchDatesAndMode(form) {
 if (form.mode && !["Online", "Live Class", "In Person", "Hybrid"].includes(form.mode)) throw new Error("Choose a valid batch mode.");
 for (const key of ["startDate", "endDate"]) {
  if (form[key] && (!/^\d{4}-\d{2}-\d{2}$/.test(form[key]) || !Number.isFinite(Date.parse(form[key])) || new Date(form[key]).toISOString().slice(0,10) !== form[key])) throw new Error("Enter valid batch dates.");
 }
 if (form.startDate && form.endDate && form.endDate < form.startDate) throw new Error("End date must be on or after the start date.");
}

export function updateManagedBatch(id, form, role) {
 if (!hasPermission(role,currentSubAdminId,"batches")) throw new Error("Batch management is not allowed.");
 const state=getBatchState(), existing=state.batches.find(batch=>batch.id===id);
 if (!existing) throw new Error("This batch no longer exists.");
 const course=getCourses().find(item=>String(item.id)===String(form.courseId));
 const teacher=getTeachers().find(item=>item.id===form.teacherId);
 if (!course || !teacher || (teacher.status!=="Active" && teacher.id!==existing.teacherId) || !form.name?.trim()) throw new Error("Enter a batch name and select a course and active instructor.");
 validateBatchDatesAndMode(form);
 if(state.batches.some(batch=>batch.id!==id && batch.courseId===course.id && batch.name.toLowerCase()===form.name.trim().toLowerCase())) throw new Error("Batch name already exists for this course.");
 if(state.classes.some(item=>item.batchId===id && item.status==="Live")) throw new Error("End the live class before editing this batch.");
 const linked=Object.values(state).some(value=>Array.isArray(value)&&value.some(item=>item?.batchId===id));
 if(linked && (course.id!==existing.courseId || teacher.id!==existing.teacherId)) throw new Error("This batch has linked records. Keep its course and instructor to preserve enrollment and class history.");
 const updated={...existing,name:form.name.trim(),courseId:course.id,course:course.title,teacherId:teacher.id,teacher:teacher.name,startDate:form.startDate||"",endDate:form.endDate||"",mode:form.mode||existing.mode||"Online"};
 const next=Object.fromEntries(Object.entries(state).map(([key,value])=>[key,Array.isArray(value)?value.map(item=>item?.batchId===id?{...item,...("batch" in item?{batch:updated.name}:{}),...("batchName" in item?{batchName:updated.name}:{})}:item):value]));
 save({...next,batches:state.batches.map(batch=>batch.id===id?updated:batch)});
 return updated;
}

export function deleteManagedBatch(id, role) {
 if (!hasPermission(role,currentSubAdminId,"batches")) throw new Error("Batch management is not allowed.");
 const state=getBatchState();
 const batch=state.batches.find(item=>item.id===id);
 if(!batch) throw new Error("This batch no longer exists.");
 if(batch.students>0 || Object.values(state).some(value=>Array.isArray(value)&&value.some(item=>item?.batchId===id))) throw new Error("This batch has students or linked records and cannot be deleted. Its enrollment and class history must be preserved.");
 save({...state,batches:state.batches.filter(item=>item.id!==id)});
}
export function placeApprovedEnrollment(id,batchId,role) {
 if(!hasPermission(role,currentSubAdminId,"enrollments")) throw new Error("Enrollment management is not allowed.");
 const state=getBatchState(), enrollment=state.enrollments.find(e=>e.id===id), batch=state.batches.find(b=>b.id===batchId);
 if(!enrollment?.approved || !batch || batch.status==="Completed" || batch.courseId!==enrollment.courseId) throw new Error("Select an upcoming or active batch for this approved course.");
 if(enrollment.batchId && enrollment.batchId!==batchId) throw new Error("Use Super Admin enrollment reassignment to preserve the existing batch history.");
 save({...state,enrollments:state.enrollments.map(e=>e.id===id ? {...e,batchId:batch.id,batch:batch.name,teacherId:batch.teacherId}:e)});
}
