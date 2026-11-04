# Despliegue automático del bot

Al subir a `main`, `.github/workflows/ci.yml` ejecuta lint, pruebas y auditoría de
dependencias en runners de GitHub. Después construye y comprueba la imagen. Solo
si esos jobs pasan se ejecuta el despliegue en un runner Linux self-hosted con
las etiquetas `self-hosted`, `linux`, `x64` y **`hydracraft-bot`**. También admite
ejecución manual desde Actions sobre `main`.

El runner hace `git pull --ff-only` en un clon persistente, comprueba que coincide
con el SHA validado, construye la imagen local y reinicia
`hydracraft-bot.service`. Si otro push ya avanzó `main`, omite el despliegue viejo.
Los despliegues se serializan y un bloqueo local evita ejecuciones simultáneas.

## Preparar el host una vez

Requiere Linux con systemd, Docker Engine, Git, Bash, sudo y flock (`util-linux`).
No requiere Node/npm en el host: las dependencias y las pruebas de construcción se
ejecutan dentro de Docker. El ejemplo supone `/usr/bin/docker` y
`/usr/bin/systemctl`; comprueba esas rutas antes de instalarlo.

Instala un runner de este repositorio siguiendo **Settings → Actions → Runners →
New self-hosted runner**. Usa una cuenta dedicada (aquí `github-runner`), añade la
etiqueta `hydracraft-bot` e instala el runner como servicio. Limita su uso a este
repositorio y protege `main`: los jobs de pull requests se ejecutan en GitHub,
nunca en este runner de producción. Tener acceso a Docker permite controlar el
host; usa esta cuenta solo para despliegues de código de confianza.

Prepara el clon de producción con esa cuenta:

```bash
sudo install -d -o github-runner -g github-runner /opt/hydracraft-bot
sudo -u github-runner git clone --branch main https://github.com/Ivanlpc/hydracraft-bot.git /opt/hydracraft-bot
sudo usermod -aG docker github-runner
```

Reinicia el servicio del runner después de cambiar sus grupos. Para un repositorio
privado, configura una deploy key SSH de solo lectura en esa cuenta y clona con la
URL SSH. El clon persistente necesita su propia autenticación Git no interactiva;
el token temporal de `actions/checkout` no se guarda en él. No pongas claves en la
URL del remoto. Comprueba como `github-runner` que funcionan `git fetch origin main`
y `docker info`.

Si instalas el clon en otro directorio, define la variable de repositorio GitHub
**`BOT_DIR`**. Debe estar en la rama `main`, sin cambios locales ni commits propios.
No edites allí la configuración de producción: un pull con conflictos se rechaza.

## Configuración y datos persistentes

Desde el clon, crea estos directorios:

```bash
sudo install -d -m 755 /etc/hydracraft-bot /etc/hydracraft-bot/config
sudo cp config/*.json /etc/hydracraft-bot/config/
sudo install -m 600 example.env /etc/hydracraft-bot/.env
sudo install -d -o 1000 -g 1000 -m 750 /var/lib/hydracraft-bot/logs /var/lib/hydracraft-bot/charts
sudoedit /etc/hydracraft-bot/.env
```

Rellena las credenciales del bot, MySQL, webhooks y `AGENT_*`. Edita también los
JSON en `/etc/hydracraft-bot/config` con las opciones reales. Estos archivos se
montan de solo lectura y no se sobreescriben al desplegar. Los cambios de esquema
de configuración futuros se deben incorporar a esa copia explícitamente.

El archivo usa la sintaxis Docker `KEY=value`: no añadas `export`, no pongas
comillas para delimitar valores y no dependas de expansión de otras variables.
Su contenido lo lee Docker al crear el contenedor. No se incluye en la imagen,
en el repositorio ni en secretos de Actions.

El contenedor corre como UID/GID `1000:1000` (usuario `node` de la imagen). Los
logs y gráficos persisten en `/var/lib/hydracraft-bot`. El directorio raíz del
contenedor es de solo lectura; `/tmp` es temporal. La unidad usa red del host
para que `127.0.0.1` siga apuntando al MySQL/agente del servidor Linux. No publica
puertos ni monta sockets Docker, systemd o Screen dentro del bot.

## Instalar systemd y permisos de reinicio

```bash
sudo install -m 644 deploy/hydracraft-bot.service /etc/systemd/system/hydracraft-bot.service
sudo visudo -f /etc/sudoers.d/hydracraft-bot
```

Copia el contenido de `deploy/sudoers.example`, ajustando `github-runner` al usuario
real. Solo autoriza `restart` y `reset-failed` para esa unidad exacta.

```bash
sudo chmod 440 /etc/sudoers.d/hydracraft-bot
sudo systemctl daemon-reload
sudo systemctl enable hydracraft-bot.service
```

No lo arranques todavía si no existe `hydracraft-bot:latest`. Ejecuta el workflow
manualmente en `main` para construir la primera imagen y arrancar el servicio, o
haz el primer despliegue local como usuario del runner:

```bash
cd /opt/hydracraft-bot
bash scripts/deploy_bot.sh "$(git rev-parse HEAD)"
```

El primer despliegue no tiene una imagen anterior para recuperar. La instalación
de la unidad es manual; posteriores cambios en su ejemplo requieren reinstalarla
y ejecutar `systemctl daemon-reload` antes del siguiente despliegue.

## Comprobación y recuperación

La construcción ejecuta `npm ci`, lint y las pruebas antes de quitar dependencias
de desarrollo. La imagen final contiene solo dependencias de producción y código
de ejecución. CI comprueba además que no contiene `.env`, Git ni las pruebas, y
ejercita nueve escenarios de despliegue/rollback con comandos simulados dentro de
un contenedor desechable.

Después del reinicio, el script comprueba durante al menos diez segundos que la
unidad sigue activa, que el contenedor usa la imagen construida y que no cambia
su instante de arranque. Esto detecta caídas
inmediatas y bucles de reinicio; **no confirma conexión a Discord, consultas MySQL
ni entrega de comandos a Bungee**. Comprueba esas funciones tras la primera
instalación con la configuración real.

Si falla el reinicio o la comprobación inicial, el script vuelve a etiquetar la
imagen anterior y reinicia la unidad. El job queda fallido aunque la recuperación
funcione. No cambia configuraciones, datos ni el commit del clon al recuperar la
imagen, y no borra imágenes: conserva sus tags por SHA para recuperación manual.

```bash
sudo systemctl status hydracraft-bot.service
sudo journalctl -u hydracraft-bot.service -n 100 --no-pager
docker image ls hydracraft-bot
docker tag hydracraft-bot:SHA_ANTERIOR hydracraft-bot:latest
sudo systemctl reset-failed hydracraft-bot.service
sudo systemctl restart hydracraft-bot.service
```

Systemd reinicia el bot si su proceso termina con error, y lo arranca al reiniciar
el host. No hay un vigilante adicional que reinicie un bot vivo pero desconectado.
Conserva espacio suficiente para las imágenes y elimina manualmente las antiguas
cuando ya no las necesites para recuperación.
