# @live/pnpm-expo-helper

Config helpers for running Expo with pnpm.

# Explanation

See:
- https://github.com/pnpm/pnpm/issues/3010
- https://github.com/pnpm/pnpm/issues/2622
- https://github.com/pnpm/pnpm/issues/1501

# Versioning

Seems to work when we use 0.64.0 of `metro` and friends. I think it's because by overriding `resolver.resolveRequest` we are skipping all resolution.

# Clear cache

See: https://stackoverflow.com/questions/46878638/how-to-clear-react-native-cache

`watchman watch-del-all`

lodash

# Compared with yarn

The difference is also that you are using it in a massive pnpm monorepo.

So there are a lots of issues with singleton packages that are hard to track down.

Keep a close eye on versions.

We really need a tool to ensure the same version is used, but not just for workspace packages, for transitive deps too.

# Logging

For detailed logging of bundling and resolution/compilation times, enable this.

We show a simple progress bar otherwise.

```
EXPO_RESOLVE_PROGRESS=1
```
