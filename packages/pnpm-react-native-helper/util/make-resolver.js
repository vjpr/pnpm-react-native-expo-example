const resolveFrom = require('resolve-from')
const {
  NodeJsInputFileSystem,
  CachedInputFileSystem,
  ResolverFactory,
} = require('enhanced-resolve')
const fs = require('fs')
const path = require('path')
const {join} = require('path')
const findCacheDir = require('find-cache-dir')
const fse = require('fs-extra')

// Paths
////////////////////

const projectRoot = process.cwd()

// Config
////////////////////

// Disabled because we are using `unsafeCache` (disk cache) now.
const useResolveFrom = false
const useCache = true
const saveErrorLogInterval = false

// Caching
////////////////////

const cacheFile = findCacheDir({
  name: 'metro-resolver-webpack-custom',
  thunk: true,
  create: true,
})

// TODO(vjpr): Change tmp file name to node_modules.
let cacheFilename = cacheFile('cache.json')

let cache

let cacheStats = {
  hit: 0,
  miss: 0,
  newlyCached: 0,
}

function resetCacheStats() {
  cacheStats = {
    hit: 0,
    miss: 0,
    newlyCached: 0,
  }
}

function readCache() {
  let cache
  try {
    cache = JSON.parse(fs.readFileSync(cacheFilename, 'utf8'))
  } catch (e) {
    if (!e.code === 'ENOENT') {
      console.log(`cache read error:`, e)
      // TODO(vjpr): Handle better.
      throw new Error(`cache read error:` + e)
    }
  }

  cache = cache ?? {}

  // Setup listeners for proxy.
  const proxiedCache = new Proxy(cache, {
    get: function (target, name, receiver) {
      if (!(name in target)) {
        cacheStats.miss++
        return undefined
      }
      cacheStats.hit++
      return Reflect.get(target, name, receiver)
    },
    set: function (target, name, value, receiver) {
      if (!(name in target)) {
        cacheStats.newlyCached++
      }
      return Reflect.set(target, name, value, receiver)
    },
  })

  return proxiedCache
}

// Errs
////////////////////

const errs = []

////////////////////

// TODO(vjpr): I think syntax errors are silenced.

