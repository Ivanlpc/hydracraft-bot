const ConsoleLogger = require('../../util/ConsoleLogger')
const { fetchAll } = require('../Database')
const QUERIES = require('../Queries')
const ranks = require('../../config/config.json').ranks

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

const getTopStaffsSince = async (staffs, date) => {
  try {
    const query = await fetchAll(QUERIES.getTopStaffsSince, [date, staffs, date, staffs, date, staffs, date, staffs])
    return query.map(staff => ({ uuid: staff.uuid, count: staff.total }))
  } catch (err) {
    ConsoleLogger.error(err)
    throw new Error('There was an error while trying to fetch getTopStaffsSince ' + date.toLocaleDateString())
  }
}

module.exports = {
  getTopStaffsSince,
  getStaffsUuidName
}
