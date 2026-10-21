// Run after npm run build: node --test frontend/tests/live-class-browser.test.mjs
// Requires an already-installed agent-browser. Uses real WebRTC with synthetic
// canvas media; no camera, microphone or desktop is captured by this test.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, readdirSync, mkdtempSync, writeFileSync, rmSync, copyFileSync } from "node:fs";
import { createServer } from "node:net";
import { once } from "node:events";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const teacher = `learnova-live-teacher-${process.pid}`, student = `learnova-live-student-${process.pid}`;
const children = [], opened = new Set();
let executable, baseUrl, initScript, temporary;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function port() {
  const socket = createServer().listen(0, "127.0.0.1");
  await once(socket, "listening");
  const result = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  return result;
}
function browser(session, args, input) {
  return (execFileSync(executable, ["--session", session, ...args], {
    cwd: root, input, encoding: "utf8", timeout: 30000, maxBuffer: 1024 * 1024,
    ...(args.includes("open") ? { stdio: ["pipe", "ignore", "ignore"] } : {}),
  }) || "").trim();
}
function evaluate(session, fn, ...args) {
  const result = JSON.parse(browser(session, ["eval", "--stdin"], `(async()=>JSON.stringify(await (${fn.toString()})(...${JSON.stringify(args)})))()`));
  return typeof result === "string" ? JSON.parse(result) : result;
}
async function waitFor(session, fn, ...args) {
  // These predicates only read state. A lost daemon response during navigation
  // may safely be re-evaluated; mutation commands are never retried.
  const check = () => evaluate(session, async (source, values) => {
    const check = (0, eval)(`(${source})`);
    for (let attempt = 0; attempt < 300; attempt++) {
      const result = check(...values);
      if (result) return result;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw Error(`Live flow timed out: ${location.pathname} | ${document.body.innerText.slice(-1800)}`);
  }, fn.toString(), args);
  try { return check(); }
  catch (error) {
    if (!String(error.stderr || error.message).includes("Invalid response: EOF")) throw error;
    return check();
  }
}
before(async () => {
  const cache = path.join(process.env.LOCALAPPDATA || path.join(homedir(), "AppData", "Local"), "npm-cache", "_npx");
  executable = process.env.AGENT_BROWSER;
  for (const entry of !executable && existsSync(cache) ? readdirSync(cache) : []) {
    const candidate = path.join(cache, entry, "node_modules", "agent-browser", "bin", process.platform === "win32" ? "agent-browser-win32-x64.exe" : `agent-browser-${process.platform}-${process.arch}`);
    if (existsSync(candidate)) { executable = candidate; break; }
  }
  assert.ok(executable, "Set AGENT_BROWSER to an existing executable; no downloads are performed.");
  temporary = mkdtempSync(path.join(tmpdir(), "learnova-live-test-"));
  const appPort = await port(), signalPort = await port();
  baseUrl = `http://127.0.0.1:${appPort}`;
  const signaling = spawn(process.execPath, [fileURLToPath(new URL("../../backend/server/signaling-server.js", import.meta.url))], {
    env: { ...process.env, SIGNALING_PORT: String(signalPort) }, stdio: ["ignore", "pipe", "pipe"],
  });
  const app = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(appPort)], {
    cwd: root, env: { ...process.env, LEARNOVA_MATERIALS_DIR: path.join(temporary, "stored-materials") }, stdio: ["ignore", "pipe", "pipe"],
  });
  children.push(signaling, app);
  let logs = "";
  children.forEach(child => {
    child.stdout.on("data", chunk => { logs = (logs + chunk).slice(-6000); });
    child.stderr.on("data", chunk => { logs = (logs + chunk).slice(-6000); });
  });
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    if (children.some(child => child.exitCode !== null)) throw Error(logs);
    try { ready = (await fetch(`${baseUrl}/api/health`)).ok && logs.includes("signaling server listening"); } catch { /* own servers starting */ }
    if (ready) break;
    await pause(100);
  }
  assert.ok(ready, logs);
  initScript = path.join(temporary, "synthetic-media.js");
  writeFileSync(initScript, `(() => {
    document.addEventListener("DOMContentLoaded", () => { document.documentElement.style.scrollBehavior = "auto"; });
    const NativeSocket = window.WebSocket;
    window.__liveSockets = [];
    window.WebSocket = class extends NativeSocket {
      constructor(url, protocols) { super(new URL(url).port === '8080' ? 'ws://127.0.0.1:${signalPort}' : url, protocols); window.__liveSockets.push(this); }
      send(data) { if (JSON.parse(data).type === 'join-room') this.__room = true; super.send(data); }
    };
    const NativePeer = window.RTCPeerConnection;
    window.__livePeers = [];
    window.RTCPeerConnection = class extends NativePeer { constructor(options) { super(options); window.__livePeers.push(this); } };
    function stream(screen) {
      const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 90;
      const context = canvas.getContext('2d');
      function draw() { context.fillStyle = screen ? (window.__screenColor || '#0000ff') : '#ff0000'; context.fillRect(0, 0, 160, 90); }
      draw(); const interval = setInterval(draw, 60);
      const result = canvas.captureStream(15);
      if (!screen) {
        const audio = new AudioContext();
        const oscillator = audio.createOscillator();
        const gain = audio.createGain(); gain.gain.value = 0.001;
        const destination = audio.createMediaStreamDestination();
        oscillator.connect(gain).connect(destination); oscillator.start(); audio.resume();
        const track = destination.stream.getAudioTracks()[0]; result.addTrack(track);
        track.addEventListener('ended', () => { oscillator.stop(); audio.close(); });
      }
      result.getTracks().forEach(track => track.addEventListener('ended', () => clearInterval(interval)));
      return result;
    }
    navigator.mediaDevices.getUserMedia = async constraints => {
      if (window.__denyCamera) throw new DOMException('No test camera', 'NotFoundError');
      const result = stream(false);
      for (const track of result.getTracks()) if (!constraints[track.kind === "video" ? "video" : "audio"]) { result.removeTrack(track); track.stop(); }
      return result;
    };
    navigator.mediaDevices.getDisplayMedia = async () => stream(true);
  })();`);
  for (const session of [teacher, student]) {
    opened.add(session);
    browser(session, ["--init-script", initScript, "--args", "--autoplay-policy=no-user-gesture-required", "open", `${baseUrl}/${session === teacher ? "teacher" : "student"}/live-classes`]);
    await waitFor(session, () => document.querySelector("h1")?.textContent === "Live Classes");
  }
}, { timeout: 90000 });
after(() => {
  for (const session of opened) { try { browser(session, ["close"]); } catch { /* still clean our servers */ } }
  children.forEach(child => child.kill());
  if (temporary) rmSync(temporary, { recursive: true, force: true });
});
async function startAndJoin(title, denyCamera = false) {
  evaluate(teacher, value => { window.__denyCamera = value; }, denyCamera);
  browser(teacher, ["click", ".teacher-create-live-btn"]);
  const batch = await waitFor(teacher, () => document.querySelector('.teacher-live-dialog select')?.value && [...document.querySelectorAll('.teacher-live-dialog select')][1]?.options[1]?.value);
  // Select through the containing label: each select is its parent's first child.
  evaluate(teacher, batchId => {
    const select = document.querySelectorAll('.teacher-live-dialog select')[1];
    select.value = batchId; select.dispatchEvent(new Event('change', { bubbles: true }));
  }, batch);
  browser(teacher, ["fill", '.teacher-live-dialog input[placeholder="e.g. React Hooks Workshop"]', title]);
  browser(teacher, ["fill", '.teacher-live-dialog input[placeholder="e.g. 1 Hour"]', "1 Hour"]);
  browser(teacher, ["click", '.teacher-live-dialog button[type="submit"]']);
  const id = await waitFor(teacher, () => location.pathname.match(/\/teacher\/live-classes\/([^/]+)$/)?.[1]);
  await waitFor(student, title => [...document.querySelectorAll('.live-class-item')].some(row => row.querySelector('h2')?.textContent === title && !row.querySelector('button').disabled), title);
  assert.equal(evaluate(student, () => document.querySelector('.live-class-item h2')?.textContent), title, "The live lecture is visible first");
  assert.equal(evaluate(student, id => JSON.parse(localStorage.getItem('learnova_batch_lifecycle')).classes.find(item => item.id === id)?.status, id), "Live");
  browser(student, ["open", `${baseUrl}/student/notifications`]);
  await waitFor(student, title => [...document.querySelectorAll('.notification-card')].some(row => row.textContent.includes(title) && row.querySelector('a')), title);
  evaluate(student, title => [...document.querySelectorAll('.notification-card')].find(row => row.textContent.includes(title)).querySelector('a').click(), title);
  await waitFor(student, () => location.pathname === '/student/live-classes');
  if (!denyCamera) {
    browser(student, ["open", `${baseUrl}/student/courses`]);
    await waitFor(student, id => [...document.querySelectorAll('.my-course-card a')].some(link => link.getAttribute('href') === `/student/live-classes/${id}` && link.textContent.includes('Attend Live Class')), id);
    browser(student, ["click", `a[href="/student/live-classes/${id}"]`]);
  } else {
    evaluate(student, title => [...document.querySelectorAll('.live-class-item')].find(row => row.querySelector('h2')?.textContent === title).querySelector('button').click(), title);
  }
  await waitFor(student, id => location.pathname === `/student/live-classes/${id}`, id);
  await waitFor(student, () => document.body.innerText.includes('Waiting room:'));
  assert.equal(evaluate(student, () => window.__livePeers.some(peer => peer.connectionState === 'connected')), false, 'Waiting students receive no media');
  await waitFor(teacher, () => [...document.querySelectorAll('.conference-person button')].some(button => button.textContent === 'Admit'));
  evaluate(teacher, () => [...document.querySelectorAll('.conference-person button')].find(button => button.textContent === 'Admit').click());
  await waitFor(student, () => window.__livePeers.some(peer => peer.connectionState === 'connected'));
  if (!denyCamera) await evaluate(student, async () => {
    for (let attempt = 0; attempt < 120; attempt++) {
      for (const peer of window.__livePeers) {
        const stats = await peer.getStats();
        if ([...stats.values()].some(item => item.type === 'inbound-rtp' && item.kind === 'audio' && item.bytesReceived > 0)) return true;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw Error('The student did not receive teacher audio RTP.');
  });
  return id;
}
async function secondStudent(id) {
  console.log("Checking second student admission and media");
  const second = `learnova-live-second-${process.pid}`;
  opened.add(second);
  browser(second, ["--init-script", initScript, "--args", "--autoplay-policy=no-user-gesture-required", "open", `${baseUrl}/student/live-classes`]);
  const storage = evaluate(student, () => Object.fromEntries(Object.entries(localStorage)));
  evaluate(second, values => { for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value); }, storage);
  browser(second, ["open", `${baseUrl}/student/live-classes/${id}`]);
  await waitFor(second, () => document.body.innerText.includes('Waiting room:'));
  assert.equal(evaluate(second, () => window.__livePeers.some(peer => peer.connectionState === 'connected')), false, 'A different browser needs separate admission even with the demo identity');
  await waitFor(teacher, () => [...document.querySelectorAll('.conference-person button')].some(button => button.textContent === 'Admit'));
  evaluate(teacher, () => [...document.querySelectorAll('.conference-person button')].find(button => button.textContent === 'Admit').click());
  await waitFor(second, () => window.__livePeers.filter(peer => peer.connectionState === 'connected').length === 2);
  evaluate(second, () => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Turn Camera On').click());
  try {
    await waitFor(student, () => [...document.querySelectorAll('.live-gallery video')].some(video => video.videoWidth && !video.muted));
  } catch (error) {
    for (const session of [teacher, student, second]) console.log(session, evaluate(session, () => ({
      peers: window.__livePeers.map(peer => ({ state: peer.connectionState, signal: peer.signalingState, role: peer.peerRole, tracks: peer.getReceivers().map(receiver => ({ kind: receiver.track.kind, state: receiver.track.readyState })) })),
      videos: [...document.querySelectorAll('.live-gallery video')].map(video => ({ width: video.videoWidth, muted: video.muted })),
      page: document.body.innerText.slice(-1200)
    })));
    throw error;
  }
  await waitFor(teacher, () => document.querySelectorAll('.live-gallery video').length === 2);
  // Phone layout remains usable while connected.
  browser(second, ["set", "viewport", "375", "812"]);
  assert.equal(evaluate(second, () => document.documentElement.scrollWidth <= innerWidth), true);
  evaluate(second, () => [...document.querySelectorAll('button')].find(button => button.textContent === 'Leave Class').click());
  await waitFor(teacher, () => document.querySelectorAll('.live-gallery video').length === 1);
  browser(second, ["close"]); opened.delete(second);
}

async function pixel(expected, session = student) {
  return waitFor(session, (expected, isTeacher) => {
    const video = document.querySelector(isTeacher ? 'video[aria-label="Student shared screen"]' : 'video[aria-label="Teacher live video"]');
    if (!video?.videoWidth || video.readyState < 2) return false;
    const canvas = document.createElement('canvas'); canvas.width = 2; canvas.height = 2;
    const ctx = canvas.getContext('2d'); ctx.drawImage(video, 0, 0, 2, 2);
    const pixel = [...ctx.getImageData(0, 0, 1, 1).data];
    return pixel[expected] > 180 && pixel.filter((value, index) => index < 3 && index !== expected).every(value => value < 80) ? pixel : false;
  }, expected, session === teacher);
}
async function share() {
  evaluate(teacher, () => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Share Screen').click());
  await pixel(2);
  evaluate(teacher, () => { window.__screenColor = '#00ff00'; });
  await pixel(1);
}
async function studentShare() {
  evaluate(student, () => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Request Screen Share').click());
  await waitFor(teacher, () => !!document.querySelector('.live-request button'));
  evaluate(teacher, () => [...document.querySelectorAll('.live-request button')].find(button => button.textContent === 'Approve').click());
  await waitFor(student, () => [...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Share Screen'));
  evaluate(student, () => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Share Screen').click());
  await pixel(2, teacher);
  evaluate(student, () => { window.__screenColor = '#00ff00'; });
  await pixel(1, teacher);
  // Interrupt only this test student's signaling socket. The room must rejoin
  // automatically and keep broadcasting the current shared-screen track.
  const peerCount = evaluate(student, () => window.__livePeers.length);
  evaluate(student, () => { window.__liveSockets.filter(socket => socket.__room && socket.readyState === 1).forEach(socket => socket.close()); });
  await waitFor(student, count => window.__livePeers.length > count && window.__livePeers.at(-1).connectionState === 'connected', peerCount);
  evaluate(student, () => { window.__screenColor = '#0000ff'; });
  await pixel(2, teacher);
  evaluate(student, () => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Stop Screen Share').click());
  await waitFor(student, () => [...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Share Screen'));
  evaluate(student, () => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Share Screen').click());
  await pixel(2, teacher);
  evaluate(student, () => { window.__screenColor = '#00ff00'; });
  await pixel(1, teacher);
  evaluate(student, () => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Stop Screen Share').click());
}
async function sharedNotes() {
  const file = path.join(temporary, "shared-lecture-notes.png");
  copyFileSync(path.join(root, "public", "Logo.png"), file);
  browser(teacher, ["upload", '.live-material-upload input[type="file"]', file]);
  browser(teacher, ["fill", '.live-material-upload textarea', "These lecture notes must appear on both screens."]);
  browser(teacher, ["click", '.live-material-upload button[type="submit"]']);
  await waitFor(teacher, () => [...document.querySelectorAll('.live-material-item')].some(item => item.textContent.includes('shared-lecture-notes.png')));
  assert.equal(evaluate(teacher, () => document.body.innerText.includes("reading 'reset'")), false);
  evaluate(teacher, () => [...document.querySelectorAll('.live-material-item')].find(item => item.textContent.includes('shared-lecture-notes.png')).querySelector('button').click());
  for (const session of [teacher, student]) await waitFor(session, () => {
    const preview = document.querySelector('.live-stage .live-shared-material');
    const image = preview?.querySelector('img');
    return !!image?.complete && image.naturalWidth > 0 && preview.textContent.includes('These lecture notes must appear on both screens.');
  });
  const resource = evaluate(student, async () => {
    const image = document.querySelector('.live-shared-material img');
    const response = await fetch(image.src);
    return { ok: response.ok, type: response.headers.get('content-type'), bytes: (await response.arrayBuffer()).byteLength };
  });
  assert.equal(resource.ok, true);
  assert.equal(resource.type, "image/png");
  assert.ok(resource.bytes > 0);
  evaluate(teacher, () => [...document.querySelectorAll('.live-material-upload button')].find(button => button.textContent.trim() === 'Stop Sharing').click());
  await waitFor(student, () => !document.querySelector('.live-shared-material'));
  const pdfText = 'BT /F1 12 Tf 20 100 Td (Shared lecture notes regression) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${pdfText.length} >>\nstream\n${pdfText}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const pdfPath = path.join(temporary, 'shared-lecture-notes.pdf');
  writeFileSync(pdfPath, pdf);
  browser(teacher, ['upload', '.live-material-upload input[type="file"]', pdfPath]);
  browser(teacher, ['fill', '.live-material-upload textarea', 'PDF notes are available in the live classroom.']);
  browser(teacher, ['click', '.live-material-upload button[type="submit"]']);
  await waitFor(teacher, () => [...document.querySelectorAll('.live-material-item')].some(item => item.textContent.includes('shared-lecture-notes.pdf')));
  evaluate(teacher, () => [...document.querySelectorAll('.live-material-item')].find(item => item.textContent.includes('shared-lecture-notes.pdf')).querySelector('button').click());
  await waitFor(student, () => !!document.querySelector('.live-stage iframe[title="shared-lecture-notes.pdf"]'));
  browser(student, ['reload']);
  await waitFor(student, () => !!document.querySelector('.live-stage iframe[title="shared-lecture-notes.pdf"]'));
  const documentResponse = evaluate(student, async () => {
    const response = await fetch(document.querySelector('.live-stage iframe').src);
    return { type: response.headers.get('content-type'), disposition: response.headers.get('content-disposition'), content: await response.text() };
  });
  assert.equal(documentResponse.type, 'application/pdf');
  assert.ok(documentResponse.disposition.startsWith('inline'));
  assert.equal(documentResponse.content, pdf);
}
test("material API rejects cross-site uploads, empty/oversized files and invalid file IDs", async () => {
  let form = new FormData();
  assert.equal((await fetch(`${baseUrl}/api/live-materials`, { method: "POST", body: form })).status, 400);
  form = new FormData();
  form.append("file", new Blob(["content"], { type: "text/plain" }), "notes.txt");
  assert.equal((await fetch(`${baseUrl}/api/live-materials`, { method: "POST", headers: { Origin: "https://other.example" }, body: form })).status, 403);
  form = new FormData();
  form.append("file", new Blob([new Uint8Array(10 * 1024 * 1024 + 1)]), "large.pdf");
  assert.equal((await fetch(`${baseUrl}/api/live-materials`, { method: "POST", body: form })).status, 413);
  assert.equal((await fetch(`${baseUrl}/api/live-materials?id=../invalid`)).status, 404);
});
test("separate browsers share camera/audio, both screens and notes with approval, reconnect and reload", async () => {
  const id = await startAndJoin(`Connected media regression ${Date.now()}`);
  evaluate(student, () => [...document.querySelectorAll('button')].find(button => button.textContent === 'Raise Hand').click());
  await waitFor(teacher, () => document.querySelector('.conference-panel').textContent.includes('Hand raised'));
  evaluate(teacher, () => [...document.querySelectorAll('button')].find(button => button.textContent === 'Lower Hand').click());
  await waitFor(student, () => [...document.querySelectorAll('button')].some(button => button.textContent === 'Raise Hand'));
  browser(student, ['fill', '#class-chat-student', 'Realtime classroom chat regression']);
  browser(student, ['click', '.conference-panel form button']);
  await waitFor(teacher, () => document.querySelector('.conference-chat').textContent.includes('Realtime classroom chat regression'));
  evaluate(student, () => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Turn Camera On').click());
  await pixel(0, teacher);
  evaluate(student, () => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Unmute Microphone').click());
  await waitFor(teacher, () => document.querySelector('.conference-panel').textContent.includes('Student'));
  evaluate(teacher, () => [...document.querySelectorAll('button')].find(button => button.textContent === 'Mute All Students').click());
  await waitFor(student, () => [...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Unmute Microphone'));
  evaluate(teacher, () => [...document.querySelectorAll('button')].find(button => button.textContent === 'Start Recording').click());
  await waitFor(teacher, () => [...document.querySelectorAll('button')].some(button => button.textContent === 'Stop Recording'));
  await waitFor(student, () => document.body.innerText.includes('Recording in progress'));
  await pause(1300);
  evaluate(teacher, () => [...document.querySelectorAll('button')].find(button => button.textContent === 'Stop Recording').click());
  await waitFor(teacher, () => !!document.querySelector('.recording-download'));
  const recording = await evaluate(teacher, async () => {
    const blob = await (await fetch(document.querySelector('.recording-download').href)).blob();
    const header = [...new Uint8Array(await blob.slice(0, 4).arrayBuffer())];
    return { size: blob.size, header, type: blob.type };
  });
  assert.ok(recording.size > 100, 'Recording contains actual media bytes');
  assert.deepEqual(recording.header, [26, 69, 223, 163], 'Recording is a WebM media container');
  await secondStudent(id);

  await pixel(0);
  await share();
  evaluate(teacher, () => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Stop Screen Share').click());
  await pixel(0);
  await studentShare();
  await sharedNotes();
  browser(teacher, ["click", ".live-room-end"]);
  await waitFor(student, id => JSON.parse(localStorage.getItem('learnova_batch_lifecycle')).classes.find(item => item.id === id)?.status === 'Completed', id);
  await waitFor(teacher, () => !!document.querySelector('.teacher-create-live-btn'));
  browser(student, ["open", `${baseUrl}/student/courses`]);
  await waitFor(student, () => [...document.querySelectorAll('.my-course-card a')].some(link => link.textContent.includes('Continue Learning') && link.getAttribute('href') === '/student/live-classes'));
  assert.equal(evaluate(student, id => !!document.querySelector(`a[href="/student/live-classes/${id}"]`), id), false);
  browser(student, ["open", `${baseUrl}/student/live-classes`]);
}, { timeout: 90000 });
test("teacher without a camera can still connect and stream a screen to the enrolled student", async () => {
  evaluate(teacher, () => { window.__screenColor = '#0000ff'; });
  await startAndJoin(`Screen only regression ${Date.now()}`, true);
  await share();
  browser(teacher, ["click", ".live-room-end"]);
}, { timeout: 90000 });
