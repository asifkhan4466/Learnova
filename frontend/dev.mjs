import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { WebSocket } = createRequire(new URL("../backend/package.json", import.meta.url))("ws");
const frontend = fileURLToPath(new URL("./", import.meta.url));
const signalingScript = fileURLToPath(new URL("../backend/server/signaling-server.js", import.meta.url));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function signalingReady(port) {
  return new Promise(resolve => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    const classId = `startup-check-${randomUUID()}`;
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.terminate();
      resolve(result);
    };
    const timer = setTimeout(() => finish(false), 700);
    socket.on("error", () => finish(false));
    socket.on("close", () => finish(false));
    socket.on("open", () => socket.send(JSON.stringify({ type: "join-room", classId, role: "participant" })));
    socket.on("message", raw => {
      try {
        const message = JSON.parse(raw);
        if (message.type === "room-joined" && message.classId === classId) finish(true);
      } catch { finish(false); }
    });
  });
}

export async function ensureSignaling(port = 8080) {
  // Reuse an existing Learnova service; never kill a service this launcher did not start.
  if (await signalingReady(port)) return { owned: false, stop() {} };
  const child = spawn(process.execPath, [signalingScript], {
    env: { ...process.env, SIGNALING_PORT: String(port) }, stdio: "inherit",
  });
  let error;
  child.once("error", value => { error = value; });
  try {
    for (let attempt = 0; attempt < 40; attempt++) {
      if (error || child.exitCode !== null) throw error || new Error(`Signaling server exited with code ${child.exitCode}.`);
      if (await signalingReady(port)) return { owned: true, child, stop: () => child.kill() };
      await pause(100);
    }
    throw new Error(`The live-class signaling service did not become ready on port ${port}.`);
  } catch (error) {
    child.kill();
    throw error;
  }
}

async function main() {
  const signaling = process.env.NEXT_PUBLIC_SIGNALING_URL ? null : await ensureSignaling();
  console.log(signaling ? "Live-class signaling ready on port 8080." : "Using the configured external live-class signaling service.");
  const app = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", ...process.argv.slice(2)], {
    cwd: frontend, stdio: "inherit",
  });
  const stop = () => { app.kill(); signaling?.stop(); };
  process.once("SIGINT", () => { stop(); process.exit(130); });
  process.once("SIGTERM", () => { stop(); process.exit(143); });
  app.once("error", error => { console.error(error.message); signaling?.stop(); process.exitCode = 1; });
  app.once("exit", code => { signaling?.stop(); process.exitCode = code ?? 1; });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(`Development startup failed: ${error.message}`); process.exitCode = 1; });
}
