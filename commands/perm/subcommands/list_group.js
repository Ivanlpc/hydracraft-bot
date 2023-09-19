module.exports = {
  name: 'list_group',
  async execute (interaction) {
    interaction.reply({
      content: 'Hello!',
      ephemeral: true
    })
  }
}
