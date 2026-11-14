# Despliegue del bot con Docker

Cada push a `master` que pasa CI construye la imagen y sustituye el contenedor.
También puedes ejecutar el workflow manualmente sobre `master`. El despliegue
está directamente en `.github/workflows/ci.yml`.

## Servidor

Configura un runner Linux x64 con las etiquetas `self-hosted`, `linux`, `x64`
y acceso a Docker. Actions descarga el código privado automáticamente.

Prepara tú las carpetas, los JSON de configuración y la base de datos:

```text
/opt/hydracraft-bot/
├── .env       # lo genera Actions
├── config/    # copia aquí los JSON de config/ del repositorio
├── logs/
└── charts/
```

El usuario del runner debe poder escribir el `.env`. El contenedor usa UID/GID
`1000:1000`: necesita leer `config/` y escribir en `logs/` y `charts/`.
Puedes elegir otra carpeta con la variable de repositorio `BOT_HOME`.
El código y las dependencias están en la imagen.

## Secretos

En GitHub abre Settings → Secrets and variables → Actions y crea un Repository
secret individual por cada variable de `example.env`: `TOKEN`, `DATABASE_HOST`,
`DATABASE_USER`, `DATABASE_PASSWORD`, los `AGENT_*` y los `WEBHOOK_*`, etc.
Cada secreto contiene solo el valor, sin `NOMBRE=`, `export` ni comillas delimitadoras.
No necesitas `BOT_ENV` ni un Environment de GitHub.

Si no defines `AGENT_JWT_AUDIENCE`, `AGENT_JWT_SUBJECT` o `AGENT_TIMEOUT_MS`,
se usan `java-node-agent`, `hydracraft-bot` y `10000`, respectivamente.

El workflow crea `/opt/hydracraft-bot/.env` con permisos `600` y lo pasa a
`docker run --env-file`. Los secretos no se incluyen en la imagen ni se imprimen.
Para cambiarlos, actualiza los secretos individuales y vuelve a ejecutar el workflow.

El despliegue hace build, genera el `.env`, detiene y elimina el contenedor
anterior si existe y hace `docker run`. Los archivos de configuración y datos
se conservan en la carpeta del servidor. Docker reinicia el bot mediante
`--restart unless-stopped`.

Para consultar el estado y los logs:

```bash
docker ps -a --filter name=hydracraft-bot
docker logs --tail 100 hydracraft-bot
```
