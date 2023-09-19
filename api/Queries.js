const botName = require('../package.json').name
const jPremiumDatabase = require('../config.json').JPREMIUM_DATABASE_NAME

const QUERIES = {
  GetLastNickname: `SELECT lastNickname FROM ${jPremiumDatabase}.user_profiles WHERE premiumId = ? OR uniqueId = ?`,
  GetPermissions: `SELECT * FROM ${botName}.permissions WHERE guildId = ? AND id = ? AND permission_node = ?`
}

module.exports = QUERIES
