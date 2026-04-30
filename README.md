# rspack-merge - Merge designed for Rspack

**rspack-merge** provides a `merge` function that concatenates arrays and merges objects creating a new object. If functions are encountered, it will execute them, run the results through the algorithm, and then wrap the returned values within a function again.

This behavior is particularly useful in configuring rspack although it has uses beyond it. Whenever you need to merge configuration objects, **webpack-merge** can come in handy.

## Installation

Install `rspack-merge` by your favorite package manager:

```bash
# npm
$ npm install -D rspack-merge

# yarn
$ yarn add -D rspack-merge

# pnpm
$ pnpm add -D rspack-merge

# bun
$ bun add -D rspack-merge

### **`merge(...configuration | [...configuration])`**

`merge` is the core, and the most important idea, of the API. Often this is all you need unless you want further customization.

```javascript
import { merge } from 'rspack-merge';

// Default API
const output = merge(object1, object2, object3, ...);

// You can pass an array of objects directly.
// This works with all available functions.
const output = merge([object1, object2, object3]);

// Keys matching to the right take precedence:
const output = merge(
  { fruit: "apple", color: "red" },
  { fruit: "strawberries" }
);
console.log(output);
// { color: "red", fruit: "strawberries"}
```

#### Limitations

Note that `Promise`s are not supported! If you want to return a configuration wrapped within a `Promise`, `merge` inside one. Example: `Promise.resolve(merge({ ... }, { ... }))`.

The same goes for configuration level functions as in the example below:

**rspack.config.js**

```javascript
import { defineConfig } from "@rspack/cli";

const commonConfig = { ... };

const productionConfig = { ... };

const developmentConfig = { ... };

export default defineConfig((env, args) => {
  switch(args.mode) {
    case 'development':
      return merge(commonConfig, developmentConfig);
    case 'production':
      return merge(commonConfig, productionConfig);
    default:
      throw new Error('No matching configuration was found!');
  }
})
```

You can choose the configuration you want by using `rspack --mode development` assuming you are using _@rspack/cli_.

### **`mergeWithCustomize({ customizeArray, customizeObject })(...configuration | [...configuration])`**

In case you need more flexibility, `merge` behavior can be customized per field as below:

```javascript
import { mergeWithCustomize } from 'rspack-merge';

const output = mergeWithCustomize(
  {
    customizeArray(a, b, key) {
      if (key === 'extensions') {
        return _.uniq([...a, ...b]);
      }

      // Fall back to default merging
      return undefined;
    },
    customizeObject(a, b, key) {
      if (key === 'module') {
        // Custom merging
        return _.merge({}, a, b);
      }

      // Fall back to default merging
      return undefined;
    }
  }
)(object1, object2, object3, ...);
```

For example, if the previous code was invoked with only `object1` and `object2`
with `object1` as:

```javascript
{
    foo1: ['object1'],
    foo2: ['object1'],
    bar1: { object1: {} },
    bar2: { object1: {} },
}
```

and `object2` as:

```javascript
{
    foo1: ['object2'],
    foo2: ['object2'],
    bar1: { object2: {} },
    bar2: { object2: {} },
}
```

then `customizeArray` will be invoked for each property of `Array` type, i.e:

```javascript
customizeArray(['object1'], ['object2'], 'foo1');
customizeArray(['object1'], ['object2'], 'foo2');
```

and `customizeObject` will be invoked for each property of `Object` type, i.e:

```javascript
customizeObject({ object1: {} }, { object2: {} }, bar1);
customizeObject({ object1: {} }, { object2: {} }, bar2);
```

### **`customizeArray`** and **`customizeObject`**

`customizeArray` and `customizeObject` provide small strategies to for `mergeWithCustomize`. They support `append`, `prepend`, `replace`, and wildcards for field names.

```javascript
import { mergeWithCustomize, customizeArray, customizeObject } from 'rspack-merge';

const output = mergeWithCustomize({
  customizeArray: customizeArray({
    'entry.*': 'prepend'
  }),
  customizeObject: customizeObject({
    entry: 'prepend'
  })
})(object1, object2, object3, ...);
```

## **`unique(<field>, <fields>, field => field)`**

`unique` is a strategy used for forcing uniqueness within configuration. It's most useful with plugins when you want to make sure there's only one in place.

The first `<field>` is the config property to look through for duplicates.

`<fields>` represents the values that should be unique when you run the field => field function on each duplicate.

When the order of elements of the `<field>` in the first configuration differs from the order in the second configuration, the latter is preserved.

```javascript
import { mergeWithCustomize, unique } from 'rspack-merge';

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

// Output contains only single HotModuleReplacementPlugin now and it's
// going to be the last plugin instance.
```

### **`mergeWithRules`**

To support advanced merging needs (i.e. merging within loaders), `mergeWithRules` includes additional syntax that allows you to match fields and apply strategies to match. Consider the full example below:

```javascript
const a = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'sass-loader' }],
      },
    ],
  },
};
const b = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              modules: true,
            },
          },
        ],
      },
    ],
  },
};
const result = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              modules: true,
            },
          },
          { loader: 'sass-loader' },
        ],
      },
    ],
  },
};

assert.deepStrictEqual(
  mergeWithRules({
    module: {
      rules: {
        test: 'match',
        use: {
          loader: 'match',
          options: 'replace',
        },
      },
    },
  })(a, b),
  result,
);
```

The way it works is that you should annotate fields to match using `match` (or `CustomizeRule.Match` if you are using TypeScript) matching your configuration structure and then use specific strategies to define how particular fields should be transformed. If a match doesn't exist above a rule, then it will apply the rule automatically.

**Supported annotations:**

- `match` (`CustomizeRule.Match`) - Optional matcher that scopes merging behavior to a specific part based on similarity (think DOM or jQuery selectors)
- `append` (`CustomizeRule.Append`) - Appends items
- `prepend` (`CustomizeRule.Prepend`) - Prepends items
- `replace` (`CustomizeRule.Replace`) - Replaces items
- `merge` (`CustomizeRule.Merge`) - Merges objects (shallow merge)

### Using with TypeScript

**rspack-merge** supports TypeScript out of the box. You should pass `Configuration` type from rspack to it as follows:

```typescript
import { Configuration } from "@rspack/core";
import { merge } from "rspack-merge";

const config = merge<Configuration>({...}, {...});

...
```

## Development

Install the dependencies:

```bash
pnpm install
```

## Get started

Build the library:

```bash
pnpm run build
```

Build the library in watch mode:

```bash
pnpm run dev
```

## Credits

This repository is forked from [webpack-merge](https://github.com/survivejs/webpack-merge). It adapts the original implementation for the Rspack ecosystem, bridging behavioral differences with webpack while adding Rspack-specific capabilities.

> Thanks to the [webpack-merge](https://github.com/survivejs/webpack-merge) maintainers and its original creator, [@bebraw](https://github.com/bebraw).

## License

[MIT licensed](https://github.com/rstackjs/rspack-merge/blob/main/LICENSE).
