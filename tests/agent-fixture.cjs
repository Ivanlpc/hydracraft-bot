const { once } = require('node:events')
const { WebSocketServer } = require('ws')
const { jwtVerify } = require('jose')
const { createAgentClient } = require('../api/Agent')

module.exports = async function fixture (t, options = {}) {
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0, maxPayload: 65536 })
  await once(server, 'listening')
  t.after(() => new Promise(resolve => {
    for (const socket of server.clients) socket.terminate()
    server.close(resolve)
  }))
  const env = {
    AGENT_PROXY_URL: `ws://127.0.0.1:${server.address().port}/ws`,
    AGENT_PROXY_ID: 'node-bungee', AGENT_PROXY_PROCESS_ID: 'bungee',
    AGENT_PROXY_JWT_SECRET: 'test-only-secret-with-at-least-32-bytes',
    AGENT_PROXY_ORIGIN: 'https://panel.example.com',
    AGENT_JWT_ISSUER: 'https://panel.example.com', AGENT_JWT_AUDIENCE: 'java-node-agent',
    AGENT_TIMEOUT_MS: String(options.timeout || 1000)
  }
  const config = { bungeecord_target: 'Proxy', targets: { Proxy: { env_prefix: 'AGENT_PROXY' } } }
  const state = { commands: [], claims: [], headers: [], urls: [], errors: [], connections: 0 }
  const seen = new Set()
  server.on('connection', (socket, request) => {
    state.connections++
    state.headers.push(request.headers)
    state.urls.push(request.url)
    let authenticated = false
    socket.on('error', () => {})
    socket.on('message', async raw => {
      try {
        const message = JSON.parse(raw.toString())
        if (message.type === 'auth') {
          const { payload } = await jwtVerify(message.token, Buffer.from(env.AGENT_PROXY_JWT_SECRET), {
            algorithms: ['HS256'], issuer: env.AGENT_JWT_ISSUER, audience: env.AGENT_JWT_AUDIENCE,
            requiredClaims: ['exp', 'iat', 'nbf', 'jti', 'sub', 'agent']
          })
          if (seen.has(payload.jti)) throw new Error('reused token')
          seen.add(payload.jti)
          state.claims.push(payload)
          if (options.authError) { socket.send(JSON.stringify({ type: 'auth.error', error: { code: 'invalid_token', message: 'secret text' } })); return }
          if (options.hangAuth) return
          authenticated = true
          socket.send(JSON.stringify({ type: 'auth.ok', agent_id: payload.agent, subject: payload.sub, expires_at: payload.exp, processes: payload.processes, ...options.authResponse }))
        } else if (message.type === 'command.exec') {
          if (!authenticated) throw new Error('command before auth')
          state.commands.push(message)
          if (options.onCommand) { options.onCommand(socket, message); return }
          socket.send(JSON.stringify({ type: 'response', id: message.id, ok: true, data: { output: '' } }))
        } else {
          throw new Error('unexpected message type')
        }
      } catch (error) {
        state.errors.push(error.message)
        socket.terminate()
      }
    })
  })
  return { ...state, state, env, config, server, client: createAgentClient(config, env) }
}
