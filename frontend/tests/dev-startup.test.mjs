import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:net";
import { test } from "node:test";
import { WebSocket } from "ws";
import { ensureSignaling } from "../dev.mjs";

test("development starts a real signaling service, reuses it, and does not stop a reused service", async () => {
  const probe = createServer().listen(0, "127.0.0.1");
  await once(probe, "listening");
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const service = await ensureSignaling(port);
  try {
    assert.equal(service.owned, true);
    const reused = await ensureSignaling(port);
    assert.equal(reused.owned, false);
    reused.stop();
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    try {
      await once(socket, "open");
      const response = once(socket, "message");
      socket.send(JSON.stringify({ type: "join-room", classId: "startup-regression", role: "student" }));
      const [raw] = await response;
      assert.equal(JSON.parse(raw).type, "room-joined");
    } finally { socket.terminate(); }
  } finally {
    const exited = once(service.child, "exit");
    service.stop();
    await exited;
  }
}, { timeout: 15000 });
