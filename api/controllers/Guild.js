const Logger = require('../../util/Logger')
const { execute } = require('../Database')
const QUERIES = require('../Queries')

const Guild = {
  newGuild: async (guildData) => {
    try {
      const query = await execute(QUERIES.newGuild, [guildData.id, guildData.name, guildData.id, guildData.name])
      if (query.affectedRows > 0) Logger.info(`NEW GUILD ${guildData.id} ${guildData.name}`)
    } catch (err) {
      Logger.error(err)
    }
  },
  leaveGuild: async (id) => {
    try {
      const query = await execute(QUERIES.deleteGuild, [id])
      if (query.affectedRows > 0) Logger.info(`Guild leave ${id}`)
      else return false
    } catch (err) {
      Logger.error(err)
    }
  }
}

module.exports = Guild
