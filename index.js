const fs = require('fs')
const { Client, GatewayIntentBits, Collection } = require('discord.js')
const Logger = require('./util/Logger')
const { TOKEN } = require('./config.json')
const COLOR = require('./util/ConsoleColor')

const commandFiles = fs.readdirSync('./commands')
const eventsFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'))
const client = new Client({ intents: [GatewayIntentBits.Guilds] })
client.commands = new Map()
client.commands_json = []
client.activeLicenses = []
client.cooldowns = new Collection()
Logger.init()

for (const file of eventsFiles) {
  const event = require(`./events/${file}`)
  Logger.info(`${COLOR.CYAN}[EVENT]${COLOR.BLACK}[${COLOR.GREEN}✔${COLOR.BLACK}] Loaded ${COLOR.MAGENTA}${event.name}`)
  if (event.once) {
    client.once(event.name, event.execute)
  } else {
    client.on(event.name, event.execute)
  }
}

for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  if (!command || !command.enabled) continue
  if (command.cooldown && command.cooldown > 0) {
    client.cooldowns.set(command.data.name, new Collection())
  }
  client.commands_json.push(command.data.toJSON())
  client.commands.set(command.data.name, command)
  Logger.info(`${COLOR.RED}[CMD]${COLOR.BLACK}[${COLOR.GREEN}✔${COLOR.BLACK}] Loaded ${COLOR.BLUE}/${command.data.name}`)
}

client.login(TOKEN)
