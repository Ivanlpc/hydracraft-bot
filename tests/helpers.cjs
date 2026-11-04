const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')

// Load the real module while replacing only its external boundaries.
module.exports = function load (file, dependencies = {}) {
  const filename = path.resolve(__dirname, '..', file)
  const requireFromFile = createRequire(filename)
  const mod = { exports: {} }
  const compiled = vm.runInThisContext(`(function(require, module, exports, __dirname, __filename) { ${fs.readFileSync(filename, 'utf8')}\n})`, { filename })
  compiled(id => Object.hasOwn(dependencies, id) ? dependencies[id] : requireFromFile(id), mod, mod.exports, path.dirname(filename), filename)
  return mod.exports
}
