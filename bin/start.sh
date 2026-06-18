#!/bin/sh
set -e

echo "Running migrations..."
php bin/console doctrine:migrations:migrate --no-interaction --env=prod

echo "Installing assets..."
php bin/console assets:install public --env=prod

echo "Cache..."
php bin/console cache:clear --env=prod
php bin/console cache:warmup --env=prod

echo "Starting server..."
php -S 0.0.0.0:$PORT -t public