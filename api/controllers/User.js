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

module.exports = getNameByUUID
