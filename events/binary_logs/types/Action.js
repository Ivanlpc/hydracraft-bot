const { WebhookClient } = require('discord.js')
const Embeds = require('../../../Embeds')
const STATEMENTS = require('@rodrigogs/mysql-events').STATEMENTS

const webhook = new WebhookClient({
  url: process.env.WEBHOOK_ACTION
})

const MySQLTrigger = {
  name: 'ACTION',
  expression: '*.luckperms_actions',
  statement: STATEMENTS.DELETE,
  onEvent: async (event) => {
    for (const row of event.affectedRows) {
      await webhook.send({ embeds: [Embeds.delete_action_embed(row.before, event.schema)] })
    }
  }
}

module.exports = MySQLTrigger
