const { test } = require('node:test')
const assert = require('node:assert/strict')
const DateUtil = require('../util/Date')

for (const input of [null, undefined, '', '31/02/2026', '29/02/2025', '00/01/2026', '12/13/2026', 'prefix01/01/2026', '01/01/2026suffix']) {
  test(`rejects invalid date ${input}`, () => assert.equal(DateUtil.parseDate(input), null))
}
test('accepts leap day and returns local midnight', () => {
  assert.equal(DateUtil.parseDate('29/02/2024'), new Date(2024, 1, 29).valueOf())
})
test('formats day of month and one-based month', () => {
  assert.equal(DateUtil.convertDate(new Date(2026, 10, 4)), '4/11/2026')
})
