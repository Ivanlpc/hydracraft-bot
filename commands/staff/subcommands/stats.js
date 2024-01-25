const { SlashCommandSubcommandBuilder } = require('discord.js')
const messages = require('../../../config/messages.json')
const { getTopStaffsSince, getStaffsUuidName } = require('../../../api/controllers/Staff')
const { createTopStaffsSinceChart, deleteChart } = require('../../../api/controllers/Chart')
const command = require('../../../config/config.json').commands.staff.subcommands.stats

module.exports = {
  name: command.name,
  data: new SlashCommandSubcommandBuilder()
    .setName(command.name)
    .setDescription(command.description)
    .addStringOption(option => option
      .setName(command.args.since.name)
      .setDescription(command.args.since.description)
      .setRequired(true)),
  async execute (interaction) {
    const date = interaction.options.getString(command.args.since.name, true)
    const rgx = /(0[1-9]|[1-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/20[0-9]{2}/g
    if (!rgx.test(date)) {
      return interaction.reply({
        content: messages.invalid_date.replace('%date%', date),
        ephemeral: true
      })
    }
    const currentStaffs = await getStaffsUuidName()
    const stats = await getTopStaffsSince(currentStaffs.map(x => x.uuid), new Date(date).valueOf())
    const chartPath = await createTopStaffsSinceChart(stats.map(stat => ({ username: currentStaffs.find(x => x.uuid === stat.uuid).username, count: stat.count })).sort((a, b) => b.count - a.count))
    await interaction.reply({
      files: [chartPath]
    })
    return deleteChart(chartPath)
  }
}
