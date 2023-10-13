const { getAccounts } = require('../../../api/controllers/User')
const command = require('../../../config/config.json').commands.account.subcommands.unlink
const messages = require('../../../config/messages.json')
const { createSelectMenu } = require('..')

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
