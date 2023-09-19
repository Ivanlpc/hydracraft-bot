module.exports = {
  name: 'list_id',
  async execute (interaction) {
    interaction.reply({
      content: 'Hello!',
      ephemeral: true
    })
  }
}
