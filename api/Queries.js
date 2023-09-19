const jPremiumDatabase = require('../config.json').JPREMIUM_DATABASE_NAME

const QUERIES = {
  GetLastNickname: `SELECT lastNickname FROM ${jPremiumDatabase}.user_profiles WHERE premiumId = ? OR uniqueId = ?`
}

module.exports = QUERIES
