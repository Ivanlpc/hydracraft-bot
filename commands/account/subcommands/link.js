const { linkAccount } = require('../../../api/controllers/User')
const command = require('../../../config/config.json').commands.account.subcommands.link
const EMBEDS = require('../../../Embeds')

module.exports = {
  name: command.name,
  async execute (interaction) {
    try {
      const code = interaction.options.getString(command.args.code.name, true)
      const discordId = interaction.user.id
      const link = await linkAccount(discordId, code)
      interaction.reply({
        embeds: [EMBEDS.linkAccount(discordId, link.lastNickname)],
        ephemeral: true
      })
    } catch (err) {
      interaction.reply({
        content: err,
        ephemeral: true
      })
    }
  }
}
