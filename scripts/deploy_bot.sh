#!/usr/bin/env bash
set -Eeuo pipefail

expected_sha=${1:?Pass the commit SHA validated by CI}
[[ "$expected_sha" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid commit SHA' >&2; exit 1; }
repo_dir=${GITHUB_WORKSPACE:?Run this script from GitHub Actions}
repo_dir=$(cd -- "$repo_dir" && pwd -P)
cd -- "$repo_dir"

image=hydracraft-bot
container=hydracraft-bot
promoted=0
previous_image=

for tool in git docker flock; do
  command -v "$tool" >/dev/null || { echo "Missing executable: $tool" >&2; exit 1; }
done
[[ -d .git ]] || { echo 'GITHUB_WORKSPACE must contain the Actions checkout' >&2; exit 1; }
exec 9>"${TMPDIR:-/tmp}/hydracraft-bot-deploy.lock"
flock -n 9 || { echo 'Another deployment is already running' >&2; exit 1; }

wait_for_container () {
  local expected_image=$1
  local previous_start='' current_start='' stable=0
  for ((attempt = 0; attempt < 30; attempt++)); do
    current_start=$(docker inspect --format '{{if .State.Running}}{{.Image}} {{.State.StartedAt}}{{end}}' "$container" 2>/dev/null || true)
    if [[ "${current_start%% *}" == "$expected_image" ]]; then
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
  echo 'The container did not remain running during the startup check' >&2
  return 1
}

replace_container () {
  local selected_image=$1
  if docker container inspect "$container" >/dev/null 2>&1; then
    docker stop --time 20 "$container" || return 1
    docker rm "$container" || return 1
  fi
  docker run --detach --pull=never --name "$container" --restart unless-stopped \
    --init --network host --read-only --cap-drop ALL \
    --security-opt no-new-privileges --tmpfs /tmp:rw,noexec,nosuid,size=64m \
    --env-file /etc/hydracraft-bot/.env \
    --mount type=bind,src=/etc/hydracraft-bot/config,dst=/app/config,readonly \
    --mount type=bind,src=/var/lib/hydracraft-bot/logs,dst=/app/logs \
    --mount type=bind,src=/var/lib/hydracraft-bot/charts,dst=/app/charts \
    --stop-timeout 20 "$selected_image"
}

on_exit () {
  local status=$?
  trap - EXIT INT TERM
  if ((status != 0 && promoted == 1)); then
    if [[ -n "$previous_image" ]]; then
      echo 'Deployment failed; restoring the previous image' >&2
      if docker tag "$previous_image" "$image:latest" &&
          replace_container "$previous_image" && wait_for_container "$previous_image"; then
        echo 'Previous image restored; deployment remains failed' >&2
      else
        echo 'Rollback failed; check the container on the host' >&2
      fi
    else
      docker rm --force "$container" || true
      echo 'No previous image exists to restore; check the container on the host' >&2
    fi
  fi
  exit "$status"
}
trap on_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [[ "$(git rev-parse HEAD)" != "$expected_sha" ]]; then
  echo 'Skipping a superseded workflow: master no longer matches its validated commit'
  exit 0
fi
[[ -z "$(git status --porcelain --untracked-files=all)" ]] || { echo 'The Actions checkout has local changes; refusing to build it' >&2; exit 1; }

docker info >/dev/null
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
replace_container "$next_image"
wait_for_container "$next_image"
echo "Deployed $expected_sha"
