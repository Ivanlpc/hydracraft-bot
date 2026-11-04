const { test } = require('node:test')
const assert = require('node:assert/strict')
const load = require('./helpers.cjs')
const DateUtil = require('../util/Date')

test('stats rejects an invalid optional end date before querying the database', async () => {
  let queried = false
  let reply
  const command = load('commands/staff/subcommands/stats.js', {
    '../../../api/controllers/Staff': { getStaffsUuidName: async () => { queried = true; return [] } },
    '../../../api/controllers/Chart': {}
  })
  await command.execute({ options: { getString: name => name === 'since' ? '01/01/2026' : '31/02/2026' }, reply: async data => { reply = data } })
  assert.equal(queried, false)
  assert.equal(reply.content, require('../config/messages.json').invalid_date)
})

test('profile embed preserves formatted dates and missing-date labels', () => {
  const embed = require('../Embeds').userProfile({ firstSeen: '4/11/2026', lastSeen: null, lastNickname: 'player', premiumId: null, lastAddress: null, firstAddress: null }).toJSON()
  assert.equal(embed.fields[0].value, '```4/11/2026```')
  assert.equal(embed.fields[1].value, '```No disponible```')
})

test('reload supports a command at index zero and preserves other commands', async t => {
  t.mock.method(require('../util/ConsoleLogger'), 'info', () => {})
  const manager = require('../CommandManager')
  const command = require('../commands/logs')
  const name = command.data.name
  const client = { commands: new Map([[name, command]]), commands_json: [command.data.toJSON(), { name: 'other' }] }
  const register = manager.registerCommands
  manager.registerCommands = async () => true
  try {
    assert.equal(await manager.reloadCommand(client, 'logs', name), true)
    assert.equal(client.commands_json.length, 2)
    assert.equal(client.commands_json[1].name, 'other')
    assert.equal(client.commands.get(name).data.name, name)
  } finally {
    manager.registerCommands = register
  }
})

test('reload rejects a missing command without removing another command', async t => {
  t.mock.method(require('../util/ConsoleLogger'), 'info', () => {})
  t.mock.method(require('../util/ConsoleLogger'), 'error', () => {})
  const manager = require('../CommandManager')
  const client = { commands: new Map(), commands_json: [{ name: 'other' }] }
  assert.equal(await manager.reloadCommand(client, 'logs', 'missing'), false)
  assert.deepEqual(client.commands_json, [{ name: 'other' }])
})

test('date validation rejects normalized non-leap dates', () => {
  assert.equal(DateUtil.validDate('29/02/2026'), false)
})
