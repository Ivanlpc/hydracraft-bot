const { test } = require('node:test')
const assert = require('node:assert/strict')
const fixture = require('./agent-fixture.cjs')
const { createAgentClient } = require('../api/Agent')

test('agent handshake uses signed short-lived, single-use, least-privilege tickets', async t => {
  const s = await fixture(t)
  assert.deepEqual(await s.client.sendCommand('Proxy', 'list'), { output: '' })
  await s.client.sendCommand('Proxy', 'lp networksync')
  assert.equal(s.state.connections, 2)
  assert.deepEqual(s.state.errors, [])
  const [first, second] = s.state.claims
  assert.equal(first.agent, 'node-bungee')
  assert.equal(first.sub, 'hydracraft-bot')
  assert.deepEqual(first.scopes, ['command:exec'])
  assert.deepEqual(first.processes, ['bungee'])
  assert.equal(first.exp - first.iat, 60)
  assert.notEqual(first.jti, second.jti)
  assert.equal(s.state.headers[0].origin, s.env.AGENT_PROXY_ORIGIN)
  assert.equal(s.state.headers[0].authorization, undefined)
  assert.deepEqual(s.state.urls, ['/ws', '/ws'])
  assert.deepEqual(s.state.commands.map(m => [m.type, m.process_id, m.command]), [['command.exec', 'bungee', 'list'], ['command.exec', 'bungee', 'lp networksync']])
})

test('auth rejection prevents command dispatch', async t => {
  const s = await fixture(t, { authError: true })
  await assert.rejects(s.client.sendCommand('Proxy', 'list'), error => error.code === 'auth_invalid_token' && !error.outcomeUnknown)
  assert.equal(s.state.commands.length, 0)
  assert.equal(s.state.connections, 1)
})

for (const response of [{ agent_id: 'other' }, { subject: 'other' }, { processes: ['other'] }, { expires_at: 1 }]) {
  test(`rejects an unexpected auth identity: ${JSON.stringify(response)}`, async t => {
    const s = await fixture(t, { authResponse: response })
    await assert.rejects(s.client.sendCommand('Proxy', 'list'), { code: 'invalid_auth_response' })
    assert.equal(s.state.commands.length, 0)
  })
}

test('explicit command rejection propagates its code without leaking remote text', async t => {
  const s = await fixture(t, { onCommand: (socket, message) => socket.send(JSON.stringify({ type: 'response', id: message.id, ok: false, error: { code: 'forbidden', message: 'sensitive-password' } })) })
  await assert.rejects(s.client.sendCommand('Proxy', 'list'), error => error.code === 'forbidden' && !error.message.includes('sensitive-password'))
})

test('responses must match the request ID', async t => {
  const s = await fixture(t, { onCommand: (socket, message) => {
    socket.send(JSON.stringify({ type: 'response', id: 'wrong', ok: true, data: { output: 'wrong' } }))
    socket.send(JSON.stringify({ type: 'response', id: message.id, ok: true, data: { output: 'matched' } }))
  } })
  assert.deepEqual(await s.client.sendCommand('Proxy', 'list'), { output: 'matched' })
})

test('timeout before auth sends no command', async t => {
  const s = await fixture(t, { hangAuth: true, timeout: 150 })
  await assert.rejects(s.client.sendCommand('Proxy', 'list'), error => error.code === 'timeout' && !error.outcomeUnknown)
  assert.equal(s.state.commands.length, 0)
})

test('lost acknowledgement reports an unknown outcome and never retries', async t => {
  const s = await fixture(t, { onCommand: () => {}, timeout: 150 })
  await assert.rejects(s.client.sendCommand('Proxy', 'list'), error => error.code === 'timeout' && error.outcomeUnknown)
  assert.equal(s.state.commands.length, 1)
  assert.equal(s.state.connections, 1)
})

test('disconnect after dispatch reports an unknown outcome without retrying', async t => {
  const s = await fixture(t, { onCommand: socket => socket.terminate() })
  await assert.rejects(s.client.sendCommand('Proxy', 'list'), error => error.code === 'connection_closed' && error.outcomeUnknown)
  assert.equal(s.state.commands.length, 1)
})

