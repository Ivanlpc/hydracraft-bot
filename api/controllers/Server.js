const Agent = require('../Agent')
const { bungeecord_target: bungeecordTarget } = require('../../config/agent.json')
const ConsoleLogger = require('../../util/ConsoleLogger')
const { execute } = require('../Database')
const QUERIES = require('../Queries')

const Server = {
  sendBungeecordCommand: async command => Agent.sendCommand(bungeecordTarget, command),
  sendServerCommand: async (command, target) => Agent.sendCommand(target, command),

  removePermission: async (schema, uuid, permission) => {
    try {
      await execute(QUERIES.removeLPPermission.replace('%database%', schema), [uuid, permission])
    } catch (err) {
      ConsoleLogger.error(err)
      throw new Error('There was an error while trying to save the vote', { cause: err })
    }
  },

  removeRankPermission: async (schema, rank, permission) => {
    try {
      await execute(QUERIES.removeLPRankPermission.replace('%database%', schema), [rank, permission])
    } catch (err) {
      ConsoleLogger.error(err)
      throw new Error('There was an error while trying to save the vote', { cause: err })
    }
  }

}

module.exports = Server
