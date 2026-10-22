#!/bin/sh
# SPDX-FileCopyrightText: 2026 Patrizio Bekerle <patrizio@bekerle.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
# Isolated signing runtime; never uses development Docker containers/volumes.
set -eu
ROOT=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
cd "${ROOT}"
VERSION=$(python3 scripts/check-release.py)
: "${APP_PRIVATE_KEY:?APP_PRIVATE_KEY is required}"
: "${APP_PUBLIC_CRT:?APP_PUBLIC_CRT is required}"
umask 077
WORK_DIR=$(mktemp -d)
CONTAINER="webapppassword-release-$(basename "${WORK_DIR}" | tr '[:upper:]' '[:lower:]')"
cleanup() {
	docker rm -fv "${CONTAINER}" >/dev/null 2>&1 || true
	rm -rf "${WORK_DIR}"
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
printf '%s\n' "${APP_PRIVATE_KEY}" >"${WORK_DIR}/webapppassword.key"
printf '%s\n' "${APP_PUBLIC_CRT}" >"${WORK_DIR}/webapppassword.crt"
unset APP_PRIVATE_KEY APP_PUBLIC_CRT

# Deliberately pinned to the same signing runtime as qownnotes-nextcloud.
docker run -d --name "${CONTAINER}" \
	-e NEXTCLOUD_ADMIN_USER=admin -e NEXTCLOUD_ADMIN_PASSWORD=release-test-only \
	-e SQLITE_DATABASE=nextcloud -e NEXTCLOUD_TRUSTED_DOMAINS=localhost \
	nextcloud:35.0.1-apache@sha256:8f2f0e93aca5e9457019933936dea1f313052e72c696b4aecb31580a208b859f >/dev/null
ready=false
for _ in $(seq 1 90); do
	if docker exec -u www-data "${CONTAINER}" php occ status --output=json 2>/dev/null |
		python3 -c 'import json,sys; sys.exit(not json.load(sys.stdin).get("installed"))' 2>/dev/null; then
		ready=true
		break
	fi
	sleep 2
done
if [ "${ready}" != true ]; then
	echo "Nextcloud did not initialize within 180 seconds" >&2
	exit 1
fi
docker exec "${CONTAINER}" mkdir -p /var/www/html/custom_apps/webapppassword /var/www/certificates /release
while IFS= read -r entry; do
	case "${entry}" in
	'' | '#'*) continue ;;
	esac
	docker cp "${entry}" "${CONTAINER}:/var/www/html/custom_apps/webapppassword/"
done <release-files.txt
docker cp "${WORK_DIR}/webapppassword.key" "${CONTAINER}:/var/www/certificates/"
docker cp "${WORK_DIR}/webapppassword.crt" "${CONTAINER}:/var/www/certificates/"
docker exec "${CONTAINER}" sh -c '
  rm -f /var/www/html/custom_apps/webapppassword/appinfo/signature.json
  chown -R www-data:www-data /var/www/html/custom_apps/webapppassword /var/www/certificates
  chmod 700 /var/www/certificates
  chmod 600 /var/www/certificates/*
'
docker exec -u www-data "${CONTAINER}" php occ integrity:sign-app \
	--privateKey=/var/www/certificates/webapppassword.key \
	--certificate=/var/www/certificates/webapppassword.crt \
	--path=/var/www/html/custom_apps/webapppassword
ARCHIVE="webapppassword-${VERSION}.tar.gz"
docker exec "${CONTAINER}" tar czf "/release/${ARCHIVE}" -C /var/www/html/custom_apps webapppassword
mkdir -p build
docker cp "${CONTAINER}:/release/${ARCHIVE}" "build/${ARCHIVE}"
if [ "$(stat -c '%s' "build/${ARCHIVE}")" -gt 20971520 ]; then
	echo "Signed archive exceeds the App Store's 20 MiB limit" >&2
	exit 1
fi
openssl dgst -sha512 -sign "${WORK_DIR}/webapppassword.key" -out "${WORK_DIR}/signature" "build/${ARCHIVE}"
openssl base64 -A -in "${WORK_DIR}/signature" -out "build/${ARCHIVE}.sig"
openssl x509 -in "${WORK_DIR}/webapppassword.crt" -pubkey -noout >"${WORK_DIR}/public.pem"
openssl dgst -sha512 -verify "${WORK_DIR}/public.pem" -signature "${WORK_DIR}/signature" "build/${ARCHIVE}"

# Check the actual extracted archive. Nextcloud silently skips unsigned apps,
# so explicitly require signature.json before checking integrity.
docker exec "${CONTAINER}" sh -c "mkdir /signed-release && tar xzf /release/${ARCHIVE} -C /signed-release && test -s /signed-release/webapppassword/appinfo/signature.json"
docker exec -u www-data "${CONTAINER}" php occ integrity:check-app webapppassword --path=/signed-release/webapppassword
docker exec "${CONTAINER}" sh -c 'mv /var/www/html/custom_apps/webapppassword /unsigned-source && mv /signed-release/webapppassword /var/www/html/custom_apps/webapppassword && chown -R www-data:www-data /var/www/html/custom_apps/webapppassword'
docker exec -u www-data "${CONTAINER}" php occ app:enable webapppassword
(cd build && sha256sum "${ARCHIVE}" >"${ARCHIVE}.sha256")
echo "Signed archive integrity and app installation passed: build/${ARCHIVE}"
