import { randomUUID } from "node:crypto";
import { WebSocket, WebSocketServer } from "ws";

const port = Number(process.env.SIGNALING_PORT || 8080);
const rooms = new Map();
const liveClasses = new Map();
const sessions = new Map();

function sessionFor(id) {
  if (!sessions.has(id)) sessions.set(id, { waiting: false, locked: false, admitted: new Set(), removed: new Set(), chat: [] });
  return sessions.get(id);
}
function roomState(id) {
  const room = [...(rooms.get(id) || [])];
  const session = sessionFor(id);
  const participant = peer => ({ peerId: peer.peerId, participantId: peer.participantId, name: peer.displayName, role: peer.role, hand: !!peer.hand, mic: !!peer.mic, camera: !!peer.camera });
  for (const peer of room) send(peer, { type: "room-state", selfPeerId: peer.peerId, admitted: peer.admitted, locked: session.locked,
    participants: peer.admitted ? room.filter(item => item.admitted).map(participant) : [],
    waiting: peer.role === "teacher" ? room.filter(item => !item.admitted).map(participant) : [],
    recording: !!session.recording, chat: peer.admitted ? session.chat : [] });
}
function announceJoin(socket) {
  const room = [...(rooms.get(socket.classId) || [])].filter(peer => peer.admitted);
  send(socket, { type: "room-joined", classId: socket.classId, peerId: socket.peerId, peers: room.filter(peer => peer !== socket).map(peer => ({ peerId: peer.peerId, role: peer.role })) });
  for (const peer of room) if (peer !== socket) send(peer, { type: "peer-joined", peerId: socket.peerId, role: socket.role });
  roomState(socket.classId);
}
// This app currently uses demo identities/local enrollments. Discovery filtering
// preserves those rules; it is not a substitute for authenticated server roles.

function sendClassUpdate(socket, entry) {
  const watch = socket.classWatch;
  if (!watch || !entry.notificationRecipients.includes(watch.studentId)) return;
  if (!watch.enrollments.some(item => String(item.courseId) === String(entry.courseId) && String(item.batchId) === String(entry.batchId))) return;
  send(socket, { type: "class-update", entry: { ...entry, notificationRecipients: [watch.studentId] } });
}

function send(socket, message) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function leaveRoom(socket, notify = true) {
  if (!socket.classId) return;

  const room = rooms.get(socket.classId);
  if (socket.role === "teacher" && sessions.has(socket.classId)) sessions.get(socket.classId).recording = false;
  if (room) {
    room.delete(socket);
    if (notify) {
      for (const peer of room) {
        send(peer, { type: "peer-left", peerId: socket.peerId });
      }
    }
    if (room.size === 0) rooms.delete(socket.classId);
    else roomState(socket.classId);
  }

  socket.classId = undefined;
}

function relayToPeers(socket, message) {
  const room = rooms.get(socket.classId);
  if (!room) return;
  const target = [...room].find(peer => peer.peerId === message.target);
  if (socket.admitted && target?.admitted && target !== socket) send(target, { ...message, peerId: socket.peerId, senderId: socket.peerId, role: socket.role });
}

const server = new WebSocketServer({ port });

