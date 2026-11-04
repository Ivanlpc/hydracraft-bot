const { test } = require('node:test')
const assert = require('node:assert/strict')
const load = require('./helpers.cjs')

test('server command failure propagates to callers', async () => {
  const server = load('api/controllers/Server.js', {
    '../Agent': { sendCommand: async () => { throw new Error('upstream unavailable') } },
    '../Database': {}, '../../util/ConsoleLogger': { error () {}, info () {} }
  })
  await assert.rejects(server.sendBungeecordCommand('list'), /upstream unavailable/)
  await assert.rejects(server.sendServerCommand('list', 'server'), /upstream unavailable/)
})
test('server controller routes commands only to explicit agent aliases', async () => {
  const requests = []
  const server = load('api/controllers/Server.js', {
    '../Agent': { sendCommand: async (...args) => { requests.push(args) } },
    '../Database': {},
    '../../config/agent.json': { bungeecord_target: 'Proxy' }
  })
  await server.sendBungeecordCommand('list')
  await server.sendServerCommand('lp networksync', 'Survival')
  assert.deepEqual(requests, [['Proxy', 'list'], ['Survival', 'lp networksync']])
})
test('profile formats first and last seen independently', async () => {
  let profile
  const command = load('commands/user/subcommands/viewprofile.js', {
    '../../../api/controllers/User': { isStaff: async () => false, getUserData: async () => ({ firstSeen: new Date(2025, 0, 2), lastSeen: new Date(2026, 10, 4) }) },
    '../../../Embeds': { userProfile: data => { profile = data; return {} } }
  })
  await command.execute({ options: { getString: () => 'player' }, reply: async () => {} })
  assert.equal(profile.firstSeen, '2/1/2025')
  assert.equal(profile.lastSeen, '4/11/2026')
})
test('giftcard recovery excludes void cards and handles missing notes', async () => {
  const api = load('api/TebexAPI.js', {
    './Requests': async () => ({ data: [{ note: 'LINKED:player:', void: true }, { note: null, void: false }, { note: 'LINKED:player:', void: false }] })
  })
  const cards = await api.recoverGiftcard('test', 'player')
  assert.equal(cards.length, 1)
  assert.equal(cards[0].void, false)
})
test('last-payment lookup uses the existing username lookup', async () => {
  const api = load('api/TebexAPI.js', { './Requests': async url => url.includes('/user/') ? { payments: [{ txn_id: 'txn' }] } : { packages: [{ name: 'rank' }] } })
  assert.deepEqual(await api.getLastPaymentFromUser('test', 'player'), [{ name: 'rank' }])
})
