#!/bin/sh
########################################################################
# Creates the signature.json for the Nextcloud application
# This script runs in a Nextcloud Docker container.
########################################################################

APP_NAME=webapppassword
APP_SOURCE=/var/www/html/custom_apps/${APP_NAME}
APP_DEST=/var/www/deploy/${APP_NAME}
CERT_PATH=/var/www/.nextcloud/certificates
DEPLOYMENT_FILE=${APP_SOURCE}/${APP_NAME}.tar.gz

rm -rf ${APP_DEST} &&
	mkdir ${APP_DEST} &&
	echo "📂 Deployment directory prepared." &&
	rsync -a --exclude .git* --exclude .gitlab-ci* --exclude .github --exclude screenshot* \
		--exclude docs --exclude tests --exclude vendor --exclude package.* --exclude composer.json --exclude composer.lock \
		--exclude Makefile --exclude *.db* --exclude docker --exclude *.phar \
		--exclude *.gz --exclude .idea --exclude .renovaterc.json --exclude .php-cs* \
		--exclude phpstan.* --exclude phpunit.* --exclude psalm.xml --exclude shell.nix \
		--exclude .envrc --exclude .direnv --exclude term.kdl --exclude .phpunit.result.cache \
		--exclude justfile --exclude treefmt.toml --exclude .devenv --exclude flake.* \
		--exclude .devenv.* --exclude devenv.* --exclude .pre-commit-config.* --exclude .shared \
		--exclude AGENTS.md \
		${APP_SOURCE}/ ${APP_DEST} &&
	echo "✅ Files copied to deployment directory." &&
	find ${APP_DEST} -type d -empty -delete &&
	echo "🗑️ Empty directories removed." &&
	su -m -c "./occ integrity:sign-app \
  --privateKey=${CERT_PATH}/${APP_NAME}.key \
  --certificate=${CERT_PATH}/${APP_NAME}.crt --path=${APP_DEST}" www-data &&
	echo "🔐 App signed successfully." &&
	cp ${APP_DEST}/appinfo/signature.json ${APP_SOURCE}/appinfo &&
	echo "\n🔍 Reviewing files to be included in the archive:\n" &&
	find ${APP_DEST} -type f | sort &&
	echo "\n⏸️ Press Enter to continue with archiving.\n" &&
	read line &&
	tar czf ${DEPLOYMENT_FILE} -C ${APP_DEST}/.. ${APP_NAME} &&
	echo "📦 Archive created." &&
	echo "\n🔐 Signature for your app archive:\n" &&
	openssl dgst -sha512 -sign ${CERT_PATH}/${APP_NAME}.key ${DEPLOYMENT_FILE} | openssl base64 &&
	echo
