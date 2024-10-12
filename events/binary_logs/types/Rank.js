const { WebhookClient } = require('discord.js')
const { getNameByUUID, validatePayments, filterPayments } = require('../../../api/controllers/User')
const Embeds = require('../../../Embeds')
const TebexAPI = require('../../../api/TebexAPI')

const ConsoleLogger = require('../../../util/ConsoleLogger')

const blacklistFile = require('../../../config/blacklist.json')
const config = require('../../../config/binarylogs.json')
const Server = require('../../../api/controllers/Server')
const webhookRank = new WebhookClient({ url: process.env.WEBHOOK_RANK })
const webhookPerm = new WebhookClient({ url: process.env.WEBHOOK_PERM })

const STATEMENTS = require('@rodrigogs/mysql-events').STATEMENTS

const rgxArray = blacklistFile.words.map((str) => new RegExp(str).source).join('|')
const rgx = new RegExp(rgxArray)

const MySQLTrigger = {
  name: 'NEWRANK',
  expression: '*.luckperms_user_permissions',
  statement: STATEMENTS.INSERT,
  onEvent: async (event) => {
    for (const row of event.affectedRows) {
      let isRank = false
      const danger = row.after.permission.includes('*') || row.after.permission.includes('luckperms.')
      if (!danger && rgx.test(row.after.permission)) return
      isRank = row.after.permission.includes('group.')

      let nickname
      try {
        nickname = await getNameByUUID(row.after.uuid)
      } catch (err) {
        ConsoleLogger.error(err)
        nickname = 'ERROR'
      }
      if (!isRank) {
        const webhookContent = {
          embeds: [Embeds.new_perm_embed(row.after.uuid, row.after.permission, nickname, event.schema, row.after.value, row.after.expiry)]
        }
        if (danger) {
          if (config.whitelist) {
            const isWhitelisted = config.whitelist_nicks.some(nick => nick === nickname)
            if (!isWhitelisted) {
              const serverId = config.schemaServer[event.schema.toLowerCase()]
              Server.removePermission(event.schema, row.after.uuid, row.after.permission)
              Server.sendServerCommand('lp networksync', serverId)
              Server.sendServerCommand('ipban nickname -s Por favor, reporta este bug en lugar de utilizarlo, no merece la pena grifear. Gracias', serverId)
              webhookContent.content = `<@&${config.tagId}>`
            }
          }
        }
        await webhookPerm.send(webhookContent)
      } else {
        row.after.permission = row.after.permission.replaceAll('group.', '')
        let userPayments = []
        try {
          let valid
          if (nickname !== 'ERROR') {
            userPayments = await TebexAPI.getUserPaymentsFromNickname(process.env.TEBEX_TOKEN, nickname)
            const todayPaymentsID = filterPayments(userPayments.payments)
            const promises = todayPaymentsID.map(id => TebexAPI.getPaymentFromId(process.env.TEBEX_TOKEN, id))
            let todayPaymentsData = []
            todayPaymentsData = await Promise.all([promises])
            valid = validatePayments(todayPaymentsData, row.after.permission)
          } else {
            valid = null
          }
          await webhookRank.send({ embeds: [Embeds.new_rank_embed(row.after.uuid, row.after.permission.replaceAll('group.', ''), valid, nickname, event.schema, row.after.value, row.after.expiry)] })
        } catch (err) {
          ConsoleLogger.error(err)
          await webhookPerm.send({
            embeds: [Embeds.error_embed({
              uuid: row.after.uuid,
              perm: row.after.permission,
              nick: nickname,
              temp: row.after.expiry
            })]
          })
        }
      }
    }
  }
}

module.exports = MySQLTrigger
