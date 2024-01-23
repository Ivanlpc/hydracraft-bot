const { SlashCommandSubcommandBuilder } = require('discord.js')
const { getIDPermissions } = require('../../../api/controllers/User')
const command = require('../../../config/config.json').commands.perm.subcommands.list_id
const messages = require('../../../config/messages.json')
const commands = require('../../../config/config.json').commands
const embeds = require('../../../Embeds')
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
    const query = await getIDPermissions(mentionableId, {
      id: interaction.guildId,
      name: interaction.guild.name
    })
    let permissionsFormat = ''
    for (const perm of query) {
      if (perm === 'all') permissionsFormat += '- ' + commands.perm.all_perms + '\n'
      if (!(perm in commands)) continue
      const permissionName = commands[perm].permission_name
      permissionsFormat += '- ' + permissionName + '\n'
    }
    if (permissionsFormat.length <= 0) {
      return interaction.reply({
        content: messages.permission_list_empty.replace('%id%', mentionableId),
        ephemeral: true
      })
    }
    return interaction.reply({
      embeds: [embeds.perm_list_id(mentionableId, permissionsFormat)],
      ephemeral: true
    })
  }
}
