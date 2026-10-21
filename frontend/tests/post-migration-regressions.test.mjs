// Run after `npm run build`:
// node --test tests/post-migration-regressions.test.mjs
// Uses an already-installed agent-browser (or AGENT_BROWSER); downloads nothing.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const session = `learnova-regressions-${process.pid}`;
let executable, server, baseUrl, browserStarted = false;

function findBrowser() {
  if (process.env.AGENT_BROWSER) return process.env.AGENT_BROWSER;
  const cache = process.platform === 'win32'
    ? path.join(process.env.LOCALAPPDATA || homedir(), 'npm-cache', '_npx')
    : path.join(homedir(), '.npm', '_npx');
  const binary = process.platform === 'win32' ? 'agent-browser-win32-x64.exe'
    : `agent-browser-${process.platform}-${process.arch}`;
  for (const entry of existsSync(cache) ? readdirSync(cache) : []) {
    const candidate = path.join(cache, entry, 'node_modules', 'agent-browser', 'bin', binary);
    if (existsSync(candidate)) return candidate;
  }
  throw new Error('An existing agent-browser installation is required. Set AGENT_BROWSER to its executable; this suite does not install dependencies.');
}
function browser(args, input) {
  const output = execFileSync(executable, ['--session', session, ...args], {
    cwd: root, input, encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024,
    // The driver's background browser can inherit startup pipes on Windows.
    // Navigation has no JSON result, so do not capture its output handles.
    ...(args[0] === 'open' ? { stdio: ['pipe', 'ignore', 'ignore'] } : {}),
  });
  return (output || '').trim();
}
function evaluate(fn, ...args) {
  const output = browser(['eval', '--stdin'], `(async () => JSON.stringify(await (${fn.toString()})(...${JSON.stringify(args)})))()`);
  const value = JSON.parse(output);
  return typeof value === 'string' ? JSON.parse(value) : value;
}
async function open(route) {
  browser(['open', `${baseUrl}${route}`]);
}

before(async () => {
  executable = findBrowser();
  const port = await new Promise((resolve, reject) => {
    const socket = createServer();
    socket.on('error', reject);
    socket.listen(0, '127.0.0.1', () => {
      const selected = socket.address().port;
      socket.close(() => resolve(selected));
    });
  });
  baseUrl = `http://127.0.0.1:${port}`;
  let logs = '';
  server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: root, stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', chunk => { logs = (logs + chunk).slice(-4000); });
  server.stderr.on('data', chunk => { logs = (logs + chunk).slice(-4000); });
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    if (server.exitCode !== null) throw new Error(`Test server exited: ${logs}`);
    try { ready = (await fetch(`${baseUrl}/api/health`)).ok; } catch { /* Wait for our own server. */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.ok(ready, `Test server did not become ready: ${logs}`);
  browserStarted = true;
  await open('/');
  browser(['set', 'viewport', '390', '844']);
}, { timeout: 60000 });

after(() => {
  try { if (browserStarted) browser(['close']); }
  finally { server?.kill(); }
});

async function navbarScenario(mode) {
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wait = async predicate => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (predicate()) return;
      await pause(40);
    }
    throw new Error(`Navbar did not settle at ${location.href}`);
  };
  await wait(() => document.getElementById('course-search'));
  const snapshot = () => ({
    route: location.pathname + location.search,
    open: document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'true',
    value: document.getElementById('course-search').value,
  });
  const edit = async value => {
    const input = document.getElementById('course-search');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await pause(50);
    if (!snapshot().open) document.querySelector('.menu-toggle').click();
    await pause(50);
  };
  const settle = async route => {
    await wait(() => location.pathname + location.search === route);
    await wait(() => route.startsWith('/courses') ? document.querySelector('.courses-page') : document.querySelector('.home'));
    await pause(100);
    return snapshot();
  };
  const click = href => Array.from(document.querySelectorAll('.nav-links a')).find(a => a.getAttribute('href') === href).click();
  if (mode === 'history') {
    await edit('home draft');
    click('/courses');
    const pushed = await settle('/courses');
    await edit('courses draft');
    history.back();
    const back = await settle('/');
    history.forward();
    return { pushed, back, forward: await settle('/courses') };
  }
  if (mode === 'query') {
    const initial = snapshot();
    await edit('discard this draft');
    click('/');
    const pushed = await settle('/');
    history.back();
    const back = await settle('/?q=python');
    history.forward();
    return { initial, pushed, back, forward: await settle('/') };
  }
  await edit('keep while editing');
  document.querySelector('.menu-toggle').click();
  await pause(50);
  const rerender = snapshot();
  document.querySelector('.menu-toggle').click();
  click('/');
  const sameRoute = await settle('/');
  const repeated = [];
  for (const href of ['/courses', '/', '/courses', '/']) {
    await edit(`discard before ${href}`);
    click(href);
    repeated.push(await settle(href));
  }
  return { rerender, sameRoute, repeated };
}

