const mysql2 = require('mysql2')
const config = require('../../config.json')
const Logger = require('../../util/Logger')

const pool = mysql2.createPool(config.Database)

pool.getConnection((err, conn) => {
  if (err) {
    Logger.error(err)
    process.exit(1)
  } else {
    if (conn) conn.release()
  }
})

module.exports = pool
