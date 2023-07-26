const { SlashCommandBuilder } = require('discord.js')
const allCommands = require('../../config.json').commands
const command = require('../../config.json').commands.perm

const permissions = (() => {
  const permissions = []
  for (const command in allCommands) {
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
      .setName(command.subcommands.list.name)
      .setDescription(command.subcommands.list.description)
      .addMentionableOption(option => option
        .setName(command.subcommands.list.args.id.name)
        .setDescription(command.subcommands.list.args.id.description)
        .setRequired(true))),
  async execute (interaction) {
    if (interaction.options.getSubcommand() === command.subcommands.add.name) {
      if (interaction.user.id !== interaction.guild.ownerId) {
        // checkPerms
      }
    }
    interaction.reply({
      content: 'Hello!',
      ephemeral: true
    })
  }
}
