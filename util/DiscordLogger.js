const maxMessages = require('../config/config.json').max_messages

class DiscordLogger {
  static async getImagesFromChannel (channel) {
    const channelMessages = await channel.messages.fetch({ limit: maxMessages })

    const imageMessages = channelMessages.filter(message => message.attachments.size > 0 || message.embeds.some(embed => embed.type === 'image'))
    const urls = []
    for (const message of imageMessages.values()) {
      for (const image of message.attachments.values()) {
        urls.push(image.url)
      }
    }
    return urls
  }
}

module.exports = DiscordLogger
