const path = require('path')
const makeResolveRequest = require('./util/make-resolver')
const {FileStore} = require('metro-cache')
const findCacheDir = require('find-cache-dir')
const blacklist = require('metro-config/src/defaults/blacklist')
const getRepoRoot = require('./util/get-repo-root')
const getWorkerPath = require('./util/get-worker-path')

require('./util/logging')

// Paths
////////////////////

const projectRoot = process.cwd()

// Caching
////////////////////

const cacheFileStore = new FileStore({
  root: findCacheDir({name: 'metro-custom', create: true}),
})

// Resolving
////////////////////

let resolveCtx = {}
const resolveRequest = makeResolveRequest(resolveCtx)

////////////////////

let expoAssetPluginPath = require.resolve(
  path.join(projectRoot, 'node_modules/expo/tools/hashAssetFiles'),
)

// Blacklist
////////////////////

let customBlacklist = [/.*\/nest-orig\/.*/]

////////////////////

// See https://facebook.github.io/metro/docs/en/configuration.
function getConfig() {
  return {
    // Paths
    ////////////////////////////////////////////////////////////////////////////

    projectRoot: path.resolve(projectRoot),

    watchFolders: [
      path.resolve(projectRoot),
      path.join(path.resolve(projectRoot), 'node_modules'),

      /*
      Only needed for pnpm monorepo usage

      To avoid the following error we must add the repo root:

      ```
      Expected path `/xxx/node_modules/.registry.npmjs.org/@babel/runtime/7.2.0/node_modules/@babel/runtime/helpers/interopRequireDefault.js` to be relative to one of the project roots
      ```
      */
      getRepoRoot(),
    ],

    // Caching
    ////////////////////////////////////////////////////////////////////////////

    cacheStores: [cacheFileStore],

    //cacheVersion,

    //resetCache,

    // Reporting
    ////////////////////////////////////////////////////////////////////////////

    // See https://github.com/facebook/metro/blob/92f8e5deee2fb574ccf68d7ce4de5fecf7477df6/packages/metro/src/lib/reporting.js#L32
    reporter: {
      update: event => {
        console.log(event)
        resolveCtx.onReporterUpdate && resolveCtx.onReporterUpdate(event)
      },
    },

    server: {
      //enhanceMiddleware: (middlware, server) => middleware,
      //enableVisualizer: true, // Install `metro-visualizer`.
    },

    // Transformer
    ////////////////////////////////////////////////////////////////////////////

    transformer: {
      // Because react-native (expo fork?) fails to resolve it unless we install expo in the repo root.
      //   https://github.com/pnpm/pnpm/issues/1501#issuecomment-446699920
      //   TODO(vjpr): Although this is bad because it prevents using multiple versions across projects.
      assetPlugins: [expoAssetPluginPath],

      //enableBabelRCLookup,

      //enableBabelRuntime
    },

    // Resolver
    ////////////////////////////////////////////////////////////////////////////

    resolver: {
      workerPath: getWorkerPath(),

      blacklistRE: blacklist([
        /.*\/default\/.*/,
        /.*\/\.cache\/.*/,
        ...customBlacklist,
      ]),

      extraNodeModules: {},

      // NOTE: This will run for all files if watchman fails to start.
      resolveRequest,
      // --

      useWatchman: false,

      // TODO(vjpr): Could use this perhaps instead of patching.
      //   Although I think I looked into this and it was not possible.
      //hasteImplModulePath,
    },
  }
}

module.exports = getConfig()
