const { WebhookClient } = require('discord.js')
const { getNameByUUID } = require('../../../api/controllers/User')
const EMBEDS = require('../../../Embeds')
const { TebexAPI } = require('../../../api/TebexAPI')
const { validatePayments, filterPayments } = require('../util/CheckPayments')

const Logger = require('../../../util/Logger')

const config = require('../../../config/config.json')
const blacklistFile = require('../../../config/blacklist.json')
const webhook = new WebhookClient({ url: process.env.WEBHOOK_RANK })

const STATEMENTS = require('@rodrigogs/mysql-events').STATEMENTS

const rgxArray = blacklistFile.words.map((str) => new RegExp(str).source).join('|')
const rgx = new RegExp(rgxArray)

const MySQLTrigger = {
  name: 'NEWRANK',
  expression: '*.luckperms_user_permissions',
  statement: STATEMENTS.INSERT,
  onEvent: (event) => {
    event.affectedRows.forEach(async row => {
      if (rgx.test(row.after.permission) && row.after.permission !== '*') return
      const perm = row.after.permission.replace('group.', '')
      if (config.Rankups.includes(perm)) return
      let nickname
      try {
        nickname = await getNameByUUID(row.after.uuid)
      } catch (err) {
        Logger.error(err)
        nickname = 'ERROR'
      }
      const temp = row.after.expiry === 0
      if (perm.includes('.')) {
        await webhook.send({ embeds: [EMBEDS.new_perm_embed(row.after.uuid, perm, nickname, event.schema, row.after.value, temp)] })
      } else {
        let userPayments = []
        try {
          userPayments = await TebexAPI.getUserPayments(process.env.TEBEX_TOKEN, row.before.uuid)
          const todayPaymentsID = filterPayments(userPayments.payments)
          const promises = todayPaymentsID.map(id => TebexAPI.getPaymentFromId(process.env.TEBEX_TOKEN, id))
          let todayPaymentsData = []
          todayPaymentsData = await Promise.all([promises])
          const valid = validatePayments(todayPaymentsData, perm.toUpperCase())
          await webhook.send({ embeds: [EMBEDS.new_rank_embed(row.after.uuid, perm, valid, nickname, event.schema, row.after.value, temp)] })
        } catch (err) {
          Logger.error(err)
          await webhook.send({
            embeds: [EMBEDS.error_embed({
              uuid: row.after.uuid,
              perm,
              nick: nickname,
              temp
            })]
          })
        }
      }
    })
  }
}

module.exports = MySQLTrigger
