const { Events } = require('discord.js')
const { performance } = require('perf_hooks')
const ConsoleLogger = require('../../util/ConsoleLogger')
const { getAllowedIds } = require('../../api/controllers/User')
const messages = require('../../config/messages.json')

module.exports = {
  name: Events.InteractionCreate,
  async execute (interaction) {
    if (interaction.channel.isDMBased()) return
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName)

      if (!command) {
        ConsoleLogger.error(`No command matching ${interaction.commandName} was found.`)
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
              content: messages.cooldown.replace('%cmd%', command.data.name).replace('%time%', `<t:${expiredTimestamp}:R>`),
              ephemeral: true
            })
          }
        }
        cooldownIds.set(interaction.user.id, (now + command.cooldown * 1000))
      }
      if (command.permission && command.permission.length > 0) {
        const member = interaction.member
        let roles = []
        roles = await getAllowedIds(interaction.guildId, command.data.name)
        if (roles.length <= 0) {
          return interaction.reply({
            content: messages.no_permission,
            ephemeral: true
          })
        }
        if (!member.roles.cache.hasAny(roles) && !roles.includes(member.id)) {
          return interaction.reply({
            content: messages.no_permission,
            ephemeral: true
          })
        }
      }

      try {
        const startTime = performance.now()
        await command.execute(interaction)
        const endTime = performance.now()
        ConsoleLogger.command(interaction, Math.round(endTime - startTime))
      } catch (error) {
        ConsoleLogger.error(`Error executing ${interaction.commandName}`)
        ConsoleLogger.error(error)
        interaction.fetchReply().then(reply => reply).catch(() => {
          interaction.reply({
            content: messages.command_error,
            ephemeral: true
          })
        })
      }
    } else if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName)
      if (!command) {
        ConsoleLogger.error(`No command matching ${interaction.commandName} was found.`)
        return interaction.reply({
          content: messages.unknown_command,
          ephemeral: true
        })
      }
      try {
        await command.autocomplete(interaction)
      } catch (error) {
        ConsoleLogger.error(`Error executing ${interaction.commandName}`)
        ConsoleLogger.error(error)
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
