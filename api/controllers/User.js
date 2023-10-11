const { execute } = require('../Database')
const QUERIES = require('../Queries')
const Logger = require('../../util/Logger')
const messages = require('../../config/messages.json')

const getNameByUUID = async (uuid) => {
  if (uuid === null) return ''
  try {
    const query = await execute(QUERIES.getLastNickname, [uuid])
    return query[0].lastNickname
  } catch (err) {
    Logger.error(err)
    return ''
  }
}

const checkPermission = async (id, permissionId, guildId) => {
  if (id === null) return false
  try {
    const getPermissions = await execute(QUERIES.getPermissions, [id, permissionId, guildId])
    return getPermissions.length > 0
  } catch (err) {
    Logger.error(err)
    return false
  }
}

const addPermission = async (id, permissionId, guildId) => {
  try {
    const query = await execute(QUERIES.addPermission, [guildId, id, permissionId])
    return query.affectedRows > 0
  } catch (err) {
    Logger.error(err)
    throw new Error('There was an error while trying to add the permission')
  }
}

const removePermission = async (id, permissionId, guildId) => {
  try {
    const query = await execute(QUERIES.removePermission, [guildId, id, permissionId])
    return query.affectedRows > 0
  } catch (err) {
    Logger.error(err)
    throw new Error('There was an error while trying to remove the permission')
  }
}

const getAllowedIds = async (guildId, permissionId) => {
  let ids = []
  try {
    ids = await execute(QUERIES.getAllowedIds, [guildId, permissionId])
    return ids.map(elem => elem.id)
  } catch (err) {
    Logger.error(err)
    throw new Error('There was an error while trying to fetch the IDs ' + guildId + ' ' + permissionId)
  }
}

const getIDPermissions = async (guildId, id) => {
  let permissions = []
  try {
    permissions = await execute(QUERIES.getPermissionsOfId, [guildId, id])
    return permissions.map(elem => elem.permission_node)
  } catch (err) {
    Logger.error(err)
    throw new Error('There was an error while trying to fetch the IDs ' + guildId + ' ' + id)
  }
}

const getNodeIds = async (guildId, permissionNode) => {
  let ids = []
  try {
    ids = await execute(QUERIES.getPermissionsNode, [guildId, permissionNode])
    return ids
  } catch (err) {
    Logger.error(err)
    throw new Error('There was an error while trying to fetch the IDs ' + guildId + ' ' + permissionNode)
  }
}

const linkAccount = async (discordId, code) => {
  try {
    const query = await execute(QUERIES.linkAccount, [discordId, code])
    if (query.affectedRows <= 0) {
      throw new Error(messages.account_already_linked)
    }
    return query[0]
  } catch (err) {
    Logger.error(err)
    throw new Error(messages.command_error)
  }
}

const getAccounts = async (discordId) => {
  try {
    const query = await execute(QUERIES.getAccounts, [discordId])
    return query
  } catch (err) {
    Logger.error(err)
    throw new Error(messages.command_error)
  }
}

const getAccountInformation = async (discordId, uniqueId) => {
  try {
    const query = await execute(QUERIES.getAccountInformation, [discordId, uniqueId])
    if (query.length === 0) throw new Error('Error while fetching ' + discordId + ' ' + uniqueId)
    return query[0]
  } catch (err) {
    Logger.error(err)
    throw new Error(messages.command_error)
  }
}

module.exports = {
  getNameByUUID,
  checkPermission,
  addPermission,
  removePermission,
  getAllowedIds,
  getIDPermissions,
  getNodeIds,
  linkAccount,
  getAccounts,
  getAccountInformation
}
