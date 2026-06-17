# Michelin Hub

## Configuration

.env.local :
```
DATABASE_URL="mysql://<user>:<mdp>@127.0.0.1:3306/perpetuel?serverVersion=8.0l.32&charset=utf8mb4"
# Strava API
STRAVA_CLIENT_ID=000
STRAVA_SECRET=xxx
STRAVA_AUTH_REDIRECT_URL=http://localhost/exchange_token
```

```bash
# Crée un dossier de stockage des clés (si il n'existe pas déjà)
mkdir -p config/jwt

# Génère la clé privée
openssl genrsa -out config/jwt/private.pem -aes256 4096

# Génère la clé publique à partir de la clé privée
openssl rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem
```


## Installation

```bash
composer install

symfony console doctrine:database:create

symfony console doctrine:migrations:migrate

symfony server:start
```

## Fixtures

```bash
symfony console doctrine:fixtures:load
```

## Documentation API 

Une doc Swagger est disponible sur la route `/api`.


## Test

Commencez par mettre en place un `.env.test` :
```
KERNEL_CLASS='App\Kernel'
APP_SECRET='$ecretf0rt3st'

DATABASE_URL="mysql://<user>:<mdp>@127.0.0.1:3306/perpetuel?serverVersion=8.0l.32&charset=utf8mb4"
```

Pour lancer un test unitaire : 
```bash
php bin/phpunit .\tests\<chemin_vers_le_test>
```

Pour lancer un coverage : 
```bash
php bin/phpunit --coverage-text
```

Attention, le coverage nécessite d'avoir mis en place Xdebug.

php.ini :
```
xdebug.mode=debug,coverage
```