const { Events } = require('discord.js')
const { bypassRoles, noMentionRoles } = require('../../config/config.json').mentions
const msg = require('../../config/messages.json').no_mention_roles

module.exports = {
  name: Events.MessageCreate,
  async execute (message) {
    if (!message.inGuild() || !message.member || message.author.bot) return
    if (message.member.roles.cache.hasAny(...bypassRoles) || message.member.id === message.guild.ownerId) return

    for (const member of message.mentions.members.values()) {
      if (member.roles.cache.hasAny(...noMentionRoles)) {
        await message.delete()
        return message.channel.send(msg.replaceAll('%id%', message.author.id))
      }
    }
  }
}
