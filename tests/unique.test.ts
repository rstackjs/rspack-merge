import { describe, it } from '@rstest/core';
import assert from 'assert';
import { rspack } from '@rspack/core';
import { mergeWithCustomize, unique } from '../src';

describe('Unique', function () {
  it('should allow unique definitions', function () {
    const output = mergeWithCustomize({
      customizeArray: unique(
        'plugins',
        ['HotModuleReplacementPlugin'],
        (plugin) => plugin.constructor && plugin.constructor.name,
      ),
    })(
      {
        plugins: [new rspack.HotModuleReplacementPlugin()],
      },
      {
        plugins: [new rspack.HotModuleReplacementPlugin()],
      },
    );
    const expected = {
      plugins: [new rspack.HotModuleReplacementPlugin()],
    };

    assert.deepStrictEqual(output, expected);
  });

  it('should pick the last plugin (#119)', function () {
    const output = mergeWithCustomize({
      customizeArray: unique(
        'plugins',
        ['DefinePlugin'],
        (plugin) => plugin.constructor && plugin.constructor.name,
      ),
    })(
      {
        plugins: [
          new rspack.DefinePlugin({
            a: 'a',
          }),
        ],
      },
      {
        plugins: [
          new rspack.DefinePlugin({
            b: 'b',
          }),
        ],
      },
    );
    const expected = {
      plugins: [
        new rspack.DefinePlugin({
          b: 'b',
        }),
      ],
    };

    assert.deepStrictEqual(output, expected);
  });

  it('should not lose any trailing plugins', function () {
    const output = mergeWithCustomize({
      customizeArray: unique(
        'plugins',
        ['HotModuleReplacementPlugin'],
        (plugin) => plugin.constructor && plugin.constructor.name,
      ),
    })(
      {
        plugins: [
          new rspack.HotModuleReplacementPlugin(),
          new rspack.DefinePlugin({}),
        ],
      },
      {
        plugins: [new rspack.HotModuleReplacementPlugin()],
      },
    );
    // The HMR plugin is picked from the last one due to
    // default ordering!
    const expected = {
      plugins: [
        new rspack.DefinePlugin({}),
        new rspack.HotModuleReplacementPlugin(),
      ],
    };

    assert.deepStrictEqual(output, expected);
  });

  it('should not lose any leading plugins', function () {
    const output = mergeWithCustomize({
      customizeArray: unique(
        'plugins',
        ['HotModuleReplacementPlugin'],
        (plugin) => plugin.constructor && plugin.constructor.name,
      ),
    })(
      {
        plugins: [
          new rspack.DefinePlugin({}),
          new rspack.HotModuleReplacementPlugin(),
        ],
      },
      {
        plugins: [new rspack.HotModuleReplacementPlugin()],
      },
    );
    // The HMR plugin is picked from the last one due to
    // default ordering!
    const expected = {
      plugins: [
        new rspack.DefinePlugin({}),
        new rspack.HotModuleReplacementPlugin(),
      ],
    };

    assert.deepStrictEqual(output, expected);
  });

  it('should check only against named plugins (#125)', function () {
    const output = mergeWithCustomize({
      customizeArray: unique(
        'plugins',
        ['DefinePlugin'],
        (plugin) => plugin.constructor && plugin.constructor.name,
      ),
    })(
      {
        plugins: [
          new rspack.HotModuleReplacementPlugin(),
          new rspack.DefinePlugin({}),
        ],
      },
      {
        plugins: [new rspack.HotModuleReplacementPlugin()],
      },
    );
    const expected = {
      plugins: [
        new rspack.HotModuleReplacementPlugin(),
        new rspack.DefinePlugin({}),
        new rspack.HotModuleReplacementPlugin(),
      ],
    };

    assert.deepStrictEqual(output, expected);
  });
});
