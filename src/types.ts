export type Key = string;

export type CustomizeArray = (
  a: unknown[],
  b: unknown[],
  key: Key,
) => false | undefined | unknown[];

export type CustomizeObject = (a: object, b: object, key: Key) => unknown;

export interface ICustomizeOptions {
  customizeArray?: CustomizeArray;
  customizeObject?: CustomizeObject;
}

const customizeRule = {
  Match: 'match',
  Merge: 'merge',
  Append: 'append',
  Prepend: 'prepend',
  Replace: 'replace',
} as const;

export { customizeRule as CustomizeRule };

export type CustomizeRule = (typeof customizeRule)[keyof typeof customizeRule];

// Preserve enum-style member types without emitting syntax Node must transform.
// rslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace CustomizeRule {
  type Match = typeof customizeRule.Match;
  type Merge = typeof customizeRule.Merge;
  type Append = typeof customizeRule.Append;
  type Prepend = typeof customizeRule.Prepend;
  type Replace = typeof customizeRule.Replace;
}

export type CustomizeRuleString =
  'match' | 'merge' | 'append' | 'prepend' | 'replace';
