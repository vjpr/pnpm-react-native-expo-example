const findUp = require('find-up')
const path = require('path')

module.exports = function getRepoRoot() {
  return path.dirname(findUp.sync('pnpm-workspace.yaml', {cwd: process.cwd()}))
}
