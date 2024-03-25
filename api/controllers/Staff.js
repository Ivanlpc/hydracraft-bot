const ConsoleLogger = require('../../util/ConsoleLogger')
const { fetchAll, fetchOne, execute } = require('../Database')
const QUERIES = require('../Queries')
const ranks = require('../../config/config.json').charts.ranks

const getStaffsUuidName = async () => {
  try {
    const staffs = ranks.map(rank => 'group.' + rank)
    const query = await fetchAll(QUERIES.getStaffUuidName, [staffs])
    return query.map(staff => ({ uuid: staff.uuid, username: staff.username }))
  } catch (err) {
    ConsoleLogger.error(err)
    throw new Error('There was an error while trying to fetch the staffs uuids')
  }
}

const getStaffUuidByNick = async (nick) => {
  try {
    const query = await fetchOne(QUERIES.getStaffUuidByNick, [nick])
    return query.uuid
  } catch (err) {
    ConsoleLogger.error(err)
    throw new Error('There was an error while trying to fetch getStaffUuidByNick ' + nick)
  }
}

const getTopStaffsRange = async (staffs, since, until) => {
  try {
    const query = await fetchAll(QUERIES.getTopStaffsRange, [since, until, staffs, since, until, staffs, since, until, staffs, since, until, staffs])
    return query.map(staff => ({ uuid: staff.uuid, count: staff.total }))
  } catch (err) {
    ConsoleLogger.error(err)
    throw new Error('There was an error while trying to fetch getTopStaffsSince ' + since)
  }
}

const getStaffProgressByUuid = async (uuid) => {
  try {
    const query = await fetchAll(QUERIES.getStaffProgressByUuid, [uuid, uuid, uuid, uuid])
    return query
  } catch (err) {
    ConsoleLogger.error(err)
    throw new Error('There was an error while trying to fetch getStaffProgressByUuid ' + uuid)
  }
}

const getStaffsUnbansRange = async (staffs, since, until) => {
  try {
    const query = await fetchAll(QUERIES.getStaffsUnbansRange, [since, until, staffs, staffs, since, until, staffs, since, until, staffs, staffs, since, until, staffs, since, until, staffs, since, until, staffs, staffs, since, until, staffs])
    return query
  } catch (err) {
    ConsoleLogger.error(err)
    throw new Error('There was an error while trying to fetch getStaffsUnbans ' + since + ' ' + until)
  }
}

const getStaffsNameByRank = async (rank) => {
  try {
    const query = await fetchAll(QUERIES.getStaffNickByRank, [rank])
    return query.map(staff => staff.username)
  } catch (err) {
    ConsoleLogger.error(err)
    throw new Error('There was an error while trying to fetch getStaffsNameByRank ' + rank)
  }
}

const createVotePanel = async (discord, channel, author, tag) => {
  try {
    const panel = await execute(QUERIES.createVotePanel, [discord, channel, author, tag])
    return panel.insertId
  } catch (err) {
    ConsoleLogger.error(err)
    throw new Error('There was an error while trying to create the vote panel')
  }
}

const saveVote = async (panelId, staffId, staffName, vote, reason) => {
  try {
    if (reason.length > 255) {
      reason = reason.substring(0, 255)
    }
    await execute(QUERIES.saveVote, [panelId, staffId, staffName, vote, reason])
  } catch (err) {
    ConsoleLogger.error(err)
    throw new Error('There was an error while trying to save the vote')
  }
}

const hasVoted = async (userId, panelId) => {
  try {
    const voted = await fetchOne(QUERIES.hasVoted, [panelId, userId])
    return voted !== null
  } catch (err) {
    ConsoleLogger.error(err)
    throw new Error('There was an error while trying to check if the user has voted')
  }
}

module.exports = {
  getStaffsUuidName,
  getTopStaffsRange,
  getStaffUuidByNick,
  getStaffProgressByUuid,
  getStaffsUnbansRange,
  getStaffsNameByRank,
  createVotePanel,
  saveVote,
  hasVoted
}
