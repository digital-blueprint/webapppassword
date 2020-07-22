# Nextcloud Development Environment

## Installation / Running

```bash
docker-compose up
```

Afterwards you should be able to open <http://localhost:8081> (admin/admin) to
login to your Nextcloud instance.

## Check nextcloud.log

In case the whole site is broken you can do a:

```bash
docker-compose run app tail -f /var/www/html/data/nextcloud.log
```

For other errors you can watch <http://localhost:8081/index.php/settings/admin/logging>.

## Tip

In case something is broken try to reset things:

```bash
docker-compose build; docker-compose down; docker volume prune -f
```