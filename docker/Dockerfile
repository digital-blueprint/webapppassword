# Use this if there is a release image
#FROM nextcloud:27-apache
#FROM nextcloud:28-apache
FROM nextcloud:29-apache

# Use this if there is no release image yet
# https://github.com/digital-blueprint/nextcloud-docker/pkgs/container/nextcloud-docker-pre-apache
# https://github.com/digital-blueprint/nextcloud-docker/tree/pre-release
#FROM ghcr.io/digital-blueprint/nextcloud-docker-pre-apache:latest

COPY entrypoint.sh /

RUN deluser www-data
RUN useradd -u 1000 -ms /bin/bash www-data
RUN usermod -a -G www-data www-data
RUN mkdir /var/www/deploy
