import mergeWith from './merge-with';
import joinArrays from './join-arrays';
import unique from './unique';
import {
  CustomizeRule,
  CustomizeRuleString,
  ICustomizeOptions,
  Key,
} from './types';
import {
  isPlainObject,
  isSameCondition,
  isUndefined,
  isPromiseLike,
} from './utils';
import wildcard from './wildcard';

function merge<Configuration extends object>(
  firstConfiguration: Configuration | Configuration[],
  ...configurations: Configuration[]
): Configuration {
  return mergeWithCustomize<Configuration>({})(
    firstConfiguration,
    ...configurations,
  );
}

function mergeWithCustomize<Configuration extends object>(
  options: ICustomizeOptions,
) {
  return function mergeWithOptions(
    firstConfiguration: Configuration | Configuration[],
    ...configurations: Configuration[]
  ): Configuration {
    if (isUndefined(firstConfiguration) || configurations.some(isUndefined)) {
      throw new TypeError('Merging undefined is not supported');
    }

    if (isPromiseLike(firstConfiguration)) {
      throw new TypeError('Promises are not supported');
    }

    if (!firstConfiguration) {
      return {} as Configuration;
    }

    if (configurations.length === 0) {
      if (Array.isArray(firstConfiguration)) {
        if (firstConfiguration.length === 0) {
          return {} as Configuration;
        }

        if (firstConfiguration.some(isUndefined)) {
          throw new TypeError('Merging undefined is not supported');
        }

        if (isPromiseLike(firstConfiguration[0])) {
          throw new TypeError('Promises are not supported');
        }

        return mergeWith(
          firstConfiguration,
          joinArrays(options),
        ) as Configuration;
      }

      return firstConfiguration;
    }

    return mergeWith(
      [firstConfiguration].concat(configurations),
      joinArrays(options),
    ) as Configuration;
  };
}

function customizeArray(rules: {
  [s: string]: CustomizeRule | CustomizeRuleString;
}) {
  return (a: unknown, b: unknown, key: Key) => {
    const matchedRule =
      Object.keys(rules).find((rule) => wildcard(rule, key)) || '';

    if (matchedRule) {
      switch (rules[matchedRule]) {
        case CustomizeRule.Prepend:
          return [...(b as unknown[]), ...(a as unknown[])];
        case CustomizeRule.Replace:
          return b;
        case CustomizeRule.Append:
        default:
          return [...(a as unknown[]), ...(b as unknown[])];
      }
    }
  };
}

type Rules = { [s: string]: CustomizeRule | CustomizeRuleString | Rules };

function mergeWithRules(rules: Rules) {
  return mergeWithCustomize({
    customizeArray: (a, b, key: Key) => {
      let currentRule: CustomizeRule | CustomizeRuleString | Rules | undefined =
        rules;

      key.split('.').forEach((k) => {
        if (!currentRule || typeof currentRule !== 'object') {
          return;
        }

        currentRule = (currentRule as Record<string, unknown>)[k] as
          | CustomizeRule
          | CustomizeRuleString
          | Rules
          | undefined;
      });

      if (isPlainObject(currentRule)) {
        return mergeWithRule({
          currentRule: currentRule as
            | CustomizeRule
            | CustomizeRuleString
            | Rules,
          a,
          b,
        });
      }

      if (typeof currentRule === 'string') {
        return mergeIndividualRule({
          currentRule,
          a: a as Array<unknown>,
          b: b as Array<unknown>,
        });
      }

      return undefined;
    },
  });
}

const isArray = Array.isArray;

