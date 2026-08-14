#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_NAME="thiqwave-app"
readonly APP_ROOT="/opt/${APP_NAME}"
readonly REPO_DIR="${APP_ROOT}/repo"
readonly LIVE_CONTAINER="${APP_NAME}"
readonly HOST_PORT="3040"
readonly REPOSITORY="git@github.com:thiqwave-com/thiqwave-app.git"
readonly LOCK_FILE="/run/lock/${APP_NAME}-deploy.lock"

log() {
  printf '[%s] %s\n' "$(date --utc +'%Y-%m-%dT%H:%M:%SZ')" "$*"
}

fail() {
  log "ERROR: $*"
  exit 1
}

wait_until_healthy() {
  local container="$1"
  local status

  for _ in $(seq 1 36); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || true)"
    case "$status" in
      healthy)
        return 0
        ;;
      unhealthy|exited|dead)
        return 1
        ;;
    esac
    sleep 5
  done

  return 1
}

run_live_container() {
  local image="$1"

  docker run \
    --detach \
    --name "$LIVE_CONTAINER" \
    --restart unless-stopped \
    --publish "127.0.0.1:${HOST_PORT}:3000" \
    --label "com.thiqwave.application=${APP_NAME}" \
    "$image" >/dev/null
}

deploy() {
  local sha="${1:-}"
  local image
  local candidate
  local previous_image=""

  [[ "$sha" =~ ^[0-9a-f]{40}$ ]] || fail "Expected a full 40-character commit SHA."

  mkdir -p "${APP_ROOT}/bin"

  if [[ ! -d "${REPO_DIR}/.git" ]]; then
    log "Cloning repository."
    git clone --no-checkout "$REPOSITORY" "$REPO_DIR"
  fi

  log "Fetching origin/main."
  git -C "$REPO_DIR" fetch --force --prune origin \
    "refs/heads/main:refs/remotes/origin/main"
  git -C "$REPO_DIR" cat-file -e "${sha}^{commit}" \
    || fail "Commit ${sha} was not fetched from origin."
  git -C "$REPO_DIR" merge-base --is-ancestor "$sha" origin/main \
    || fail "Commit ${sha} is not on origin/main."

  git -C "$REPO_DIR" checkout --force --detach "$sha"
  git -C "$REPO_DIR" clean -fdx

  # Install the version from the deployed commit for the next deployment.
  install -m 0755 "${REPO_DIR}/infra/deploy.sh" "${APP_ROOT}/bin/deploy"

  image="${APP_NAME}:${sha}"
  candidate="${APP_NAME}-candidate-${sha:0:12}"

  log "Building ${image}."
  docker build \
    --label "com.thiqwave.application=${APP_NAME}" \
    --build-arg NEXT_PUBLIC_API_MODE=mock \
    --tag "$image" \
    "$REPO_DIR"

  docker rm --force "$candidate" >/dev/null 2>&1 || true
  log "Health-checking candidate image."
  docker run --detach --name "$candidate" "$image" >/dev/null
  if ! wait_until_healthy "$candidate"; then
    docker logs --tail 100 "$candidate" >&2 || true
    docker rm --force "$candidate" >/dev/null 2>&1 || true
    fail "Candidate image failed its health check."
  fi
  docker rm --force "$candidate" >/dev/null

  if docker container inspect "$LIVE_CONTAINER" >/dev/null 2>&1; then
    previous_image="$(docker inspect --format '{{.Config.Image}}' "$LIVE_CONTAINER")"
  fi

  log "Replacing the live container."
  docker rm --force "$LIVE_CONTAINER" >/dev/null 2>&1 || true
  run_live_container "$image"

  if ! wait_until_healthy "$LIVE_CONTAINER"; then
    docker logs --tail 100 "$LIVE_CONTAINER" >&2 || true
    docker rm --force "$LIVE_CONTAINER" >/dev/null 2>&1 || true

    if [[ -n "$previous_image" ]]; then
      log "Live health check failed; rolling back to ${previous_image}."
      run_live_container "$previous_image"
      wait_until_healthy "$LIVE_CONTAINER" \
        || fail "Deployment and rollback health checks both failed."
    fi

    fail "Deployment health check failed."
  fi

  printf '%s\n' "$sha" >"${APP_ROOT}/current"
  while IFS= read -r old_image; do
    if [[ -n "$old_image" && "$old_image" != "$image" ]]; then
      docker image rm "$old_image" >/dev/null 2>&1 || true
    fi
  done < <(
    docker image ls \
      --filter "label=com.thiqwave.application=${APP_NAME}" \
      --format '{{.Repository}}:{{.Tag}}'
  )
  docker image prune --force >/dev/null

  log "Deployment complete: ${sha}"
}

mkdir -p "$(dirname "$LOCK_FILE")"
exec 9>"$LOCK_FILE"
flock --nonblock 9 || fail "Another deployment is already running."

deploy "$@"
