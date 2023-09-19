const fs = require('fs')
const { createGzip } = require('node:zlib')
const COLOR = require('./ConsoleColor')

class Logger {
  static init () {
    if (!fs.existsSync('./logs')) fs.mkdirSync('./logs')
    if (fs.existsSync('./logs/latest.txt')) {
      fs.renameSync('./logs/latest.txt', './logs/tmp.txt')
      const date = new Date().toLocaleDateString('es-ES').replaceAll('/', '-')
      let i = 1
      while (fs.existsSync(`./logs/${date}-${i}.log.gz`)) {
        i++
      }
      const stream = fs.createReadStream('./logs/tmp.txt')
      stream.pipe(createGzip())
        .pipe(fs.createWriteStream(`./logs/${date}-${i}.log.gz`))
        .on('finish', () => {
          fs.rmSync('./logs/tmp.txt')
        })
    }
  }

  static info (msg) {
    console.info(COLOR.BLACK, msg, COLOR.RESET)
    // eslint-disable-next-line no-control-regex
    const regex = /\u001b\[[0-4]?[0-9]m/g
    msg = msg.replaceAll(regex, '')
    if (!fs.existsSync('./logs')) fs.mkdirSync('./logs')
    const message = `\n[${new Date().toLocaleString()}] [INFO]: ${msg}`
    fs.appendFileSync('./logs/latest.txt', message, (e) => {
      if (e) console.log(e)
    })
  }

  static error (msg) {
    console.error(COLOR.RED, msg, COLOR.RESET)
    // eslint-disable-next-line no-control-regex
    const regex = /\u001b\[[0-4]?[0-9]m/g
    msg = msg.replaceAll(regex, '')
    if (!fs.existsSync('./logs')) fs.mkdirSync('./logs')
    const message = `\n[${new Date().toLocaleString()}] [ERROR]: ${msg}`
    fs.appendFileSync('./logs/latest.txt', message, (e) => {
      if (e) console.log(e)
    })
  }

  static fatal (msg) {
    console.error(COLOR.RED, msg, COLOR.RESET)
    if (!fs.existsSync('./logs')) fs.mkdirSync('./logs')
    const message = `\n[${new Date().toLocaleString()}] [ERROR]: ${msg}`
    fs.appendFileSync('./logs/latest.txt', message, (e) => {
      if (e) console.log(e)
    })
  }
}
module.exports = Logger