test('navbar closes and discards drafts on push, back and forward without resurrecting old state', async () => {
  await open('/');
  const result = evaluate(navbarScenario, 'history');
  for (const [transition, state] of Object.entries(result)) {
    assert.equal(state.open, false, `${transition}: menu remains open`);
    assert.equal(state.value, '', `${transition}: stale search draft`);
  }
});

test('query-only transitions reset the draft and restore the URL query on back/forward', async () => {
  await open('/?q=python');
  const result = evaluate(navbarScenario, 'query');
  assert.equal(result.initial.value, 'python');
  assert.equal(result.pushed.value, '');
  assert.equal(result.back.value, 'python');
  assert.equal(result.forward.value, '');
  for (const state of [result.pushed, result.back, result.forward]) assert.equal(state.open, false);
});

test('ordinary rerenders and unchanged URLs preserve editing, while repeated genuine transitions reset it', async () => {
  await open('/');
  const result = evaluate(navbarScenario, 'repeated');
  assert.equal(result.rerender.value, 'keep while editing');
  assert.equal(result.sameRoute.value, 'keep while editing');
  for (const state of result.repeated) {
    assert.equal(state.open, false);
    assert.equal(state.value, '');
  }
});

async function assignmentScenario(mode) {
  const key = 'learnova_student_assignment_submissions';
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wait = async predicate => {
    for (let attempt = 0; attempt < 150; attempt++) {
      if (predicate()) return;
      await pause(20);
    }
    throw new Error(`Assignment did not settle: ${document.querySelector('[role="status"]')?.textContent}`);
  };
  await wait(() => document.querySelector('.view-assignment-btn'));
  document.querySelector('.view-assignment-btn').click();
  await wait(() => document.querySelector('dialog[open] .assignment-submit-form'));
  const form = document.querySelector('.assignment-submit-form');
  const input = form.querySelector('input[type="file"]');
  const notes = form.querySelector('textarea');
  notes.value = '  Regression notes  ';
  const nativeReader = window.FileReader;
  const nativeSet = Storage.prototype.setItem;
  const nativeReset = form.reset.bind(form);
  let readers = 0, writes = 0, resets = 0;
  let failRead = mode === 'read-failure', failSave = mode === 'storage-failure';
  window.FileReader = class extends nativeReader {
    readAsDataURL(file) {
      readers++;
      setTimeout(() => {
        if (failRead) this.onerror?.(new Event('error'));
        else super.readAsDataURL(file);
      }, 60);
    }
  };
  Storage.prototype.setItem = function (name, value) {
    if (name === key && failSave) throw new DOMException('Regression storage full', 'QuotaExceededError');
    const result = nativeSet.call(this, name, value);
    if (name === key) writes++;
    return result;
  };
  form.reset = () => { resets++; nativeReset(); };
  const choose = file => {
    const transfer = new DataTransfer();
    if (file) transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const message = () => document.querySelector('dialog[open] [role="status"]')?.textContent;
  const submit = () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  try {
    if (mode === 'validation') {
      const messages = [];
      for (const file of [null, new File(['bad'], 'bad.txt', { type: 'text/plain' }), new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.pdf', { type: 'application/pdf' })]) {
        choose(file); submit(); await pause(40); messages.push(message());
      }
      return { messages, readers, writes, resets, notes: notes.value, stored: localStorage.getItem(key) };
    }
    choose(new File(['%PDF-1.4 regression fixture'], 'regression.pdf', { type: 'application/pdf' }));
    form.requestSubmit();
    if (mode === 'duplicate') form.requestSubmit();
    let failure;
    if (failRead || failSave) {
      await wait(() => !!message());
      failure = { message: message(), resets, writes, notes: notes.value, fileCount: input.files.length, stored: localStorage.getItem(key) };
      failRead = false; failSave = false;
      form.requestSubmit();
    }
    await wait(() => message() === 'Assignment submitted successfully.');
    await pause(150);
    return {
      failure, message: message(), readers, writes, resets,
      notesAfterReset: notes.value, filesAfterReset: input.files.length,
      saved: JSON.parse(localStorage.getItem(key)),
      fileDisplayed: document.querySelector('.assignment-submitted-file')?.textContent,
    };
  } finally {
    window.FileReader = nativeReader;
    Storage.prototype.setItem = nativeSet;
  }
}

async function assignment(mode) {
  evaluate(() => { localStorage.removeItem('learnova_student_assignment_submissions'); return true; });
  await open('/student/assignments');
  return evaluate(assignmentScenario, mode);
}
function assertSuccessful(result) {
  assert.equal(result.message, 'Assignment submitted successfully.');
  assert.equal(result.writes, 1);
  assert.equal(result.resets, 1);
  assert.equal(result.notesAfterReset, '');
  assert.equal(result.filesAfterReset, 0);
  assert.match(result.fileDisplayed, /regression\.pdf/);
  const saved = result.saved['Build a Responsive Website'];
  assert.equal(saved.notes, 'Regression notes');
  assert.equal(saved.fileName, 'regression.pdf');
  assert.match(saved.fileData, /^data:application\/pdf;base64,/);
}

test('valid PDF saves, resets the captured form after the async event, and survives reload', async () => {
  assertSuccessful(await assignment('success'));
  await open('/student/assignments');
  const persisted = evaluate(async () => {
    for (let n = 0; n < 100 && !document.querySelector('.view-assignment-btn'); n++) await new Promise(r => setTimeout(r, 20));
    document.querySelector('.view-assignment-btn').click();
    await new Promise(r => setTimeout(r, 80));
    return document.querySelector('.assignment-submitted-file')?.textContent;
  });
  assert.match(persisted, /regression\.pdf/);
});

test('missing, unsupported and oversized files retain their validation messages without saving or resetting', async () => {
  const result = await assignment('validation');
  assert.deepEqual(result.messages, ['Please select a PDF, JPG, JPEG, PNG, or WEBP file.', 'Only PDF and image files are allowed.', 'File size must be 10 MB or smaller.']);
  assert.equal(result.readers, 0);
  assert.equal(result.writes, 0);
  assert.equal(result.resets, 0);
  assert.equal(result.notes, '  Regression notes  ');
  assert.equal(result.stored, null);
});

for (const mode of ['read-failure', 'storage-failure']) {
  test(`${mode} retains the form, reports failure, and allows a successful retry`, async () => {
    const result = await assignment(mode);
    assert.equal(result.failure.message, mode === 'read-failure' ? 'The selected file could not be read.' : 'Regression storage full');
    assert.equal(result.failure.resets, 0);
    assert.equal(result.failure.writes, 0);
    assert.equal(result.failure.fileCount, 1);
    assert.equal(result.failure.notes, '  Regression notes  ');
    assert.equal(result.failure.stored, null);
    assertSuccessful(result);
  });
}

test('overlapping submission events read, persist and reset the assignment exactly once', async () => {
  const result = await assignment('duplicate');
  assertSuccessful(result);
  assert.equal(result.readers, 1);
  assert.equal(Object.keys(result.saved).length, 1);
});
