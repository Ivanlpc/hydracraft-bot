const request = require('../Requests')
const API_URL = require('../../config/pterodactyl.json').PTERO_URL_CLIENT
const servers = require('../../config/pterodactyl.json').servers
const ConsoleLogger = require('../../util/ConsoleLogger')

const Server = {
  sendBungeecordCommand: async (command) => {
    const apiKey = process.env.PTERO_CLIENT_KEY

    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    headers.append('Accept', 'application/json')
    headers.append('Authorization', 'Bearer ' + apiKey)

    const body = {
      command
    }

    const data = {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      redirect: 'follow'
    }
    await request(API_URL + `/servers/${servers.Proxy}/command`, data).then(res => {
      ConsoleLogger.info('Command sent')
    }).catch(err => {
      ConsoleLogger.error('Error sending command', err)
      console.log(err)
    })
  }
}

module.exports = Server
