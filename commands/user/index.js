const path = require('path')
const { SlashCommandBuilder } = require('discord.js')
const CommandManager = require('../../CommandManager')
const ConsoleLogger = require('../../util/ConsoleLogger')
const messages = require('../../config/messages.json')
const command = require('../../config/config.json').commands.user

const data = new SlashCommandBuilder()
  .setName(command.name)
  .setDescription(command.description)

const subcommands = CommandManager.loadSubcommands(path.resolve(__dirname))

for (const subcommand of subcommands.values()) {
  data.addSubcommand(subcommand.data)
}

module.exports = {
  permission: command.requires_permission ? command.name : '',
  cooldown: command.cooldown || 0,
  enabled: command.enabled,
  data,
  async execute (interaction) {
    try {
      const subcommand = subcommands.get(interaction.options.getSubcommand())
      if (!subcommand) return
      await subcommand.execute(interaction)
    } catch (err) {
      ConsoleLogger.error(`Error executing /${command.name} ${interaction.options.getSubcommand()}`)
      ConsoleLogger.error(err)
      return interaction.reply({
        content: messages.command_error,
        ephemeral: true
      })
    }
  }
}
