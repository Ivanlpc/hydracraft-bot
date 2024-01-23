const ConsoleLogger = require('../../util/ConsoleLogger')
const { execute } = require('../Database')
const QUERIES = require('../Queries')

const Guild = {
  newGuild: async (guildData) => {
    try {
      const query = await execute(QUERIES.newGuild, [guildData.id, guildData.name, guildData.name])
      if (query.affectedRows > 0) ConsoleLogger.info(`NEW GUILD ${guildData.id} ${guildData.name}`)
    } catch (err) {
      ConsoleLogger.error(err)
    }
  },
  leaveGuild: async (id) => {
    try {
      const query = await execute(QUERIES.deleteGuild, [id])
      if (query.affectedRows > 0) ConsoleLogger.info(`Guild leave ${id}`)
      else return false
    } catch (err) {
      ConsoleLogger.error(err)
    }
  }
}

module.exports = Guild
