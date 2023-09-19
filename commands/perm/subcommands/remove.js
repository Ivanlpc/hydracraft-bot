module.exports = {
  name: 'remove',
  async execute (interaction) {
    interaction.reply({
      content: 'Hello!',
      ephemeral: true
    })
  }
}
