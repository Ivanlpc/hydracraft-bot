const { SlashCommandSubcommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const messages = require('../../../config/messages.json')
const { getStaffsNameByRank } = require('../../../api/controllers/Staff')
const Embeds = require('../../../Embeds')
const { createVotePanel } = require('../../../api/controllers/Staff')
const Logger = require('../../../util/ConsoleLogger')
const command = require('../../../config/config.json').commands.staff.subcommands.vote
const emojis = require('../../../util/LetterEmojis')

const createSelector = (staffs, panelId) => {
  const options = staffs.map(staff => ({ label: staff.name, value: staff.name, emoji: { name: staff.emoji } }))
  const select = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('vote_selector;' + panelId)
        .setPlaceholder(messages.select_staff)
        .addOptions(...options)
    )

  return select
}

const createButton = (discordId) => {
  const button = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('close_votes;' + discordId)
        .setLabel(messages.end_votes)
        .setStyle(ButtonStyle.Danger)
    )

  return button
}

const mapEmojis = (staffs) => {
  return staffs.map((staff, index) => {
    return { name: staff, emoji: emojis[Math.min(index, emojis.length - 1)] }
  })
}

module.exports = {
  name: command.name,
  data: new SlashCommandSubcommandBuilder()
    .setName(command.name)
    .setDescription(command.description),

  async execute (interaction) {
    const currentStaffs = await getStaffsNameByRank(command.ranks)
    const staffs = mapEmojis(currentStaffs)
    try {
      const panelId = await createVotePanel(interaction.guild.id, interaction.channel.id, interaction.user.id, interaction.user.username)
      const selector = createSelector(staffs, panelId)
      const button = createButton(interaction.user.id)
      await interaction.reply({ embeds: [Embeds.vote_embed(staffs)], components: [selector, button] })
    } catch (err) {
      Logger.error(err)
      await interaction.reply({ content: messages.error, ephemeral: true })
    }
  }
}
