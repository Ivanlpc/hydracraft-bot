const { Events } = require('discord.js')
const ConsoleLogger = require('../../util/ConsoleLogger')
const COLOR = require('../../util/ConsoleColor')
const { clearPermissions } = require('../../api/controllers/User')

module.exports = {
  name: Events.GuildRoleDelete,
  async execute (role) {
    await clearPermissions(role.id, { id: role.guild.id, name: role.guild.name })
    ConsoleLogger.info(`${COLOR.CYAN}[EVENT] ${COLOR.WHITE}Removed permissions of role ${COLOR.YELLOW}${role.id} `)
  }
}
