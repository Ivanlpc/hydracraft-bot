const { SlashCommandSubcommandBuilder } = require('discord.js')
const { removePermission } = require('../../../api/controllers/User')
const messages = require('../../../config/messages.json')
const command = require('../../../config/config.json').commands.perm.subcommands.remove

module.exports = {
  name: command.name,
  build: (permissionList) => new SlashCommandSubcommandBuilder()
    .setName(command.name)
    .setDescription(command.description)
    .addStringOption(option => option
      .setName(command.args.perm.name)
      .setDescription(command.args.perm.description)
      .addChoices(...permissionList)
      .setRequired(true))
    .addMentionableOption(option => option
      .setName(command.args.id.name)
      .setDescription(command.args.id.description)
      .setRequired(true)),

  async execute (interaction) {
    const permId = interaction.options.getString(command.args.perm.name, true).valueOf()
    const mentionableId = interaction.options.getMentionable(command.args.id.name, true).valueOf()
    const query = await removePermission(mentionableId, permId, {
      id: interaction.guildId,
      name: interaction.guild.name
    })
    if (!query) {
      return interaction.reply({
        content: messages.permission_not_exists.replace('%id%', mentionableId),
        ephemeral: true
      })
    } else {
      return interaction.reply({
        content: messages.permission_removed.replace('%id%', mentionableId),
        ephemeral: true
      })
    }
  }
}
