const fs = require('fs')
const path = require('path')
const { REST, Routes } = require('discord.js')
const TOKEN = process.env.TOKEN
const CLIENT_ID = process.env.CLIENT_ID
const ConsoleLogger = require('./util/ConsoleLogger')
const COLOR = require('./util/ConsoleColor')
const rest = new REST().setToken(TOKEN)
const allowedGuilds = require('./config/config.json').allowed_guilds

class CommandManager {
  static async registerCommands (commands) {
    try {
      ConsoleLogger.info(`${COLOR.WHITE}Registering commands...`)
      for (const guildId of allowedGuilds) {
        const data = await rest.put(
          Routes.applicationGuildCommands(CLIENT_ID, guildId),
          { body: commands })
        ConsoleLogger.info(`${COLOR.WHITE}Registered ${COLOR.GREEN}${data.length} ${COLOR.WHITE}commands in guild ${guildId}`)
      }
    } catch (error) {
      ConsoleLogger.error(error)
    }
  }

  static async reloadCommand (client, fileName, commandName) {
    ConsoleLogger.info(`Reloading ${commandName} command`)
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
      ConsoleLogger.error(error)
      return false
    }
  }

  static loadSubcommands (dirname) {
    const filePath = path.join(dirname, '/subcommands')
    const subcommandsFiles = fs.readdirSync(filePath)
    const data = new Map()
    for (const file of subcommandsFiles) {
      const subcommand = require(`${filePath}/${file}`)
      if (!subcommand) continue
      data.set(subcommand.name, subcommand)
    }
    return data
  }
}

module.exports = CommandManager
