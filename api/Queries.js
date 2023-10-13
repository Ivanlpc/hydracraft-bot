const botName = require('../package.json').name
const jPremiumDatabase = require('../config/config.json').JPREMIUM_DATABASE_NAME

const QUERIES = {
  getLastNickname: `SELECT lastNickname FROM ${jPremiumDatabase}.user_profiles WHERE premiumId = ? OR uniqueId = ?`,
  getPermissions: `SELECT * FROM ${botName}.permissions WHERE guildId = ? AND id = ? AND permission_node = ?`,
  addPermission: `INSERT INTO ${botName}.permissions (guildId, id, permission_node) VALUES (?, ?, ?)`,
  removePermission: `DELETE FROM ${botName}.permissions WHERE guildId = ? AND id = ? AND permission_node = ?`,
  getAllowedIds: `SELECT id FROM ${botName}.permissions WHERE guildId = ? AND permission_node = ?`,
  getPermissionsOfId: `SELECT permission_node FROM ${botName}.permissions WHERE guildId = ? AND id = ?`,
  getPermissionsNode: `SELECT id FROM ${botName}.permissions WHERE guildId = ? AND permission_node = ?`,
  newGuild: `INSERT INTO ${botName}.guilds (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE id = ?, name = ?`,
  deleteGuild: `DELETE FROM ${botName}.guilds WHERE id = ?`,
  linkAccount: `UPDATE ${jPremiumDatabase}.user_profiles SET code = -1, discord = ? WHERE code = ?`,
  unLinkAccount: `UPDATE ${jPremiumDatabase}.user_profiles SET code = NULL, discord = NULL where discord = ? AND uniqueId = ?`,
  getAccounts: `SELECT uniqueId, lastNickname FROM ${jPremiumDatabase}.user_profiles WHERE discord = ?`,
  getAccountInformation: `SELECT uniqueId, lastNickname, lastAddress, lastServer, firstAddress, firstSeen, premiumId FROM ${jPremiumDatabase}.user_profiles WHERE discord = ? AND uniqueId = ?`
}

module.exports = QUERIES
