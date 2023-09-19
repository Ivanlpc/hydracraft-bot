const { WebhookClient } = require('discord.js')
const { Embeds } = require('../../../Embeds')
const config = require('../../../config.json')
const STATEMENTS = require('@rodrigogs/mysql-events').STATEMENTS

const webhook = new WebhookClient({
  url: config.WEBHOOKS.ACTION
})

const MySQLTrigger = {
  name: 'ACTION',
  expression: '*.luckperms_actions',
  statement: STATEMENTS.DELETE,
  onEvent: (event) => {
    event.affectedRows.forEach(row => {
      webhook.send({ embeds: [Embeds.delete_action_embed(row.before, event.schema)] })
    })
  }
}

module.exports = MySQLTrigger
