const ConsoleLogger = require('../util/ConsoleLogger')

/**
 *
 * @param input - URL you want to request
 * @param init - Options of the request
 * @returns Promise with the response
 */
const Requests = (input, init) => {
  try {
    return new Promise((resolve, reject) => {
      fetch(input, init)
        .then(res => res.json())
        .then(result => resolve(result))
        .catch(err => reject(err))
    })
  } catch (error) {
    ConsoleLogger.error('[request][Error]: ', error)
    throw new Error('failed to request API')
  }
}

module.exports = Requests
