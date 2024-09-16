const ConsoleLogger = require('../utils/ConsoleLogger')
const { fetchAll } = require('../Database')
const QUERIES = require('../Queries')

const Moderation = {
  getPunishmentsTypes: async () => {
    try {
      const punishments = await fetchAll(QUERIES.getPunishmentsTypes, [])
      return punishments
    } catch (err) {
      ConsoleLogger.error(err)
      throw new Error('There was an error while trying to get the punishments types')
    }
  },
  getUserPunishmentsId: async (userId, punishmentType) => {
    try {
      const punishments = await fetchAll(QUERIES.getUserPunishmentsId, [userId, punishmentType])
      return punishments
    } catch (err) {
      ConsoleLogger.error(err)
      throw new Error('There was an error while trying to get the user punishments id')
    }
  },
  getUserPunishments: async (userId) => {
    try {
      const punishments = await fetchAll(QUERIES.getUserPunishments, [userId])
      return punishments
    } catch (err) {
      ConsoleLogger.error(err)
      throw new Error('There was an error while trying to get the user punishments')
    }
  }
}

module.exports = Moderation
