import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

import { createStore } from '../src/services/store.js';

async function temporaryStore(t) {
  const directory = await mkdtemp(join(process.cwd(), '.test-store-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const filePath = join(directory, 'state.json');
  return { directory, filePath, store: createStore(filePath) };
}

test('store serializes concurrent read-modify-write updates', async (t) => {
  const { store } = await temporaryStore(t);

  await Promise.all(Array.from({ length: 25 }, () => store.update(async (state) => {
    const value = (state.value || 0) + 1;
    await new Promise(resolve => setImmediate(resolve));
    state.value = value;
  })));

  assert.deepEqual(await store.read(), { value: 25 });
});

test('store writes valid JSON without leaving temporary files', async (t) => {
  const { directory, filePath, store } = await temporaryStore(t);

  await store.update(state => {
    state.reports = [{ id: 'one' }];
  });

  assert.deepEqual(JSON.parse(await readFile(filePath, 'utf8')), { reports: [{ id: 'one' }] });
  assert.deepEqual(await readdir(directory), ['state.json']);
});

test('a failed mutator does not overwrite the last valid state', async (t) => {
  const { store } = await temporaryStore(t);
  await store.update(state => {
    state.value = 1;
  });

  await assert.rejects(store.update(state => {
    state.value = 2;
    throw new Error('Invalid update');
  }), /Invalid update/);
  assert.deepEqual(await store.read(), { value: 1 });
});