function mergeWithRule({
  currentRule,
  a,
  b,
}: {
  currentRule: CustomizeRule | CustomizeRuleString | Rules;
  a: unknown;
  b: unknown;
}) {
  if (!isArray(a)) {
    return a;
  }

  const bAllMatches: unknown[] = [];
  const ret = a.map((ao) => {
    if (!isPlainObject(currentRule)) {
      return ao;
    }

    const ret: Record<string, unknown> = {};
    const rulesToMatch: string[] = [];
    const operations: Record<string, unknown> = {};
    Object.entries(currentRule).forEach(([k, v]) => {
      if (v === CustomizeRule.Match) {
        rulesToMatch.push(k);
      } else {
        operations[k] = v;
      }
    });

    const bMatches = (b as unknown[]).filter(
      (o): o is Record<string, unknown> => {
        const matches = rulesToMatch.every((rule) =>
          isSameCondition(
            (ao as Record<string, unknown>)[rule],
            (o as Record<string, unknown>)[rule],
          ),
        );

        if (matches) {
          bAllMatches.push(o);
        }

        return matches;
      },
    );

    if (!isPlainObject(ao)) {
      return ao;
    }

    Object.entries(ao).forEach(([k, v]) => {
      const rule = currentRule as Record<string, unknown>;

      switch (rule[k] as CustomizeRule) {
        case CustomizeRule.Match: {
          ret[k] = v;

          Object.entries(rule).forEach(([k, v]) => {
            if (v === CustomizeRule.Replace && bMatches.length > 0) {
              const val = last(bMatches)[k];

              if (typeof val !== 'undefined') {
                ret[k] = val;
              }
            }
          });
          break;
        }
        case CustomizeRule.Append: {
          if (!bMatches.length) {
            ret[k] = v;

            break;
          }

          const appendValue = last(bMatches)[k];

          if (!isArray(v) || !isArray(appendValue)) {
            throw new TypeError('Trying to append non-arrays');
          }

          ret[k] = v.concat(appendValue);
          break;
        }
        case CustomizeRule.Merge: {
          if (!bMatches.length) {
            ret[k] = v;

            break;
          }

          const lastValue = last(bMatches)[k];

          if (!isPlainObject(v) || !isPlainObject(lastValue)) {
            throw new TypeError('Trying to merge non-objects');
          }

          ret[k] = merge(v as object, lastValue as object);
          break;
        }
        case CustomizeRule.Prepend: {
          if (!bMatches.length) {
            ret[k] = v;

            break;
          }

          const prependValue = last(bMatches)[k];

          if (!isArray(v) || !isArray(prependValue)) {
            throw new TypeError('Trying to prepend non-arrays');
          }

          ret[k] = prependValue.concat(v);
          break;
        }
        case CustomizeRule.Replace:
          ret[k] = bMatches.length > 0 ? last(bMatches)[k] : v;
          break;
        default: {
          const currentRule = operations[k] as CustomizeRule | CustomizeRuleString | Rules;

          const b = bMatches
            .map((o) => (o as Record<string, unknown>)[k])
            .reduce(
              (acc, val) =>
                isArray(acc) && isArray(val) ? [...acc, ...val] : acc,
              [],
            );

          ret[k] = mergeWithRule({ currentRule, a: v, b });
          break;
        }
      }
    });

    return ret;
  });

  return ret.concat((b as unknown[]).filter((o) => !bAllMatches.includes(o)));
}

function mergeIndividualRule({
  currentRule,
  a,
  b,
}: {
  currentRule: CustomizeRule;
  a: Array<unknown>;
  b: Array<unknown>;
}) {
  switch (currentRule) {
    case CustomizeRule.Append:
      return a.concat(b);
    case CustomizeRule.Prepend:
      return b.concat(a);
    case CustomizeRule.Replace:
      return b;
  }

  return a;
}

function last<T>(arr: T[]): T {
  return arr[arr.length - 1];
}

function customizeObject(rules: {
  [s: string]: CustomizeRule | CustomizeRuleString;
}) {
  return (a: unknown, b: unknown, key: Key) => {
    switch (rules[key]) {
      case CustomizeRule.Prepend:
        return mergeWith([b as object, a as object], joinArrays());
      case CustomizeRule.Replace:
        return b;
      case CustomizeRule.Append:
        return mergeWith([a as object, b as object], joinArrays());
    }
  };
}

export {
  customizeArray,
  customizeObject,
  CustomizeRule,
  merge,
  merge as default,
  mergeWithCustomize,
  mergeWithRules,
  unique,
};
