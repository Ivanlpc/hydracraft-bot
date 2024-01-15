const botName = require('../package.json').name
const { jPremiumDatabase, pins } = require('../config/config.json')

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
  linkAccount: `UPDATE ${jPremiumDatabase}.user_profiles SET discord = ? WHERE uniqueId = (SELECT id FROM ${jPremiumDatabase}.pending_links WHERE code = ?)`,
  unLinkAccount: `UPDATE ${jPremiumDatabase}.user_profiles SET discord = NULL where discord = ? AND uniqueId = ?`,
  getAccounts: `SELECT uniqueId, lastNickname FROM ${jPremiumDatabase}.user_profiles WHERE discord = ?`,
  getAccountInformation: `SELECT uniqueId, lastNickname, lastAddress, lastServer, firstAddress, firstSeen, premiumId FROM ${jPremiumDatabase}.user_profiles WHERE discord = ? AND uniqueId = ?`,
  isStaff: `SELECT * FROM ${pins}.PinCodes WHERE uuid = ?`
}

module.exports = QUERIES
