class DateUtil {
  static parseDate (dateString) {
    const rgx = /^(0[1-9]|[1-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/20[0-9]{2}$/
    if (typeof dateString !== 'string') return null
    if (!rgx.test(dateString)) return null
    const [day, month, year] = dateString.split('/').map(Number)
    const date = new Date(year, month - 1, day)
    if (date.getDate() !== day || date.getMonth() !== month - 1) return null
    return date.valueOf()
  }

  static validDate (dateString) {
    return this.parseDate(dateString) !== null
  }

  static convertDate (dateString) {
    const aux = new Date(dateString)
    return `${aux.getDate()}/${aux.getMonth() + 1}/${aux.getFullYear()}`
  }
}

module.exports = DateUtil
