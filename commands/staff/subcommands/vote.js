const { SlashCommandSubcommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const messages = require('../../../config/messages.json')
const { getStaffsNameByRank } = require('../../../api/controllers/Staff')
const Embeds = require('../../../Embeds')
const command = require('../../../config/config.json').commands.staff.subcommands.vote

const createSelector = (staffs) => {
  const options = staffs.map(staff => ({ label: staff, value: staff }))
  const select = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('vote_selector')
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

module.exports = {
  name: command.name,
  data: new SlashCommandSubcommandBuilder()
    .setName(command.name)
    .setDescription(command.description),

  async execute (interaction) {
    const currentStaffs = await getStaffsNameByRank(command.ranks)
    const selector = createSelector(currentStaffs)
    const button = createButton(interaction.user.id)
    interaction.client.votes = new Set()
    await interaction.reply({ embeds: [Embeds.vote_embed(currentStaffs)], components: [selector, button] })
  }
}
