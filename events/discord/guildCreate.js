const { Events } = require('discord.js')
const Guild = require('../../api/controllers/Guild')

module.exports = {
  name: Events.GuildCreate,
  async execute (interaction) {
    Guild.newGuild(interaction.guild.id)
  }
}
