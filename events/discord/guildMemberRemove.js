const { Events } = require('discord.js')
const ConsoleLogger = require('../../util/ConsoleLogger')
const COLOR = require('../../util/ConsoleColor')
const { clearPermissions } = require('../../api/controllers/User')

module.exports = {
  name: Events.GuildMemberRemove,
  async execute (member) {
    await clearPermissions(member.id, { id: member.guild.id, name: member.guild.name })
    ConsoleLogger.info(`${COLOR.CYAN}[EVENT] ${COLOR.WHITE}Removed permissions of ${COLOR.YELLOW}${member.id} ${member.user.tag}`)
  }
}
