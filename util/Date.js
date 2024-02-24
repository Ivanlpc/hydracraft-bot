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
    console.log(dateString)
    const aux = new Date(dateString)
    console.log(aux)
    return `${aux.getDay()}/${aux.getMonth()}/${aux.getFullYear()}`
  }
}

module.exports = DateUtil
