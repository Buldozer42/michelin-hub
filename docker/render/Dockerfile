FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libicu-dev \
    libzip-dev \
    libpq-dev \
    libxml2-dev \
    && docker-php-ext-install \
    intl \
    zip \
    pdo_pgsql \
    opcache \
    xml

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

# IMPORTANT FIX: disable Symfony auto-scripts (prevents DATABASE_URL crash)
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Safe cache build (after install)
RUN php bin/console cache:clear --env=prod || true \
 && php bin/console cache:warmup --env=prod || true

EXPOSE 10000

CMD sh -c 'if [ -n "${DATABASE_URL:-}" ] && echo "$DATABASE_URL" | grep -Eq "(^|[?&])serverVersion=(&|$)"; then export DATABASE_URL="$(echo "$DATABASE_URL" | sed -E "s/([?&])serverVersion=(&|$)/\1/g; s/[?&]$//; s/\?&/\?/")"; fi; php -S 0.0.0.0:${PORT:-10000} -t public'