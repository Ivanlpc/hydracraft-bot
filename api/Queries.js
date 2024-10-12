const botName = require('../package.json').name
const { jPremiumDatabase, pins, luckperms, bans } = require('../config/config.json')

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
  getToken: `SELECT token FROM ${botName}.tokens`,
  getStaffUuidByNick: `SELECT uuid FROM ${luckperms}.luckperms_players WHERE username = ?`,
  getStaffNickByRank: `SELECT DISTINCT pl.username as username FROM ${luckperms}.luckperms_user_permissions perm JOIN ${luckperms}.luckperms_players pl ON (perm.uuid = pl.uuid) WHERE perm.permission IN (?)`,
  getStaffUuidName: `SELECT DISTINCT perm.uuid as uuid, pl.username as username FROM ${luckperms}.luckperms_user_permissions perm JOIN ${luckperms}.luckperms_players pl ON (perm.uuid = pl.uuid) WHERE perm.permission IN (?)`,
  getStatsOfNickname: `SELECT 'bans', COUNT(*) from ${bans}.litebans_bans WHERE banned_by_name = ?
  UNION ALL
  SELECT 'kicks', COUNT(*) from ${bans}.litebans_mutes WHERE banned_by_name = ?
  UNION ALL
  SELECT 'warns', COUNT(*) from ${bans}.litebans_kicks WHERE banned_by_name = ?
  UNION ALL
  SELECT 'mutes', COUNT(*) from ${bans}.litebans_warnings WHERE banned_by_name = ?`,
  getStatsSinceNickname: `SELECT 'bans', COUNT(*) from ${bans}.litebans_bans WHERE banned_by_name = ? AND time > ?
  UNION ALL
  SELECT 'kicks', COUNT(*) from ${bans}.litebans_mutes WHERE banned_by_name = ? AND time > ?
  UNION ALL
  SELECT 'warns', COUNT(*) from ${bans}.litebans_kicks WHERE banned_by_name = ? AND time > ?
  UNION ALL
  SELECT 'mutes', COUNT(*) from ${bans}.litebans_warnings WHERE banned_by_name = ? AND time > ?`,
  getStatsSinceAll: `SELECT * FROM (SELECT banned_by_name, 'bans', COUNT(*) from ${bans}.litebans_bans WHERE time > ? GROUP BY banned_by_name
  UNION ALL
  SELECT banned_by_name, 'kicks', COUNT(*) from ${bans}.litebans_mutes WHERE time > ? GROUP BY banned_by_name
  UNION ALL
  SELECT banned_by_name, 'warns', COUNT(*) from ${bans}.litebans_kicks WHERE time > ? GROUP BY banned_by_name
  UNION ALL
  SELECT banned_by_name, 'mutes', COUNT(*) from ${bans}.litebans_warnings WHERE time > ? GROUP BY banned_by_name) as X ORDER BY banned_by_name`,
  getStaffProgressByUuid: `SELECT date, SUM(count) as count FROM (
    SELECT DATE_FORMAT(FROM_UNIXTIME(FLOOR(time / 1000)), '%M-%y') AS date, COUNT(*) AS count
    FROM ${bans}.litebans_bans  
    WHERE banned_by_uuid = ?
    GROUP BY date
    UNION ALL
    SELECT DATE_FORMAT(FROM_UNIXTIME(FLOOR(time / 1000)), '%M-%y') AS date, COUNT(*) AS count
    FROM ${bans}.litebans_kicks  
    WHERE banned_by_uuid = ?
    GROUP BY date
    UNION ALL
    SELECT DATE_FORMAT(FROM_UNIXTIME(FLOOR(time / 1000)), '%M-%y') AS date, COUNT(*) AS count
    FROM ${bans}.litebans_mutes  
    WHERE banned_by_uuid = ?
    GROUP BY date
    UNION ALL
    SELECT DATE_FORMAT(FROM_UNIXTIME(FLOOR(time / 1000)), '%M-%y') AS date, COUNT(*) AS count
    FROM ${bans}.litebans_warnings  
    WHERE banned_by_uuid = ?
    GROUP BY date
  ) as f
  GROUP BY date
  ORDER BY STR_TO_DATE(CONCAT('01/', date), '%d/%M-%y') ASC`,
  getTopStaffsRange: `SELECT banned_by_uuid as uuid, SUM(numero) as total FROM (SELECT banned_by_uuid, COUNT(*) as numero from ${bans}.litebans_bans WHERE time > ? AND time < ? AND banned_by_uuid IN (?) GROUP BY banned_by_uuid
  UNION ALL
  SELECT banned_by_uuid, COUNT(*) as numero from ${bans}.litebans_mutes WHERE time > ? AND time < ? AND banned_by_uuid IN (?) GROUP BY banned_by_uuid
  UNION ALL
  SELECT banned_by_uuid, COUNT(*) as numero from ${bans}.litebans_kicks WHERE time > ? AND time < ? AND banned_by_uuid IN (?) GROUP BY banned_by_uuid
  UNION ALL
  SELECT banned_by_uuid, COUNT(*) as numero from ${bans}.litebans_warnings WHERE time > ? AND time < ? AND banned_by_uuid IN (?) GROUP BY banned_by_uuid) as X GROUP by banned_by_uuid ORDER BY total DESC`,
  createVotePanel: `INSERT INTO ${botName}.vote_panels (discord_id, channel_id, author_id, author_name) VALUES (?, ?, ?, ?)`,
  saveVote: `INSERT INTO ${botName}.votes (panel_id, staff_id, staff_name, vote, reason) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE staff_id = staff_id`,
  hasVoted: `SELECT staff_id FROM ${botName}.votes WHERE panel_id = ? AND staff_id = ?`,
  getVotes: `SELECT vote, count(*) as total FROM ${botName}.votes WHERE panel_id = ? GROUP BY vote`,
  removeLPPermission: 'DELETE FROM %database%.luckperms_user_permissions WHERE uuid = ? AND permission = ?',
  removeLPRankPermission: 'DELETE FROM %database%.luckperms_group_permissions WHERE name = ? AND permission = ?'
}

module.exports = QUERIES
