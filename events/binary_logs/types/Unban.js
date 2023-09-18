const { WebhookClient } = require('discord.js')
const { TebexAPI } = require('../../../API/TebexAPI')
const { Embeds } = require('../../../API/Util/Embeds')
const Logger = require('../../../util/Logger')
const { validatePayments, filterPayments } = require('../util/CheckPayments')

const config = require('../../../config.json')

const webhook = new WebhookClient({ url: config.WEBHOOKS.UNBAN })

const STATEMENTS = require('@rodrigogs/mysql-events').STATEMENTS

const MySQLTrigger = {
  name: 'UNBAN',
  expression: '*.litebans_bans',
  statement: STATEMENTS.UPDATE,
  onEvent: (event) => {
    event.affectedRows.forEach(async row => {
      if (row.after.removed_by_reason === '#expired' || row.after.removed_by_reason === null) return
      let userPayments = []
      try {
        userPayments = await TebexAPI.getUserPayments(config.TEBEX_TOKEN, row.before.uuid)
      } catch (e) {
        Logger.error(e)
      }
      const nickname = userPayments.player.username
      const todayPaymentsID = filterPayments(userPayments.payments)
      const promises = todayPaymentsID.map(id => TebexAPI.getPaymentFromId(config.TEBEX_TOKEN, id))
      let todayPaymentsData = []
      try {
        todayPaymentsData = await Promise.all([promises])
      } catch (err) {
        Logger.error(err)
      }
      const valid = validatePayments(todayPaymentsData, 'DESBANEO')
      await webhook.send({ embeds: [Embeds.unban_embed(row, valid, nickname, event.schema)] })
    })
  }
}

module.exports = MySQLTrigger
