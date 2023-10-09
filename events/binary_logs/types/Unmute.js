const { WebhookClient } = require('discord.js')
const { TebexAPI } = require('../../../api/TebexAPI')
const Embeds = require('../../../Embeds')
const Logger = require('../../../util/Logger')
const { validatePayments, filterPayments } = require('../util/CheckPayments')

const config = require('../../../config/config.json')

const webhook = new WebhookClient({ url: process.env.WEBHOOK_UNMUTE })

const STATEMENTS = require('@rodrigogs/mysql-events').STATEMENTS

const MySQLTrigger = {
  name: 'UNMUTE',
  expression: '*.litebans_mutes',
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
      const valid = validatePayments(todayPaymentsData, 'DESMUTEO')
      await webhook.send({ embeds: [Embeds.unmute_embed(row, valid, nickname, event.schema)] })
    })
  }
}

module.exports = MySQLTrigger
