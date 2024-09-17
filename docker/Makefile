all: check-code test sign-app

.PHONY: bash check-code sign-app show-log test

# Try to use "docker compose" and fall back to "docker-compose" if not available
DOCKER_COMPOSE := $(shell docker compose > /dev/null && echo docker compose || echo docker-compose)

build:
	$(DOCKER_COMPOSE) build

fetch-db:
	$(DOCKER_COMPOSE) run --rm app su -c "cp data/mydb.db apps/webapppassword" www-data

push-db:
	$(DOCKER_COMPOSE) run --rm app su -c "cp apps/webapppassword/mydb.db data" www-data

bash:
	$(DOCKER_COMPOSE) run --rm app su -c "bash" www-data

bash-root:
	$(DOCKER_COMPOSE) run --rm app bash

maintenance-mode-off:
	$(DOCKER_COMPOSE) run --rm app su -c "./occ maintenance:mode --off" www-data

check-code:
	$(DOCKER_COMPOSE) run --rm app su -c "./occ app:check-code webapppassword" www-data

sign-app:
	$(DOCKER_COMPOSE) run --rm app ../sign-app.sh

test:
	$(DOCKER_COMPOSE) run --rm app su -c "cd apps/webapppassword && make test" www-data

show-log:
	$(DOCKER_COMPOSE) run --rm app tail -f /var/www/html/data/nextcloud.log

remove-volumes:
	docker volume rm --force nextcloud-webapppassword_nextcloud
