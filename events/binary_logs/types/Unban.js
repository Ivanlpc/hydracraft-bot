const { WebhookClient } = require('discord.js')
const TebexAPI = require('../../../api/TebexAPI')
const Embeds = require('../../../Embeds')
const Logger = require('../../../util/Logger')
const { validatePayments, filterPayments, getNameByUUID } = require('../../../api/controllers/User')
const config = require('../../../config/binarylogs.json')
const messages = require('../../../config/messages.json')
const STATEMENTS = require('@rodrigogs/mysql-events').STATEMENTS

const webhook = new WebhookClient({ url: process.env.WEBHOOK_UNBAN })
const webhook2 = new WebhookClient({ url: process.env.WEBHOOK_UNBAN2 })

const MySQLTrigger = {
  name: 'UNBAN',
  expression: '*.litebans_bans',
  statement: STATEMENTS.UPDATE,
  onEvent: async (event) => {
    for (const row of event.affectedRows) {
      if (row.after.removed_by_reason === config.expired_reason || row.after.removed_by_reason === null) return
      let nickname
      try {
        nickname = await getNameByUUID(row.before.uuid)
      } catch (err) {
        Logger.error(err)
        nickname = 'ERROR'
      }
      let userPayments = []
      if (nickname === 'ERROR') {
        await webhook.send({ embeds: [Embeds.unban_embed(row, null, nickname, event.schema)] })
        await webhook2.send({ embeds: [Embeds.unban_embed(row, null, nickname, event.schema)] })
        return
      }
      try {
        userPayments = await TebexAPI.getUserPaymentsFromNickname(process.env.TEBEX_TOKEN, nickname)
      } catch (e) {
        Logger.error(e)
      }
      const todayPaymentsID = filterPayments(userPayments.payments)
      const promises = todayPaymentsID.map(payment => TebexAPI.getPaymentFromId(process.env.TEBEX_TOKEN, payment.txn_id))
      let todayPaymentsData = []
      try {
        todayPaymentsData = await Promise.all(promises)
      } catch (err) {
        Logger.error(err)
      }
      const valid = validatePayments(todayPaymentsData, config.unban_package)
      if (valid) {
        row.after.removed_by_reason = row.after.removed_by_reason.replaceAll(/(tbx-)[a-zA-Z0-9-]+/g, messages.hidden_transaction_id)
      }
      await webhook.send({ embeds: [Embeds.unban_embed(row, valid, nickname, event.schema)] })
      await webhook2.send({ embeds: [Embeds.unban_embed(row, valid, nickname, event.schema)] })
    }
  }
}

module.exports = MySQLTrigger
