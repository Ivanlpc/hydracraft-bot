const { SlashCommandSubcommandBuilder } = require('discord.js')
const { addPermission } = require('../../../api/controllers/User')
const command = require('../../../config/config.json').commands.perm.subcommands.add
const messages = require('../../../config/messages.json')

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
    const query = await addPermission(mentionableId, permId, {
      id: interaction.guildId,
      name: interaction.guild.name
    })
    if (!query) {
      return interaction.reply({
        content: messages.permission_exists.replace('%id%', mentionableId),
        ephemeral: true
      })
    } else {
      return interaction.reply({
        content: messages.permission_added.replace('%id%', mentionableId),
        ephemeral: true
      })
    }
  }
}
