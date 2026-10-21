import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "./test-module-loader.js";

const entries = new Map();
globalThis.localStorage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
globalThis.sessionStorage = { getItem: () => null };
const loader = await createServer();
const batches = await loader.ssrLoadModule("/src/utils/batchStorage.js");
const initial = structuredClone(batches.getBatchState());
const active = initial.batches.find(item => item.teacherId === batches.teacherId && item.status === "Active");
const enrollment = initial.enrollments.find(item => item.studentId === batches.studentId && item.batchId === active.id);
function reset() {
  localStorage.setItem(batches.BATCH_STORAGE_KEY, JSON.stringify(initial));
  return batches.getBatchState();
}

test("manual live start appears for the enrolled course/batch with notification and a joinable room", () => {
  reset();
  const item = batches.startManualClass({ courseId: active.courseId, batchId: active.id, lectureTitle: "Live discovery regression", duration: "1 Hour" });
  const state = batches.getBatchState();
  assert.equal(batches.studentClasses(state).find(row => row.id === item.id)?.status, "Live");
  assert.equal(batches.studentClasses(state)[0].id, item.id, "A newly started lecture appears before old scheduled classes");
  const notice = batches.studentLiveNotifications(state).find(row => row.classId === item.id);
  assert.equal(notice.live, true);
  assert.equal(notice.unread, true);
  assert.equal(batches.joinClass(item.id).id, item.id);
  batches.readLiveNotifications();
  assert.equal(batches.studentLiveNotifications(batches.getBatchState()).find(row => row.classId === item.id).unread, false);
  batches.endClass(item.id);
  assert.throws(() => batches.joinClass(item.id), /no longer available/);
});

test("numeric and string course IDs match; wrong course/batch, pending and unapproved enrollments do not", () => {
  const state = reset();
  const item = { courseId: String(active.courseId), batchId: active.id, status: "Live" };
  assert.equal(batches.canJoinClass(batches.studentId, item, state), true);
  for (const change of [{ courseId: "other-course" }, { batchId: "other-batch" }, { approved: false }, { status: "Pending" }]) {
    const isolated = { ...state, enrollments: [{ ...enrollment, ...change }] };
    assert.equal(batches.canJoinClass(batches.studentId, item, isolated), false, JSON.stringify(change));
  }
  assert.equal(batches.canJoinClass("STU-NOT-ENROLLED", item, state), false);
  assert.equal(batches.canJoinClass(batches.studentId, item, { ...state, batches: [{ ...active, status: "Upcoming" }] }), false);
});

test("scheduled starts notify only eligible students and cannot be joined after the class ends", () => {
  reset();
  const state = batches.getBatchState();
  const scheduled = { id: "scheduled-live-test", teacherId: batches.teacherId, courseId: active.courseId, batchId: active.id,
    title: "Scheduled regression", course: active.course, batch: active.name, status: "Scheduled" };
  localStorage.setItem(batches.BATCH_STORAGE_KEY, JSON.stringify({ ...state, classes: [...state.classes, scheduled], enrollments: [
    { ...enrollment, courseId: String(active.courseId) },
    { ...enrollment, id: "wrong-batch", studentId: "STU-WRONG", batchId: "other-batch" },
    { ...enrollment, id: "pending", studentId: "STU-PENDING", approved: false, status: "Pending" },
  ] }));
  const item = batches.startClass(scheduled.id);
  assert.deepEqual(item.notificationRecipients, [batches.studentId]);
  assert.equal(batches.studentLiveNotifications(batches.getBatchState(), "STU-WRONG").some(row => row.classId === item.id), false);
  assert.equal(batches.joinClass(item.id).status, "Live");
  batches.endClass(item.id);
  assert.equal(batches.studentClasses(batches.getBatchState()).some(row => row.id === item.id), false);
});

