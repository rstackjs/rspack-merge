function isRegex(o: unknown): o is RegExp {
  return o instanceof RegExp;
}

function isPlainObject(value: unknown) {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  if (proto === null) {
    return true;
  }

  let baseProto = proto;
  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto);
  }

  return proto === baseProto;
}

function isUndefined(value: unknown): value is undefined {
  return typeof value === 'undefined';
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  );
}

export function flatten<T, R>(target: T): R {
  const delimiter = '.';
  const output: Record<string, unknown> = {};

  function step(object, prev?) {
    Object.keys(object).forEach(function (key) {
      const value = object[key];
      const type = Object.prototype.toString.call(value);

      const newKey = prev ? prev + delimiter + key : key;

      if (
        !Array.isArray(value) &&
        !Buffer.isBuffer(value) &&
        isPlainObject(value) &&
        Object.keys(value).length
      ) {
        return step(value, newKey);
      }

      output[newKey] = value;
    });
  }

  step(target);

  return output as R;
}

function isSameCondition(a, b) {
  if (!a || !b) {
    return a === b;
  }
  if (
    typeof a === 'string' ||
    typeof b === 'string' ||
    isRegex(a) ||
    isRegex(b) ||
    typeof a === 'function' ||
    typeof b === 'function'
  ) {
    return a.toString() === b.toString();
  }

  const entriesA = Object.entries(flatten<unknown, object>(a));
  const entriesB = Object.entries(flatten<unknown, object>(b));
  if (entriesA.length !== entriesB.length) {
    return false;
  }

  for (let i = 0; i < entriesA.length; i++) {
    entriesA[i][0] = entriesA[i][0].replace(/\b\d+\b/g, '[]');
    entriesB[i][0] = entriesB[i][0].replace(/\b\d+\b/g, '[]');
  }

  function cmp([k1, v1]: [string, unknown], [k2, v2]: [string, unknown]) {
    if (k1 < k2) return -1;
    if (k1 > k2) return 1;
    if (String(v1) < String(v2)) return -1;
    if (String(v1) > String(v2)) return 1;
    return 0;
  }
  entriesA.sort(cmp);
  entriesB.sort(cmp);

  if (entriesA.length !== entriesB.length) {
    return false;
  }
  for (let i = 0; i < entriesA.length; i++) {
    if (
      entriesA[i][0] !== entriesB[i][0] ||
      entriesA[i][1]?.toString() !== entriesB[i][1]?.toString()
    ) {
      return false;
    }
  }
  return true;
}

export {
  isUndefined,
  isRegex,
  isPlainObject,
  isSameCondition,
  isPromiseLike,
};
