#!/usr/bin/env bash
set -Eeuo pipefail

# Run only in a disposable container: these paths are deliberately container-local.
[[ -f /.dockerenv && "$(id -u)" == 0 ]] || { echo 'Run this harness as root in a disposable Docker container' >&2; exit 1; }
deploy_script=${1:?Pass the deployment script path}
fixture=$(mktemp -d)
mkdir -p "$fixture/bin" "$fixture/repo/.git" /etc/hydracraft-bot/config /var/lib/hydracraft-bot/{logs,charts}
touch /etc/hydracraft-bot/.env

cat >"$fixture/bin/mock" <<'MOCK'
#!/usr/bin/env bash
set -eu
tool=${0##*/}
printf '%s %s\n' "$tool" "$*" >>"$DEPLOY_TEST_STATE/calls"
case "$tool" in
  git)
    case "$1" in
      symbolic-ref) if [[ "$SCENARIO" == branch ]]; then echo feature; else echo main; fi ;;
      status) if [[ "$SCENARIO" == dirty ]]; then echo ' M index.js'; fi ;;
      rev-parse)
        if [[ "$SCENARIO" == stale && "$2" == FETCH_HEAD ]]; then echo bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb; else echo aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa; fi ;;
    esac ;;
  docker)
    case "$1" in
      inspect)
        if [[ "$3" == '{{.Image}}' ]]; then
          if [[ "$SCENARIO" == no_previous ]]; then exit 1; else echo sha256:previous; fi
        elif [[ "$SCENARIO" == no_previous || "$SCENARIO" == unhealthy ]] && [[ ! -f "$DEPLOY_TEST_STATE/rolled-back" ]]; then
          echo ''
        elif [[ -f "$DEPLOY_TEST_STATE/rolled-back" ]]; then echo 'sha256:previous stable-start';
        else echo 'sha256:next stable-start'; fi ;;
      image)
        if [[ "$5" != hydracraft-bot:latest ]]; then echo sha256:next;
        elif [[ "$SCENARIO" == no_previous ]]; then exit 1;
        else echo sha256:previous; fi ;;
      build) if [[ "$SCENARIO" == build_failure ]]; then exit 1; fi ;;
      tag) if [[ "$2" == sha256:previous ]]; then touch "$DEPLOY_TEST_STATE/rolled-back"; fi ;;
    esac ;;
  systemctl)
    if [[ "$1" == is-active && ( "$SCENARIO" == unhealthy || "$SCENARIO" == no_previous ) && ! -f "$DEPLOY_TEST_STATE/rolled-back" ]]; then exit 1; fi ;;
  sudo)
    if [[ "$3" == restart && "$SCENARIO" == restart_failure && ! -f "$DEPLOY_TEST_STATE/rolled-back" ]]; then exit 1; fi ;;
  flock) if [[ "$SCENARIO" == locked ]]; then exit 1; fi ;;
  sleep) : ;;
esac
MOCK
chmod +x "$fixture/bin/mock"
for tool in git docker systemctl sudo flock sleep; do ln -s mock "$fixture/bin/$tool"; done

run_case () {
  local scenario=$1 expected=$2 actual=0
  mkdir "$fixture/$scenario"
  PATH="$fixture/bin:$PATH" SCENARIO="$scenario" DEPLOY_TEST_STATE="$fixture/$scenario" BOT_DIR="$fixture/repo" \
    bash "$deploy_script" aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa >"$fixture/$scenario/output" 2>&1 || actual=$?
  if [[ "$actual" != "$expected" ]]; then
    cat "$fixture/$scenario/output"
    echo "Unexpected status for $scenario: $actual (expected $expected)" >&2
    exit 1
  fi
}

for scenario in branch dirty locked; do
  run_case "$scenario" 1
  if grep -q 'docker build\|sudo .* restart' "$fixture/$scenario/calls"; then exit 1; fi
done
run_case stale 0
if grep -q 'git pull\|docker build\|sudo .* restart' "$fixture/stale/calls"; then exit 1; fi
run_case build_failure 1
if grep -q 'docker tag\|sudo .* restart' "$fixture/build_failure/calls"; then exit 1; fi
run_case success 0
grep -q 'git pull --ff-only origin main' "$fixture/success/calls"
grep -q 'sudo -n /usr/bin/systemctl restart hydracraft-bot.service' "$fixture/success/calls"
for scenario in unhealthy restart_failure; do
  run_case "$scenario" 1
  grep -q 'docker tag sha256:previous hydracraft-bot:latest' "$fixture/$scenario/calls"
  grep -q 'Previous image restored' "$fixture/$scenario/output"
done
run_case no_previous 1
grep -q 'No previous image exists' "$fixture/no_previous/output"
echo 'Deployment scenarios passed: lock, branch, dirty clone, stale commit, build failure, success, startup failure, restart failure, first deployment failure'
