// TODO(vjpr): We need to bundle this dep because we can't install it.
// Compiled with `ncc` into one file.
const semver = require('./vendor/semver.js')

// TODO(vjpr): Could probably use a function like this for everything.
exports.addDepToMany = function addDepToMany(currentPkg, pkgs, deps) {
  for (const pkg of pkgs) {
    const {name, version} = pkgArrToObject(pkg)
    if (currentPkg.name === name) {
      if (
        version !== undefined &&
        !semver.satisfies(currentPkg.version, version)
      )
        continue
      // E.g. {foo: '*', bar: '*'}
      const depObj = deps.reduce((obj, dep) => {
        const {name, version} = pkgArrToObject(dep)
        obj[name] = version ? version : '*'
        return obj
      }, {})

      const oldDeps = currentPkg.dependencies
      const newDeps = {
        ...currentPkg.dependencies,
        ...depObj,
      }
      currentPkg.dependencies = newDeps
    }
  }
}

function pkgArrToObject(spec) {
  if (Array.isArray(spec)) {
    const [name, version] = spec
    return {name, version}
  }
  return {name: spec}
}

// filter - only report diffs for these packages.
exports.pkgDiff = function pkgDiff(origPkg, newPkg, ctx, filter) {
  if (!filter.includes(origPkg.name)) return
  try {
    const same = deepCompare(origPkg, newPkg)
    const status = same ? 'un-modified' : 'modified'
    ctx.log(`[pnpmfile] '${origPkg.name}' was ${status}`)
    if (!same) {
      //depDiff(origPkg, newPkg)
      console.log(newPkg)
    }
  } catch (e) {
    ctx.log(e)
  }
}

function deepCompare(arg1, arg2) {
  if (
    Object.prototype.toString.call(arg1) ===
    Object.prototype.toString.call(arg2)
  ) {
    if (
      Object.prototype.toString.call(arg1) === '[object Object]' ||
      Object.prototype.toString.call(arg1) === '[object Array]'
    ) {
      if (Object.keys(arg1).length !== Object.keys(arg2).length) {
        return false
      }
      return Object.keys(arg1).every(function (key) {
        return deepCompare(arg1[key], arg2[key])
      })
    }
    return arg1 === arg2
  }
  return false
}

//function depDiff(origPkg, newPkg) {
//  const added = []
//  const removed = []
//  for ([k, v] of Object.entries(origPkg.dependencies)) {
//    if (Object.keys(newPkg.dependencies).includes(k)) {
//    }
//  }
//}

// TODO(vjpr): Might not handle git versions or other more complicated specifier keys like `npm:`.
// Stopped using this as if didn't handle all cases.
//function pkgStrToObject(dep) {
//  if (!dep.startsWith('@')) {
//    const [name, version] = dep.split('@')
//    return {name, version}
//  } else {
//    const [at, name, version] = dep.split('@')
//    return {name: '@' + name, version}
//  }
//}
