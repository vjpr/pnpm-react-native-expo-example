const isExpo = true
const {FileStore} = require('metro-cache')
// NOTE: Will change to `exclusionList` in metro-config@0.64.
const exclusionList = require('metro-config/src/defaults/blacklist')
// --
const MetroCore = require('metro-core')

// See: https://github.com/facebook/metro/blob/v0.59.0/packages/metro-config/src/defaults/index.js#L128
const MetroTransformWorker = require.resolve('metro/src/JSTransformer/worker.js')
const workerPath = require.resolve('metro/src/DeltaBundler/Worker.js')
// --

module.exports = require('@live/pnpm-react-native-helper/rn-cli.config.js')({isExpo, exclusionList, workerPath, FileStore, MetroCore, MetroTransformWorker})
