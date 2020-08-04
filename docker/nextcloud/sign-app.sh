#!/bin/sh
########################################################################
# Creates the signature.json for the Nextcloud application
########################################################################

APP_NAME=webapppassword
APP_SOURCE=/var/www/html/custom_apps/${APP_NAME}
APP_DEST=/var/www/deploy/${APP_NAME}
CERT_PATH=/var/www/.nextcloud/certificates
DEPLOYMENT_FILE=${APP_SOURCE}/${APP_NAME}.tar.gz

rm -rf ${APP_DEST} && \
mkdir ${APP_DEST} && \
rsync -a --exclude .git --exclude *.db* --exclude docker --exclude *.phar --exclude *.gz --exclude .idea ${APP_SOURCE}/ ${APP_DEST} && \
su -m -c "./occ integrity:sign-app \
  --privateKey=${CERT_PATH}/${APP_NAME}.key \
  --certificate=${CERT_PATH}/${APP_NAME}.crt --path=${APP_DEST}" www-data && \
cp ${APP_DEST}/appinfo/signature.json ${APP_SOURCE}/appinfo && \
tar cz ${APP_DEST}/.. > ${DEPLOYMENT_FILE} && \
echo "\nSignature for your app archive:\n" && \
openssl dgst -sha512 -sign ${CERT_PATH}/${APP_NAME}.key ${DEPLOYMENT_FILE} | openssl base64 && \
echo