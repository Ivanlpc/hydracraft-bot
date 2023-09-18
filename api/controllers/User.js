const { execute } = require('../Database')
const QUERIES = require('../Queries')
const Logger = require('../../util/Logger')

const getNameByUUID = async (uuid) => {
  if (uuid === null) return ''
  try {
    return await execute(QUERIES.GetLastNickname, [uuid])
  } catch (err) {
    Logger.error(err)
    return ''
  }
}

module.exports = getNameByUUID
