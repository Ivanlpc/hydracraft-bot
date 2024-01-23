const { Events } = require('discord.js')
const Guild = require('../../../api/controllers/Guild')
const ConsoleLogger = require('../../../util/ConsoleLogger')
const COLOR = require('../../../util/ConsoleColor')
const allowedGuilds = require('../../../config/config.json').allowed_guilds

module.exports = {
  name: Events.GuildCreate,
  async execute (guild) {
    if (!allowedGuilds.includes(guild.id)) {
      guild.leave().then(() => ConsoleLogger.info(`${COLOR.CYAN}[EVENT] ${COLOR.WHITE}Auto left guild ${guild.id} ${guild.name}`)).catch(err => ConsoleLogger.error(err))
      return
    }
    Guild.newGuild(guild)
    ConsoleLogger.info(`NEW GUILD ${guild.id} ${guild.name}`)
  }
}
