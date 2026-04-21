#!/usr/bin/env sh
set -e

: "${DJANGO_SETTINGS_MODULE:=config.settings.prod}"
export DJANGO_SETTINGS_MODULE

echo "[entrypoint] applying migrations"
python manage.py migrate --noinput

if [ "${DJANGO_COLLECTSTATIC:-1}" = "1" ]; then
    echo "[entrypoint] collecting static files"
    python manage.py collectstatic --noinput
fi

exec "$@"
