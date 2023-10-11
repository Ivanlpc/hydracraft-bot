const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js')
const { getAccounts } = require('../../../api/controllers/User')
const command = require('../../../config.json').commands.account.subcommands.link
const messages = require('../../../config/messages.json')

const createSelectMenu = (accounts) => {
  const options = accounts.map(elem => ({
    label: elem.lastNickname,
    value: elem.uniqueId
  }))
  const select = new StringSelectMenuBuilder()
    .setCustomId('account_selector')
    .setPlaceholder('SELECCIONA CUENTA')
    .addOptions(...options)

  const row = new ActionRowBuilder()
    .addComponents(select)
  return row
}

module.exports = {
  name: command.name,
  async execute (interaction) {
    try {
      const discordId = interaction.user.id
      const accounts = await getAccounts(discordId)
      if (accounts.length === 0) {
        return interaction.reply({
          content: messages.no_accounts,
          ephemeral: true
        })
      }
      return interaction.reply({
        components: [createSelectMenu(accounts)]
      })
    } catch (err) {
      interaction.reply({
        content: err,
        ephemeral: true
      })
    }
  }
}
