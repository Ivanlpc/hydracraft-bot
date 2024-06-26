const { SlashCommandSubcommandBuilder } = require('discord.js')
const messages = require('../../../config/messages.json')
const { getStaffsUuidName, getTopStaffsRange } = require('../../../api/controllers/Staff')
const { createTopStaffsSinceChart, deleteChart } = require('../../../api/controllers/Chart')
const DateUtil = require('../../../util/Date')
const command = require('../../../config/config.json').commands.staff.subcommands.stats

module.exports = {
  name: command.name,
  data: new SlashCommandSubcommandBuilder()
    .setName(command.name)
    .setDescription(command.description)
    .addStringOption(option => option
      .setName(command.args.since.name)
      .setDescription(command.args.since.description)
      .setRequired(true))
    .addStringOption(option => option
      .setName(command.args.until.name)
      .setDescription(command.args.until.description)
      .setRequired(false)),
  async execute (interaction) {
    const date = interaction.options.getString(command.args.since.name, true)
    const until = interaction.options.getString(command.args.until.name, false)
    const timestamp = DateUtil.parseDate(date)
    const timestampUntil = DateUtil.parseDate(until) || new Date().valueOf()

    if (!timestamp || (until && (!timestampUntil || timestampUntil < timestamp))) {
      return interaction.reply({
        content: messages.invalid_date,
        ephemeral: true
      })
    }

    const currentStaffs = await getStaffsUuidName()
    const staffUuids = currentStaffs.map(x => x.uuid)
    const stats = await getTopStaffsRange(staffUuids, timestamp, timestampUntil)
    const usernames = []
    const counts = []
    let chartPath = ''

    for (const staff of stats) {
      const username = currentStaffs.find(x => x.uuid === staff.uuid).username
      usernames.push(username)
      counts.push(staff.count)
    }

    chartPath = await createTopStaffsSinceChart(usernames, counts, date, until)
    await interaction.reply({
      files: [chartPath]
    })
    return deleteChart(chartPath)
  }
}
