const { test } = require('node:test')
const assert = require('node:assert/strict')
const load = require('./helpers.cjs')

function setup (server = {}) {
  const sent = []
  const ids = []
  class WebhookClient { async send (data) { sent.push(data) } }
  const deps = {
    'discord.js': { WebhookClient },
    '../../../api/controllers/User': {
      getNameByUUID: async () => 'player',
      filterPayments: payments => payments,
      validatePayments: payments => { assert.equal(payments[0].id, 'payment'); return 'payment' }
    },
    '../../../api/TebexAPI': {
      getUserPaymentsFromNickname: async () => ({ payments: [{ txn_id: 'transaction' }] }),
      getPaymentFromId: async (_token, id) => { ids.push(id); return { id: 'payment', packages: [] } }
    },
    '../../../Embeds': { new_rank_embed: (...args) => args, new_perm_embed: () => ({}), error_embed: () => ({}) },
    '../../../config/blacklist.json': { words: ['ignored'] },
    '../../../config/binarylogs.json': { whitelist: true, whitelist_nicks: [], schemaServer: { luckperms: 'server' } },
    '../../../api/controllers/Server': server,
    '../../../util/ConsoleLogger': { error (error) { throw error } }
  }
  return { deps, sent, ids }
}

test('rank logs await individual payment details using transaction IDs', async () => {
  const s = setup()
  const trigger = load('events/binary_logs/types/Rank.js', s.deps)
  await trigger.onEvent({ schema: 'luckperms', affectedRows: [{ after: { uuid: 'uuid', permission: 'group.vip' } }] })
  assert.deepEqual(s.ids, ['transaction'])
  assert.equal(s.sent[0].embeds[0][2], 'payment')
})

test('permission cleanup completes before sync and ban commands', async () => {
  const operations = []
  const s = setup({
    removePermission: async () => { await Promise.resolve(); operations.push('removed') },
    sendServerCommand: async command => { operations.push(command) }
  })
  const trigger = load('events/binary_logs/types/Rank.js', s.deps)
  await trigger.onEvent({ schema: 'luckperms', affectedRows: [{ after: { uuid: 'uuid', permission: '*' } }] })
  assert.equal(operations[0], 'removed')
  assert.equal(operations[1], 'lp networksync')
  assert.match(operations[2], /^ipban player /)
})

test('an ignored permission does not skip the rest of a binlog batch', async () => {
  const operations = []
  const s = setup({ removeRankPermission: async () => { operations.push('removed') }, sendServerCommand: async () => { operations.push('synced') } })
  const trigger = load('events/binary_logs/types/GroupPermission.js', s.deps)
  await trigger.onEvent({ schema: 'luckperms', affectedRows: [{ after: { permission: 'ignored', name: 'rank' } }, { after: { permission: '*', name: 'rank' } }] })
  assert.deepEqual(operations, ['removed', 'synced'])
  assert.equal(s.sent.length, 1)
})
