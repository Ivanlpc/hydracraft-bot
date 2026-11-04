const { test } = require('node:test')
const assert = require('node:assert/strict')
const { Collection } = require('discord.js')
const load = require('./helpers.cjs')

test('image logging ignores attachments without an image content type', async () => {
  const logger = require('../util/DiscordLogger')
  const image = { contentType: 'image/png', name: 'image.png' }
  const attachment = { contentType: null, name: 'unknown' }
  const messages = new Collection([['1', { attachments: new Collection([['image', image], ['other', attachment]]) }]])
  const images = await logger.getImagesFromChannel({ messages: { fetch: async () => messages } })
  assert.deepEqual(images, [image])
})

test('mention moderation skips webhook messages without a guild member', async () => {
  const handler = require('../events/discord/messageCreate')
  await handler.execute({ inGuild: () => true, member: null })
})

test('mention moderation deletes messages mentioning a protected member', async () => {
  const handler = load('events/discord/messageCreate.js', {
    '../../config/config.json': { mentions: { bypassRoles: [], noMentionRoles: ['protected'] } }
  })
  let deleted = false
  const message = {
    inGuild: () => true, member: { id: 'member', roles: { cache: new Collection() } }, guild: { ownerId: 'owner' },
    mentions: { members: new Collection([['target', { roles: { cache: new Collection([['protected', {}]]) } }]]) },
    author: { id: 'member' }, delete: async () => { deleted = true }, channel: { send: async () => {} }
  }
  await handler.execute(message)
  assert.equal(deleted, true)
})
