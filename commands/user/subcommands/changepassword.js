const { addPermission } = require('../../../api/controllers/User')
const Logger = require('../../../util/Logger')
const command = require('../../../config/config.json').commands.perm.subcommands.add
const messages = require('../../../config/messages.json')
module.exports = {
  name: command.name,
  async execute (interaction) {
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
