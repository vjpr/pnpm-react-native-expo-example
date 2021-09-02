# @live/app-templates.expo-v42

An app template for using Expo in a pnpm monorepo.

# Explanation

See: https://github.com/pnpm/pnpm/issues/3731

# Tips

Don't name anything the same in the root dir. Case sensitivity is a problem and also `app`, `app.json`, 'App.tsx' would cause problems.

# Troubleshooting

## Clear cache

See: https://stackoverflow.com/questions/46878638/how-to-clear-react-native-cache

`watchman watch-del-all`

## Working on multiple apps

You must exit the app on the simulator before loading a new app or it won't work.
