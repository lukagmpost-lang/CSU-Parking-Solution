/**
 * File-based data store with atomic updates
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export function createStore(filePath) {
  let chain = Promise.resolve();
  
  async function readState() {
    try {
      const content = await readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      return {};
    }
  }
  
  async function writeState(state) {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(state, null, 2));
  }
  
  function update(mutator) {
    const run = chain.then(async () => {
      const state = await readState();
      const result = await mutator(state);
      await writeState(state);
      return result;
    });
    chain = run.then(() => undefined, () => undefined);
    return run;
  }
  
  return {
    update,
    read: () => chain.then(readState, readState),
  };
}
