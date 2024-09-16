const { SlashCommandSubcommandBuilder } = require('discord.js')
const { getUserPunishmentsId } = require('../../../api/controllers/Moderation')
const command = require('../../config/config.json').commands.punish.subcommands.user

module.exports = {
  name: command.name,
  data: new SlashCommandSubcommandBuilder()
    .setName(command.name)
    .setDescription(command.description)
    .addUserOption(option => option
      .setName(command.args.user.name)
      .setDescription(command.args.user.description)
      .setRequired(true)
    )
    .addStringOption(option => option
      .setName(command.args.reason.name)
      .setDescription(command.args.reason.description)
      .setRequired(true)
      .setAutocomplete(true)
    ),
  async execute (interaction) {
    const user = interaction.options.getUser(command.args.user.name, true)
    const reason = interaction.options.getNumber(command.args.reason.name, true)
    const userPunishments = await getUserPunishmentsId(user.id, reason)
  },
  async autocomlpete (interaction) {
    if (!interaction.client.punishments || interaction.client.punishments.expire < Date.now()) {
      interaction.client.punishments = {
        expire: Date.now() + command.expire_time,
        types: await interaction.client.moderation.getPunishmentsTypes()
      }
    }
    const types = interaction.client.punishments.types
    const focused = interaction.options.getFocused()
    const filtered = types.filter(type => type.name.toLowerCase().includes(focused.toLowerCase()))
    return await interaction.respond(
      filtered.map(type => ({
        name: type.name,
        value: type.id
      }))
    )
  }
}
