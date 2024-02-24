const mysql = require('mysql')
const ConsoleLogger = require('../util/ConsoleLogger')
const name = require('../package.json').name

let pool
const maxReconnectAttempts = 5
let reconnectAttempts = 0
const reconnectInterval = 5000

const createPool = () => {
  pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD
  })

  pool.on('connection', (connection) => {
    ConsoleLogger.info('Database connection established')
    reconnectAttempts = 0
  })

  pool.on('error', (err) => {
    ConsoleLogger.error(err)
    ConsoleLogger.error('Database connection was closed. Reconnecting...')
    reconnect()
  })
  pool.getConnection((err, conn) => {
    if (err) {
      ConsoleLogger.error(err)
      process.exit(1)
    } else {
      if (conn) conn.release()
    }
  })
}

const reconnect = () => {
  if (reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++
    setTimeout(() => {
      createPool()
    }, reconnectInterval)
  } else {
    ConsoleLogger.error('Max reconnect attempts reached. Exiting...')
    process.exit(1)
  }
}

const getConnection = () => {
  return mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD
  })
}

const createTables = () => {
  pool.query(`CREATE TABLE IF NOT EXISTS ${name}.guilds (
    id varchar(255) NOT NULL,
    joined_at datetime NOT NULL DEFAULT current_timestamp(),
    name varchar(255) CHARACTER SET utf8 DEFAULT NULL,
    PRIMARY KEY(id))`, [])
  pool.query(`CREATE TABLE IF NOT EXISTS ${name}.permissions (
    guildId varchar(255) NOT NULL,
    id varchar(255) NOT NULL,
    permission_node VARCHAR(255) NOT NULL,
    PRIMARY KEY (guildId, id, permission_node),
    INDEX guilds_ind (guildId),
    FOREIGN KEY (guildId)
        REFERENCES guilds(id)
        ON DELETE CASCADE)`)
}
/**
 * @param {string} query
 * @param {any[]} params
 * @returns {Promise<any | null>}
 */
const fetchOne = (query, params = []) => {
  try {
    if (!pool) throw new Error('Pool was not created. Ensure pool is created when running the app')
    return new Promise((resolve, reject) => {
      pool.query(query, params, (error, results) => {
        if (error) reject(error)
        else if (results.length === 0) resolve(null)
        else resolve(results[0])
      })
    })
  } catch (error) {
    ConsoleLogger.error(error)
  }
}

/**
 * @param {string} query
 * @param {any[]} params
 * @returns {Promise<any[]>}
 */
const fetchAll = (query, params = []) => {
  try {
    if (!pool) throw new Error('Pool was not created. Ensure pool is created when running the app')
    return new Promise((resolve, reject) => {
      pool.query(query, params, (error, results) => {
        if (error) reject(error)
        else resolve(results)
      })
    })
  } catch (error) {
    ConsoleLogger.error(error)
  }
}

/**
 * @param {string} query
 * @param {any[]} params
 * @throws {MysqlError}
 * @returns {Promise<Number>} Affected rows
 */
const execute = (query, params = []) => {
  try {
    if (!pool) throw new Error('Pool was not created. Ensure pool is created when running the app')
    return new Promise((resolve, reject) => {
      pool.query(query, params, (error, results) => {
        if (error) reject(error)
        else resolve(results.affectedRows)
      })
    })
  } catch (error) {
    ConsoleLogger.error(error)
  }
}

createPool()

module.exports = {
  fetchOne,
  fetchAll,
  execute,
  createTables,
  getConnection
}
