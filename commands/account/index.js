const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js')
const path = require('path')
const command = require('../../config/config.json').commands.account
const Logger = require('../../util/Logger')
const messages = require('../../config/messages.json')
const CommandManager = require('../../CommandManager')

const createSelectMenu = (accounts) => {
  const options = accounts.map(elem => ({
    label: elem.lastNickname,
    value: elem.uniqueId
  }))
  const select = new StringSelectMenuBuilder()
    .setCustomId('account_info_selector')
    .setPlaceholder('SELECCIONA CUENTA')
    .addOptions(...options)

  const row = new ActionRowBuilder()
    .addComponents(select)
  return row
}

const subcommands = CommandManager.loadSubcommands(path.resolve(__dirname))

module.exports = {
  createSelectMenu,
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
    try {
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
