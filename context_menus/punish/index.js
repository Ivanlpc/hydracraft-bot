const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js')
const config = require('../../config/config.json').commands.punish

const selector = {}

const data = new ContextMenuCommandBuilder()
  .setName(config.context.name)
  .setType(ApplicationCommandType.Message)
  .setDMPermission(false)

module.exports = {
  data,
  async execute (interaction) {
    const messageId = interaction.targetId
    const user = interaction.channel.messages.cache.get(messageId).author.id
    if (!user) return interaction.reply({ content: 'User not found', ephemeral: true })
  }
}
