export class MemoryStorage {
  #values = new Map();

  get length() {
    return this.#values.size;
  }

  clear() {
    this.#values.clear();
  }

  getItem(key) {
    return this.#values.has(String(key)) ? this.#values.get(String(key)) : null;
  }

  key(index) {
    return Array.from(this.#values.keys())[index] || null;
  }

  removeItem(key) {
    this.#values.delete(String(key));
  }

  setItem(key, value) {
    this.#values.set(String(key), String(value));
  }
}

export function useLocalStorage(t) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = new MemoryStorage();

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });

  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  });

  return storage;
}
