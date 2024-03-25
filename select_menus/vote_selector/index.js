const { ModalBuilder, TextInputStyle, ActionRowBuilder, TextInputBuilder, WebhookClient, EmbedBuilder } = require('discord.js')
const messages = require('../../config/messages.json')
const config = require('../../config/config.json').vote_config
const embeds = require('../../Embeds')

const webhook = new WebhookClient({ url: process.env.WEBHOOK_VOTES })

const createModal = (selectedStaff) => {
  const modal = new ModalBuilder()
    .setCustomId('voteModal')
    .setTitle(messages.reason.replace('%staff%', selectedStaff))

  const reasonInput = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel(messages.write_reason)
    .setRequired(true)
    .setStyle(TextInputStyle.Paragraph)

  modal.addComponents(new ActionRowBuilder().addComponents(reasonInput))
  return modal
}

module.exports = {
  enabled: true,
  customId: 'vote_selector',
  execute: async (client, interaction) => {
    if (interaction.client.votes.has(interaction.user.id)) {
      return interaction.reply({ content: messages.already_voted, ephemeral: true })
    }
    const selectedOption = interaction.values[0]
    const modal = createModal(selectedOption)
    await interaction.showModal(modal)
    interaction.awaitModalSubmit({
      filter: (i) => {
        return i.customId === 'voteModal'
      },
      time: 60000
    }).then(async res => {
      interaction.client.votes.add(interaction.user.id)
      const embed = interaction.message.embeds[0]
      const lines = embed.description.split('\n')
      const description = lines.map(line => {
        if (line.includes(selectedOption)) {
          const votes = line.split(config.arrow)[1]
          return line.replace(votes, parseInt(votes) + 1)
        }
        return line
      })
      const tempEmbed = new EmbedBuilder(embed).setDescription(description.join('\n'))
      await interaction.message.edit({ embeds: [tempEmbed] })
      const reason = res.fields.getTextInputValue('reason') || messages.no_reason
      webhook.send({ embeds: [embeds.new_vote_embed(interaction.user.id, selectedOption, reason)] })
      await res.reply({ content: messages.vote_success, ephemeral: true })
    }).catch(async () => {
      const msg = await interaction.channel.send({ content: messages.vote_timeout.replace('%user%', interaction.user.id), ephemeral: true })
      setTimeout(() => {
        interaction.channel.messages.fetch(msg).then(msg => {
          msg.delete()
        })
      }, 5000)
    })
  }
}
