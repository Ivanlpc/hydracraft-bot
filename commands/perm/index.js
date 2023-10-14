const { SlashCommandBuilder } = require('discord.js')
const path = require('path')
const Logger = require('../../util/Logger')
const allCommands = require('../../config/config.json').commands
const command = require('../../config/config.json').commands.perm
const messages = require('../../config/messages.json')
const CommandManager = require('../../CommandManager')

const subcommands = CommandManager.loadSubcommands(path.resolve(__dirname))

const permissions = (() => {
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
  return permissions
})()

module.exports = {
  permission: command.requires_permission ? command.name : '',
  cooldown: command.cooldown || 0,
  enabled: command.enabled,
  data: new SlashCommandBuilder()
    .setName(command.name)
    .setDescription(command.description)
    .addSubcommand(cmd => cmd
      .setName(command.subcommands.add.name)
      .setDescription(command.subcommands.add.description)
      .addStringOption(option => option
        .setName(command.subcommands.add.args.perm.name)
        .setDescription(command.subcommands.add.args.perm.description)
        .addChoices(...permissions)
        .setRequired(true))
      .addMentionableOption(option => option
        .setName(command.subcommands.add.args.id.name)
        .setDescription(command.subcommands.add.args.id.description)
        .setRequired(true)))
    .addSubcommand(cmd => cmd
      .setName(command.subcommands.remove.name)
      .setDescription(command.subcommands.remove.description)
      .addStringOption(option => option
        .setName(command.subcommands.remove.args.perm.name)
        .setDescription(command.subcommands.remove.args.perm.description)
        .addChoices(...permissions)
        .setRequired(true))
      .addMentionableOption(option => option
        .setName(command.subcommands.remove.args.id.name)
        .setDescription(command.subcommands.remove.args.id.description)
        .setRequired(true)))
    .addSubcommand(cmd => cmd
      .setName(command.subcommands.list_id.name)
      .setDescription(command.subcommands.list_id.description)
      .addMentionableOption(option => option
        .setName(command.subcommands.list_id.args.id.name)
        .setDescription(command.subcommands.list_id.args.id.description)
        .setRequired(true)))
    .addSubcommand(cmd => cmd
      .setName(command.subcommands.list_group.name)
      .setDescription(command.subcommands.list_group.description)
      .addStringOption(option => option
        .setName(command.subcommands.list_group.args.perm.name)
        .setDescription(command.subcommands.list_group.args.perm.description)
        .addChoices(...permissions)
        .setRequired(true))),
  async execute (interaction) {
    try {
      const subcommand = subcommands.get(interaction.options.getSubcommand())
      if (!subcommand) return
      await subcommand.execute(interaction)
    } catch (err) {
      Logger.error(`Error executing /${command.name} ${interaction.options.getSubcommand()}`)
      Logger.error(err)
      return interaction.reply({
        content: messages.command_error,
        ephemeral: true
      })
    }
  }
}
