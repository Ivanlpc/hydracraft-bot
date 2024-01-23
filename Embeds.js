const { EmbedBuilder } = require('discord.js')
const config = require('./config/config.json')

const embeds = {
  unban_embed: (data, unban, name, schema) => {
    return new EmbedBuilder()
      .setTitle('NUEVO DESBANEO')
      .setDescription('Informacion')
      .setColor(unban ? 'Green' : 'Red')
      .setThumbnail(config.TRANSACTION_AVATAR_URL + name)
      .addFields(
        { name: 'UUID:', value: data.after.uuid },
        { name: 'Nombre: ', value: name },
        { name: 'Razón:', value: data.before.reason },
        { name: 'Expira: ', value: data.before.until <= 0 ? 'Permanente' : `<t:${Math.round(data.before.until / 1000)}:R>` },
        { name: 'IPban', value: data.before.ipban ? 'Si' : 'No' },
        { name: 'Desbaneado por:', value: data.after.removed_by_name },
        { name: 'Razón de desbaneo:', value: data.after.removed_by_reason },
        { name: 'DESBANEO en su ultima compra (Últimas 24h):', value: unban !== null ? `https://creator.tebex.io/payments/${unban}` : 'No se ha encontrado ninguna compra' },
        { name: 'BBDD', value: schema }
      )
  },
  unmute_embed: (data, unmute, name, schema) => {
    return new EmbedBuilder()
      .setTitle('NUEVO DESMUTEO')
      .setDescription('Informacion')
      .setColor(unmute ? 'Green' : 'Red')
      .setThumbnail(config.TRANSACTION_AVATAR_URL + name)
      .addFields(
        { name: 'UUID:', value: data.after.uuid },
        { name: 'Nombre: ', value: name },
        { name: 'Razón:', value: data.before.reason },
        { name: 'Expira: ', value: data.before.until <= 0 ? 'Permanente' : `<t:${Math.round(data.before.until / 1000)}:R>` },
        { name: 'IPmute', value: data.before.ipban ? 'Si' : 'No' },
        { name: 'Desbaneado por:', value: data.after.removed_by_name },
        { name: 'Razón de desmuteo:', value: data.after.removed_by_reason },
        { name: 'DESMUTEO en su ultima compra (Últimas 24h):', value: unmute !== null ? `https://creator.tebex.io/payments/${unmute}` : 'No se ha encontrado ninguna compra' },
        { name: 'BBDD', value: schema }
      )
  },
  delete_history_embed: (userNickname, data, schema) => {
    return new EmbedBuilder()
      .setTitle('BAN ELIMINADO')
      .setDescription('Información')
      .setThumbnail(config.TRANSACTION_AVATAR_URL + userNickname)
      .setColor('Red')
      .addFields(
        { name: 'IP:', value: data.ip },
        { name: 'Baneado por:', value: data.banned_by_name },
        { name: 'Fecha de la sanción:', value: new Date(Number.parseInt(data.time)).toLocaleDateString() },
        { name: 'Usuario:', value: userNickname },
        { name: 'UUID:', value: data.uuid },
        { name: 'Razón: ', value: data.reason },
        { name: 'Expira: ', value: data.until === 0 ? 'Permanente' : `<t:${data.until}:R>` },
        { name: 'IPban', value: data.ipban ? 'Si' : 'No' },
        { name: 'Activo', value: data.active ? 'Si' : 'No' },
        { name: 'BBDD', value: schema }
      )
  },
  delete_action_embed: (data, schema) => {
    return new EmbedBuilder()
      .setTitle('SE HAN BORRADO LOGS DE ACCIONES')
      .setDescription('Información')
      .setColor('Red')
      .addFields(
        { name: 'Tipo (U = usuario, G = rango)', value: data.type },
        { name: 'Comando de luckperms ejecutado por:', value: data.actor_name },
        { name: 'UUID del que lo ejecuta:', value: data.actor_uuid },
        { name: 'Ejecutado el:', value: new Date(Number.parseInt(data.time) * 1000).toLocaleDateString() },
        { name: 'Usuario sobre el que se ejecutó el comando:', value: data.acted_name },
        { name: 'Acción realizada: ', value: data.action },
        { name: 'BBDD', value: schema }
      )
  },
  new_rank_embed: (uuid, rank, tienda, name, schema, value, temp) => {
    return new EmbedBuilder()
      .setTitle('NUEVO RANGO')
      .setDescription('Información')
      .setColor(tienda ? 'Green' : 'Red')
      .setThumbnail(config.TRANSACTION_AVATAR_URL + name)
      .addFields(
        { name: 'UUID:', value: uuid },
        { name: 'Nick:', value: name },
        { name: 'Rango: ', value: rank },
        { name: 'Su última compra (anterior a 1 día) coincide con el rango:', value: tienda !== null ? `https://creator.tebex.io/payments/${tienda}` : 'No se ha encontrado ninguna compra' },
        { name: 'Base de datos', value: schema },
        { name: 'Valor:', value: value ? 'Permitir' : 'Denegar' },
        { name: 'Duración:', value: temp === 0 ? 'Permanente' : `<t:${temp}:R>` }
      )
  },
  new_perm_embed: (uuid, rank, name, schema, value, temp) => {
    return new EmbedBuilder()
      .setTitle('NUEVO PERMISO')
      .setDescription('Información')
      .setColor('Red')
      .setThumbnail(config.TRANSACTION_AVATAR_URL + name)
      .addFields(
        { name: 'UUID:', value: uuid },
        { name: 'Nick:', value: name },
        { name: 'Permiso: ', value: rank },
        { name: 'Base de datos', value: schema },
        { name: 'Valor:', value: value ? 'Permitir' : 'Denegar' },
        { name: 'Duración:', value: temp === 0 ? 'Permanente' : `<t:${temp}:R>` }
      )
  },
  delete_ban_embed: (data, name, schema) => {
    const embed = new EmbedBuilder()
      .setTitle('SANCIÓN ELIMINADA')
      .setDescription('Informacion')
      .setColor('Red')
      .setThumbnail(config.TRANSACTION_AVATAR_URL + name)
      .addFields(
        { name: 'UUID:', value: data.uuid },
        { name: 'Nombre: ', value: name },
        { name: 'Baneado por:', value: data.banned_by_name },
        { name: 'Razón:', value: data.reason },
        { name: 'Fecha:', value: new Date(data.time).toLocaleDateString() },
        { name: 'Expira en:', value: data.until !== -1 ? new Date(data.until).toLocaleDateString() : 'Permanente' },
        { name: 'Baneo de ip:', value: data.ipban.toString() },
        { name: 'BBDD', value: schema }
      )
    if (data.removed_by_name !== null) {
      embed.addFields(
        { name: 'Desbaneado por:', value: data.removed_by_name },
        { name: 'Motivo del unban:', value: data.removed_by_reason || 'Ninguno' }
      )
    }
    return embed
  },
  error_embed: (data) => {
    const embed = new EmbedBuilder()
      .setTitle('ERROR AL OBTENER INFORMACIÓN')
      .setDescription('Informacion')
      .setColor('Red')
    for (const key of data) {
      embed.addFields({
        name: key,
        value: data[key]
      })
    }
    return embed
  },
  perm_list_id: (id, perms) => {
    return new EmbedBuilder()
      .setTitle('LISTA DE PERMISOS')
      .setDescription(`ID: <@!${id}>\n` +
      'Permisos:' +
      '```' + perms + '```')
      .setColor('Blue')
  },
  perm_group_list: (node, ids) => {
    return new EmbedBuilder()
      .setTitle('LISTA DE IDs')
      .setColor('Blue')
      .setDescription(ids)
  },
  linkAccount: (discordId, nickname) => {
    return new EmbedBuilder()
      .setTitle('CUENTA VINCULADA')
      .setThumbnail(config.TRANSACTION_AVATAR_URL + nickname)
      .addFields({
        name: 'Discord:',
        value: `<@!${discordId}>`
      }, {
        name: 'Minecraft:',
        value: nickname
      })
  },
  accountInfo: (data) => {
    return new EmbedBuilder()
      .setTitle('INFORMACIÓN DE CUENTA')
      .setThumbnail(config.TRANSACTION_AVATAR_URL + data.lastNickname)
      .setColor(data.premiumId ? 'Green' : 'Yellow')
      .addFields(
        { name: 'Nick', value: '```' + data.lastNickname + '```', inline: true },
        { name: 'Premium', value: data.premiumId ? '```SI```' : '```NO```', inline: true },
        { name: 'Fecha de registro', value: '```' + data.firstSeen + '```', inline: true },
        { name: 'Última IP', value: '```' + data.lastAddress + '```', inline: true },
        { name: 'Primera IP', value: '```' + data.value.firstAddress + '```', inline: true },
        { name: 'Modalidad', value: '```' + data.lastServer + '```' }
      )
  },
  password_embed: (nick, password) => {
    return new EmbedBuilder()
      .setTitle('CONTRASEÑA TEMPORAL')
      .setDescription('Por favor, cámbiala lo antes posible con el comando\n' +
      '`/changepassword ' + password + ' <contraseña>`')
      .setColor('Blue')
      .addFields(
        { name: 'Nick:', value: '```' + nick + '```' },
        { name: 'Contraseña:', value: '```' + password + '```' }
      )
  }
}

module.exports = embeds
