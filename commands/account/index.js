const { SlashCommandBuilder } = require('discord.js')
const command = require('../../config.json').commands.account

module.exports = {
  cooldown: command.cooldown || 0,
  enabled: command.enabled,
  data: new SlashCommandBuilder()
    .setName(command.name)
    .setDescription(command.description)
    .addSubcommand(cmd => cmd
      .setName(command.subcommands.link.name)
      .setDescription(command.subcommands.link.description)
      .addStringOption(option => option
        .setName(command.subcommands.link.args.code.name)
        .setDescription(command.subcommands.link.args.code.description)
        .setRequired(true))
    ),
  async execute (interaction) {
    if (interaction.options.getSubcommand() === command.subcommands.link.name) {
      //TODO
    }
  }
}
