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

export enum CustomizeRule {
  Match = 'match',
  Merge = 'merge',
  Append = 'append',
  Prepend = 'prepend',
  Replace = 'replace',
}

export type CustomizeRuleString =
  | 'match'
  | 'merge'
  | 'append'
  | 'prepend'
  | 'replace';
