const { SlashCommandSubcommandBuilder } = require('discord.js')
const { isStaff, getUserData } = require('../../../api/controllers/User')
const Embeds = require('../../../Embeds')
const messages = require('../../../config/messages.json')
const command = require('../../../config/config.json').commands.user.subcommands.viewprofile

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
    const nick = interaction.options.getString(command.args.nick.name, true).valueOf()
    const staff = await isStaff(nick)
    if (staff) {
      return interaction.reply({
        content: messages.is_staff.replaceAll('%nick%', nick),
        ephemeral: true
      })
    }
    const userData = await getUserData(nick)
    if (userData === null) {
      return interaction.reply({
        content: messages.user_not_found,
        ephemeral: true
      })
    }
    return await interaction.reply({
      embeds: [Embeds.userProfile(userData)],
      ephemeral: true
    })
  }
}
