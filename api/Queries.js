const jPremiumDatabase = require('../config.json').DATABASE.jPremiumDatabase

const QUERIES = {
  GetLastNickname: `SELECT lastNickname FROM ${jPremiumDatabase}.user_profiles WHERE premiumId = ? OR uniqueId = ?`
}

module.exports = QUERIES
