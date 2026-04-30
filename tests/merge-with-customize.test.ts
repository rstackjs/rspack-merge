import { describe, it } from '@rstest/core';
import assert from 'assert';
import { rspack } from '@rspack/core';
import { mergeWithCustomize } from '../src';

describe('Merge', function () {
  customizeMergeTests(mergeWithCustomize);
});

function customizeMergeTests(merge) {
  it('should allow overriding array behavior', function () {
    const first = {
      entry: ['a'],
    };
    const second = {
      entry: ['b'],
    };

    assert.deepStrictEqual(
      merge({
        customizeArray(a) {
          return a;
        },
      })(first, second),
      first,
    );
  });

  it('should pass key to array customizer', function () {
    let receivedKey;
    const first = {
      entry: ['a'],
    };
    const second = {
      entry: ['b'],
    };
    const result = merge({
      customizeArray(a, _, key) {
        receivedKey = key;

        return a;
      },
    })(first, second);

    assert.strictEqual(receivedKey, 'entry');
    assert.deepStrictEqual(result, first);
  });

  it('should allow overriding object behavior', function () {
    const first = {
      entry: {
        a: 'foo',
      },
    };
    const second = {
      entry: {
        a: 'bar',
      },
    };

    assert.deepStrictEqual(
      merge({
        customizeObject(a) {
          return a;
        },
      })(first, second),
      first,
    );
  });

  it('should pass key to object customizer', function () {
    let receivedKey;
    const first = {
      entry: {
        a: 'foo',
      },
    };
    const second = {
      entry: {
        a: 'bar',
      },
    };
    const result = merge({
      customizeObject(a, _, key) {
        receivedKey = key;

        return a;
      },
    })(first, second);

    assert.strictEqual(receivedKey, 'entry');
    assert.deepStrictEqual(result, first);
  });

  it('should customize plugins', function () {
    let receivedKey;
    const config1 = {
      plugins: [
        new rspack.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify('development'),
          },
        }),
        new rspack.HotModuleReplacementPlugin(),
      ],
    };
    const config2 = {
      plugins: [
        new rspack.DefinePlugin({
          __CLIENT__: true,
        }),
        new rspack.IgnorePlugin({
          resourceRegExp: /^\.\/locale$/,
          contextRegExp: /moment$/,
        }),
        new rspack.HotModuleReplacementPlugin(),
      ],
    };

    merge({
      customizeArray(_, __, key) {
        receivedKey = key;
      },
    })(config1, config2);

    assert.strictEqual(receivedKey, 'plugins');
  });
}
