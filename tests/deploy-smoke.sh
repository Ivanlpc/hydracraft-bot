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
      status) if [[ "$SCENARIO" == dirty ]]; then echo ' M index.js'; fi ;;
      rev-parse)
        [[ "$2" == HEAD ]] || exit 1
        if [[ "$SCENARIO" == stale ]]; then echo bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb; else echo aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa; fi ;;
      *) echo 'Deployment must not fetch, pull or require a branch checkout' >&2; exit 1 ;;
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
      build)
        [[ "$PWD" == "$GITHUB_WORKSPACE" ]] || exit 1
        if [[ "$SCENARIO" == build_failure ]]; then exit 1; fi ;;
      tag) if [[ "$2" == sha256:previous ]]; then touch "$DEPLOY_TEST_STATE/rolled-back"; fi ;;
      run) if [[ "$SCENARIO" == restart_failure && ! -f "$DEPLOY_TEST_STATE/rolled-back" ]]; then exit 1; fi ;;
    esac ;;
  systemctl|sudo) echo 'Deployment must use Docker directly' >&2; exit 1 ;;
  flock) if [[ "$SCENARIO" == locked ]]; then exit 1; fi ;;
  sleep) : ;;
esac
MOCK
chmod +x "$fixture/bin/mock"
for tool in git docker systemctl sudo flock sleep; do ln -s mock "$fixture/bin/$tool"; done

run_case () {
  local scenario=$1 expected=$2 actual=0
  mkdir "$fixture/$scenario"
  PATH="$fixture/bin:$PATH" SCENARIO="$scenario" DEPLOY_TEST_STATE="$fixture/$scenario" GITHUB_WORKSPACE="$fixture/repo" TMPDIR="$fixture" \
    bash "$deploy_script" aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa >"$fixture/$scenario/output" 2>&1 || actual=$?
  if [[ "$actual" != "$expected" ]]; then
    cat "$fixture/$scenario/output"
    echo "Unexpected status for $scenario: $actual (expected $expected)" >&2
    exit 1
  fi
}

for scenario in dirty locked; do
  run_case "$scenario" 1
  if grep -q 'docker build\|docker stop\|docker run' "$fixture/$scenario/calls"; then exit 1; fi
done
run_case stale 0
if grep -q 'git pull\|docker build\|docker stop\|docker run' "$fixture/stale/calls"; then exit 1; fi
run_case build_failure 1
if grep -q 'docker tag\|docker stop\|docker run' "$fixture/build_failure/calls"; then exit 1; fi
run_case success 0
grep -q 'git rev-parse HEAD' "$fixture/success/calls"
grep -q 'docker build .*--tag hydracraft-bot:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa .' "$fixture/success/calls"
if grep -q 'git fetch\|git pull\|git symbolic-ref' "$fixture/success/calls"; then exit 1; fi
grep -q 'docker stop --time 20 hydracraft-bot' "$fixture/success/calls"
grep -q 'docker rm hydracraft-bot' "$fixture/success/calls"
grep -q 'docker run .*--restart unless-stopped .*sha256:next' "$fixture/success/calls"
if grep -q 'systemctl\|sudo' "$fixture/success/calls"; then exit 1; fi
for scenario in unhealthy restart_failure; do
  run_case "$scenario" 1
  grep -q 'docker tag sha256:previous hydracraft-bot:latest' "$fixture/$scenario/calls"
  grep -q 'Previous image restored' "$fixture/$scenario/output"
  grep -q 'docker run .*sha256:previous' "$fixture/$scenario/calls"
done
run_case no_previous 1
grep -q 'No previous image exists' "$fixture/no_previous/output"
echo 'Deployment scenarios passed: lock, dirty checkout, stale commit, build failure, workspace build without Git credentials, startup failure, restart failure, first deployment failure'
