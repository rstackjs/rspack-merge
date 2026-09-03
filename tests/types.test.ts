import { describe, expect, it } from 'rstack/test';
import { CustomizeRule } from '../src/index.ts';

describe('public types', () => {
  it('preserves enum-compatible CustomizeRule member types', () => {
    const rules: [
      CustomizeRule.Match,
      CustomizeRule.Merge,
      CustomizeRule.Append,
      CustomizeRule.Prepend,
      CustomizeRule.Replace,
    ] = [
      CustomizeRule.Match,
      CustomizeRule.Merge,
      CustomizeRule.Append,
      CustomizeRule.Prepend,
      CustomizeRule.Replace,
    ];

    expect(rules).toEqual(['match', 'merge', 'append', 'prepend', 'replace']);
  });
});
