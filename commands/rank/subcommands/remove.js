const { removePermission } = require('../../../api/controllers/User')
const Logger = require('../../../util/Logger')
const command = require('../../../config/config.json').commands.perm.subcommands.remove
const messages = require('../../../config/messages.json').messages
module.exports = {
  name: command.name,
  async execute (interaction) {
    const permId = interaction.options.getString(command.args.perm.name, true).valueOf()
    const mentionableId = interaction.options.getMentionable(command.args.id.name, true).valueOf()
    try {
      const query = await removePermission(mentionableId, permId, interaction.guildId)
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
    } catch (err) {
      Logger.error(err)
      return interaction.reply({
        content: messages.command_error,
        ephemeral: true
      })
    }
  }
}
