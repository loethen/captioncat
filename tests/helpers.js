export function memoryStorage(initial = {}) {
  let values = structuredClone(initial);
  return {
    async get(key) { return { [key]: structuredClone(values[key]) }; },
    async set(patch) { Object.assign(values, structuredClone(patch)); },
    async remove(key) { delete values[key]; },
    snapshot() { return structuredClone(values); },
  };
}
