const getRepoRoot = require('./get-repo-root')
const path = require('path')

// NOTE: This is to solve `Transformer.transform is not a function`. Something to do with non-flattened deps.
module.exports = function getWorkerPath() {
  // The default is set in https://github.com/facebook/metro/blob/d6eefe44bdc163c04b3ada92d825451b52ecf41a/packages/metro-config/src/defaults/index.js#L116
  // As of 202012, it is 'metro/src/DeltaBundler/Worker'.
  // TODO(vjpr): Resolve the package version.

  // a.

  const workerPath = require.resolve('metro/src/DeltaBundler/Worker.js')
  console.log({workerPath})
  return workerPath

  // b. Old way.
  //const workerPath =
  //  '/node_modules/.pnpm/metro@0.58.0/node_modules/metro/src/DeltaBundler/Worker.js'
  //const repoRoot = getRepoRoot()
  //return require.resolve(path.join(repoRoot, workerPath))

}
