const botName = require('../package.json').name
const { jPremiumDatabase, pins } = require('../config/config.json')

const QUERIES = {
  getLastNickname: `SELECT lastNickname FROM ${jPremiumDatabase}.user_profiles WHERE premiumId = ? OR uniqueId = ?`,
  addPermission: `INSERT INTO ${botName}.permissions (guildId, id, permission_node) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE permission_node = permission_node`,
  removePermission: `DELETE FROM ${botName}.permissions WHERE guildId = ? AND id = ? AND permission_node = ?`,
  clearPermissions: `DELETE FROM ${botName}.permissions WHERE guildId = ? AND id = ?`,
  getAllowedIds: `SELECT id FROM ${botName}.permissions WHERE guildId = ? AND (permission_node = ? OR permission_node = 'all')`,
  getPermissionsOfId: `SELECT permission_node FROM ${botName}.permissions WHERE guildId = ? AND id = ?`,
  getPermissionsNode: `SELECT id FROM ${botName}.permissions WHERE guildId = ? AND permission_node = ?`,
  newGuild: `INSERT INTO ${botName}.guilds (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = ?`,
  deleteGuild: `DELETE FROM ${botName}.guilds WHERE id = ?`,
  linkAccount: `UPDATE ${jPremiumDatabase}.user_profiles SET discord = ? WHERE uniqueId = (SELECT id FROM ${jPremiumDatabase}.pending_links WHERE code = ?)`,
  unLinkAccount: `UPDATE ${jPremiumDatabase}.user_profiles SET discord = NULL where discord = ? AND uniqueId = ?`,
  getAccounts: `SELECT uniqueId, lastNickname FROM ${jPremiumDatabase}.user_profiles WHERE discord = ?`,
  getAccountInformation: `SELECT uniqueId, lastNickname, lastAddress, lastServer, firstAddress, firstSeen, premiumId FROM ${jPremiumDatabase}.user_profiles WHERE discord = ? AND uniqueId = ?`,
  isStaff: `SELECT * FROM ${pins}.PinCodes WHERE uuid = ?`,
  getUserData: `SELECT * FROM ${jPremiumDatabase}.user_profiles WHERE lastNickname = ?`,
  getToken: `SELECT token FROM ${botName}.tokens`
}

module.exports = QUERIES
