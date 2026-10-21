import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";

let server, url;
const clients = [];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
before(async () => {
  const probe = createServer().listen(0, "127.0.0.1");
  await once(probe, "listening");
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  url = `ws://127.0.0.1:${port}`;
  server = spawn(process.execPath, [fileURLToPath(new URL("../../backend/server/signaling-server.js", import.meta.url))], {
    env: { ...process.env, SIGNALING_PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  server.stdout.on("data", data => { output += data; });
  server.stderr.on("data", data => { output += data; });
  for (let attempt = 0; attempt < 100 && !output.includes("listening"); attempt++) {
    if (server.exitCode !== null) throw Error(output);
    await pause(50);
  }
  assert.match(output, /listening/);
});
after(() => { clients.forEach(client => client.terminate()); server?.kill(); });
async function connect(studentId, courseId = 1, batchId = "batch-a") {
  const socket = new WebSocket(url);
  clients.push(socket);
  socket.messages = [];
  socket.on("message", raw => socket.messages.push(JSON.parse(raw)));
  await once(socket, "open");
  if (studentId) socket.send(JSON.stringify({ type: "watch-classes", studentId, enrollments: [{ courseId, batchId }] }));
  return socket;
}
async function waitFor(socket, predicate) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const message = socket.messages.find(predicate);
    if (message) return message;
    await pause(30);
  }
  throw Error(`Expected message not received: ${JSON.stringify(socket.messages)}`);
}
const entry = { id: "class-directory-test", courseId: 1, batchId: "batch-a", teacherId: "TCH-1001", title: "Shared live lecture",
  status: "Live", startedAt: new Date().toISOString(), notificationRecipients: ["STU-1001", "STU-WRONG-BATCH", "STU-WRONG-COURSE"] };

test("live discovery reaches the matching enrolled student across separate connections and replays to late joiners", async () => {
  const student = await connect("STU-1001", "1");
  const otherBatch = await connect("STU-WRONG-BATCH", 1, "batch-b");
  const otherCourse = await connect("STU-WRONG-COURSE", 2);
  const nonRecipient = await connect("STU-OTHER");
  const teacher = await connect();
  teacher.send(JSON.stringify({ type: "publish-class", entry: { ...entry, payments: [{ secret: "not-for-discovery" }], fileData: "private" } }));
  const update = await waitFor(student, data => data.type === "class-update");
  assert.equal(update.entry.id, entry.id);
  assert.equal(update.entry.payments, undefined);
  assert.equal(update.entry.fileData, undefined);
  assert.deepEqual(update.entry.notificationRecipients, ["STU-1001"]);
  const late = await connect("STU-1001");
  assert.equal((await waitFor(late, data => data.type === "class-update")).entry.id, entry.id);
  await pause(150);
  for (const excluded of [otherBatch, otherCourse, nonRecipient]) assert.equal(excluded.messages.length, 0);
});

test("completion updates students and stale teacher reconnects cannot reopen the class", async () => {
  const student = await connect("STU-1001");
  const teacher = await connect();
  teacher.send(JSON.stringify({ type: "publish-class", entry: { ...entry, status: "Completed", endedAt: new Date().toISOString() } }));
  await waitFor(student, data => data.entry?.status === "Completed");
  teacher.send(JSON.stringify({ type: "publish-class", entry }));
  const late = await connect("STU-1001");
  assert.equal((await waitFor(late, data => data.type === "class-update")).entry.status, "Completed");
});

test("malformed discovery input does not crash the service and existing room signaling still works", async () => {
  const student = await connect();
  student.send("null");
  student.send(JSON.stringify({ type: "watch-classes", studentId: "STU-1001", enrollments: [null, {}] }));
  student.send(JSON.stringify({ type: "publish-class", entry: null }));
  const teacher = await connect();
  teacher.send(JSON.stringify({ type: "join-room", classId: "media-test", role: "teacher" }));
  const joined = await waitFor(teacher, data => data.type === "room-joined");
  student.send(JSON.stringify({ type: "join-room", classId: "media-test", role: "student" }));
  const peer = await waitFor(teacher, data => data.type === "peer-joined");
  teacher.send(JSON.stringify({ type: "offer", target: peer.peerId, offer: { type: "offer", sdp: "test-relay" } }));
  const offer = await waitFor(student, data => data.type === "offer");
  assert.equal(offer.peerId, joined.peerId);
  assert.equal(offer.offer.sdp, "test-relay");
});

test("screen requests and teacher decisions stay inside the room and target the requesting student", async () => {
  const teacher = await connect(), student = await connect(), otherStudent = await connect(), otherTeacher = await connect();
  for (const [socket, role, participantId, classId] of [
    [teacher, "teacher", "TCH-1001", "screen-room"], [student, "student", "STU-1001", "screen-room"],
    [otherStudent, "student", "STU-1002", "screen-room"], [otherTeacher, "teacher", "TCH-OTHER", "other-screen-room"],
  ]) {
    socket.send(JSON.stringify({ type: "join-room", classId, role, participantId }));
    await waitFor(socket, data => data.type === "room-joined");
  }
  student.send(JSON.stringify({ type: "screen-share-request" }));
  const request = await waitFor(teacher, data => data.type === "screen-share-request");
  assert.equal(request.participantId, "STU-1001");
  student.send(JSON.stringify({ type: "screen-share-decision", participantId: "STU-1001", approved: true }));
  await waitFor(student, data => data.type === "error");
  assert.equal(student.messages.some(data => data.type === "screen-share-decision"), false);
  teacher.send(JSON.stringify({ type: "screen-share-decision", participantId: request.participantId, approved: true }));
  assert.equal((await waitFor(student, data => data.type === "screen-share-decision")).approved, true);
  teacher.send(JSON.stringify({ type: "screen-share-decision", participantId: request.participantId, approved: false }));
  await waitFor(student, data => data.type === "screen-share-decision" && data.approved === false);
  assert.equal(otherStudent.messages.some(data => data.type === "screen-share-decision"), false);
  assert.equal(otherTeacher.messages.some(data => data.type === "screen-share-request"), false);
});

test("waiting room gates media and chat, admission enables controls, and removal prevents reentry", async () => {
  const teacher = await connect(), student = await connect();
  const classId = "conference-controls";
  teacher.send(JSON.stringify({ type: "join-room", classId, role: "teacher", waitingRoom: true }));
  const host = await waitFor(teacher, data => data.type === "room-joined");
  student.send(JSON.stringify({ type: "join-room", classId, role: "student", participantId: "admission-student", requireAdmission: true, name: "Test Student" }));
  await waitFor(student, data => data.type === "waiting-room");
  const waiting = await waitFor(teacher, data => data.type === "room-state" && data.waiting.length === 1);
  const target = waiting.waiting[0].peerId;
  student.send(JSON.stringify({ type: "room-chat", text: "not admitted" }));
  student.send(JSON.stringify({ type: "offer", target: host.peerId, offer: { sdp: "blocked" } }));
  await pause(100);
  assert.equal(teacher.messages.some(data => data.offer?.sdp === "blocked" || data.chat?.some(item => item.message === "not admitted")), false);
  teacher.send(JSON.stringify({ type: "admit-participant", target }));
  await waitFor(student, data => data.type === "room-joined");
  student.send(JSON.stringify({ type: "participant-state", hand: true }));
  await waitFor(teacher, data => data.type === "room-state" && data.participants.some(peer => peer.peerId === target && peer.hand));
  student.send(JSON.stringify({ type: "room-chat", text: "Hello class" }));
  await waitFor(teacher, data => data.type === "room-state" && data.chat.some(item => item.message === "Hello class" && item.senderName === "Test Student"));
  teacher.send(JSON.stringify({ type: "room-control", action: "mute", target }));
  await waitFor(student, data => data.type === "force-mute");
  teacher.send(JSON.stringify({ type: "room-control", action: "recording", locked: true }));
  await waitFor(student, data => data.type === "room-state" && data.recording);
  teacher.send(JSON.stringify({ type: "room-control", action: "remove", target }));
  await waitFor(student, data => data.type === "entry-denied");
  student.messages = [];
  student.send(JSON.stringify({ type: "join-room", classId, role: "student", participantId: "admission-student", requireAdmission: true }));
  await waitFor(student, data => data.type === "entry-denied");
});

test("classroom lock denies newcomers and students cannot admit or moderate peers", async () => {
  const teacher = await connect(), student = await connect();
  const classId = "locked-conference";
  teacher.send(JSON.stringify({ type: "join-room", classId, role: "teacher", waitingRoom: true }));
  await waitFor(teacher, data => data.type === "room-joined");
  teacher.send(JSON.stringify({ type: "room-control", action: "lock", locked: true }));
  await waitFor(teacher, data => data.type === "room-state" && data.locked);
  student.send(JSON.stringify({ type: "join-room", classId, role: "student", participantId: "newcomer", requireAdmission: true }));
  await waitFor(student, data => data.type === "entry-denied");
  student.send(JSON.stringify({ type: "room-control", action: "lock", locked: false }));
  student.send(JSON.stringify({ type: "admit-participant", target: "other" }));
  await pause(100);
  assert.equal(teacher.messages.at(-1).locked, true);
});
