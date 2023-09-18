const { EmbedBuilder } = require('discord.js')
const config = require('./config.json')

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
        { name: 'Desbaneado por:', value: data.after.removed_by_name },
        { name: 'Razón:', value: data.before.reason },
        { name: 'Razón de desbaneo:', value: data.after.removed_by_reason },
        { name: 'DESBANEO en su ultima compra (anterior a 1h):', value: unban.toString() },
        { name: 'Schema', value: schema }
      )
  },
  unmute_embed: (data, unban, name, schema) => {
    return new EmbedBuilder()
      .setTitle('NUEVO DESMUTEO')
      .setDescription('Informacion')
      .setColor(unban ? 'Green' : 'Red')
      .setThumbnail(config.TRANSACTION_AVATAR_URL + name)
      .addFields(
        { name: 'UUID:', value: data.uuid },
        { name: 'Nombre: ', value: name },
        { name: 'Desmuteado por:', value: data.removed_by_name },
        { name: 'Razón:', value: data.reason },
        { name: 'Razón de desbaneo:', value: data.removed_by_reason },
        { name: 'Ha comprado DESMUTEO en su ultima compra:', value: unban.toString() },
        { name: 'Schema', value: schema }
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
        { name: 'Schema', value: schema }
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
        { name: 'Su última compra (anterior a 1 día) coincide con el rango:', value: tienda.toString() },
        { name: 'Base de datos', value: schema },
        { name: 'Valor:', value: value ? 'True' : 'False' },
        { name: 'Permanente:', value: temp.toString() }
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
        { name: 'Valor:', value: value ? 'True' : 'False' },
        { name: 'Permanente:', value: temp.toString() }
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
        { name: 'Schema', value: schema }
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
  }
}

module.exports = embeds
