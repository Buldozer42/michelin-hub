# Michelin Hub

## Sommaire

- [Michelin Hub](#michelin-hub)
  - [Sommaire](#sommaire)
  - [Prerequis](#prerequis)
  - [Configuration](#configuration)
    - [1) Variables d'environnement](#1-variables-denvironnement)
    - [2) Cles JWT](#2-cles-jwt)
  - [Installation et lancement local](#installation-et-lancement-local)
  - [Lancement avec Docker Compose PostgreSQL](#lancement-avec-docker-compose-postgresql)
  - [Jeu de donnees de dev fixtures](#jeu-de-donnees-de-dev-fixtures)
  - [Documentation API](#documentation-api)
  - [Principaux endpoints](#principaux-endpoints)
  - [Tests](#tests)
    - [Configuration test](#configuration-test)
    - [Lancer les tests](#lancer-les-tests)

## Prerequis

- PHP 8.2+
- Composer
- OpenSSL (generation des cles JWT)
- Une base de donnees:
	- MySQL/MariaDB (usage local classique)
	- ou PostgreSQL via Docker Compose
- Optionnel: Symfony CLI

## Configuration

### 1) Variables d'environnement

Creez un fichier `.env.local` a la racine du projet:

```dotenv
# Exemple MySQL local
DATABASE_URL="mysql://<user>:<mot_de_passe>@127.0.0.1:3306/michelin-hub?serverVersion=8.0.32&charset=utf8mb4"

# Strava
STRAVA_CLIENT_ID=00000
STRAVA_SECRET=xxxxxxxxxxxxxxxx
STRAVA_AUTH_REDIRECT_URL=http://localhost/api/strava/token/exchange
```

Notes:

- Adaptez `serverVersion` a votre version reelle (MySQL, MariaDB ou PostgreSQL).
- La redirection Strava doit correspondre a celle configuree dans votre application Strava.

### 2) Cles JWT

La config JWT utilise par defaut:

- `JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem`
- `JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem`
- `JWT_PASSPHRASE` (dans vos variables d'environnement)

Generez les cles:

```bash
mkdir -p config/jwt
openssl genrsa -out config/jwt/private.pem -aes256 4096
openssl rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem
```

Puis ajoutez la passphrase dans `.env.local`:

```dotenv
JWT_PASSPHRASE=mettre_la_meme_passphrase_que_lors_de_la_generation
```

## Installation et lancement local

```bash
composer install
php bin/console doctrine:database:create --if-not-exists
php bin/console doctrine:migrations:migrate -n
symfony server:start
```

Sans Symfony CLI:

```bash
php -S 127.0.0.1:8000 -t public
```

## Lancement avec Docker Compose PostgreSQL

Le fichier `compose.yaml` fournit un service PostgreSQL.

1. Demarrer la base:

```bash
docker compose up -d database
```

2. Definir un `DATABASE_URL` PostgreSQL dans `.env.local`:

```dotenv
DATABASE_URL="postgresql://app:!ChangeMe!@127.0.0.1:5432/app?serverVersion=16&charset=utf8"
```

3. Appliquer les migrations:

```bash
php bin/console doctrine:migrations:migrate -n
```

## Jeu de donnees de dev fixtures

```bash
php bin/console doctrine:fixtures:load
```

Pour eviter une confirmation interactive:

```bash
php bin/console doctrine:fixtures:load -n
```

## Documentation API

Documentation Swagger UI:

- [http://localhost:8000/api](http://localhost:8000/api)

Le prefixe des routes API Platform est `/api`.

## Principaux endpoints

Les routes suivantes sont exposees via API Platform:

- `POST /api/register` : inscription utilisateur
- `POST /api/login` : connexion (retourne un JWT)
- `GET /api/challenges` : liste des challenges
- `GET /api/challenges/{id}` : detail challenge
- `POST /api/challenges` : creation challenge (ROLE_ADMIN)
- `PATCH /api/challenges/{id}` : edition challenge (ROLE_ADMIN)
- `POST /api/challenges/{id}/participate` : participer a un challenge (ROLE_USER)
- `GET /api/authorize?scope=activity:read` : URL d'autorisation Strava
- `POST /api/strava/token/exchange` : echange code OAuth -> tokens
- `POST /api/strava/token/refresh` : refresh token Strava
- `POST /api/activity/sync` : synchronisation des activites Strava

Exemple d'en-tete pour les routes protegees:

```http
Authorization: Bearer <jwt>
```

## Tests

### Configuration test

Le fichier `.env.test` doit au minimum contenir:

```dotenv
KERNEL_CLASS='App\Kernel'
APP_SECRET='$ecretf0rt3st'
DATABASE_URL="mysql://<user>:<mot_de_passe>@127.0.0.1:3306/michelin-hub_test?serverVersion=8.0.32&charset=utf8mb4"
```

### Lancer les tests

Tous les tests:

```bash
php bin/phpunit
```

Test cible:

```bash
php bin/phpunit tests/Controller/Security/LoginControllerTest.php
```

Avec coverage:

```bash
php bin/phpunit --coverage-text
```

Le coverage necessite Xdebug. Exemple dans `php.ini`:

```ini
xdebug.mode=debug,coverage
```