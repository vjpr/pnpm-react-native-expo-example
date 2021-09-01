# pnpm-expo-example

See: https://github.com/pnpm/pnpm/issues/3010

# How it works?

- We replace Metro's resolver with `webpack/enhanced-resolve` using the `resolveRequest` config option.
- We patch `metro` to fix a `jest-haste-map` issue.

# Performance

- `enhanced-resolve` is super slow, so we use the `unsafeCache` option and write this to disk.
- Loading the initial Metro dep graph takes a long time in large monorepos but this usually only has to be done once. I think it involves reading all files in your monorepo. I think this data is cached to `node_modules/.cache/metro-custom`. It would be nice to share this cache if possible across multiple mobile apps.

# Tips

Make sure you have `watchman` installed.

# Upgrading existing project

1. Don't forget to apply `package.json#pnpm.overrides` to the root of your project. (This could also be done in the `pnpmfile.js`.)

2. Make sure to add the `pnpmfile.js` lines.

Be careful of [this issue](https://github.com/pnpm/pnpm/issues/3735) when using pnpmfiles and `pnpm update` after updating a `pnpmfile`.

# Troubleshooting

### Show debug messages about resolving

```
EXPO_RESOLVE_PROGRESS=1 npm run ios
```

### Reset metro cache and our webpack enhanced-resolve `unsafeCache`.

```
rm -rf packages/expo/node_modules/.cache
```

### Reset watchman file watchers.

```
watchman watch-del-all
```

### `ReferenceError: SHA-1 for file`

```
cd packages/expo
pnpm why metro

# Ensure there are NO results
```

```
pnpm why @vjpr/metro

# Ensure there are results
```

### Delete all node_modules

This can fix bad dependency issues and will also solve https://github.com/pnpm/pnpm/issues/3735

```
npm run delete-node-modules
pnpm i
```

### See Github issues

https://github.com/pnpm/pnpm/issues/3731

# Todo

- Maybe we don't need to patch `metro`, and we just patch `jest-haste-map` because `pnpm.overrides` is smarter now.

For latest RN I think the issue is fixed anyway.

- Share the metro dep graph cache across projects.
