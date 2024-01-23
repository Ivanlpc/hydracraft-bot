const { Events } = require('discord.js')
const Guild = require('../../api/controllers/Guild')
const ConsoleLogger = require('../../util/ConsoleLogger')
const COLOR = require('../../util/ConsoleColor')

module.exports = {
  name: Events.GuildDelete,
  async execute (guild) {
    Guild.leaveGuild(guild.id)
    ConsoleLogger.info(`${COLOR.CYAN}[EVENT] ${COLOR.WHITE}Guild leave ${guild.id}`)
  }
}
