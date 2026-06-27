#!/bin/sh
set -e

echo "=== RUNNING MIGRATIONS ==="
python manage.py migrate --noinput
echo "=== MIGRATIONS DONE ==="

echo "=== RUNNING COLLECTSTATIC ==="
python manage.py collectstatic --noinput
echo "=== COLLECTSTATIC DONE ==="

echo "=== STARTING GUNICORN ON PORT ${PORT} ==="
exec gunicorn eventifood.wsgi:application \
    --bind "0.0.0.0:${PORT}" \
    --workers 2 \
    --log-level info \
    --access-logfile - \
    --error-logfile -
