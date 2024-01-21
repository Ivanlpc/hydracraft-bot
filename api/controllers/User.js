const { execute } = require('../Database')
const QUERIES = require('../Queries')
const Logger = require('../../util/Logger')
const messages = require('../../config/messages.json')
const config = require('../../config/binarylogs.json')

const getNameByUUID = async (uuid) => {
  if (uuid === null) return ''
  try {
    if (uuid.includes('-')) uuid = uuid.replaceAll('-', '')
    const query = await execute(QUERIES.getLastNickname, [uuid, uuid])
    return query[0].lastNickname || 'ERROR'
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

const unLinkAccount = async (discordId, uniqueId) => {
  try {
    const query = await execute(QUERIES.unLinkAccount, [discordId, uniqueId])
    if (query.affectedRows <= 0) {
      throw new Error(messages.command_error)
    }
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

const isStaff = async (nickname) => {
  try {
    const query = await execute(QUERIES.isStaff, [nickname])
    if (query.length > 0) return true
    else return false
  } catch (err) {
    Logger.error(err)
  }
}

const validatePayments = (payments, stringValidation) => {
  if (payments.length === 0) return null
  else {
    for (const payment in payments) {
      for (const product in payments[payment].packages) {
        if (payments[payment].packages[product].name.toLocaleLowerCase() === stringValidation.toLocaleLowerCase()) return payments[payment].id
      }
    }
    return null
  }
}

const filterPayments = (payments) => {
  if (payments === null) return []
  else {
    const today = Date.now()
    return payments.filter(payment => today - (payment.time * 1000) < config.max_payment_time)
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
  getAccountInformation,
  unLinkAccount,
  isStaff,
  validatePayments,
  filterPayments
}
