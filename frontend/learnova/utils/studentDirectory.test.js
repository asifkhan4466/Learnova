import assert from "node:assert/strict";
import { createServer } from "./test-module-loader.js";
const entries = new Map();
globalThis.localStorage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
globalThis.sessionStorage = { getItem: () => null };
globalThis.window = new EventTarget();
const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
 const directory = await server.ssrLoadModule("/src/utils/studentDirectory.js");
 const batch = {id:"test-batch",name:"Unique batch",course:"Test course",courseId:"test-course"};
 const enrollments = [
 {id:"e1",studentId:"STU-1001",student:"Ahmed",batchId:batch.id,courseId:batch.courseId,approved:false},
 {id:"e2",studentId:"STU-1001",batchId:batch.id,courseId:batch.courseId,approved:true},
 {id:"e3",studentId:"STU-1002",batchId:"other-batch",courseId:batch.courseId},
 {id:"e4",studentId:"STU-1003",batchId:batch.id,courseId:"other-course"}
 ];
 assert.equal(directory.batchStudents(batch,enrollments).length,1);
 assert.equal(directory.batchStudents(batch,enrollments)[0].enrollments.length,2);
 assert.throws(()=>directory.deleteStudent("STU-1001","student"),/not allowed/);
 directory.updateStudentProfile("STU-1001",{name:"Updated student",email:"updated@example.com",username:""},"admin");
 assert.equal(directory.batchStudents(batch,enrollments)[0].name,"Updated student");
 assert.equal(directory.getStudents().find(row=>row.id==="STU-1001").email,"updated@example.com");
 directory.deleteStudent("STU-1001","admin");
 assert.equal(directory.batchStudents(batch,enrollments).length,0);
 assert.ok(!directory.getStudents().some(row=>row.id==="STU-1001"));
 assert.equal(enrollments.length,4);
 assert.ok(JSON.parse(localStorage.getItem("learnova_deleted_students")).includes("STU-1001"));
 console.log("PASS: roster isolation, pending enrollments, deduplication, profile updates, permissions, persisted deletion and history retention.");
} finally { await server.close(); }
