const Logger = require('../../../util/Logger')
const command = require('../../../config/config.json').commands.user.subcommands.changepassword
const messages = require('../../../config/messages.json')
const { isStaff } = require('../../../api/controllers/User')

module.exports = {
  name: command.name,
  async execute (interaction) {
    const nick = interaction.options.getString(command.args.nick.name, true).valueOf()
    try {
      const staff = await isStaff(nick)
    } catch (err) {
      Logger.error(err)
      return interaction.reply({
        content: messages.command_error,
        ephemeral: true
      })
    }
  }
}
