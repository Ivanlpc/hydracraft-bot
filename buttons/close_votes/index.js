const { EmbedBuilder } = require('discord.js')
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
    const description = interaction.message.embeds[0].description.split('\n')
    description[0] = messages.votes_closed_desc
    const tempEmbed = new EmbedBuilder(interaction.message.embeds[0])
      .setTitle(messages.votes_closed)
      .setDescription(description.join('\n'))
    await interaction.message.edit({ embeds: [tempEmbed], components: [] })
  }
}
