const fs = require('fs')
const path = require('path')
const { SlashCommandBuilder } = require('discord.js')
const Logger = require('../../util/Logger')
const COLOR = require('../../util/ConsoleColor')
const allCommands = require('../../config.json').commands
const command = require('../../config.json').commands.perm
const { messages } = require('../../config.json')

const subcommands = (() => {
  const subcommandsFiles = fs.readdirSync(path.join(__dirname, 'subcommands'))
  const data = []
  for (const file of subcommandsFiles) {
    const subcommand = require(`./subcommands/${file}`)
    Logger.info(`${COLOR.YELLOW}[SUB-CMD]${COLOR.BLACK}[${COLOR.GREEN}✔${COLOR.BLACK}] Loaded ${COLOR.BLUE}/${command.name} ${subcommand.name}`)
    data.push(subcommand)
  }
  return data
})()

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
    if (allCommands[command].subcommands !== undefined) {
      for (const subcommand in allCommands[command].subcommands) {
        if (allCommands[command].subcommands[subcommand].requires_permission) {
          permissions.push({
            name: allCommands[command].subcommands[subcommand].permission_name,
            value: `${command}_${subcommand}`
          })
        }
      }
    }
  }
  return permissions
})()

module.exports = {
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
        .setName(command.subcommands.list_group.args.id.name)
        .setDescription(command.subcommands.list_group.args.id.description)
        .addChoices(...permissions)
        .setRequired(true))),
  async execute (interaction) {
    if (interaction.options.getSubcommand() === command.subcommands.add.name) {
      if (interaction.user.id !== interaction.guild.ownerId) {
        try {
          // TODO checkPermission
        } catch (err) {
          Logger.error(err)
          return
        }
      }
      try {
        await subcommands.execute(interaction.options.getSubcommand())
      } catch (error) {
        Logger.error(`Error executing ${interaction.options.getSubcommand()}`)
        Logger.error(error)
        return interaction.reply({
          content: messages.command_error,
          ephemeral: true
        })
      }
    }
  }
}
