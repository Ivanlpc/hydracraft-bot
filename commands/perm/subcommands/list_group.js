const { getNodeIds } = require('../../../api/controllers/User')
const Logger = require('../../../util/Logger')
const listCommnand = require('../../../config/config.json').commands.perm.subcommands.list_group
const messages = require('../../../config/messages.json')
const embeds = require('../../../Embeds')

module.exports = {
  name: listCommnand.name,
  async execute (interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) {
      const permissionNode = interaction.options.getString(listCommnand.args.perm.name, true).valueOf()
      try {
        const query = await getNodeIds(interaction.guildId, permissionNode)
        if (query.length <= 0) {
          return interaction.reply({
            content: messages.permission_list_empty.replace('%perm%', permissionNode),
            ephemeral: true
          })
        }
        let formatedQuery = query.map(elem => `- <@!${elem.id}>`)

        if (formatedQuery.length > 20) {
          const size = formatedQuery.length - 20
          formatedQuery = formatedQuery.splice(19, size)
          formatedQuery.push(`... ${size} más...`)
        }
        formatedQuery = formatedQuery.join('\n')

        return interaction.reply({
          embeds: [embeds.perm_group_list(permissionNode, formatedQuery)],
          ephemeral: true
        })
      } catch (err) {
        Logger.error(err)
        return interaction.reply({
          content: messages.command_error,
          ephemeral: true
        })
      }
    }
  }
}
