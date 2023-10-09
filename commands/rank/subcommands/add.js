const { addPermission } = require('../../../api/controllers/User')
const Logger = require('../../../util/Logger')
const pterodactyl = require('../../../config/pterodactyl.json')
const command = require('../../../config/config.json').commands.rank.subcommands.add
const messages = require('../../../config/messages.json').messages
module.exports = {
  name: command.name,
  async execute (interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) {
      const rank = interaction.options.getString(command.args.rank.name, true).valueOf()
      const nick = interaction.options.getString(command.args.nick.name, true).valueOf()
      try {
        //
      } catch (err) {
        Logger.error(err)
        return interaction.reply({
          content: messages.command_error,
          ephemeral: true
        })
      }
    }
  }
}
