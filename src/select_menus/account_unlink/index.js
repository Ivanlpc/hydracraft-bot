const { unLinkAccount } = require('../../api/controllers/User')
const messages = require('../../config/messages.json')

module.exports = {
  enabled: true,
  customId: 'account_unlink',
  execute: async (client, interaction) => {
    const uniqueId = interaction.values[interaction.values.length - 1]
    const discordId = interaction.user.id

    try {
      await unLinkAccount(discordId, uniqueId)
      await interaction.reply({
        content: messages.account_unlinked,
        ephemeral: true
      })
    } catch (err) {
      interaction.reply({
        content: messages.command_error,
        ephemeral: true
      })
    }
  }
}
