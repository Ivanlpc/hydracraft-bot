const PTERO_CONFIG = require('../config/pterodactyl.json')
const Logger = require('../util/Logger')
const request = require('../util/Requests')

const buildHeaders = () => {
  const header = new Headers()
  header.append('Authorization', process.env.PTERO_CLIENT_KEY)
  return header
}

const PterodactylAPI = {
  sendCommand: async (server, command) => {
    const url = `${PTERO_CONFIG.PTERO_URL}/servers/${server}/command`
    const requestOptions = {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.parse({
        command
      })
    }
    try {
      return await request(url, requestOptions)
    } catch (err) {
      Logger.error(err)
    }
  }
}

module.exports = PterodactylAPI