// TODO(vjpr): Name as `makeResolveRequest` for clarity.
module.exports = function makeResolveRequest(resolveCtx) {
  console.log('-'.repeat(80))
  console.log('NOTE: Missing dependencies are reported to `tmp/err.log`.')
  console.log(
    'Add them to pnpmfile.js and then run `pnpm update --depth=-1` in the project dir they are missing from.',
  )
  console.log('-'.repeat(80))

  //////////////////////////////////////////////////////////////////////////////

  let errorReporterInterval

  // TODO(vjpr): Do we need this interval or we can just report it on bundle build failed below?
  if (saveErrorLogInterval) {
    // Save err log every 1 second until build is done.
    errorReporterInterval = setInterval(() => {
      // TODO(vjpr): Maybe make async?
      saveErrorLogToDisk(errs)
    }, 5000)
    // --
  }

  //////////////////////////////////////////////////////////////////////////////

  if (useCache) {
    cache = readCache()

    // a.
    // TODO(vjpr): Find a better way to save.
    //process.on('exit', () => {save()})

    //setInterval(() => {save()}, 10000)

    // NOTE(vjpr): Runs too soon.
    //process.nextTick(() => {
    //  save()
    //})

    resolveCtx.onReporterUpdate = event => {
      if (event.type === 'bundle_build_started') {
        resetCacheStats()
      }
      if (event.type === 'bundle_transform_progressed') {
        resolveCtx.onCacheUpdate?.(cacheStats)
        // TODO(vjpr): Report `cacheStats`
      }
      if (event.type === 'bundle_build_failed') {
        saveErrorLogToDisk(errs)
      }
      if (event.type === 'bundle_build_done') {
        save()
        // Stop reporting errors.
        // TODO(vjpr): Should we? On future builds we also want this info.
        clearInterval(errorReporterInterval)
      }
    }

    // TODO(vjpr): Maybe there is a hook we can use. After compile?

    function save() {
      console.log('saving resolver cache')
      fs.writeFileSync(cacheFilename, JSON.stringify(cache, null, 2))
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  // Only one resolver per session.
  let resolver

  // Callback def: `metro/packages/metro-resolver/src/types.js`.
  const resolveFn = (context, request, platform) => {
    // We wrap in try-catch otherwise errors are silent.
    try {
      return doResolve()
    } catch (err) {
      // NOTE: `Cant't resolve` messages appear here.
      //   We need to look at these to install missing deps.
      const errString = err.toString()
      const found = errString.match(
        /Error: Can't resolve '(?<pkgName>.*)' in '(?<path>.*)'/,
      )
      if (found) {
        //console.log(found.groups)
        const {pkgName, path} = found.groups
        // TODO(vjpr): readPackageUp to get the name of the package that needs to patched for easier pnpmfile stuff.
        errs.push({request, pkgName, path})
      } else {
        // This will log syntax errors, etc. that we make in the resolver.
        console.log(err)
      }
    }

    function doResolve() {
      if (!resolver) {
        // Only create one resolver.
        // TODO(vjpr): Not sure if each request needs its own resolver (because of extensions)
        resolver = makeWebpackEnhancedResolveResolver(
          {context, platform}, // Metro params.
          {useCache, projectRoot, cache}, // Our params.
        )
      }

      const resolveContext = {}
      // TODO(vjpr): Check if its a dir before dirname.
      const lookupStartPath = path.dirname(context.originModulePath)

      let filePath

      if (useResolveFrom) {
        // `resolve-from` can be much faster than webpack, but won't work for complicated requests (e.g. exts).
        // See https://github.com/webpack/enhanced-resolve/issues/110#issue-245546672
        let result = resolveFrom.silent(lookupStartPath, request)
        if (result) return {type: 'sourceFile', filePath: result}
      }

      try {
        if (process.env.EXPO_RESOLVE_PROGRESS)
          console.time('webpack resolve ' + request)
        filePath = resolver.resolveSync(
          {},
          lookupStartPath,
          request,
          resolveContext,
        )
        if (process.env.EXPO_RESOLVE_PROGRESS)
          console.timeEnd('webpack resolve ' + request)
      } catch (err) {
        //console.log({err})
        //console.log(JSON.stringify(err, null, 2))
        console.log(err)
        const assets = tryAssetFile(context, request, platform)
        if (assets) return assets
        throw err
      }

      return {type: 'sourceFile', filePath}
    }
  }

  // Wrapped for perf timing.
  return (context, request, platform) => {
    if (process.env.EXPO_RESOLVE_PROGRESS) {
      console.log('request:', request)
      console.time(request)
    }
    const res = resolveFn(context, request, platform)
    if (process.env.EXPO_RESOLVE_PROGRESS) {
      console.timeEnd(request)
    }
    return res
  }
}

////////////////////////////////////////////////////////////////////////////////

function tryAssetFile(context, request, platform, err) {
  const dirname = path.dirname(request)
  const basename = path.basename(request)
  const assetResolutions = context.resolveAsset(dirname, basename, platform)
  if (assetResolutions) {
    return {
      type: 'assetFiles',
      filePaths: assetResolutions.map(name => `${dirname}/${name}`),
    }
  }
  return null
}

////////////////////////////////////////////////////////////////////////////////
// From `makePnpResolver`.

function getExtensions(context, platform) {
  const baseExtensions = context.sourceExts.map(extension => `.${extension}`)
  let finalExtensions = [...baseExtensions]
  if (context.preferNativePlatform) {
    finalExtensions = [
      ...baseExtensions.map(extension => `.native${extension}`),
      ...finalExtensions,
    ]
  }
  if (platform) {
    // We must keep a const reference to make Flow happy
    const p = platform
    finalExtensions = [
      ...baseExtensions.map(extension => `.${p}${extension}`),
      ...finalExtensions,
    ]
  }

  return finalExtensions
}

////////////////////////////////////////////////////////////////////////////////

// https://github.com/webpack/enhanced-resolve
function makeWebpackEnhancedResolveResolver(
  {context, platform},
  {useCache, projectRoot, cache},
) {
  //////////////////////////////////////////////////////////////////////////////

  // NOTE: This cache seems to be in-memory only.
  // ???: Typical usage will consume the `NodeJsInputFileSystem` + `CachedInputFileSystem`, which wraps the Node.js `fs` wrapper to add resilience + caching.
  //const cachedDuration = 5184000000 // Causes out-of-memory.
  const cachedDuration = 518400
  //const cachedDuration = 0
  const fileSystem = new CachedInputFileSystem(fs, cachedDuration)

  ////////////////////////////////////////////////////////////////////////////////

  const extensions = getExtensions(context, platform)

  const resolver = ResolverFactory.createResolver({
    // How `package.json#exports` are handled.
    //   E.g. {exports: {default: './browser.js', node: './node.js'}}
    // See: https://webpack.js.org/configuration/resolve/#resolveconditionnames
    conditionNames: [
      // TODO(vjpr): I added these in case another package uses them.
      //'import',
      //'require',
      // This is what `supports-color@7` uses to point to it's browser build.
      'default',
    ],
    mainFields: [
      // For `supports-color@5.5.0`.
      'browser',
      'main',
    ],
    fileSystem,
    extensions,
    // This determines whether you can call `resolveSync` instead of `resolve(errback...)`.
    // Metro resolver is sync so we need it. Otherwise we get...
    //   Error: Cannot 'resolveSync' because the fileSystem is not sync. Use 'resolve'!
    useSyncFileSystemCalls: true,
    // --
    // Caching
    // See: `enhanced-resolve/lib/UnsafeCachePlugin`.
    // TODO(vjpr): This may cause bad caching errors! Clear it often or set a good cache key.
    unsafeCache: useCache ? cache : false,
    cacheWithContext: false, // TODO(vjpr): not sure about this.
    // --
    modules: [
      // Because a lot of expo packages depend on react-native but don't specify it as a dep.
      // This is needed when working in a monorepo.
      path.join(projectRoot, 'node_modules'),
      // --
      'node_modules',
    ],
  })

  return resolver
}

function saveErrorLogToDisk(errs) {
  let errLogFilename = join(process.cwd(), 'tmp/err.log')
  console.log('saving err log')
  fse.outputFileSync(errLogFilename, JSON.stringify(errs, null, 2))
}
