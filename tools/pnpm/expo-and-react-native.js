const {addDepToMany, pkgDiff} = require('./utils/index.js')

module.exports = (pkg, ctx) => {
  //////////////////////////////////////////////////////////////////////////////
  // Expo
  //////////////////////////////////////////////////////////////////////////////
  // Expo deps are usually *.
  // But metro/RN we have to manually specify hold back because they run behind.

  // WARNING
  // See also: `<repo root>/package.json#pnpm.overrides`.
  // WARNING

  //////////////////////////////////////////////////////////////////////////////

  //if (pkg.name === 'react-native') {
  //  if (pkg.version === '0.63.2') {
  //    pkg.dependencies = {
  //      ...pkg.dependencies,
  //      metro: '^0.59.0',
  //    }
  //  }
  //}
  //
  //if (pkg.name === '@react-native-community/cli') {
  //  if (pkg.version === '0.63.2') {
  //    pkg.dependencies = {
  //      ...pkg.dependencies,
  //      metro: '^0.59.0',
  //    }
  //  }
  //}

  //////////////////////////////////////////////////////////////////////////////
  // React Native v65
  //////////////////////////////////////////////////////////////////////////////

  addDepToMany(
    pkg,
    [['@react-native-community/cli-platform-ios', '^6.0.0']],
    [['ora', '^5']],
  )

  addDepToMany(
    pkg,
    [['react-native', '^0.65.0']],
    [['react-native-codegen', '^0.0.7'], ['mkdirp']],
  )

  addDepToMany(
      pkg,
      [['react-native-codegen', '^0.0.7']], ['invariant', 'glob', 'micromatch', 'mkdirp', 'chalk']
    )

  addDepToMany(
      pkg,
      [['metro-transform-worker', '^0.66.0']], ['metro-minify-uglify']
    )

  //////////////////////////////////////////////////////////////////////////////
  // Expo v40
  //////////////////////////////////////////////////////////////////////////////

  // Invariant Violation: Tried to register two views with the same name RNCSafeAreaProvider
  // TODO(vjpr): We need to be careful here when we upgrade expo.
  addDepToMany(
    pkg,
    [['expo', '40.0.1']],
    [['react-native-safe-area-context', '3.3.0']],
  )

  //////////////////////////////////////////////////////////////////////////////
  // Expo v42 - 202108
  //////////////////////////////////////////////////////////////////////////////

  addDepToMany(pkg, [['metro-config', '^0.59.0']], [])

  addDepToMany(
    pkg,
    [['@expo/dev-server']],
    [
      ['connect'],
      ['node-fetch', '^2.6.0'],
      // TODO(vjpr): From expo@40. Check still needed.
      ['@expo/spawn-async'],
    ],
  )

  addDepToMany(
    pkg,
    [['expo-cli', '^4.11.0']],
    [['@expo/metro-config', '^0.1.84'], ['resolve-from']],
  )

  addDepToMany(
    pkg,
    [['@expo/metro-config', '^0.1.84']],
    [
      ['resolve-from', '*'],
      // Disabled because `metro-config` is resolved from the project root.
      //['metro-config', '^0.59.0']
    ],
  )

  //////////////////////////////////////////////////////////////////////////////
  // react-native v64
  //////////////////////////////////////////////////////////////////////////////

  addDepToMany(
    pkg,
    [['metro-config', '^0.66.0']],
    // TODO(vjpr): Double-check this.
    /*
    Cannot find module 'metro-transform-worker'
    Require stack:
    - /Users/Vaughan/dev-mono/thirtyfive/node_modules/.pnpm/metro-config@0.66.0/node_modules/metro-config/src/defaults/index.js
    */
    [
      //['metro-transform-worker', '0.66.0'],
    ],
  )

  //////////////////////////////////////////////////////////////////////////////
  // Expo
  //////////////////////////////////////////////////////////////////////////////

  // To update see: `tmp/err.log` in a pnpm expo project

  const pkgs = [
    'expo-constants',
    'expo-keep-awake',
    'expo-asset',
    'expo-font',
    'expo-error-recovery',
    'expo-asset',
    '@expo/vector-icons',
    'expo-linear-gradient',
    'expo-sqlite',
    'react-native-vector-icons',
    'expo-file-system',
    'expo-linking',
    'expo-web-browser',
    'expo-splash-screen',
    'expo-application',
  ]
  addDepToMany(pkg, pkgs, [['@unimodules/core']])
  addDepToMany(pkg, ['@unimodules/core'], ['@unimodules/react-native-adapter'])
  addDepToMany(
    pkg,
    ['@expo/vector-icons'],
    ['expo-font', 'expo-constants', 'prop-types'],
  )
  addDepToMany(pkg, ['expo-font'], ['expo-asset', 'expo-constants'])
  addDepToMany(pkg, ['expo-asset'], ['expo-constants', 'expo-file-system'])
}
