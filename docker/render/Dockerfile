FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    git unzip libicu-dev libzip-dev libxml2-dev \
    && docker-php-ext-install pdo_mysql intl zip xml opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-scripts

RUN php bin/console cache:clear --env=prod || true \
 && php bin/console cache:warmup --env=prod || true \
 && php bin/console assets:install public --env=prod || true

CMD php -S 0.0.0.0:$PORT -t public