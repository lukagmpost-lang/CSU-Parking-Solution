import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function startServer(t) {
  const directory = await mkdtemp(join(process.cwd(), '.test-server-'));
  const dataFile = join(directory, 'parking-data.json');
  const child = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, DATA_FILE: dataFile, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';

  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });

  const port = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server startup timed out: ' + output)), 5000);
    const onData = () => {
      const match = output.match(/http:\/\/localhost:(\d+)/);
      if (!match) return;
      clearTimeout(timeout);
      child.stdout.off('data', onData);
      resolve(Number(match[1]));
    };
    child.stdout.on('data', onData);
    child.once('exit', code => {
      clearTimeout(timeout);
      reject(new Error('Server exited during startup (' + code + '): ' + output));
    });
    onData();
  });

  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill('SIGTERM');
      await exited;
    }
    await rm(directory, { recursive: true, force: true });
  });

  return { baseUrl: 'http://127.0.0.1:' + port, dataFile };
}

async function post(baseUrl, path, body, raw = false) {
  const response = await fetch(baseUrl + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ? body : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

test('report API validates input and persists report-derived availability atomically', async (t) => {
  const { baseUrl, dataFile } = await startServer(t);

  const malformed = await post(baseUrl, '/api/reports', '{bad-json', true);
  assert.equal(malformed.status, 400);
  assert.equal(malformed.body.error, 'Invalid JSON body');

  const invalidNote = await post(baseUrl, '/api/reports', {
    facilityId: 'lot21', issueType: 'lot_full', note: { invalid: true },
  });
  assert.equal(invalidNote.status, 400);
  assert.equal(invalidNote.body.error, 'Note must be a string');

  const first = await post(baseUrl, '/api/reports', { facilityId: 'lot21', issueType: 'lot_full' });
  assert.equal(first.status, 201);
  let response = await fetch(baseUrl + '/api/facilities/lot21');
  let facility = await response.json();
  assert.equal(facility.availability.status, 'Filling Fast');
  assert.equal(facility.availability.reportCount, 1);

  const second = await post(baseUrl, '/api/reports', { facilityId: 'lot21', issueType: 'lot_full' });
  assert.equal(second.status, 201);
  response = await fetch(baseUrl + '/api/facilities/lot21');
  facility = await response.json();
  assert.equal(facility.availability.status, 'Full');
  assert.equal(facility.availability.reportCount, 2);

  const closure = await post(baseUrl, '/api/reports', { facilityId: 'lot21', issueType: 'event_closure' });
  assert.equal(closure.status, 201);
  const refreshed = await post(baseUrl, '/api/availability/refresh', {});
  assert.equal(refreshed.status, 200);
  response = await fetch(baseUrl + '/api/facilities/lot21');
  facility = await response.json();
  assert.equal(facility.availability.status, 'Closed');
  assert.equal(facility.availability.reportCount, 2);
  assert.equal(facility.activeReports.length, 3);

  const persisted = JSON.parse(await readFile(dataFile, 'utf8'));
  assert.equal(persisted.reports.length, 3);
  assert.equal(persisted.availability.lot21.status, 'Closed');
  assert.equal(persisted.availability.lot21.reportCount, 2);

  persisted.reports.forEach(report => { report.expiresAt = Date.now() - 1; });
  await writeFile(dataFile, JSON.stringify(persisted));
  await post(baseUrl, '/api/availability/refresh', {});
  response = await fetch(baseUrl + '/api/facilities/lot21');
  facility = await response.json();
  assert.equal(facility.activeReports.length, 0);
  assert.equal(facility.availability.reportCount, 0);
  assert.notEqual(facility.availability.status, 'Closed');
});
