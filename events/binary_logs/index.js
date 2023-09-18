const mysql = require('mysql')
const path = require('path')
const fs = require('fs')
const Logger = require('../../util/Logger')

const MySQLEvents = require('@rodrigogs/mysql-events')
const eventsPath = path.join(__dirname, 'Events')
const eventsFile = fs.readdirSync(eventsPath)

const config = require('../../config.json')

const SQLEvents = async () => {
  const connection = mysql.createPool({
    host: config.Database.host,
    user: config.Database.user,
    password: config.Database.password
  })
  const instance = new MySQLEvents(connection, {
    startAtEnd: true,
    excludedSchemas: {
      mysql: true
    }
  })
  await instance.start()

  for (const file of eventsFile) {
    const filePath = path.join(eventsPath, file)
    const { MySQLTrigger } = require(filePath)
    instance.addTrigger(MySQLTrigger)
  }

  instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, Logger.error)
  instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, Logger.error)
}

module.exports = SQLEvents
