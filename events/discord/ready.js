const { Events } = require('discord.js')
const Logger = require('../../util/Logger')
const CommandManager = require('../../CommandManager')
const COLOR = require('../../util/ConsoleColor')
const { createTables } = require('../../api/Database')

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute (client) {
    CommandManager.registerCommands(client.commands_json)
    createTables()
    Logger.info(`Ready! Logged in as ${COLOR.WHITE}${client.user.tag}`)
  }
}
