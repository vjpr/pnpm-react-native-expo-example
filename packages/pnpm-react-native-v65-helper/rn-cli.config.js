const isExpo = false
const {FileStore} = require('metro-cache')
const exclusionList = require('metro-config/src/defaults/exclusionList')
const MetroCore = require('metro-core')

// See: https://github.com/facebook/metro/blob/v0.64.0/packages/metro-config/src/defaults/index.js#L128
const MetroTransformWorker = require.resolve('metro-transform-worker')
const workerPath = require.resolve('metro/src/DeltaBundler/Worker.js')
// --

console.log('Reading config!')
module.exports = require('@live/pnpm-react-native-helper/rn-cli.config.js')({isExpo, exclusionList, workerPath, FileStore, MetroCore, MetroTransformWorker})
