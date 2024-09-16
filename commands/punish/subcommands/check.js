const { SlashCommandBuilder } = require('discord.js')
const command = require('../../../config/config.json').commands.check

module.exports = {
  permission: command.requires_permission ? command.name : '',
  cooldown: command.cooldown || 0,
  enabled: command.enabled,
  data: new SlashCommandBuilder()
    .setName(command.name)
    .setDescription(command.description)
    .addUserOption(option => option
      .setName(command.args.user.name)
      .setDescription(command.args.user.description)
      .setRequired(true)
    ),

  async execute (interaction) {
  }

}
