const validatePayment = (payments, stringValidation) => {
  if (payments.length === 0) return false
  else {
    for (const payment in payments) {
      for (const product in payments[payment].packages) {
        if (payments[payment][product].name === stringValidation) return true
      }
    }
    return false
  }
}

const filterPayments = (payments) => {
  if (payments === null) return []
  else {
    const today = Date.now()
    return payments.filter(payment => today - (payment.time * 1000) < 86400000)
  }
}

module.exports = {
  validatePayment,
  filterPayments
}
