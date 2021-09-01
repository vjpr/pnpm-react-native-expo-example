// TODO(vjpr): Rename this to `make-rn-cli.config.js` or something.
//   It's confusing otherwise.

let cacheStats = {}

// TODO(vjpr): Make all these mandatory. Always use the wrapper.
module.exports = ({
  isExpo,
  exclusionList,
  workerPath,
  FileStore,
  MetroCore,
  MetroTransformWorker,
} = {}) => {
  const path = require('path')
  const findCacheDir = require('find-cache-dir')
  const makeResolveRequest = require('./util/make-resolver')
  const getRepoRoot = require('./util/get-repo-root')

  // We do this in a wrapper to get the versioning correct.
  //const getWorkerPath = require('./util/get-worker-path')

  ////////////////////

  if (!exclusionList) {
    // 0.64
    exclusionList = require('metro-config/src/defaults/exclusionList)')
    // 0.59
    //blacklist = require('metro-config/src/defaults/blacklist')
  }

  ////////////////////

  require('./util/logging')({MetroCore})

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

  let resolveCtx = {
    // NOTE: We attach `onReporterUpdate` within `makeResolveRequest`.
    onReporterUpdate: null,
    onCacheUpdate: _cacheStats => (cacheStats = _cacheStats),
  }
  const resolveRequest = makeResolveRequest(resolveCtx)

  ////////////////////

  let expoAssetPluginPath

  // TODO(vjpr): Use `isExpo`.
  try {
    expoAssetPluginPath = require.resolve(
      path.join(projectRoot, 'node_modules/expo/tools/hashAssetFiles'),
    )
  } catch (e) {
    // TODO(vjpr): Fix.
    console.log('Not using expo')
  }

  // Blacklist
  ////////////////////

  let customBlacklist = [
    /.*\/nest-orig\/.*/,
    // Blitz causes two `package.json` files with the same `name` because of build artifacts dir.
    // <project>/package.json
    // <project>/.blitz/build/package.json
    /.*\/\.blitz\/.*/,
    // --
    /.*\/\.venv\/.*/,
  ]

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
          reportProgress(event)
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
        assetPlugins: [isExpo ? expoAssetPluginPath : undefined].filter(
          Boolean,
        ),

        // Transformer Paths
        ////////////////////

        // From: https://github.com/facebook/metro/blob/master/packages/metro-config/src/defaults/index.js

        workerPath,
        //asyncRequireModulePath: 'metro-runtime/src/modules/asyncRequire',
        //assetRegistryPath: 'missing-asset-registry-path',
        //babelTransformerPath: 'metro-babel-transformer',
        //transformerPath: require.resolve('metro-transform-worker'),
        //minifierPath: 'metro-minify-uglify',

        ////////////////////

        //enableBabelRCLookup,

        //enableBabelRuntime
      },

      // NOTE: This is outside of the `transformer` section.
      transformerPath: MetroTransformWorker,

      // Resolver
      ////////////////////////////////////////////////////////////////////////////

      resolver: {
        blacklistRE: exclusionList([
          /.*\/default\/.*/,
          /.*\/\.cache\/.*/,
          /.*\/neon-sys-.*/,
          ...customBlacklist,
        ]),

        extraNodeModules: {},

        // NOTE: This will run for all files if watchman fails to start.
        resolveRequest,
        // --

        useWatchman: true,

        // TODO(vjpr): Could use this perhaps instead of patching.
        //   Although I think I looked into this and it was not possible.
        //hasteImplModulePath,
      },
    }
  }

  return getConfig()
}

////////////////////////////////////////////////////////////////////////////////

const cliProgress = require('cli-progress')
const c = require('chalk')
const sls = require('single-line-string')
const ora = require('ora')

const depGraphSpinner = ora(
  'Loading Metro dependency graph (this may take a while on first load)',
).start()

const progressBar = new cliProgress.SingleBar(
  {
    format: sls`
      Bundling | ${c.cyan('{bar}')}
      {percentage}% | {value}/{total} Files | ETA: {eta}s
    `,
  },
  cliProgress.Presets.shades_classic,
)

function reportProgress(event) {
  // TODO(vjpr): Time dep_graph_loading to dep_graph_loaded.
  //   Print warning that it's slow the first time.

  const handlers = {
    dep_graph_loading: () => {
      // TODO(vjpr): Would be cool to show progress bar here.
      //   Takes a long time because of our monorepo I think.
      console.log(event)
      depGraphSpinner.start()
    },
    dep_graph_loaded: () => {
      depGraphSpinner.succeed()
      console.log(event)
    },
    bundle_build_started: () => {
      //
      //buildID: '1',
      //bundleDetails: {
      //  entryFile: '/Users/Vaughan/dev-mono/thirtyfive/repos/other/audeo/packages/apps/mobile-expo/AppEntry.js',
      //  platform: 'ios',
      //  dev: true,
      //  minify: false,
      //  bundleType: 'bundle'
      //},
      //
      progressBar.start()
    },
    bundle_transform_progressed: () => {
      // TODO(vjpr): Print `enhanced-require.UnsafeCachePlugin` cache stats.
      const {transformedFileCount, totalFileCount} = event
      progressBar.setTotal(totalFileCount)
      progressBar.update(transformedFileCount)
    },
    bundle_build_done: () => {
      progressBar.stop()
      console.log('Webpack enhanced-require disk cache stats:', cacheStats)
    },
    bundle_build_failed: () => {
      progressBar.stop()
      console.log(event)
      console.log('Bundle build failed.')
    },
    client_log: () => {
      // NOTE: This is printed by default.
      // Do nothing.
      //console.log(event)
    },
  }

  const defaultHandler = () => {
    console.log(event)
  }

  const fn = handlers[event.type] ?? defaultHandler

  fn()
}
