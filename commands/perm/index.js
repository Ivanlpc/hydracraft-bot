const path = require('path')
const { SlashCommandBuilder } = require('discord.js')
const ConsoleLogger = require('../../util/ConsoleLogger')
const CommandManager = require('../../CommandManager')
const messages = require('../../config/messages.json')
const allCommands = require('../../config/config.json').commands
const command = require('../../config/config.json').commands.perm

const permissionList = (() => {
  const permissions = []
  for (const command in allCommands) {
    if (!allCommands[command].enabled) continue
    if (allCommands[command].requires_permission) {
      permissions.push({
        name: allCommands[command].permission_name,
        value: command
      })
    }
  }
  permissions.push({
    name: command.all_perms,
    value: 'all'
  })
  return permissions
})()

const data = new SlashCommandBuilder()
  .setName(command.name)
  .setDescription(command.description)

const subcommands = CommandManager.loadSubcommands(path.resolve(__dirname))

for (const subcommand of subcommands.values()) {
  data.addSubcommand(subcommand.build(permissionList))
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
