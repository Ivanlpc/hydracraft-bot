const config = require('../config.json')

const QUERIES = {
  GetLastNickname: `SELECT lastNickname FROM ${config.Database.jPremiumDatabase}.user_profiles WHERE premiumId = ? OR uniqueId = ?`
}

module.exports = QUERIES
