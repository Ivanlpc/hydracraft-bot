const botName = require('../package.json').name
const jPremiumDatabase = require('../config.json').JPREMIUM_DATABASE_NAME

const QUERIES = {
  getLastNickname: `SELECT lastNickname FROM ${jPremiumDatabase}.user_profiles WHERE premiumId = ? OR uniqueId = ?`,
  getPermissions: `SELECT * FROM ${botName}.permissions WHERE guildId = ? AND id = ? AND permission_node = ?`,
  addPermission: `INSERT INTO ${botName}.permissions (guildId, id, permission_node) VALUES (?, ?, ?)`,
  removePermission: `DELETE FROM ${botName}.permissions WHERE guildId = ? AND id = ? AND permission_node = ?`,
  getAllowedIds: `SELECT id FROM ${botName}.permissions WHERE guildId = ? AND permission_node = ?`,
  getPermissionsOfId: `SELECT permission_node FROM ${botName}.permissions WHERE guildId = ? AND id = ?`,
  getPermissionsNode: `SELECT id FROM ${botName}.permissions WHERE guildId = ? AND permission_node = ?`
}

module.exports = QUERIES
