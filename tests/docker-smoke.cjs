const assert = require('node:assert/strict')
const fs = require('node:fs')

assert.notEqual(process.getuid(), 0, 'The bot must run as a non-root user')
assert.equal(process.env.NODE_ENV, 'production')
assert.equal(fs.existsSync('/app/.env'), false, 'Secrets must not be baked into the image')
assert.equal(fs.existsSync('/app/.git'), false)
assert.equal(fs.existsSync('/app/tests'), false)
assert.equal(fs.existsSync('/app/node_modules/eslint'), false)
for (const dependency of ['discord.js', 'dotenv', 'jose', 'ws', 'mysql', '@rodrigogs/mysql-events', 'chartjs-to-image']) {
  require.resolve(dependency, { paths: ['/app'] })
}
for (const directory of ['/app/logs', '/app/charts']) {
  fs.accessSync(directory, fs.constants.W_OK)
}
assert.equal(typeof require('/app/api/Agent').sendCommand, 'function')
console.log('Production image smoke check passed')
