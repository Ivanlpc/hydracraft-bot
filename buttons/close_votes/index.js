const messages = require('../../config/messages.json')

module.exports = {
  enabled: true,
  customId: 'close_votes',
  execute: async (client, interaction) => {
    const id = interaction.customId.split(';')[1]
    if (id !== interaction.user.id) {
      return interaction.reply({ content: messages.not_allowed_close_votes, ephemeral: true })
    }
    interaction.deferUpdate()
    interaction.client.votes = new Set()
    await interaction.message.edit({ components: [] })
  }
}
