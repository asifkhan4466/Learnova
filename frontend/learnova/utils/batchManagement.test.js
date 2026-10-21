import assert from "node:assert/strict";
import { createServer } from "./test-module-loader.js";

const entries = new Map();
globalThis.localStorage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
globalThis.sessionStorage = { getItem: () => null };
globalThis.window = new EventTarget();
globalThis.StorageEvent = class extends Event { constructor(type, options) { super(type); this.key = options.key; } };
const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
 const batch = await server.ssrLoadModule("/src/utils/batchStorage.js");
 const { getCourses } = await server.ssrLoadModule("/src/utils/courseStorage.js");
 const { getTeachers } = await server.ssrLoadModule("/src/utils/peopleStorage.js");
 const course=getCourses()[0], teacher=getTeachers().find(row=>row.status==="Active");
 const form={name:"Batch validation test",courseId:course.id,teacherId:teacher.id,startDate:"2026-10-01",endDate:"2026-11-01",mode:"Live Class"};
 assert.throws(()=>batch.createManagedBatch({...form,endDate:"2026-09-01"},"admin"),/End date/);
 assert.throws(()=>batch.createManagedBatch({...form,mode:"Invalid"},"admin"),/valid batch mode/);
 assert.throws(()=>batch.createManagedBatch(form,"subadmin"),/not allowed/);
 const created=batch.createManagedBatch(form,"admin");
 assert.equal(created.mode,"Live Class");
 assert.equal(created.status,"Upcoming");
 assert.throws(()=>batch.createManagedBatch(form,"admin"),/already exists/);
 const updated=batch.updateManagedBatch(created.id,{...form,name:"Renamed batch",mode:"Hybrid"},"admin");
 assert.equal(updated.mode,"Hybrid");
 assert.equal(batch.getBatchState().batches.find(row=>row.id===created.id).name,"Renamed batch");
 const stored=JSON.parse(localStorage.getItem(batch.BATCH_STORAGE_KEY));
 assert.equal(stored.batches.find(row=>row.id===created.id).mode,"Hybrid");
 batch.deleteManagedBatch(created.id,"admin");
 assert.ok(!batch.getBatchState().batches.some(row=>row.id===created.id));
 assert.throws(()=>batch.updateManagedBatch(created.id,form,"admin"),/no longer exists/);
 const protectedBatch=batch.getBatchState().batches.find(row=>row.students>0 || batch.getBatchState().enrollments.some(item=>item.batchId===row.id));
 assert.ok(protectedBatch,"Existing enrolled batch is available for regression coverage");
 assert.throws(()=>batch.deleteManagedBatch(protectedBatch.id,"admin"),/cannot be deleted/);
 console.log("PASS: batch create/edit/delete, mode persistence, permission checks, duplicate/date validation and linked-record protection.");
} finally { await server.close(); }
