const path = require('path')
const fs = require('fs')
const ConsoleLogger = require('../../util/ConsoleLogger')
const { getConnection } = require('../../api/Database')
const MySQLEvents = require('@rodrigogs/mysql-events')
const eventsPath = path.join(__dirname, 'types')
const eventsFile = fs.readdirSync(eventsPath)

const SQLEvents = async () => {
  const connection = getConnection()

  const instance = new MySQLEvents(connection, {
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

  instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, ConsoleLogger.fatal)
  instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, ConsoleLogger.fatal)
}

module.exports = SQLEvents
