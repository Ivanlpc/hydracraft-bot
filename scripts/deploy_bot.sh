#!/usr/bin/env bash
set -Eeuo pipefail

expected_sha=${1:?Pass the commit SHA validated by CI}
[[ "$expected_sha" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid commit SHA' >&2; exit 1; }
repo_dir=${BOT_DIR:-/opt/hydracraft-bot}
repo_dir=$(cd -- "$repo_dir" && pwd -P)
cd -- "$repo_dir"

service=hydracraft-bot.service
image=hydracraft-bot
container=hydracraft-bot
promoted=0
previous_image=

for tool in git docker systemctl sudo flock; do
  command -v "$tool" >/dev/null || { echo "Missing executable: $tool" >&2; exit 1; }
done
[[ -d .git ]] || { echo 'BOT_DIR must be a normal Git clone' >&2; exit 1; }
exec 9>.git/hydracraft-deploy.lock
flock -n 9 || { echo 'Another deployment is already running' >&2; exit 1; }

wait_for_container () {
  local expected_image=$1
  local previous_start='' current_start='' stable=0
  for ((attempt = 0; attempt < 30; attempt++)); do
    current_start=$(docker inspect --format '{{if .State.Running}}{{.Image}} {{.State.StartedAt}}{{end}}' "$container" 2>/dev/null || true)
    if systemctl is-active --quiet "$service" && [[ "${current_start%% *}" == "$expected_image" ]]; then
      if [[ "$current_start" == "$previous_start" ]]; then
        stable=$((stable + 1))
      else
        stable=0
      fi
      if ((stable >= 5)); then return 0; fi
      previous_start=$current_start
    else
      stable=0
      previous_start=
    fi
    sleep 2
  done
  echo 'The service/container did not remain running during the startup check' >&2
  return 1
}

on_exit () {
  local status=$?
  trap - EXIT INT TERM
  if ((status != 0 && promoted == 1)); then
    if [[ -n "$previous_image" ]]; then
      echo 'Deployment failed; restoring the previous image' >&2
      if docker tag "$previous_image" "$image:latest" &&
          sudo -n /usr/bin/systemctl reset-failed "$service" &&
          sudo -n /usr/bin/systemctl restart "$service" && wait_for_container "$previous_image"; then
        echo 'Previous image restored; deployment remains failed' >&2
      else
        echo 'Rollback failed; check the service on the host' >&2
      fi
    else
      echo 'No previous image exists to restore; check the service on the host' >&2
    fi
  fi
  exit "$status"
}
trap on_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

[[ "$(git symbolic-ref --short HEAD)" == main ]] || { echo 'The deployment clone must be on main' >&2; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo 'The deployment clone has local changes; refusing to overwrite them' >&2; exit 1; }
git fetch --no-tags origin main
if [[ "$(git rev-parse FETCH_HEAD)" != "$expected_sha" ]]; then
  echo 'Skipping a superseded workflow: main no longer matches its validated commit'
  exit 0
fi
git pull --ff-only origin main
[[ "$(git rev-parse HEAD)" == "$expected_sha" ]] || { echo 'Checkout does not match the commit validated by CI' >&2; exit 1; }

docker info >/dev/null
systemctl cat "$service" >/dev/null
[[ -f /etc/hydracraft-bot/.env && -d /etc/hydracraft-bot/config &&
   -d /var/lib/hydracraft-bot/logs && -d /var/lib/hydracraft-bot/charts ]] || {
  echo 'Install the production environment, configuration and data directories first' >&2
  exit 1
}
previous_image=$(docker inspect --format '{{.Image}}' "$container" 2>/dev/null ||
  docker image inspect --format '{{.Id}}' "$image:latest" 2>/dev/null || true)

docker build --pull --label "org.opencontainers.image.revision=$expected_sha" --tag "$image:$expected_sha" .
next_image=$(docker image inspect --format '{{.Id}}' "$image:$expected_sha")
promoted=1
docker tag "$image:$expected_sha" "$image:latest"
sudo -n /usr/bin/systemctl reset-failed "$service"
sudo -n /usr/bin/systemctl restart "$service"
wait_for_container "$next_image"
echo "Deployed $expected_sha"
