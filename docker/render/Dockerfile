FROM php:8.3-cli

# System dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libicu-dev \
    libzip-dev \
    libxml2-dev \
    default-mysql-client \
    && docker-php-ext-install \
    intl \
    zip \
    pdo_mysql \
    opcache \
    xml

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy project
COPY . .

# Install dependencies (SAFE for Render)
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Clean + warm cache (important for API Platform stability)
RUN php bin/console cache:clear --env=prod || true \
 && php bin/console cache:warmup --env=prod || true

# Render port
EXPOSE 10000

# Start server (Render injects $PORT)
CMD php -S 0.0.0.0:$PORT -t public