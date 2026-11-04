const { test } = require('node:test')
const assert = require('node:assert/strict')
const confirm = require('../util/Confirmation')

test('confirmation is scoped to the reply and acknowledges the button', async () => {
  let acknowledged = false
  const button = { user: { id: 'author' }, customId: 'yes', deferUpdate: async () => { acknowledged = true } }
  const result = await confirm({
    user: { id: 'author' }, reply: async () => {},
    fetchReply: async () => ({ awaitMessageComponent: async options => {
      assert.equal(await options.filter(button), true)
      assert.equal(await options.filter({ ...button, customId: 'unrelated' }), false)
      let rejected = false
      assert.equal(await options.filter({ user: { id: 'other' }, reply: async () => { rejected = true } }), false)
      assert.equal(rejected, true)
      return button
    } })
  }, {})
  assert.equal(result, button)
  assert.equal(acknowledged, true)
})

test('collector expiry returns null', async () => {
  const result = await confirm({ reply: async () => {}, fetchReply: async () => ({ awaitMessageComponent: async () => { throw Object.assign(new Error('timeout'), { code: 'InteractionCollectorError' }) } }) }, {})
  assert.equal(result, null)
})

test('confirmation transport errors propagate', async () => {
  await assert.rejects(confirm({ reply: async () => {}, fetchReply: async () => ({ awaitMessageComponent: async () => { throw new Error('connection failed') } }) }, {}), /connection failed/)
})
