const { SlashCommandSubcommandBuilder, ActionRowBuilder, ButtonBuilder, WebhookClient } = require('discord.js')
const DiscordLogger = require('../../../util/DiscordLogger')
const { isStaff, getUserData, isPremium, fixpremium } = require('../../../api/controllers/User')
const Embeds = require('../../../Embeds')
const messages = require('../../../config/messages.json')
const command = require('../../../config/config.json').commands.user.subcommands.fixpremium

const webhook = new WebhookClient({ url: process.env.WEBHOOK_FIXPREMIUM })

const button = new ButtonBuilder()
  .setCustomId('yes')
  .setLabel('CONFIRMAR')
  .setStyle('Success')
const cancel = new ButtonBuilder()
  .setCustomId('cancel')
  .setLabel('CANCELAR')
  .setStyle('Danger')

module.exports = {
  name: command.name,
  data: new SlashCommandSubcommandBuilder()
    .setName(command.name)
    .setDescription(command.description)
    .addStringOption(option => option
      .setName(command.args.nick.name)
      .setDescription(command.args.nick.description)
      .setRequired(true)),
  async execute (interaction) {
    const nick = interaction.options.getString(command.args.nick.name, true).valueOf()
    const staff = await isStaff(nick)
    if (staff) {
      return interaction.reply({
        content: messages.is_staff.replaceAll('%nick%', nick),
        ephemeral: true
      })
    }

    const userData = await getUserData(nick)
    if (userData === null) {
      return interaction.reply({
        content: messages.user_not_found,
        ephemeral: true
      })
    }
    if (isPremium(userData)) {
      return interaction.reply({
        content: messages.user_already_premium.replaceAll('%nick%', nick),
        ephemeral: true
      })
    }
    const filter = (buttonInteraction) => {
      if (buttonInteraction.user.id === interaction.user.id) return true
      return buttonInteraction.reply({ content: 'No puedes reaccionar a este mensaje', ephemeral: true })
    }
    const Collector = interaction.channel.createMessageComponentCollector({
      filter,
      max: 1,
      time: 10000
    })

    await interaction.reply({
      embeds: [Embeds.fixpremium_confirmation_embed(nick)],
      components: [new ActionRowBuilder().addComponents([button, cancel])]
    })

    Collector.on('end', async (collected) => {
      if (collected.size === 0) {
        await interaction.editReply({
          content: messages.command_cancelled,
          components: [],
          embeds: [],
          ephemeral: true
        })
        return interaction.followUp({
          content: messages.command_timeout,
          ephemeral: true
        })
      }

      const result = collected.first()
      if (result.customId === 'yes') {
        const success = await fixpremium(nick)
        if (success) {
          await interaction.editReply({
            content: messages.fixpremium_success.replaceAll('%nick%', nick),
            components: [],
            embeds: []
          })
          return await webhook.send({
            content: (await DiscordLogger.getImagesFromChannel(interaction.channel)).join('\n') || messages.no_images,
            embeds: [Embeds.log_fixpremium_embed(interaction.member, nick)]
          })
        } else {
          return interaction.editReply({
            content: messages.fixpremium_error.replaceAll('%nick%', nick),
            components: [],
            embeds: []
          })
        }
      } else {
        return interaction.editReply({
          content: messages.command_cancelled,
          components: [],
          embeds: [],
          ephemeral: true
        })
      }
    })
  }
}
