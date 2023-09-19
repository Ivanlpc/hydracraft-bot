module.exports = {
  name: 'add',
  async execute (interaction) {
    interaction.reply({
      content: 'Hello!',
      ephemeral: true
    })
  }
}
