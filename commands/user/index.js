const { SlashCommandBuilder } = require('discord.js')
const path = require('path')
const Logger = require('../../util/Logger')
const command = require('../../config/config.json').commands.user
const messages = require('../../config/messages.json')
const CommandManager = require('../../CommandManager')

const subcommands = CommandManager.loadSubcommands(path.resolve(__dirname))

module.exports = {
  permission: command.requires_permission ? command.name : '',
  cooldown: command.cooldown || 0,
  enabled: command.enabled,
  data: new SlashCommandBuilder()
    .setName(command.name)
    .setDescription(command.description)
    .addSubcommand(cmd => cmd
      .setName(command.subcommands.link_discord.name)
      .setDescription(command.subcommands.link_discord.description)
      .addStringOption(option => option
        .setName(command.subcommands.link_discord.args.nick.name)
        .setDescription(command.subcommands.link_discord.args.nick.description)
        .setRequired(true))
      .addUserOption(option => option
        .setName(command.subcommands.link_discord.args.discord.name)
        .setDescription(command.subcommands.link_discord.args.discord.description)
        .setRequired(true)))
    .addSubcommand(cmd => cmd
      .setName(command.subcommands.forcecracked.name)
      .setDescription(command.subcommands.forcecracked.description)
      .addStringOption(option => option
        .setName(command.subcommands.forcecracked.args.nick.name)
        .setDescription(command.subcommands.forcecracked.args.nick.description)
        .setRequired(true)))
    .addSubcommand(cmd => cmd
      .setName(command.subcommands.changepassword.name)
      .setDescription(command.subcommands.changepassword.description)
      .addStringOption(option => option
        .setName(command.subcommands.changepassword.args.nick.name)
        .setDescription(command.subcommands.changepassword.args.nick.description)
        .setRequired(true)))
    .addSubcommand(cmd => cmd
      .setName(command.subcommands.check.name)
      .setDescription(command.subcommands.check.description)
      .addUserOption(option => option
        .setName(command.subcommands.check.args.discord.name)
        .setDescription(command.subcommands.check.args.discord.description)
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