server.on("connection", (socket) => {
  socket.peerId = randomUUID();

  socket.on("message", (rawMessage) => {
    let message;
    try {
      message = JSON.parse(rawMessage.toString());
    } catch {
      send(socket, { type: "error", message: "Messages must be valid JSON." });
      return;
    }

    if (!message || typeof message !== "object") return;
    const { type } = message;

    if (type === "watch-classes") {
      if (typeof message.studentId !== "string" || !Array.isArray(message.enrollments)) return;
      socket.classWatch = { studentId: message.studentId, enrollments: message.enrollments.slice(0, 100).filter(item => item && item.courseId && item.batchId) };
      for (const entry of liveClasses.values()) sendClassUpdate(socket, entry);
      return;
    }

    if (type === "publish-class") {
      const entry = message.entry;
      if (!entry || typeof entry.id !== "string" || !entry.courseId || !entry.batchId || !entry.teacherId ||
          !["Live", "Completed"].includes(entry.status) || !entry.startedAt || !Array.isArray(entry.notificationRecipients)) return;
      const previous = liveClasses.get(entry.id);
      if (previous && (previous.teacherId !== entry.teacherId || previous.courseId !== entry.courseId || previous.batchId !== entry.batchId)) return;
      // An old reconnect must never reopen a session which has already ended.
      if (previous?.status === "Completed" && entry.status === "Live") return;
      const update = Object.fromEntries(["id", "courseId", "course", "batchId", "batch", "teacherId", "teacher", "title", "lectureTitle", "duration", "date", "time", "status", "startedAt", "endedAt", "notification", "notificationRecipients", "activeSharedMaterial", "lectureMaterials"]
        .filter(key => entry[key] !== undefined).map(key => [key, entry[key]]));
      liveClasses.set(entry.id, update);
      if (entry.status === "Completed") {
        for (const peer of rooms.get(entry.id) || []) { send(peer, { type: "class-ended" }); peer.close(); }
        sessions.delete(entry.id);
      }
      if (liveClasses.size > 1000) liveClasses.delete(liveClasses.keys().next().value);
      for (const client of server.clients) sendClassUpdate(client, update);
      return;
    }

    if (type === "join-room") {
      const classId = String(message.classId || "").trim();
      if (!classId) {
        send(socket, { type: "error", message: "join-room requires classId." });
        return;
      }

      if (liveClasses.get(classId)?.status === "Completed") { send(socket, { type: "entry-denied", message: "This class has ended." }); return; }
      leaveRoom(socket, false);
      socket.classId = classId;
      socket.peerId = String(message.peerId || socket.peerId);
      socket.role = String(message.role || "participant");
      socket.participantId = String(message.participantId || socket.peerId);
      socket.displayName = String(message.name || (socket.role === "teacher" ? "Teacher" : "Student")).slice(0, 80);
      socket.resumeKey = `${socket.participantId}:${String(message.resumeToken || "").slice(0, 128)}`;
      const session = sessionFor(classId);
      if (socket.role === "teacher" && message.waitingRoom === true) session.waiting = true;
      if (socket.role === "student" && (session.removed.has(socket.resumeKey) || (session.locked && !session.admitted.has(socket.resumeKey)))) {
        send(socket, { type: "entry-denied", message: "The teacher has locked the classroom or removed you from this session." });
        socket.classId = undefined;
        return;
      }
      socket.admitted = socket.role !== "student" || (!(session.waiting || message.requireAdmission) || session.admitted.has(socket.resumeKey));

      const room = rooms.get(classId) || new Set();
      room.add(socket);
      rooms.set(classId, room);

      if (socket.admitted) announceJoin(socket);
      else { send(socket, { type: "waiting-room" }); roomState(classId); }
      return;
    }

    if (type === "admit-participant" && socket.role === "teacher" && socket.admitted) {
      const target = [...(rooms.get(socket.classId) || [])].find(peer => peer.peerId === message.target && peer.role === "student" && !peer.admitted);
      if (target) { target.admitted = true; sessionFor(socket.classId).admitted.add(target.resumeKey); announceJoin(target); }
      return;
    }
    if (type === "room-control" && socket.role === "teacher" && socket.admitted) {
      const session = sessionFor(socket.classId);
      if (message.action === "lock") session.locked = !!message.locked;
      if (message.action === "recording") session.recording = !!message.locked;
      for (const target of rooms.get(socket.classId) || []) {
        if (target.role !== "student" || (message.target && target.peerId !== message.target)) continue;
        if (message.action === "mute") { target.mic = false; send(target, { type: "force-mute" }); }
        if (message.action === "lower-hand") target.hand = false;
        if (message.action === "remove" && message.target) {
          session.removed.add(target.resumeKey); session.admitted.delete(target.resumeKey);
          send(target, { type: "entry-denied", message: "The teacher removed you from this session." });
          leaveRoom(target);
        }
      }
      roomState(socket.classId);
      return;
    }
    if (type === "participant-state" && socket.admitted && socket.classId) {
      for (const key of ["hand", "mic", "camera"]) if (typeof message[key] === "boolean") socket[key] = message[key];
      roomState(socket.classId);
      return;
    }
    if (type === "room-chat" && socket.admitted && socket.classId && typeof message.text === "string") {
      const text = message.text.trim().slice(0, 2000);
      if (text) {
        const chat = sessionFor(socket.classId).chat;
        chat.push({ id: randomUUID(), senderName: socket.displayName, message: text, sentAt: new Date().toISOString() });
        if (chat.length > 100) chat.shift();
        roomState(socket.classId);
      }
      return;
    }

    if (type === "leave-room") {
      leaveRoom(socket);
      send(socket, { type: "room-left" });
      return;
    }

    if (type === "screen-share-request" && socket.role === "student" && socket.classId && socket.admitted) {
      for (const peer of rooms.get(socket.classId) || []) {
        if (peer.role === "teacher") send(peer, { type, participantId: socket.participantId });
      }
      return;
    }

    if (type === "screen-share-decision" && socket.role === "teacher" && socket.classId && typeof message.approved === "boolean") {
      for (const peer of rooms.get(socket.classId) || []) {
        if (peer.role === "student" && peer.participantId === message.participantId) send(peer, { type, participantId: peer.participantId, approved: message.approved });
      }
      return;
    }

    if (["offer", "answer", "ice-candidate"].includes(type)) {
      if (!socket.classId) {
        send(socket, { type: "error", message: "Join a room before sending signaling messages." });
        return;
      }
      relayToPeers(socket, message);
      return;
    }

    send(socket, { type: "error", message: `Unsupported message type: ${type || "unknown"}.` });
  });

  socket.on("close", () => leaveRoom(socket));
  socket.on("error", () => leaveRoom(socket));
});

server.on("listening", () => {
  console.log(`Learnova signaling server listening on ws://localhost:${port}`);
});
