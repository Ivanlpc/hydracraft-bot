const { randomUUID } = require('node:crypto')
const { SignJWT } = require('jose')
const WebSocket = require('ws')
const config = require('../config/agent.json')

class AgentCommandError extends Error {
  constructor (code, outcomeUnknown = false) {
    super(`Agent command failed: ${code}${outcomeUnknown ? '. Delivery may have occurred; do not retry automatically' : ''}`)
    this.name = 'AgentCommandError'
    this.code = code
    this.outcomeUnknown = outcomeUnknown
  }
}

function required (value, name) {
  if (typeof value !== 'string' || !value.trim() || /\p{Cc}/u.test(value)) {
    throw new Error(`Missing or invalid agent setting: ${name}`)
  }
  return value
}

function settingsFor (target, settings, env) {
  if (typeof target !== 'string' || !Object.hasOwn(settings.targets || {}, target)) {
    throw new Error('Unknown agent target; configure an explicit target alias')
  }
  const prefix = settings.targets[target]?.env_prefix
  if (typeof prefix !== 'string' || !/^[A-Z][A-Z0-9_]*$/.test(prefix)) throw new Error('Invalid agent environment prefix')
  const get = suffix => required(env[`${prefix}_${suffix}`], `${prefix}_${suffix}`)
  let url
  try { url = new URL(get('URL')) } catch { throw new Error(`Invalid agent URL: ${prefix}_URL`) }
  const loopback = ['127.0.0.1', '[::1]'].includes(url.hostname)
  if ((url.protocol !== 'wss:' && !(url.protocol === 'ws:' && loopback)) || url.username || url.password || url.search || url.hash) {
    throw new Error('Agent URL must use WSS, without credentials, query or fragment; WS is only allowed on numeric loopback')
  }
  const agentId = get('ID')
  const processId = get('PROCESS_ID')
  for (const id of [agentId, processId]) {
    if (!/^[A-Za-z0-9_.:-]{1,128}$/.test(id) || id === '*') throw new Error('Invalid agent or process ID; wildcards are forbidden')
  }
  const secret = get('JWT_SECRET')
  if (Buffer.byteLength(secret) < 32) throw new Error(`Agent secret must contain at least 32 UTF-8 bytes: ${prefix}_JWT_SECRET`)
  const origin = get('ORIGIN')
  let originUrl
  try { originUrl = new URL(origin) } catch { throw new Error(`Invalid agent origin: ${prefix}_ORIGIN`) }
  const localOrigin = ['127.0.0.1', '[::1]'].includes(originUrl.hostname)
  if (originUrl.origin !== origin || (originUrl.protocol !== 'https:' && !(originUrl.protocol === 'http:' && localOrigin))) {
    throw new Error('Agent origin must be an HTTPS origin without a path; HTTP is only allowed on numeric loopback')
  }
  const issuer = required(env[`${prefix}_JWT_ISSUER`] || env.AGENT_JWT_ISSUER, 'AGENT_JWT_ISSUER')
  const audience = required(env[`${prefix}_JWT_AUDIENCE`] || env.AGENT_JWT_AUDIENCE, 'AGENT_JWT_AUDIENCE')
  const subject = required(env.AGENT_JWT_SUBJECT || 'hydracraft-bot', 'AGENT_JWT_SUBJECT')
  const timeout = Number(env.AGENT_TIMEOUT_MS || 10000)
  if (!Number.isInteger(timeout) || timeout < 100 || timeout > 30000) throw new Error('AGENT_TIMEOUT_MS must be between 100 and 30000')
  return { url: url.href, agentId, processId, secret, origin, issuer, audience, subject, timeout }
}

function validateCommand (command) {
  if (typeof command !== 'string' || !command.trim() || Buffer.byteLength(command) > 4096 || /\p{Cc}/u.test(command)) {
    throw new Error('Agent commands must be one non-empty line of at most 4096 UTF-8 bytes, without control characters')
  }
}

function safeCode (code) {
  return typeof code === 'string' && /^[a-z0-9_]{1,64}$/.test(code) ? code : 'remote_error'
}

function exchange (settings, token, expiresAt, command) {
  return new Promise((resolve, reject) => {
    let settled = false
    let commandSent = false
    const id = randomUUID()
    const socket = new WebSocket(settings.url, {
      origin: settings.origin,
      rejectUnauthorized: true,
      followRedirects: false,
      handshakeTimeout: settings.timeout,
      maxPayload: 65536,
      perMessageDeflate: false
    })
    const finish = (error, data) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket.removeAllListeners('message')
      // Each operation has its own ticket and socket; no idle authenticated session remains.
      socket.terminate()
      if (error) reject(error)
      else resolve(data)
    }
    const fail = code => finish(new AgentCommandError(code, commandSent))
    const timer = setTimeout(() => fail('timeout'), settings.timeout)
    const send = payload => {
      socket.send(JSON.stringify(payload), error => { if (error) fail('send_failed') })
    }
    socket.on('error', () => fail('connection_error'))
    socket.on('close', () => fail('connection_closed'))
    socket.on('open', () => send({ type: 'auth', token }))
    socket.on('message', (raw, binary) => {
      if (settled) return
      let message
      try { message = JSON.parse(raw.toString()) } catch { fail('invalid_response'); return }
      if (binary || !message || typeof message !== 'object' || Array.isArray(message)) { fail('invalid_response'); return }
      if (!commandSent) {
        if (message.type === 'auth.error') { fail(`auth_${safeCode(message.error?.code)}`); return }
        if (message.type !== 'auth.ok' || message.agent_id !== settings.agentId || message.subject !== settings.subject ||
            !Number.isInteger(message.expires_at) || message.expires_at <= Date.now() / 1000 || message.expires_at > expiresAt ||
            !Array.isArray(message.processes) || !message.processes.includes(settings.processId)) {
          fail('invalid_auth_response')
          return
        }
        commandSent = true
        send({ id, type: 'command.exec', process_id: settings.processId, command })
      } else if (message.type === 'response' && message.id === id) {
        if (message.ok === false) {
          // The agent replied with an explicit rejection; do not echo its potentially sensitive text.
          const code = safeCode(message.error?.code)
          const rejectedBeforeExecution = ['forbidden', 'unknown_process', 'bad_command', 'screen_missing', 'runuser_missing', 'screen_user_missing', 'screen_user_privilege', 'screen_permission', 'screen_user_unsupported'].includes(code)
          finish(new AgentCommandError(code, !rejectedBeforeExecution))
        } else if (message.ok === true && message.data && typeof message.data.output === 'string') {
          finish(null, message.data)
        } else {
          fail('invalid_response')
        }
      }
    })
  })
}

function createAgentClient (settings, env = process.env) {
  return {
    validateConfig () {
      if (!Object.hasOwn(settings.targets || {}, settings.bungeecord_target)) throw new Error('Missing Bungeecord agent target')
      for (const target of Object.keys(settings.targets)) settingsFor(target, settings, env)
    },
    async sendCommand (target, command) {
      validateCommand(command)
      const connection = settingsFor(target, settings, env)
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = now + 60
      const token = await new SignJWT({ agent: connection.agentId, processes: [connection.processId], scopes: ['command:exec'] })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuer(connection.issuer).setAudience(connection.audience).setSubject(connection.subject)
        .setIssuedAt(now).setNotBefore(now).setExpirationTime(expiresAt).setJti(randomUUID())
        .sign(Buffer.from(connection.secret, 'utf8'))
      return exchange(connection, token, expiresAt, command)
    }
  }
}

module.exports = { ...createAgentClient(config), createAgentClient, AgentCommandError }
