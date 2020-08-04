all: sign-app

.PHONY: bash check-code sign-app show-log test

bash:
	docker-compose run --rm app su -c "bash" www-data

check-code:
	docker-compose run --rm app su -c "./occ app:check-code webapppassword" www-data

sign-app:
	docker-compose run --rm app ../sign-app.sh

test:
	docker-compose run --rm app su -c "cd apps/webapppassword && make test" www-data

show-log:
	docker-compose run --rm app tail -f /var/www/html/data/nextcloud.log
