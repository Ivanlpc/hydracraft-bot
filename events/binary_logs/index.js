const path = require('path')
const fs = require('fs')
const Logger = require('../../util/Logger')
const MySQLEvents = require('@rodrigogs/mysql-events')
const eventsPath = path.join(__dirname, 'types')
const eventsFile = fs.readdirSync(eventsPath)
const { pool } = require('../../api/Database')
const SQLEvents = async () => {
  const instance = new MySQLEvents(pool, {
    startAtEnd: true,
    excludedSchemas: {
      mysql: true
    }
  })
  await instance.start()

  for (const file of eventsFile) {
    const filePath = path.join(eventsPath, file)
    const MySQLTrigger = require(filePath)
    instance.addTrigger(MySQLTrigger)
  }

  instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, Logger.fatal)
  instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, Logger.fatal)
}

module.exports = SQLEvents