test('agent execution timeouts remain an unknown outcome', async t => {
  const s = await fixture(t, { onCommand: (socket, message) => socket.send(JSON.stringify({ type: 'response', id: message.id, ok: false, error: { code: 'screen_timeout' } })) })
  await assert.rejects(s.client.sendCommand('Proxy', 'list'), error => error.code === 'screen_timeout' && error.outcomeUnknown)
  assert.equal(s.state.commands.length, 1)
})

test('oversized WebSocket messages fail safely without redispatch', async t => {
  const s = await fixture(t, { onCommand: socket => socket.send('a'.repeat(65537)) })
  await assert.rejects(s.client.sendCommand('Proxy', 'list'), error => error.code === 'connection_error' && error.outcomeUnknown)
  assert.equal(s.state.commands.length, 1)
})

test('binary protocol messages cannot be mistaken for command success', async t => {
  const s = await fixture(t, { onCommand: (socket, message) => socket.send(Buffer.from(JSON.stringify({ type: 'response', id: message.id, ok: true, data: { output: '' } }))) })
  await assert.rejects(s.client.sendCommand('Proxy', 'list'), { code: 'invalid_response' })
})

test('parallel commands keep their tickets, request IDs and responses separate', async t => {
  const s = await fixture(t, { onCommand: (socket, message) => socket.send(JSON.stringify({ type: 'response', id: message.id, ok: true, data: { output: message.command } })) })
  assert.deepEqual(await Promise.all(['first', 'second'].map(command => s.client.sendCommand('Proxy', command))), [{ output: 'first' }, { output: 'second' }])
  assert.equal(new Set(s.state.commands.map(message => message.id)).size, 2)
  assert.equal(new Set(s.state.claims.map(claims => claims.jti)).size, 2)
})

for (const data of ['{invalid', 'null', '[]', JSON.stringify({ type: 'response', ok: true })]) {
  test(`invalid protocol response is rejected: ${data}`, async t => {
    const s = await fixture(t, { timeout: 150, onCommand: socket => socket.send(data) })
    await assert.rejects(s.client.sendCommand('Proxy', 'list'))
  })
}

test('unknown targets, oversized commands and console control characters fail before connection', async t => {
  const s = await fixture(t)
  await assert.rejects(s.client.sendCommand('unknown', 'list'), /Unknown agent target/)
  for (const command of ['', '  ', 'list\nstop', 'list\rstop', 'list\x00', 'list\x1bstop', 'a'.repeat(4097), 'é'.repeat(2049)]) {
    await assert.rejects(s.client.sendCommand('Proxy', command), /one non-empty line/)
  }
  assert.equal(s.state.connections, 0)
})

test('insecure URLs, weak secrets, wildcards and invalid origins fail validation', async t => {
  const s = await fixture(t)
  for (const override of [
    { AGENT_PROXY_URL: 'ws://agent.example.com/ws' },
    { AGENT_PROXY_URL: 'wss://user:password@agent.example.com/ws' },
    { AGENT_PROXY_URL: 'wss://agent.example.com/ws?token=secret' },
    { AGENT_PROXY_URL: 'wss://agent.example.com/ws#fragment' },
    { AGENT_PROXY_JWT_SECRET: 'short' }, { AGENT_PROXY_JWT_SECRET: '' },
    { AGENT_PROXY_PROCESS_ID: '*' }, { AGENT_PROXY_ID: '' },
    { AGENT_PROXY_ORIGIN: 'https://panel.example.com/path' },
    { AGENT_PROXY_ORIGIN: 'http://panel.example.com' },
    { AGENT_JWT_ISSUER: '' }, { AGENT_JWT_AUDIENCE: '' },
    { AGENT_TIMEOUT_MS: '0' }, { AGENT_TIMEOUT_MS: 'Infinity' }
  ]) {
    assert.throws(() => createAgentClient(s.config, { ...s.env, ...override }).validateConfig())
  }
  s.client.validateConfig()
  assert.equal(s.state.connections, 0)
})