test("discovery preserves a shared-browser roster/read state and rejects updates for other batches", () => {
  reset();
  const item = batches.startManualClass({ courseId: active.courseId, batchId: active.id, lectureTitle: "Discovery merge regression", duration: "1 Hour" });
  const state = batches.getBatchState();
  const stored = { ...item, notificationRecipients: [batches.studentId, "STU-SECOND"], notificationReadBy: [batches.studentId], participants: [{ id: "teacher", role: "Teacher" }] };
  const remoteEntry = { id: item.id, courseId: item.courseId, batchId: item.batchId, status: "Live", notificationRecipients: [batches.studentId] };
  localStorage.setItem(batches.BATCH_STORAGE_KEY, JSON.stringify({ ...state, classes: state.classes.map(row => row.id === item.id ? stored : row) }));
  const previousWindow = globalThis.window, previousSocket = globalThis.WebSocket;
  let socket, unsubscribe;
  globalThis.window = Object.assign(new EventTarget(), { location: { pathname: "/student/live-classes", protocol: "http:", hostname: "localhost" }, setTimeout, clearTimeout });
  globalThis.WebSocket = class {
    readyState = 1;
    constructor() { globalThis.WebSocket.current = this; }
    send() {}
    close() {}
  };
  try {
    unsubscribe = batches.subscribeBatches(() => {});
    socket = globalThis.WebSocket.current;
    socket.onmessage({ data: JSON.stringify({ type: "class-update", entry: remoteEntry }) });
    const updated = batches.getBatchState().classes.find(row => row.id === item.id);
    assert.deepEqual(updated.notificationRecipients, [batches.studentId, "STU-SECOND"]);
    assert.deepEqual(updated.notificationReadBy, [batches.studentId]);
    assert.deepEqual(updated.participants, stored.participants);
    socket.onmessage({ data: JSON.stringify({ type: "class-update", entry: { ...remoteEntry, id: "wrong-batch-update", batchId: "other-batch" } }) });
    assert.equal(batches.getBatchState().classes.some(row => row.id === "wrong-batch-update"), false);
    socket.onmessage({ data: JSON.stringify({ type: "class-update", entry: { ...remoteEntry, status: "Completed" } }) });
    assert.throws(() => batches.joinClass(item.id), /no longer available/);
  } finally {
    unsubscribe?.();
    globalThis.window = previousWindow;
    globalThis.WebSocket = previousSocket;
  }
});

test("lecture upload sends the real file, preserves notes on reload, and shares a usable file URL", async () => {
  reset();
  const live = batches.startManualClass({ courseId: active.courseId, batchId: active.id, lectureTitle: "Material persistence", duration: "1 Hour" });
  const originalFetch = globalThis.fetch;
  const notes = "Lecture notes\n".repeat(120);
  let uploads = 0;
  globalThis.fetch = async (url, options) => {
    uploads++;
    assert.equal(url, "/api/live-materials");
    assert.equal(options.body.get("file").name, "lecture-notes.txt");
    assert.equal(await options.body.get("file").text(), "Actual lesson file");
    return Response.json({ fileUrl: "/api/live-materials?id=upload-test" }, { status: 201 });
  };
  try {
    const material = await batches.uploadLectureMaterial(live.id, new File(["Actual lesson file"], "lecture-notes.txt", { type: "text/plain" }), notes);
    assert.equal(uploads, 1);
    batches.shareLectureMaterial(live.id, material.id);
    const saved = batches.getBatchState();
    localStorage.setItem(batches.BATCH_STORAGE_KEY, JSON.stringify({ ...saved, testReload: true }));
    const reloaded = batches.getBatchState();
    assert.equal(reloaded.materials.find(item => item.id === material.id).notes, notes.trim());
    assert.equal(reloaded.materials.find(item => item.id === material.id).fileUrl, material.fileUrl);
    assert.equal(reloaded.classes.find(item => item.id === live.id).activeSharedMaterial.materialId, material.id);
    batches.stopSharingLectureMaterial(live.id);
    assert.equal(batches.getBatchState().classes.find(item => item.id === live.id).activeSharedMaterial, null);
    await assert.rejects(batches.uploadLectureMaterial(live.id, new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.pdf")), /10 MB/);
    assert.equal(uploads, 1);
  } finally { globalThis.fetch = originalFetch; }
});
