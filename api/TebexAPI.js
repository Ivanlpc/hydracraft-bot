const request = require('./Requests')

const config = require('../config/config.json')
const ConsoleLogger = require('../util/ConsoleLogger')

/**
 * Build Headers to make a request
 * @param token Token of your Craftingstore shop
 * @returns Header with the token
 */
const buildHeaders = (token) => {
  const header = new Headers()
  header.append('X-Tebex-Secret', token)
  return header
}

const TebexAPI = {

  /**
     * Get a payment with the ID provided
     * @param token Token of your Tebex store
     * @param transaction_id ID of the payment you want to get
     * @returns IPaymentFromID | []
     */
  getPaymentFromId: async (token, transactionId) => {
    const url = `${config.TEBEX_URL}/payments/${transactionId}`
    const requestOptions = {
      method: 'GET',
      headers: buildHeaders(token)
    }
    const res = await request(url, requestOptions)

    return res
  },

  /**
     * Create a giftcard
     * @param token Token of your Tebex Store
     * @param amount Amount of the giftcard to create
     * @param id ID of the discord account that creates the giftcard
     * @param name Name of the discord account that creates the giftcard
     * @param link Optional. Discord ID of the username to link the giftcard
     * @returns IManageGiftcard | IError
     */
  createGiftcard: async (token, amount, id, name, link) => {
    const url = `${config.TEBEX_URL}/gift-cards`
    const body = new FormData()
    body.append('amount', amount.toString())
    body.append('note', 'LINKED:' + link + ': Created with Discord bot from ' + name + ' with id: ' + id)
    const requestOptions = {
      method: 'POST',
      headers: buildHeaders(token),
      body
    }
    const res = await request(url, requestOptions)
    return res
  },

  /**
     * Delete a Giftcard from your Tebex store
     * @param token Token of your Tebex store
     * @param id ID of the Giftcard you want to delete
     * @returns IManageGiftcard | IError
     */
  deleteGiftcard: async (token, id) => {
    const url = `${config.TEBEX_URL}/gift-cards/${id}`
    const requestOptions = {
      method: 'DELETE',
      headers: buildHeaders(token)
    }
    const res = await request(url, requestOptions)
    return res
  },

  /**
     * Ban a user from buying in your Tebex store
     * @param token Token of your Tebex store
     * @param user Name of the user you want to ban
     * @param reason Reason of the ban
     * @param ip Optional. IP of the user you want to ban
     * @returns IBan
     */
  createBan: async (token, user, reason, ip) => {
    const url = `${config.TEBEX_URL}/bans`
    const body = new FormData()
    body.append('reason', reason)
    body.append('user', user)
    if (ip) {
      body.append('ip', ip)
    }
    const requestOptions = {
      method: 'POST',
      headers: buildHeaders(token),
      body
    }
    const res = await request(url, requestOptions)
    return res
  },

  /**
     * Get all payments made by the username provided
     * @param token Token of your Tebex store
     * @param user Name of the user you want to get the payments
     * @returns IPayments | IError
     */
  getUserPaymentsFromNickname: async (token, nick) => {
    const url = `${config.TEBEX_URL}/user/${nick}`
    const requestOptions = {
      method: 'GET',
      headers: buildHeaders(token)
    }
    const res = await request(url, requestOptions)
    return res
  },

  /**
     * Get all giftcards linked to the provided username
     * @param token Token of your Tebex store
     * @param user Name of the user
     * @returns IGiftcard[] | IError
     */
  recoverGiftcard: async (token, user) => {
    const url = `${config.TEBEX_URL}/gift-cards`
    const requestOptions = {
      method: 'GET',
      headers: buildHeaders(token)
    }
    const res = await request(url, requestOptions)
    if ('error_code' in res) return res
    const giftcard = res.data.filter(elem => elem.note.split(':')[1] === user)
    giftcard.filter(elem => !elem.void)
    if (giftcard.length > 0) return giftcard
    else {
      return {
        error_code: 422,
        error_message: 'Giftcards not found with the username ' + user
      }
    }
  },
  getLastPaymentFromUser: async (token, user) => {
    const payments = await TebexAPI.getPaymentsFromUser(token, user)
    if ('error_code' in payments) return null
    if (payments.payments.length <= 0) return null
    const payment = await TebexAPI.getPaymentFromId(token, payments.payments[0].txn_id)
    if (Array.isArray(payment)) return null
    return payment.packages
  },
  updatePaymentNickname: async (token, id, username) => {
    const url = `${config.TEBEX_URL}/payments/${id}`
    const body = new URLSearchParams()
    body.append('username', username)
    const requestOptions = {
      method: 'PUT',
      headers: buildHeaders(token),
      body
    }
    try {
      await request(url, requestOptions)
      return true
    } catch (err) {
      ConsoleLogger.error(err)
      return false
    }
  }
}

module.exports = TebexAPI
