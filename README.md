# Discord Bot Project

## Introducción

Este proyecto se trata de un bot de Discord implementado en JavaScript, diseñado para facilitar la gestión de un servidor de Discord y la interacción con una base de datos MySQL. Las principales características incluyen la gestión de permisos, enfriamiento de comandos, gestión de usuarios y de staff, además de un avanzado sistema de logs. Este bot es especialmente útil para automatizar tareas administrativas y mejorar la experiencia de sus miembros.

## Características

### Gestión de Permisos

- **/perm**: Permite a los administradores gestionar los permisos del bot directamente desde Discord, utilizando comandos slash. Los permisos se almacenan y se leen desde una base de datos MySQL, asegurando una gestión centralizada y segura.

### Enfriamiento de Comandos

- **Cooldowns**: Evita el abuso de comandos estableciendo un período de enfriamiento después de cada uso, asegurando que los usuarios no sobrecarguen el bot con peticiones.

### Gestión de Usuarios

1. **Cambio de contraseña**: Permite a los usuarios cambiar su contraseña por una temporal, garantizando la seguridad de las cuentas.
2. **Actualización de nombres de usuario**: Los usuarios pueden actualizar sus nombres de usuario directamente a través de comandos.
3. **Fusión de cuentas**: Facilita la fusión de cuentas de diferentes usuarios y, opcionalmente, el cambio de nombre en sus compras de Tebex.
4. **Información de la cuenta**: Muestra la información detallada de la cuenta de un usuario.

### Gestión de Staff

1. **Gráficas de sanciones**: Crea gráficas que muestran las sanciones realizadas en un período de tiempo definido, así como la evolución de las sanciones dadas por un miembro del staff en particular. Esto permite un seguimiento visual y eficiente de las actividades del staff.

### Sistema de Logs

1. **Logs de MySQL**: Escucha los logs binarios de MySQL para crear registros en Discord de ciertos cambios en el servidor, permitiendo un seguimiento en tiempo real de las modificaciones importantes.
2. **Logs por consola**: Genera logs personalizados y ordenados por fecha en cada reinicio del bot, facilitando la depuración y el mantenimiento del sistema.

## Requisitos

- Node.js (v20 o superior)
- MySQL (v5.7 o superior)
- Un servidor de Discord y permisos de administrador para añadir bots

## Instalación

1. Clone el repositorio:
   ```bash
   git clone https://github.com/ivanlpc/hydracraft-bot.git
   ```
2. Instale las dependencias:
   ```bash
   cd hydracraft-bot
   npm install
   ```
3. Configure el archivo `.env` con sus credenciales de MySQL y el token de su bot de Discord.
4. Ejecute el bot:
   ```bash
   node index.js
   ```




## Licencia

Este proyecto está bajo la Licencia MIT. Vea el archivo LICENSE para más detalles.

---
