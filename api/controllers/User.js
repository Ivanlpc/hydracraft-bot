const { fetchOne, fetchAll, execute } = require('../Database')
const QUERIES = require('../Queries')
const ConsoleLogger = require('../../util/ConsoleLogger')
const binaryLogsConfig = require('../../config/binarylogs.json')
const passwordLength = require('../../config/config.json').commands.user.subcommands.changepassword.password_length
const Server = require('./Server')
const Guild = require('./Guild')

const getNameByUUID = async (uuid) => {
  if (uuid === null) return ''
  try {
    if (uuid.includes('-')) uuid = uuid.replaceAll('-', '')
    const query = await fetchOne(QUERIES.getLastNickname, [uuid, uuid])
    return query.lastNickname || 'ERROR'
  } catch (err) {
    ConsoleLogger.error(err)
    return ''
  }
}

const addPermission = async (id, permissionId, guildData) => {
  try {
    const query = await execute(QUERIES.addPermission, [guildData.id, id, permissionId])
    return query > 0
  } catch (err) {
    ConsoleLogger.error(err)
    Guild.newGuild({ id: guildData.id, name: guildData.name })
    throw new Error('There was an error while trying to add the permission')
  }
}

const removePermission = async (id, permissionId, guildData) => {
  try {
    const query = await execute(QUERIES.removePermission, [guildData.id, id, permissionId])
    return query > 0
  } catch (err) {
    ConsoleLogger.error(err)
    Guild.newGuild({ id: guildData.id, name: guildData.name })
    throw new Error('There was an error while trying to remove the permission')
  }
}

const clearPermissions = async (id, guildData) => {
  try {
    const query = await execute(QUERIES.clearPermissions, [guildData.id, id])
    return query > 0
  } catch (err) {
    ConsoleLogger.error(err)
    Guild.newGuild({ id: guildData.id, name: guildData.name })
    throw new Error('There was an error while trying to clear permissions')
  }
}

const getAllowedIds = async (guildId, permissionId) => {
  let ids = []
  try {
    ids = await fetchAll(QUERIES.getAllowedIds, [guildId, permissionId])
    return ids.map(elem => elem.id)
  } catch (err) {
    ConsoleLogger.error(err)
    throw new Error('There was an error while trying to fetch the IDs ' + guildId + ' ' + permissionId)
  }
}

const getIDPermissions = async (id, guildData) => {
  let permissions = []
  try {
    permissions = await fetchAll(QUERIES.getPermissionsOfId, [guildData.id, id])
    return permissions.map(elem => elem.permission_node)
  } catch (err) {
    ConsoleLogger.error(err)
    Guild.newGuild({ id: guildData.id, name: guildData.name })
    throw new Error('There was an error while trying to fetch the IDs ' + guildData.id + ' ' + id)
  }
}

const getNodeIds = async (permissionNode, guildData) => {
  let ids = []
  try {
    ids = await fetchAll(QUERIES.getPermissionsNode, [guildData.id, permissionNode])
    return ids
  } catch (err) {
    ConsoleLogger.error(err)
    Guild.newGuild({ id: guildData.id, name: guildData.name })
    throw new Error('There was an error while trying to fetch the IDs ' + guildData.id + ' ' + permissionNode)
  }
}

const isStaff = async (nickname) => {
  try {
    const query = await fetchOne(QUERIES.isStaff, [nickname])
    if (query !== null) return true
    else return false
  } catch (err) {
    ConsoleLogger.error(err)
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
    return payments.filter(payment => today - (payment.time * 1000) < binaryLogsConfig.max_payment_time)
  }
}

const generatePassword = (length) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let password = ''
  for (let i = 0; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

const getUserData = async (nickname) => {
  const query = await fetchOne(QUERIES.getUserData, [nickname])
  if (query === null) return null
  return query
}

const hasPassword = (userData) => {
  return userData.hashedPassword !== null
}

const createPassword = async (nickname) => {
  const password = generatePassword(passwordLength)
  try {
    await Server.sendBungeecordCommand(`forcecreatepassword ${nickname} ${password}`)
    return password
  } catch (err) {
    ConsoleLogger.error(err)
    return null
  }
}

const updatePassword = async (nickname) => {
  const password = generatePassword(passwordLength)
  try {
    await Server.sendBungeecordCommand(`forcechangepassword ${nickname} ${password}`)
    return password
  } catch (err) {
    ConsoleLogger.error(err)
    return null
  }
}

const isPremium = (userData) => {
  return userData.premiumId !== null
}

const fixpremium = async (nickname) => {
  try {
    await Server.sendBungeecordCommand(`forcePurgeUserProfile ${nickname}`)
    return true
  } catch (err) {
    ConsoleLogger.error(err)
    return false
  }
}

module.exports = {
  getNameByUUID,
  addPermission,
  removePermission,
  clearPermissions,
  getAllowedIds,
  getIDPermissions,
  getNodeIds,
  isStaff,
  validatePayments,
  filterPayments,
  getUserData,
  hasPassword,
  createPassword,
  updatePassword,
  isPremium,
  fixpremium
}
