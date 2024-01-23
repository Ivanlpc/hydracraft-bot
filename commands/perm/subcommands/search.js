const { SlashCommandSubcommandBuilder } = require('discord.js')
const { getNodeIds } = require('../../../api/controllers/User')
const command = require('../../../config/config.json').commands.perm.subcommands.list_group
const messages = require('../../../config/messages.json')
const embeds = require('../../../Embeds')

module.exports = {
  name: command.name,
  build: (permissionList) => new SlashCommandSubcommandBuilder()
    .setName(command.name)
    .setDescription(command.description)
    .addStringOption(option => option
      .setName(command.args.perm.name)
      .setDescription(command.args.perm.description)
      .addChoices(...permissionList)
      .setRequired(true)),

  async execute (interaction) {
    const permissionNode = interaction.options.getString(command.args.perm.name, true).valueOf()
    const query = await getNodeIds(permissionNode, {
      id: interaction.guildId,
      name: interaction.guild.name
    })
    if (query.length <= 0) {
      return interaction.reply({
        content: messages.permission_node_empty,
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
  }
}
