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

export const CustomizeRule = {
  Match: 'match',
  Merge: 'merge',
  Append: 'append',
  Prepend: 'prepend',
  Replace: 'replace',
} as const;

export type CustomizeRule = (typeof CustomizeRule)[keyof typeof CustomizeRule];

export type CustomizeRuleString =
  'match' | 'merge' | 'append' | 'prepend' | 'replace';
