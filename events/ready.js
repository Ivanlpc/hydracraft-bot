const { Events } = require('discord.js')
const Logger = require('../util/Logger')
const CommandManager = require('../CommandManager')
const COLOR = require('../util/ConsoleColor')

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute (client) {
    CommandManager.registerCommands(client.commands_json)
    Logger.info(`Ready! Logged in as ${COLOR.WHITE}${client.user.tag}`)
  }
}
