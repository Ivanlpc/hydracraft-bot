const { SlashCommandSubcommandBuilder, WebhookClient } = require('discord.js')
const DiscordLogger = require('../../../util/DiscordLogger')
const { isStaff, getUserData, hasPassword, createPassword, updatePassword, isPremium } = require('../../../api/controllers/User')
const Embeds = require('../../../Embeds')
const messages = require('../../../config/messages.json')
const command = require('../../../config/config.json').commands.user.subcommands.changepassword

const webhook = new WebhookClient({ url: process.env.WEBHOOK_CHANGEPASSWORD })

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
    let password
    if (!hasPassword(userData)) {
      password = await createPassword(nick)
    } else {
      password = await updatePassword(nick)
    }
    if (password === null) {
      return interaction.reply({
        content: messages.command_error,
        ephemeral: true
      })
    }
    await interaction.reply({
      embeds: [Embeds.password_embed(nick, password)],
      ephemeral: false
    })
    const images = await DiscordLogger.getImagesFromChannel(interaction.channel)
    return await DiscordLogger.sendImagesToWebhook(webhook, {
      images,
      embeds: [Embeds.log_password_embed(interaction.member, nick, password)]
    })
  }
}
