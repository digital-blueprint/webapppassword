#!/bin/bash

set -e
TAG="registry.gitlab.tugraz.at/dbp/nextcloud/webapppassword/main:v1"
sudo docker build --tag "${TAG}" --file "Dockerfile" .
sudo docker run --rm --security-opt label=disable \
    --volume "$(pwd)/..:/home/user/app" --workdir "/home/user/app" \
    --tty --interactive "${TAG}" bash
echo "Now run: sudo docker push '$TAG'"
