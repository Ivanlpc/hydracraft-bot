const messages = require('../../config/messages.json')

module.exports = {
  enabled: true,
  customId: 'account_info',
  execute: async (client, interaction) => {
    const uniqueId = interaction.values[interaction.values.length - 1]
    const discordId = interaction.user.id
    try {
      //const data = await getAccountInformation(discordId, uniqueId)

      interaction.deferUpdate()
      await interaction.message
    } catch (err) {
      interaction.reply({
        content: messages.command_error,
        ephemeral: true
      })
    }
  }
}
