const { SlashCommandSubcommandBuilder } = require('discord.js')
const { clearPermissions } = require('../../../api/controllers/User')
const command = require('../../../config/config.json').commands.perm.subcommands.clear
const messages = require('../../../config/messages.json')
module.exports = {
  name: command.name,
  build: () => new SlashCommandSubcommandBuilder()
    .setName(command.name)
    .setDescription(command.description)
    .addMentionableOption(option => option
      .setName(command.args.id.name)
      .setDescription(command.args.id.description)
      .setRequired(true)),

  async execute (interaction) {
    const mentionableId = interaction.options.getMentionable(command.args.id.name, true).valueOf()
    const query = await clearPermissions(mentionableId, {
      id: interaction.guildId,
      name: interaction.guild.name
    })
    if (!query) {
      return interaction.reply({
        content: messages.permission_list_empty.replace('%id%', mentionableId),
        ephemeral: true
      })
    } else {
      return interaction.reply({
        content: messages.permission_cleared.replace('%id%', mentionableId),
        ephemeral: true
      })
    }
  }
}
