const { getIDPermissions } = require('../../../api/controllers/User')
const Logger = require('../../../util/Logger')
const listCommnand = require('../../../config/config.json').commands.perm.subcommands.list_id
const messages = require('../../../config/messages.json').messages
const commands = require('../../../config/config.json').commands
const embeds = require('../../../Embeds')
module.exports = {
  name: listCommnand.name,
  async execute (interaction) {
    const mentionableId = interaction.options.getMentionable(listCommnand.args.id.name, true).valueOf()
    try {
      const query = await getIDPermissions(interaction.guildId, mentionableId)
      if (query.length <= 0) {
        return interaction.reply({
          content: messages.permission_list_empty.replace('%id%', mentionableId),
          ephemeral: true
        })
      }
      let permissionsFormat = ''
      query.forEach(perm => {
        perm = perm.split('.')
        let permissionName = commands
        for (let i = 0; i < perm.length; i++) {
          permissionName = permissionName[perm[i]]
        }
        permissionsFormat += '- ' + permissionName.permission_name + '\n'
      })
      return interaction.reply({
        embeds: [embeds.perm_list_id(mentionableId, permissionsFormat)],
        ephemeral: true
      })
    } catch (err) {
      Logger.error(err)
      return interaction.reply({
        content: messages.command_error,
        ephemeral: true
      })
    }
  }
}
