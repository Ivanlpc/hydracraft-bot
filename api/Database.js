const mysql = require('mysql2')
const Logger = require('../util/Logger')
const name = require('../package.json').name

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

const createTables = () => {
  execute(`CREATE TABLE IF NOT EXISTS ${name}.guilds (
    id varchar(255) NOT NULL,
    joined_at datetime NOT NULL DEFAULT current_timestamp(),
    name varchar(255) CHARACTER SET utf8 DEFAULT NULL,
    PRIMARY KEY(id))`, [])
  execute(`CREATE TABLE IF NOT EXISTS ${name}.permissions (
    guildId varchar(255) NOT NULL,
    id varchar(255) NOT NULL,
    permission_node VARCHAR(255) NOT NULL,
    PRIMARY KEY (guildId, id, permission_node),
    INDEX guilds_ind (guildId),
    FOREIGN KEY (guildId)
        REFERENCES guilds(id)
        ON DELETE CASCADE)`)
}

const execute = (query, params = []) => {
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
  createTables,
  pool
}
