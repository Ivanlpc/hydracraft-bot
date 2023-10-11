const { Events } = require('discord.js')
const Guild = require('../../api/controllers/Guild')

module.exports = {
  name: Events.GuildDelete,
  async execute (interaction) {
    Guild.leaveGuild(interaction.guild.id)
  }
}
