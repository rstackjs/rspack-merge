import { Customize, Key } from './types';
import mergeWith from './merge-with';
import { isRegex, isPlainObject } from './utils';

const isArray = Array.isArray;

export default function joinArrays({
  customizeArray,
  customizeObject,
  key,
}: {
  customizeArray?: Customize;
  customizeObject?: Customize;
  key?: Key;
} = {}) {
  return function _joinArrays(a: unknown, b: unknown, k: Key) {
    const newKey = key ? `${key}.${k}` : k;

    if (typeof a === 'function' && typeof b === 'function') {
      return (...args: unknown[]) => _joinArrays(a(...args), b(...args), k);
    }

    if (isArray(a) && isArray(b)) {
      const customResult = customizeArray && customizeArray(a, b, newKey);

      return customResult || [...a, ...b];
    }

    if (isRegex(b)) {
      return b;
    }

    if (isPlainObject(a) && isPlainObject(b)) {
      const customResult = customizeObject && customizeObject(a, b, newKey);

      return (
        customResult ||
        mergeWith(
          [a as object, b as object],
          joinArrays({
            customizeArray,
            customizeObject,
            key: newKey,
          }),
        )
      );
    }

    if (isPlainObject(b)) {
      return mergeWith(
        [{}, b as object],
        joinArrays({
          customizeArray,
          customizeObject,
          key: newKey,
        }),
      );
    }

    if (isArray(b)) {
      return [...b];
    }

    return b;
  };
}
