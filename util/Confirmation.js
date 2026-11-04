const { ComponentType, MessageFlags } = require('discord.js')

module.exports = async function confirm (interaction, payload) {
  await interaction.reply(payload)
  const message = await interaction.fetchReply()
  try {
    const result = await message.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: 10000,
      filter: async button => {
        if (button.user.id === interaction.user.id) return ['yes', 'cancel'].includes(button.customId)
        await button.reply({ content: 'No puedes reaccionar a este mensaje', flags: MessageFlags.Ephemeral })
        return false
      }
    })
    await result.deferUpdate()
    return result
  } catch (error) {
    if (error.code === 'InteractionCollectorError') return null
    throw error
  }
}
