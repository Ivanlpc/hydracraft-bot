const { Events } = require('discord.js')
const ConsoleLogger = require('../../util/ConsoleLogger')
const COLOR = require('../../util/ConsoleColor')

module.exports = {
  name: Events.Warn,
  async execute (error) {
    ConsoleLogger.error(`${COLOR.CYAN}[EVENT] ${COLOR.WHITE}Error: ${COLOR.YELLOW}${error} `)
  }
}
