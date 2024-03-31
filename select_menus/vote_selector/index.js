const { ModalBuilder, TextInputStyle, ActionRowBuilder, TextInputBuilder, WebhookClient, EmbedBuilder } = require('discord.js')
const messages = require('../../config/messages.json')
const config = require('../../config/config.json').commands.staff.subcommands.vote
const embeds = require('../../Embeds')
const Logger = require('../../util/ConsoleLogger')
const { saveVote, hasVoted, getVotes } = require('../../api/controllers/Staff')

const webhook = new WebhookClient({ url: process.env.WEBHOOK_VOTES })

const createModal = (selectedStaff) => {
  const modal = new ModalBuilder()
    .setCustomId('voteModal')
    .setTitle(messages.vote_title.replace('%time%', config.max_time))

  const reasonInput = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel(messages.reason.replace('%staff%', selectedStaff))
    .setRequired(true)
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(255)

  modal.addComponents(new ActionRowBuilder().addComponents(reasonInput))
  return modal
}

const editEmbed = (embed, savedVotes) => {
  const lines = embed.description.split('\n')
  const totalVotes = savedVotes.reduce((acc, vote) => acc + vote.total, 0)
  const description = lines.map(line => {
    const items = line.split('`')
    if (items.length < 3) return line
    const staff = items[3]
    const staffVotes = savedVotes.find(vote => vote.vote === staff)

    if (!staffVotes) return line
    const pertencage = ((staffVotes.total / totalVotes * 100)).toFixed(0)
    return line.replace(items[1], `${staffVotes.total} votos (${pertencage}%)`)
  })
  return new EmbedBuilder(embed).setDescription(description.join('\n'))
}

module.exports = {
  enabled: true,
  customId: 'vote_selector',
  execute: async (client, interaction) => {
    const panelId = await interaction.customId.split(';')[1]
    if (await hasVoted(interaction.user.id, panelId)) {
      return interaction.reply({ content: messages.already_voted, ephemeral: true })
    }
    const selectedOption = interaction.values[0]
    const modal = createModal(selectedOption)
    await interaction.showModal(modal)
    interaction.awaitModalSubmit({
      filter: (i) => {
        return i.customId === 'voteModal'
      },
      time: config.max_time * 60000
    }).then(async res => {
      const reason = res.fields.getTextInputValue('reason') || messages.no_reason
      webhook.send({ embeds: [embeds.new_vote_embed(interaction.user.id, selectedOption, reason)] })
      await saveVote(panelId, interaction.user.id, interaction.user.username, selectedOption, reason)
      const total = await getVotes(panelId)
      await interaction.message.edit({ embeds: [editEmbed(interaction.message.embeds[0], total)] })

      res.reply({ content: messages.vote_success, ephemeral: true })
    }).catch(async (err) => {
      Logger.error(err)
      const msg = await interaction.channel.send({ content: messages.vote_timeout.replace('%user%', interaction.user.id), ephemeral: true })
      setTimeout(() => {
        interaction.channel.messages.fetch(msg).then(msg => {
          msg.delete()
        })
      }, 5000)
    })
  }
}
