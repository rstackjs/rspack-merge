function mergeUnique(
  key: string,
  uniques: unknown[],
  getter: (a: unknown) => string,
) {
  const uniquesSet = new Set(uniques);
  return (a: unknown[], b: unknown[], k: string) =>
    k === key &&
    Array.from(
      [...a, ...b]
        .map((it) => ({ key: getter(it), value: it }))
        .map(({ key, value }) => ({
          key: uniquesSet.has(key) ? key : value,
          value: value,
        }))
        .reduce((m, { key, value }) => {
          m.delete(key); // This is required to preserve backward compatible order of elements after a merge.
          return m.set(key, value);
        }, new Map<unknown, unknown>())
        .values(),
    );
}

export default mergeUnique;
