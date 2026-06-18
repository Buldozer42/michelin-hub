#!/bin/sh
set -e

echo "Checking JWT keys..."

mkdir -p config/jwt

if [ ! -f config/jwt/private.pem ]; then
  echo "Generating JWT keys (no passphrase)..."

  openssl genrsa -out config/jwt/private.pem 4096
  openssl rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem
fi

echo "Running migrations..."
php bin/console doctrine:migrations:migrate --no-interaction --env=prod

echo "Installing assets..."
php bin/console assets:install public --env=prod

echo "Cache..."
php bin/console cache:clear --env=prod
php bin/console cache:warmup --env=prod

echo "Starting server..."
php -S 0.0.0.0:$PORT -t public