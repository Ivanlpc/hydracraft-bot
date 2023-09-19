const mysql = require('mysql2')
const Logger = require('../util/Logger')

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD
})

pool.getConnection((err, conn) => {
  if (err) {
    Logger.error(err)
    process.exit(1)
  } else {
    if (conn) conn.release()
  }
})

const execute = (query, params) => {
  try {
    if (!pool) throw new Error('Pool was not created. Ensure pool is created when running the app')
    return new Promise((resolve, reject) => {
      pool.query(query, params, (error, results) => {
        if (error) reject(error)
        else resolve(results)
      })
    })
  } catch (error) {
    Logger.error(error)
  }
}

module.exports = {
  execute,
  pool
}
