const { test } = require('node:test')
const assert = require('node:assert/strict')
const { Collection, Role, User } = require('discord.js')
const load = require('./helpers.cjs')
const queries = require('../api/Queries')
const messages = require('../config/messages.json')
const config = require('../config/config.json').commands.perm.subcommands

function fixture () {
  let rows = []
  const controller = load('api/controllers/User.js', {
    '../Database': {
      execute: async (query, params) => {
        if (query === queries.addPermission) {
          rows.push({ guild: params[0], id: params[1], permission: params[2] })
          return { affectedRows: 1 }
        }
        assert.ok(query === queries.removePermission || query === queries.clearPermissions)
        const before = rows.length
        rows = rows.filter(row => !(row.guild === params[0] && row.id === params[1] && (query === queries.clearPermissions || row.permission === params[2])))
        return { affectedRows: before - rows.length }
      },
      fetchAll: async (query, [guild, permission]) => {
        assert.equal(query, queries.getAllowedIds)
        return rows.filter(row => row.guild === guild && (row.permission === permission || row.permission === 'all')).map(row => ({ id: row.id }))
      }
    },
    './Server': {}, './Guild': {}, '../../util/ConsoleLogger': { error () {} }
  })
  const handler = load('events/discord/interactionCreate.js', {
    '../../api/controllers/User': controller,
    '../../util/ConsoleLogger': { error () {}, command () {} }
  })

  async function change (action, type, id, permission = 'staff', guild = 'guild-1') {
    // Use discord.js's actual valueOf implementation for both mentionable types.
    const mentionable = Object.create(type === 'role' ? Role.prototype : User.prototype)
    Object.defineProperty(mentionable, 'id', { value: id })
    const command = load(`commands/perm/subcommands/${action}.js`, { '../../../api/controllers/User': controller })
    const data = command.build([{ name: 'Staff', value: 'staff' }, { name: 'All', value: 'all' }]).toJSON()
    assert.equal(data.options.find(option => option.name === config[action].args.id.name).type, 9)
    await command.execute({
      guildId: guild, guild: { name: 'Test guild' },
      options: { getString: () => permission, getMentionable: () => mentionable },
      reply: async () => {}
    })
  }

  async function execute ({ roles = [], userId = 'user-1', guild = 'guild-1', raw = false, permission = 'staff' } = {}) {
    let ran = false
    let reply
    const command = { data: { name: 'staff' }, permission, execute: async () => { ran = true } }
    await handler.execute({
      inGuild: () => true, isAutocomplete: () => false, isChatInputCommand: () => true,
      guildId: guild, commandName: 'staff', user: { id: userId },
      member: { roles: raw ? roles : { cache: new Collection(roles.map(id => [id, {}])) } },
      client: { commands: new Map([['staff', command]]) },
      reply: async data => { reply = data }
    })
    return { ran, reply }
  }
  return { change, execute }
}

for (const raw of [false, true]) {
  test(`role assignment authorizes every role member (${raw ? 'raw member' : 'cached member'})`, async () => {
    const s = fixture()
    await s.change('add', 'role', 'role-1')
    assert.equal((await s.execute({ roles: ['unrelated', 'role-1'], raw })).ran, true)
    assert.equal((await s.execute({ userId: 'another-user', roles: ['role-1'], raw })).ran, true)
    const denied = await s.execute({ roles: ['unrelated'], raw })
    assert.equal(denied.ran, false)
    assert.equal(denied.reply.content, messages.no_permission)
  })
}

test('individual assignment authorizes only the selected user', async () => {
  const s = fixture()
  await s.change('add', 'user', 'user-1')
  assert.equal((await s.execute()).ran, true)
  assert.equal((await s.execute({ userId: 'another-user' })).ran, false)
})

test('losing a role immediately removes inherited access', async () => {
  const s = fixture()
  await s.change('add', 'role', 'role-1')
  assert.equal((await s.execute({ roles: ['role-1'] })).ran, true)
  assert.equal((await s.execute()).ran, false)
})

for (const type of ['role', 'user']) {
  for (const action of ['remove', 'clear']) {
    test(`${action} revokes a ${type} grant`, async () => {
      const s = fixture()
      const id = type === 'role' ? 'role-1' : 'user-1'
      await s.change('add', type, id)
      assert.equal((await s.execute({ roles: ['role-1'] })).ran, true)
      await s.change(action, type, id)
      assert.equal((await s.execute({ roles: ['role-1'] })).ran, false)
    })
  }
}

test('role and individual grants are additive', async () => {
  const s = fixture()
  await s.change('add', 'role', 'role-1')
  await s.change('add', 'user', 'user-1')
  await s.change('remove', 'role', 'role-1')
  assert.equal((await s.execute()).ran, true)
  assert.equal((await s.execute({ userId: 'another-user', roles: ['role-1'] })).ran, false)
})

for (const type of ['role', 'user']) {
  test(`all permission works for a ${type} and remains scoped to its guild`, async () => {
    const s = fixture()
    await s.change('add', type, type === 'role' ? 'role-1' : 'user-1', 'all')
    assert.equal((await s.execute({ roles: ['role-1'], permission: 'user' })).ran, true)
    assert.equal((await s.execute({ roles: ['role-1'], permission: 'user', guild: 'other-guild' })).ran, false)
  })
}

test('a role grant for one command does not authorize a different permission', async () => {
  const s = fixture()
  await s.change('add', 'role', 'role-1', 'staff')
  assert.equal((await s.execute({ roles: ['role-1'], permission: 'user' })).ran, false)
})
