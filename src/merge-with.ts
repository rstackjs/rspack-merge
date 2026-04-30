function mergeWith(
  objects: object[],
  customizer: (a: unknown, b: unknown, key: string) => unknown,
) {
  const [first, ...rest] = objects;
  let ret = first;

  rest.forEach((a) => {
    ret = mergeTo(ret, a, customizer);
  });

  return ret;
}

function mergeTo(
  a: object,
  b: object,
  customizer: (a: unknown, b: unknown, key: string) => unknown,
) {
  const ret: Record<string, unknown> = {};

  Object.keys(a)
    .concat(Object.keys(b))
    .forEach((k) => {
      const v = customizer(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
        k,
      );

      ret[k] = typeof v === 'undefined' ? (a as Record<string, unknown>)[k] : v;
    });

  return ret;
}

export default mergeWith;
