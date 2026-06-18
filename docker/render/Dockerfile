FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    git unzip libicu-dev libzip-dev libpq-dev libxml2-dev \
    && docker-php-ext-install intl zip pdo_pgsql opcache xml

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-scripts

EXPOSE 10000

CMD php -S 0.0.0.0:$PORT -t public