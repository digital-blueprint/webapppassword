# Nextcloud Development Environment

## Installation / Running

```bash
docker-compose up
```

Afterwards you should be able to open <http://localhost:8081> (admin/admin).

## Tip

In case something is broken try to reset things:

```bash
docker-compose build; docker-compose down; docker volume prune -f
```