const { test } = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const { once } = require('node:events')
const request = require('../api/Requests')

test('HTTP client handles JSON, empty responses, invalid JSON and upstream errors', async t => {
  const server = http.createServer((req, res) => {
    if (req.url === '/empty') { res.writeHead(204); res.end(); return }
    if (req.url === '/error') { res.writeHead(503); res.end('unavailable'); return }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(req.url === '/invalid' ? '{invalid' : '{"ok":true}')
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}`
  assert.deepEqual(await request(base), { ok: true })
  assert.equal(await request(base + '/empty'), null)
  await assert.rejects(request(base + '/error'), /503/)
  await assert.rejects(request(base + '/invalid'), SyntaxError)
})

