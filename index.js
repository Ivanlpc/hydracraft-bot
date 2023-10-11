const fs = require('fs')
const { Client, GatewayIntentBits, Collection } = require('discord.js')
const Logger = require('./util/Logger')
require('dotenv').config()
const TOKEN = process.env.TOKEN
const COLOR = require('./util/ConsoleColor')
const SQLEvents = require('./events/binary_logs/index')
const commandFiles = fs.readdirSync('./commands')
const eventsFiles = fs.readdirSync('./events/discord').filter(file => file.endsWith('.js'))
const selectMenuFiles = fs.readdirSync('./select_menus')
const client = new Client({ intents: [GatewayIntentBits.Guilds] })
client.commands = new Map()
client.selectMenus = new Map()
client.commands_json = []
client.cooldowns = new Collection()

Logger.init()
SQLEvents().then('Logging SQL events').catch(err => console.log(err))

for (const file of eventsFiles) {
  const event = require(`./events/discord/${file}`)
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

for (const file of selectMenuFiles) {
  const menu = require(`./select_menus/${file}`)
  if (!menu.enabled) continue
  client.selectMenus.set(menu.customId, menu)
  Logger.info(`${COLOR.MAGENTA}[MENU]${COLOR.BLACK}[${COLOR.GREEN}✔${COLOR.BLACK}] Loaded ${COLOR.BLUE}${menu.customId}`)
}

client.login(TOKEN)
