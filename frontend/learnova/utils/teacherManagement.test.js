import assert from "node:assert/strict";
import { createServer } from "./test-module-loader.js";

const entries = new Map();
globalThis.localStorage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
globalThis.sessionStorage = { getItem: () => null };
globalThis.window = new EventTarget();
globalThis.StorageEvent = class extends Event { constructor(type, options) { super(type); this.key = options.key; } };
const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { updateTeacher, deleteTeacher } = await server.ssrLoadModule("/src/utils/teacherManagement.js");
  const { getTeachers } = await server.ssrLoadModule("/src/utils/peopleStorage.js");
  const { getCourses, COURSE_STORAGE_KEY } = await server.ssrLoadModule("/src/utils/courseStorage.js");
  const { getBatchState, BATCH_STORAGE_KEY } = await server.ssrLoadModule("/src/utils/batchStorage.js");
  const original = getTeachers()[0];
  const other = getTeachers()[1];
  const courses = getCourses();
  localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(courses.map((course, index) => index === 0 ? { ...course, instructorId: original.id, instructor: original.name } : course)));
  const state = getBatchState();
  localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify({ ...state, classes: state.classes.map(row => ({ ...row, status: "Completed" })) }));
  assert.throws(() => updateTeacher(original.id, { id: other.id }), /already uses/);
  const updated = updateTeacher(original.id, { id: "TCH-RENAMED", name: "Updated Teacher", email: "updatedteacher@example.com", specialization: "Mathematics", phone: "123456", status: "Active" });
  assert.equal(getTeachers().find(row => row.id === updated.id).phone, "123456");
  assert.ok(!getTeachers().some(row => row.id === original.id));
  assert.equal(getCourses()[0].instructorId, updated.id);
  assert.equal(getCourses()[0].instructor, updated.name);
  assert.ok(!getBatchState().batches.some(row => row.teacherId === original.id));
  assert.equal(JSON.parse(localStorage.getItem(`learnova_profile_${updated.id}`)).specialization, "Mathematics");
  const courseCount = getCourses().length;
  const batchCount = getBatchState().batches.length;
  deleteTeacher(updated.id);
  assert.ok(!getTeachers().some(row => row.id === updated.id));
  assert.equal(getCourses().length, courseCount);
  assert.equal(getBatchState().batches.length, batchCount);
  assert.equal(getCourses()[0].instructorId, "");
  assert.ok(!getBatchState().batches.some(row => row.teacherId === updated.id));
  assert.equal(localStorage.getItem(`learnova_profile_${updated.id}`), null);
  assert.throws(() => deleteTeacher(updated.id), /no longer exists/);
  console.log("PASS: teacher editing, duplicate validation, ID migration, persistence and deletion preserve linked records.");
} finally {
  await server.close();
}
