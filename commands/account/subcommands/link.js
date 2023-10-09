const { addPermission } = require('../../../api/controllers/User')
const Logger = require('../../../util/Logger')
const command = require('../../../config.json').commands.account.subcommands.link
const messages = require('../../../config.json').messages
module.exports = {
  name: command.name,
  async execute (interaction) {
    //
  }
}
