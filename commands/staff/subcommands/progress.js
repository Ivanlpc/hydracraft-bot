const { SlashCommandSubcommandBuilder } = require('discord.js')
const messages = require('../../../config/messages.json')
const { getStaffUuidByNick, getStaffProgressByUuid } = require('../../../api/controllers/Staff')
const { deleteChart, createProgressChart } = require('../../../api/controllers/Chart')
const command = require('../../../config/config.json').commands.staff.subcommands.progress

module.exports = {
  name: command.name,
  data: new SlashCommandSubcommandBuilder()
    .setName(command.name)
    .setDescription(command.description)
    .addStringOption(option => option
      .setName(command.args.nick.name)
      .setDescription(command.args.nick.description)
      .setRequired(true)),
  async execute (interaction) {
    const nick = interaction.options.getString(command.args.nick.name)
    const uuid = await getStaffUuidByNick(nick)
    if (uuid === null) {
      return interaction.reply({
        content: messages.user_not_found
      })
    }
    const stats = await getStaffProgressByUuid(uuid)
    if (stats === null) {
      return interaction.reply({
        content: messages.no_stats,
        ephemeral: true
      })
    }
    const chart = await createProgressChart(stats, nick)
    await interaction.reply({
      files: [chart]
    })
    return await deleteChart(chart)
  }
}
