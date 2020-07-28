all: sign-app

.PHONY: bash check-code sign-app show-log

bash:
	docker-compose run app bash

check-code:
	docker-compose run app su -c "./occ app:check-code webapppassword" www-data

sign-app:
	docker-compose run app ../sign-app.sh

show-log:
	docker-compose run app tail -f /var/www/html/data/nextcloud.log
