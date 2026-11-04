const { Events, Collection, MessageFlags } = require('discord.js')
const { performance } = require('node:perf_hooks')
const ConsoleLogger = require('../../util/ConsoleLogger')
const { getAllowedIds } = require('../../api/controllers/User')
const messages = require('../../config/messages.json')

module.exports = {
  name: Events.InteractionCreate,
  async execute (interaction) {
    if (!interaction.inGuild()) return
    try {
      if (interaction.isAutocomplete()) {
        const command = interaction.client.commands.get(interaction.commandName)
        if (!command?.autocomplete) return await interaction.respond([])
        return await command.autocomplete(interaction)
      }
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName)
        if (!command) {
          return await interaction.reply({ content: messages.unknown_command, flags: MessageFlags.Ephemeral })
        }
        if (command.permission) {
          const roles = await getAllowedIds(interaction.guildId, command.permission)
          const memberRoles = interaction.member.roles
          const hasRole = Array.isArray(memberRoles)
            ? memberRoles.some(role => roles.includes(role))
            : memberRoles.cache.hasAny(...roles)
          if (!hasRole && !roles.includes(interaction.user.id)) {
            return await interaction.reply({ content: messages.no_permission, flags: MessageFlags.Ephemeral })
          }
        }
        if (command.cooldown > 0) {
          const cooldowns = interaction.client.cooldowns
          if (!cooldowns.has(command.data.name)) cooldowns.set(command.data.name, new Collection())
          const ids = cooldowns.get(command.data.name)
          const now = Date.now()
          for (const [id, expires] of ids) {
            if (expires <= now) ids.delete(id)
          }
          const expires = ids.get(interaction.user.id)
          if (expires > now) {
            return await interaction.reply({
              content: messages.cooldown.replace('%cmd%', command.data.name).replace('%time%', `<t:${Math.ceil(expires / 1000)}:R>`),
              flags: MessageFlags.Ephemeral
            })
          }
          ids.set(interaction.user.id, now + command.cooldown * 1000)
        }
        const start = performance.now()
        await command.execute(interaction)
        ConsoleLogger.command(interaction, Math.round(performance.now() - start))
      } else if (interaction.isStringSelectMenu() || interaction.isButton()) {
        const handlers = interaction.isButton() ? interaction.client.buttons : interaction.client.selectMenus
        const handler = handlers.get(interaction.customId.split(';')[0])
        if (handler) await handler.execute(interaction.client, interaction)
      }
    } catch (error) {
      ConsoleLogger.error(error)
      try {
        if (interaction.isAutocomplete()) {
          if (!interaction.responded) await interaction.respond([])
        } else if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({ content: messages.command_error })
        } else if (interaction.replied) {
          await interaction.followUp({ content: messages.command_error, flags: MessageFlags.Ephemeral })
        } else {
          await interaction.reply({ content: messages.command_error, flags: MessageFlags.Ephemeral })
        }
      } catch (replyError) {
        ConsoleLogger.error(replyError)
      }
    }
  }
}
