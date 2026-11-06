# Despliegue automático con Docker

Cada push a `master` ejecuta CI y, si pasa, construye una imagen por SHA y sustituye
el contenedor `hydracraft-bot`. Un commit local necesita un push para activar
Actions. También admite ejecución manual del workflow sobre `master`.

El bot utiliza únicamente Docker, con `--restart unless-stopped` para recuperarse
tras caídas y reinicios del host. No necesita una unidad systemd ni sudo durante
el despliegue.

## Preparación

Requiere Linux, Docker Engine, Git, Bash y flock. Instala un runner de este
repositorio con las etiquetas `self-hosted`, `linux`, `x64`.
Su usuario necesita acceso a Docker. Actions descarga el repositorio privado en
`GITHUB_WORKSPACE` usando su token automático con permiso `contents: read`.
No necesitas un clon en `/opt/hydracraft-bot`, una variable `BOT_DIR`, una deploy
key ni un token personal. El script construye desde esa copia sin ejecutar
`git fetch` ni `git pull`. Comprueba como usuario del runner que `docker info`
funciona. Los pull requests se prueban en runners de GitHub.

Copia `example.env` y los JSON de `config/` desde tu equipo al servidor y prepara
los archivos de producción una sola vez desde la carpeta donde los hayas copiado:

```bash
sudo install -d -m 755 /etc/hydracraft-bot /etc/hydracraft-bot/config
sudo cp config/*.json /etc/hydracraft-bot/config/
sudo install -m 600 example.env /etc/hydracraft-bot/.env
sudo install -d -o 1000 -g 1000 -m 750 /var/lib/hydracraft-bot/logs /var/lib/hydracraft-bot/charts
sudoedit /etc/hydracraft-bot/.env
```

Rellena las credenciales y los JSON reales. El archivo usa sintaxis Docker
`KEY=value`, sin `export` ni expansión de variables. Docker lo lee en el host;
no se incluye en la imagen. La configuración se monta de solo lectura y los
logs y gráficos persisten fuera del contenedor. Los despliegues conservan estos
datos; incorpora explícitamente los futuros cambios de esquema de configuración.

El bot corre con UID/GID `1000:1000`, raíz de solo lectura, `/tmp` temporal y red
del host para acceder a MySQL y al agente en `127.0.0.1` del servidor Linux.

## Migración e inicio

Si instalaste la unidad anterior, desactívala una sola vez antes de desplegar,
para evitar que compita por el mismo contenedor. Las instalaciones nuevas omiten
este paso:

```bash
sudo systemctl disable --now hydracraft-bot.service
```

La unidad y sus permisos sudo dejan de utilizarse. Ejecuta el workflow manualmente
en `master` o haz push a `master` para realizar el primer despliegue.
Para cargar cambios posteriores del `.env`, vuelve a ejecutar el workflow:
reiniciar el contenedor existente no recarga las variables.

## Sustitución y recuperación

El script construye antes de detener el contenedor anterior. Después lo detiene,
lo elimina y crea otro con la nueva imagen y los mismos montajes. Hay una breve
interrupción durante la sustitución. Los despliegues se serializan, usan un
bloqueo en `${TMPDIR:-/tmp}/hydracraft-bot-deploy.lock`, fuera del checkout.
El job descarga `master` y omite el despliegue si su SHA ya no coincide con el commit
que pasó CI. Acepta el checkout con HEAD separado que utiliza Actions.

Comprueba durante al menos diez segundos que el contenedor sigue funcionando con
la imagen esperada y sin reiniciarse. Esto detecta caídas inmediatas; comprueba
Discord, MySQL y Bungee con la configuración real tras la primera instalación.

Si falla la sustitución o el arranque, recrea el contenedor con la imagen anterior.
El job queda fallido aunque la recuperación funcione. En el primer despliegue,
sin imagen anterior, elimina el contenedor fallido. Conserva las imágenes por SHA
para recuperación; elimina manualmente las antiguas cuando ya no las necesites.

```bash
docker ps -a --filter name=hydracraft-bot
docker logs --tail 100 hydracraft-bot
docker image ls hydracraft-bot
```

CI comprueba la imagen y ejecuta escenarios simulados de despliegue y recuperación
en un contenedor desechable.
