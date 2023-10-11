const { Events } = require('discord.js')
const Logger = require('../../util/Logger')
const { messages } = require('../../config/messages.json')

module.exports = {
  name: Events.InteractionCreate,
  async execute (interaction) {
    if (interaction.channel.isDMBased()) return
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName)

      if (!command) {
        Logger.error(`No command matching ${interaction.commandName} was found.`)
        return interaction.reply({
          content: messages.unknown_command,
          ephemeral: true
        })
      }
      if (command.cooldown && command.cooldown > 0) {
        const now = Date.now()
        const cooldowns = interaction.client.cooldowns
        const cooldownIds = cooldowns.get(command.data.name)
        if (cooldownIds.has(interaction.user.id)) {
          const expirationTime = cooldownIds.get(interaction.user.id)
          if (now < expirationTime) {
            const expiredTimestamp = Math.round(expirationTime / 1000)
            return interaction.reply({
              content: messages.cooldown.replace('{0}', command.data.name).replace('{1}', `<t:${expiredTimestamp}:R>`),
              ephemeral: true
            })
          }
        }
        cooldownIds.set(interaction.user.id, (now + command.cooldown * 1000))
      }
      try {
        await command.execute(interaction)
      } catch (error) {
        Logger.error(`Error executing ${interaction.commandName}`)
        Logger.error(error)
        return interaction.reply({
          content: messages.command_error,
          ephemeral: true
        })
      }
    } else if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName)
      if (!command) {
        Logger.error(`No command matching ${interaction.commandName} was found.`)
        return interaction.reply({
          content: messages.unknown_command,
          ephemeral: true
        })
      }
      try {
        await command.autocomplete(interaction)
      } catch (error) {
        Logger.error(`Error executing ${interaction.commandName}`)
        Logger.error(error)
        return interaction.reply({
          content: messages.command_error,
          ephemeral: true
        })
      }
    } else if (interaction.isStringSelectMenu()) {
      const selectMenu = interaction.client.getSelectMenu(interaction.customId)
      if (!selectMenu) return
      try {
        await selectMenu.execute(interaction.client, interaction)
      } catch (e) {
        interaction.reply({
          content: messages.command_error,
          ephemeral: true
        })
      }
    }
  }
}
