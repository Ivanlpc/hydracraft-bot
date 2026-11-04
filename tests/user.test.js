const { test } = require('node:test')
const assert = require('node:assert/strict')
const load = require('./helpers.cjs')

function user (database = {}, server = {}) {
  return load('api/controllers/User.js', {
    '../Database': database, './Server': server, './Guild': {},
    '../../util/ConsoleLogger': { error () {} },
    'node:crypto': { randomInt: () => 1 }
  })
}

test('failed staff checks reject instead of allowing account changes', async () => {
  const controller = user({ fetchOne: async () => { throw new Error('database down') } })
  await assert.rejects(controller.isStaff('player'), error => error.message === 'Unable to verify staff status' && error.cause.message === 'database down')
})

test('staff protection resolves the nickname to both account UUIDs', async () => {
  const queries = require('../api/Queries')
  const calls = []
  const controller = user({ fetchOne: async (query, params) => {
    calls.push([query, params])
    return query === queries.getUserData ? { uniqueId: 'offline-uuid', premiumId: 'premium-uuid' } : { uuid: 'premium-uuid' }
  } })
  assert.equal(await controller.isStaff('player'), true)
  assert.deepEqual(calls[0], [queries.getUserData, ['player']])
  assert.deepEqual(calls[1], [queries.isStaff, [['offlineuuid', 'premiumuuid']]])
})

test('unknown accounts are not staff and accounts without UUIDs fail closed', async () => {
  assert.equal(await user({ fetchOne: async () => null }).isStaff('missing'), false)
  await assert.rejects(user({ fetchOne: async () => ({}) }).isStaff('player'), /Unable to verify staff status/)
})

test('password generation uses the cryptographic random source', async () => {
  const commands = []
  const controller = user({}, { sendBungeecordCommand: async command => { commands.push(command) } })
  const password = await controller.createPassword('player')
  assert.match(password, /^B+$/)
  assert.equal(commands[0], `forcecreatepassword player ${password}`)
})

test('failed password changes and premium operations never report success', async () => {
  const controller = user({}, { sendBungeecordCommand: async () => { throw new Error('upstream down') } })
  assert.equal(await controller.createPassword('player'), null)
  assert.equal(await controller.updatePassword('player'), null)
  assert.equal(await controller.fixpremium('player'), false)
  assert.equal(await controller.mergepremium('new', 'old'), false)
})

test('untrusted nicknames cannot add console command arguments', async () => {
  let sent = 0
  const controller = user({}, { sendBungeecordCommand: async () => { sent++ } })
  for (const nickname of ['player extra', 'player\nstop', 'player;stop', 'a'.repeat(17), '']) {
    assert.equal(await controller.createPassword(nickname), null)
    assert.equal(await controller.updatePassword(nickname), null)
    assert.equal(await controller.fixpremium(nickname), false)
    assert.equal(await controller.mergepremium('valid', nickname), false)
    assert.equal(await controller.mergepremium(nickname, 'valid'), false)
  }
  assert.equal(sent, 0)
})

for (const name of ['fixpremium', 'mergepremium']) {
  test(`${name} cancellation does not modify the account`, async () => {
    const discord = require('discord.js')
    let changes = 0
    let response
    const command = load(`commands/user/subcommands/${name}.js`, {
      'discord.js': { ...discord, WebhookClient: class {} },
      '../../../util/Confirmation': async () => ({ customId: 'cancel' }),
      '../../../api/controllers/User': {
        isStaff: async () => false,
        getUserData: async nick => ({ premiumId: nick === 'new' ? 'premium' : null }),
        isPremium: data => data.premiumId !== null,
        [name]: async () => { changes++; return true }
      }
    })
    await command.execute({
      options: { getString: option => option === 'premium' ? 'new' : 'old' },
      editReply: async data => { response = data }
    })
    assert.equal(changes, 0)
    assert.equal(response.content, require('../config/messages.json').command_cancelled)
    assert.deepEqual(response.components, [])
  })
}
