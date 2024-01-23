const path = require('path')
const { SlashCommandBuilder } = require('discord.js')
const command = require('../../../config/config.json').commands.logs

module.exports = {
  permission: command.requires_permission ? command.name : '',
  cooldown: command.cooldown || 0,
  enabled: command.enabled,
  data: new SlashCommandBuilder()
    .setName(command.name)
    .setDescription(command.description),
  async execute (interaction) {
    interaction.reply({
      files: [path.join(__dirname, '../../logs/latest.txt')],
      ephemeral: true
    })
  }

}
