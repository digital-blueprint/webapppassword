all: sign-app

.PHONY: bash check-code sign-app show-log

bash:
	docker-compose run --rm app bash

check-code:
	docker-compose run --rm app su -c "./occ app:check-code webapppassword" www-data

sign-app:
	docker-compose run --rm app ../sign-app.sh

show-log:
	docker-compose run --rm app tail -f /var/www/html/data/nextcloud.log
