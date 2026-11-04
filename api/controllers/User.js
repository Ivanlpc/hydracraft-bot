const { fetchOne, fetchAll, execute } = require('../Database')
const QUERIES = require('../Queries')
const { randomInt } = require('node:crypto')
const { validateNickname } = require('../../util/Minecraft')
const ConsoleLogger = require('../../util/ConsoleLogger')
const binaryLogsConfig = require('../../config/binarylogs.json')
const passwordLength = require('../../config/config.json').commands.user.subcommands.changepassword.password_length
const Server = require('./Server')
const Guild = require('./Guild')
const TebexAPI = require('../TebexAPI')

const getNameByUUID = async (uuid) => {
  if (uuid === null) return ''
  try {
    if (uuid.includes('-')) uuid = uuid.replaceAll('-', '')
    const query = await fetchOne(QUERIES.getLastNickname, [uuid, uuid])
    return query.lastNickname || null
  } catch (err) {
    ConsoleLogger.error(err)
    return ''
  }
}

const addPermission = async (id, permissionId, guildData) => {
  try {
    const query = await execute(QUERIES.addPermission, [guildData.id, id, permissionId])
    return query.affectedRows > 0
  } catch (err) {
    ConsoleLogger.error(err)
    Guild.newGuild({ id: guildData.id, name: guildData.name })
    throw new Error('There was an error while trying to add the permission', { cause: err })
  }
}

const removePermission = async (id, permissionId, guildData) => {
  try {
    const query = await execute(QUERIES.removePermission, [guildData.id, id, permissionId])
    return query.affectedRows > 0
  } catch (err) {
    ConsoleLogger.error(err)
    Guild.newGuild({ id: guildData.id, name: guildData.name })
    throw new Error('There was an error while trying to remove the permission', { cause: err })
  }
}

const clearPermissions = async (id, guildData) => {
  try {
    const query = await execute(QUERIES.clearPermissions, [guildData.id, id])
    return query.affectedRows > 0
  } catch (err) {
    ConsoleLogger.error(err)
    Guild.newGuild({ id: guildData.id, name: guildData.name })
    throw new Error('There was an error while trying to clear permissions', { cause: err })
  }
}

const getAllowedIds = async (guildId, permissionId) => {
  let ids
  try {
    ids = await fetchAll(QUERIES.getAllowedIds, [guildId, permissionId])
    return ids.map(elem => elem.id)
  } catch (err) {
    ConsoleLogger.error(err)
    throw new Error('There was an error while trying to fetch the IDs ' + guildId + ' ' + permissionId, { cause: err })
  }
}

const getIDPermissions = async (id, guildData) => {
  let permissions
  try {
    permissions = await fetchAll(QUERIES.getPermissionsOfId, [guildData.id, id])
    return permissions.map(elem => elem.permission_node)
  } catch (err) {
    ConsoleLogger.error(err)
    Guild.newGuild({ id: guildData.id, name: guildData.name })
    throw new Error('There was an error while trying to fetch the IDs ' + guildData.id + ' ' + id, { cause: err })
  }
}

const getNodeIds = async (permissionNode, guildData) => {
  let ids
  try {
    ids = await fetchAll(QUERIES.getPermissionsNode, [guildData.id, permissionNode])
    return ids
  } catch (err) {
    ConsoleLogger.error(err)
    Guild.newGuild({ id: guildData.id, name: guildData.name })
    throw new Error('There was an error while trying to fetch the IDs ' + guildData.id + ' ' + permissionNode, { cause: err })
  }
}

const isStaff = async (nickname) => {
  try {
    const profile = await fetchOne(QUERIES.getUserData, [nickname])
    if (profile === null) return false
    const uuids = [profile.uniqueId, profile.premiumId]
      .filter(uuid => typeof uuid === 'string' && uuid.length > 0)
      .map(uuid => uuid.replaceAll('-', ''))
    if (uuids.length === 0) throw new Error('Account has no UUID to verify staff status')
    return await fetchOne(QUERIES.isStaff, [uuids]) !== null
  } catch (err) {
    ConsoleLogger.error(err)
    throw new Error('Unable to verify staff status', { cause: err })
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
  if (!Array.isArray(payments)) return []
  else {
    const today = Date.now()
    return payments.filter(payment => today - (payment.time * 1000) < binaryLogsConfig.max_payment_time)
  }
}

const generatePassword = (length) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let password = ''
  for (let i = 0; i < length; ++i) {
    password += charset.charAt(randomInt(charset.length))
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
    await Server.sendBungeecordCommand(`forcecreatepassword ${validateNickname(nickname)} ${password}`)
    return password
  } catch (err) {
    ConsoleLogger.error(err)
    return null
  }
}

const updatePassword = async (nickname) => {
  const password = generatePassword(passwordLength)
  try {
    await Server.sendBungeecordCommand(`forcechangepassword ${validateNickname(nickname)} ${password}`)
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
    await Server.sendBungeecordCommand(`forcePurgeUserProfile ${validateNickname(nickname)}`)
    return true
  } catch (err) {
    ConsoleLogger.error(err)
    return false
  }
}

const mergepremium = async (newnick, oldnick) => {
  try {
    await Server.sendBungeecordCommand(`forcemergepremiumuserprofile ${validateNickname(newnick)} ${validateNickname(oldnick)}`)
    return true
  } catch (err) {
    ConsoleLogger.error(err)
    return false
  }
}

const updatePaymentNickname = async (oldNickname, newNickname) => {
  try {
    const payments = await TebexAPI.getUserPaymentsFromNickname(process.env.TEBEX_TOKEN, oldNickname)
    if (payments.payments.length <= 0) return true
    for (const payment of payments.payments) {
      const res = await TebexAPI.updatePaymentNickname(process.env.TEBEX_TOKEN, payment.txn_id, newNickname)
      if (!res) return false
    }
  } catch (err) {
    ConsoleLogger.error(err)
    return false
  }
  return true
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
  fixpremium,
  mergepremium,
  updatePaymentNickname
}
