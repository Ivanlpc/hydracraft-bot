const { SlashCommandSubcommandBuilder, ActionRowBuilder, ButtonBuilder, WebhookClient } = require('discord.js')
const DiscordLogger = require('../../../util/DiscordLogger')
const { isStaff, getUserData, isPremium, mergepremium, updatePaymentNickname } = require('../../../api/controllers/User')
const Embeds = require('../../../Embeds')
const messages = require('../../../config/messages.json')
const command = require('../../../config/config.json').commands.user.subcommands.mergepremium

const webhook = new WebhookClient({ url: process.env.WEBHOOK_MERGEPREMIUM })

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
      .setName(command.args.oldnick.name)
      .setDescription(command.args.oldnick.description)
      .setRequired(true))
    .addStringOption(option => option
      .setName(command.args.newnick.name)
      .setDescription(command.args.newnick.description)
      .setRequired(true)),
  async execute (interaction) {
    const oldnick = interaction.options.getString(command.args.oldnick.name, true).valueOf()
    const newnick = interaction.options.getString(command.args.newnick.name, true).valueOf()
    const [staffNew, staffOld] = await Promise.all([isStaff(newnick), isStaff(oldnick)])
    if (staffNew || staffOld) {
      return interaction.reply({
        content: messages.is_staff.replaceAll('%nick%', oldnick + ' / ' + newnick),
        ephemeral: true
      })
    }

    const [dataNew, dataOld] = await Promise.all([getUserData(newnick), getUserData(oldnick)])
    if (dataNew === null || dataOld === null) {
      return interaction.reply({
        content: messages.user_not_found,
        ephemeral: true
      })
    }
    if (isPremium(dataOld)) {
      return interaction.reply({
        content: messages.user_already_premium.replaceAll('%nick%', oldnick),
        ephemeral: true
      })
    }
    if (!isPremium(dataNew)) {
      return interaction.reply({
        content: messages.user_not_premium.replaceAll('%nick%', newnick),
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
      embeds: [Embeds.mergepremium_confirmation_embed(newnick, oldnick)],
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
        const success = await mergepremium(newnick, oldnick)
        if (success) {
          await interaction.editReply({
            content: messages.mergepremium_success.replaceAll('%oldnick%', oldnick).replaceAll('%newnick%', newnick),
            components: [],
            embeds: []
          })
          const update = await updatePaymentNickname(oldnick, newnick)
          if (update) {
            await interaction.followUp({
              content: messages.updatedPayments.replaceAll('%oldnick%', oldnick).replaceAll('%newnick%', newnick),
              ephemeral: false
            })
          } else {
            await interaction.followUp({
              content: messages.updatedPayments_error.replaceAll('%oldnick%', oldnick).replaceAll('%newnick%', newnick),
              ephemeral: false
            })
          }
          const images = await DiscordLogger.getImagesFromChannel(interaction.channel)
          return await DiscordLogger.sendImagesToWebhook(webhook, {
            images,
            embeds: [Embeds.log_mergepremium_embed(interaction.member, newnick, oldnick)]
          })
        } else {
          return interaction.editReply({
            content: messages.mergepremium_error.replaceAll('%oldnick%', oldnick).replaceAll('%newnick%', newnick),
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
