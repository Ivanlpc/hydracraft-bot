const maxMessages = require('../config/config.json').max_messages

class DiscordLogger {
  static async getImagesFromChannel (channel) {
    const channelMessages = await channel.messages.fetch({ limit: maxMessages })

    const imageMessages = channelMessages.filter(message => message.attachments.size > 0 && message.attachments.some(attachment => attachment.contentType.includes('image')))
    const urls = []
    for (const message of imageMessages.values()) {
      for (const image of message.attachments.values()) {
        urls.push(image)
      }
    }
    return urls
  }

  static async sendImagesToWebhook (webhook, data) {
    const { images, embeds } = data
    if (images.length > 10) {
      for (let i = 0; i < images.length; i += 10) {
        const files = images.slice(i, i + 10)
        await webhook.send({ files })
      }
      await webhook.send({ embeds })
    } else if (images.length > 0) {
      await webhook.send({
        files: images,
        embeds
      })
    } else {
      await webhook.send({ embeds })
    }
  }
}
module.exports = DiscordLogger
