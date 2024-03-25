class DateUtil {
  static parseDate (dateString) {
    const rgx = /(0[1-9]|[1-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/20[0-9]{2}/g
    if (!rgx.test(dateString)) return null
    const [day, month, year] = dateString.split('/')
    return new Date(year, month - 1, day).valueOf()
  }

  static validDate (dateString) {
    return this.parseDate(dateString) !== null
  }

  static convertDate (dateString) {
    const aux = new Date(dateString)
    return `${aux.getDay()}/${aux.getMonth()}/${aux.getFullYear()}`
  }
}

module.exports = DateUtil
