FROM php:8.3-cli

# System dependencies
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

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy project
COPY . .

# Install dependencies (IMPORTANT: keep scripts ON to avoid API Platform bugs)
RUN composer install --no-dev --optimize-autoloader

# Ensure Symfony cache is clean and rebuilt properly
RUN php bin/console cache:clear --env=prod || true
RUN php bin/console cache:warmup --env=prod || true

# Render uses dynamic port
EXPOSE 10000

# Start server (Render injects $PORT)
CMD php -S 0.0.0.0:$PORT -t public