# Nextcloud Development Environment

## Installation / Running

```bash
docker-compose up
```

Afterwards you should be able to open <http://localhost:8081> (admin/admin) to
login to your Nextcloud instance.

## Check nextcloud.log

```bash
docker-compose run app tail -f /var/www/html/data/nextcloud.log
```

## Tip

In case something is broken try to reset things:

```bash
docker-compose build; docker-compose down; docker volume prune -f
```