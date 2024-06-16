const QUERIES = require('../Queries')
const request = require('../Requests')
const { fetchOne } = require('../Database')
const API_URL = require('../../config/pterodactyl.json').API_URl
const ConsoleLogger = require('../../util/ConsoleLogger')

const getToken = async () => {
  const query = await fetchOne(QUERIES.getToken, [])
  if (query === null) throw new Error('Error while fetching token')
  return query.token
}

const Server = {
  sendBungeecordCommand: async (command) => {
    const token = await getToken()

    const headers = new Headers()
    headers.append('Content-Type', 'application/x-www-form-urlencoded')
    headers.append('token', token)

    const urlencoded = new URLSearchParams()
    urlencoded.append('command', command)

    const data = {
      method: 'POST',
      headers,
      body: urlencoded,
      redirect: 'follow'
    }
    const response = await request(API_URL, data)
    if (!response.status) {
      ConsoleLogger.error(response)
      throw new Error('Error while sending Bungeecord command ' + response.message)
    }
  }
}

module.exports = Server
