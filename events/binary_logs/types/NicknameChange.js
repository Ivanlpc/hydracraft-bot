const { WebhookClient } = require('discord.js')
const { updatePaymentNickname } = require('../../../api/controllers/User')
const embeds = require('../../../Embeds')
const STATEMENTS = require('@rodrigogs/mysql-events').STATEMENTS
const JPREMIUM = require('../../../config/config.json').jPremiumDatabase
const messages = require('../../../config/messages.json')

const webhook = new WebhookClient({
  url: process.env.WEBHOOK_NICKNAME_UPDATE
})

const MySQLTrigger = {
  name: 'NICKNAME',
  expression: `${JPREMIUM}.user_profiles`,
  statement: STATEMENTS.UPDATE,
  onEvent: async (event) => {
    for (const row of event.affectedRows) {
      if (!row.after.lastNickname || !row.before.lastNickname) return
      if (row.after.lastNickname === null || row.before.lastNickname === null) return
      if (row.after.premiumId === null || row.before.premiumId === null) return
      if (row.after.premiumId !== row.before.premiumId) return
      if (row.after.lastNickname === row.before.lastNickname) return
      const oldNickname = row.before.lastNickname
      const newNickname = row.after.lastNickname
      const result = await updatePaymentNickname(oldNickname, newNickname)
      if (result) {
        webhook.send({
          embeds: [embeds.nickname_update_embed(oldNickname, newNickname)]
        })
      } else {
        webhook.send({
          content: messages.updatedPayments_error.replaceAll('%oldnick%', oldNickname).replaceAll('%newnick%', newNickname)
        })
      }
    }
  }
}

module.exports = MySQLTrigger
