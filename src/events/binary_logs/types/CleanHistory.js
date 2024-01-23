const { WebhookClient } = require('discord.js')
const Embeds = require('../../../Embeds')
const { getNameByUUID } = require('../../../api/controllers/User')
const STATEMENTS = require('@rodrigogs/mysql-events').STATEMENTS

const webhook = new WebhookClient({
  url: process.env.WEBHOOK_HISTORY
})

const MySQLTrigger = {
  name: 'CLEAN',
  expression: '*.litebans_bans',
  statement: STATEMENTS.DELETE,
  onEvent: async (event) => {
    for (const row of event.affectedRows) {
      const userNickname = await getNameByUUID(row.before.uuid) || 'ERROR'
      await webhook.send({ embeds: [Embeds.delete_history_embed(userNickname, row.before, event.schema)] })
    }
  }
}

module.exports = MySQLTrigger
