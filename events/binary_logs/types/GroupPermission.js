const { WebhookClient } = require('discord.js')
const Embeds = require('../../../Embeds')
const blacklistFile = require('../../../config/blacklist.json')
const config = require('../../../config/binarylogs.json')
const Server = require('../../../api/controllers/Server')
const webhookPerm = new WebhookClient({ url: process.env.WEBHOOK_PERM })

const STATEMENTS = require('@rodrigogs/mysql-events').STATEMENTS

const rgxArray = blacklistFile.words.map((str) => new RegExp(str).source).join('|')
const rgx = new RegExp(rgxArray)

const MySQLTrigger = {
  name: 'NEWGROUPPERM',
  expression: '*.luckperms_group_permissions',
  statement: STATEMENTS.INSERT,
  onEvent: async (event) => {
    for (const row of event.affectedRows) {
      const danger = row.after.permission.includes('*') || row.after.permission.includes('luckperms.')
      if (!danger && rgx.test(row.after.permission)) return

      const webhookContent = {
        embeds: [Embeds.new_perm_embed('NULL', row.after.permission, row.after.name, event.schema, row.after.value, row.after.expiry)]
      }
      if (danger) {
        const serverId = config.schemaServer[event.schema.toLowerCase()]
        Server.removeRankPermission(event.schema, row.after.name, row.after.permission).then(Server.sendServerCommand('lp networksync', serverId))
        webhookContent.content = `<@&${config.tagId}>`
      }
      await webhookPerm.send(webhookContent)
    }
  }
}

module.exports = MySQLTrigger
