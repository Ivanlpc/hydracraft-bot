const { REST, Routes } = require('discord.js')
const { CLIENT_ID, GUILD_ID, TOKEN } = require('./config.json')
const Logger = require('./util/Logger')
const COLOR = require('./util/ConsoleColor')
const rest = new REST().setToken(TOKEN)

class CommandManager {
  static async registerCommands (commands) {
    try {
      Logger.info('Registering commands...')
      const data = await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands })
      Logger.info(`Registered ${COLOR.GREEN}${data.length} ${COLOR.BLACK}commands`)
    } catch (error) {
      Logger.error(error)
    }
  }

  static async reloadCommand (client, fileName, commandName) {
    Logger.info(`Reloading ${commandName} command`)
    delete require.cache[require.resolve(`./commands/${fileName}`)]
    try {
      client.commands.delete(fileName)
      const index = client.commands_json.findIndex(elem => elem.name === commandName)
      if (!index) throw new Error('Unable to find the index of ' + commandName)
      client.commands_json.splice(index, 1)
      const newCommand = await require(`./commands/${fileName}`)
      client.commands_json.push(newCommand.data.toJSON())
      client.commands.set(newCommand.data.name, newCommand)
      this.registerCommands(client.commands_json)
      return true
    } catch (error) {
      Logger.error(error)
      return false
    }
  }
}

module.exports = CommandManager
