function validateNickname (nickname) {
  if (typeof nickname !== 'string' || !/^[A-Za-z0-9_]{1,16}$/.test(nickname)) {
    throw new Error('Invalid Java Minecraft nickname')
  }
  return nickname
}

module.exports = { validateNickname }
