const { execute } = require('../Database')
const QUERIES = require('../Queries')
const Logger = require('../../util/Logger')

const getNameByUUID = async (uuid) => {
  if (uuid === null) return ''
  try {
    const query = await execute(QUERIES.GetLastNickname, [uuid])
    return query[0].lastNickname
  } catch (err) {
    Logger.error(err)
    return ''
  }
}

const checkPermission = async (id, permissionId, guildId) => {
  if (id === null) return false
  try {
    const getPermissions = await execute(QUERIES.GetPermissions, [id, permissionId, guildId])
    return getPermissions.length > 0
  } catch (err) {
    Logger.error(err)
    return false
  }
}

module.exports = {
  getNameByUUID,
  checkPermission
}
