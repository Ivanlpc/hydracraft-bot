const path = require('path')
const { SlashCommandBuilder } = require('discord.js')
const Logger = require('../../util/Logger')
const ranksConfig = require('../../config/pterodactyl.json').ranks
const command = require('../../config/config.json').commands.rank
const { messages } = require('../../config/messages.json')
const { getAllowedIds } = require('../../api/controllers/User')
const CommandManager = require('../../CommandManager')

const subcommands = CommandManager.loadSubcommands(path.resolve(__dirname))

const ranks = (() => {
  const ranks = []
  for (const rankName in ranksConfig) {
    ranks.push({
      name: rankName,
      value: rankName.toLocaleLowerCase()
    })
  }
  return ranks
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
        .setName(command.subcommands.add.args.nick.name)
        .setDescription(command.subcommands.add.args.nick.description)
        .setRequired(true))
      .addStringOption(option => option
        .setName(command.subcommands.add.args.rank.name)
        .setDescription(command.subcommands.add.args.rank.description)
        .addChoices(...ranks)
        .setRequired(true)))
    .addSubcommand(cmd => cmd
      .setName(command.subcommands.remove.name)
      .setDescription(command.subcommands.remove.description)
      .addStringOption(option => option
        .setName(command.subcommands.remove.args.nick.name)
        .setDescription(command.subcommands.remove.args.nick.description)
        .setRequired(true))
      .addStringOption(option => option
        .setName(command.subcommands.remove.args.rank.name)
        .setDescription(command.subcommands.remove.args.rank.description)
        .addChoices(...ranks)
        .setRequired(true)))
    .addSubcommand(cmd => cmd
      .setName(command.subcommands.list_rank.name)
      .setDescription(command.subcommands.list_rank.description)
      .addStringOption(option => option
        .setName(command.subcommands.list_rank.args.nick.name)
        .setDescription(command.subcommands.list_rank.args.nick.description)
        .setRequired(true)))
    .addSubcommand(cmd => cmd
      .setName(command.subcommands.list_user.name)
      .setDescription(command.subcommands.list_user.description)
      .addStringOption(option => option
        .setName(command.subcommands.list_user.args.rank.name)
        .setDescription(command.subcommands.list_user.args.rank.description)
        .addChoices(...ranks)
        .setRequired(true))),
  async execute (interaction) {
    try {
      const roles = await getAllowedIds(interaction.guildId, 'rank')
      if (roles.length <= 0) {
        return interaction.reply({
          content: messages.no_permission,
          ephemeral: true
        })
      }
      const member = interaction.member
      if (!member.roles.cache.hasAny(roles) && !roles.includes(member.id) && member.id !== member.guild.ownerId) {
        return interaction.reply({
          content: messages.no_permission,
          ephemeral: true
        })
      }
      const subcommand = subcommands.get(interaction.options.getSubcommand())
      if (!subcommand) return
      await subcommand.execute(interaction)
    } catch (err) {
      Logger.error(`Error executing ${interaction.options.getSubcommand()}`)
      Logger.error(err)
      return interaction.reply({
        content: messages.command_error,
        ephemeral: true
      })
    }
  }
}
