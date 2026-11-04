const { test } = require('node:test')
const assert = require('node:assert/strict')
const { Collection } = require('discord.js')
const load = require('./helpers.cjs')
const messages = require('../config/messages.json')

function setup (options = {}) {
  const replies = []
  let executions = 0
  const command = { data: { name: 'staff' }, permission: 'staff', execute: async () => { executions++ }, ...options.command }
  const handler = load('events/discord/interactionCreate.js', {
    '../../api/controllers/User': { getAllowedIds: async () => { if (options.databaseError) throw new Error('database unavailable'); return options.allowed || ['role-1'] } },
    '../../util/ConsoleLogger': { error () {}, command () {} }
  })
  const interaction = {
    inGuild: () => true,
    channel: { isDMBased: () => false },
    guildId: 'guild-1', user: { id: 'user-1' },
    member: { id: 'user-1', roles: { cache: new Collection([['role-1', {}]]) } },
    client: { commands: new Map([['staff', command]]), cooldowns: new Collection(), buttons: new Map(), selectMenus: new Map() },
    commandName: 'staff',
    isChatInputCommand: () => true, isAutocomplete: () => false,
    isStringSelectMenu: () => false, isButton: () => false,
    reply: async data => { replies.push(data) },
    respond: async data => { replies.push(data) },
    editReply: async data => { replies.push(data) },
    followUp: async data => { replies.push(data) },
    ...options.interaction
  }
  return { handler, interaction, replies, executions: () => executions }
}

test('role permission allows command execution', async () => {
  const s = setup()
  await s.handler.execute(s.interaction)
  assert.equal(s.executions(), 1)
})
test('direct user permission allows command execution', async () => {
  const s = setup({ allowed: ['user-1'] })
  await s.handler.execute(s.interaction)
  assert.equal(s.executions(), 1)
})
test('permission lookup errors produce a private error without executing', async () => {
  const s = setup({ databaseError: true })
  await s.handler.execute(s.interaction)
  assert.equal(s.executions(), 0)
  assert.equal(s.replies[0].content, messages.command_error)
})
test('a missing channel does not crash interaction handling', async () => {
  const s = setup({ interaction: { channel: null, inGuild: () => false } })
  await s.handler.execute(s.interaction)
  assert.equal(s.executions(), 0)
})
test('unknown autocomplete responds with choices rather than a message', async () => {
  const s = setup({ interaction: { commandName: 'missing', isChatInputCommand: () => false, isAutocomplete: () => true } })
  await s.handler.execute(s.interaction)
  assert.deepEqual(s.replies, [[]])
})
test('a deferred failed command edits its reply', async () => {
  const s = setup({ command: { execute: async () => { throw new Error('failed') } }, interaction: { deferred: true } })
  await s.handler.execute(s.interaction)
  assert.equal(s.replies[0].content, messages.command_error)
})
test('cooldowns work even when no collection was pre-created', async () => {
  const s = setup({ command: { cooldown: 10 } })
  await s.handler.execute(s.interaction)
  await s.handler.execute(s.interaction)
  assert.equal(s.executions(), 1)
  assert.match(s.replies[0].content, /staff/)
})
test('unauthorized users cannot execute a command', async () => {
  const s = setup({ allowed: [] })
  await s.handler.execute(s.interaction)
  assert.equal(s.executions(), 0)
  assert.equal(s.replies[0].content, messages.no_permission)
})
