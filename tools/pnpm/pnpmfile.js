module.exports = {
  hooks: {readPackage, afterAllResolved},
}

function afterAllResolved(lockfile, context) {
  return lockfile
}
function readPackage(pkg, ctx) {
  require('./expo-and-react-native')(pkg, ctx)
  return pkg
}
