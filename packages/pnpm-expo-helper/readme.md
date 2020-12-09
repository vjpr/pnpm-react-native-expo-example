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
