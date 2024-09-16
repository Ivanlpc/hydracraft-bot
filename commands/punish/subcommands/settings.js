const { SlashCommandSubcommandBuilder } = require('discord.js')
const command = require('../../config/config.json').commands.punish.subcommands.settings

module.exports = {
  name: command.name,
  data: new SlashCommandSubcommandBuilder()
    .setName(command.name)
    .setDescription(command.description),
  async execute (interaction) {
  }

}
