# Michelin Hub

## Installation

```bash
composer install
```

.env.local

```dotenv
DATABASE_URL="postgresql://app:!ChangeMe!@127.0.0.1:5432/app?serverVersion=16&charset=utf8"
```

```bash
php bin/console doctrine:database:create

php bin/console doctrine:migrations:migrate
```

```bash
php bin/console doctrine:fixtures:load
```

```bash
# Crée un dossier de stockage des clés (si il n'existe pas déjà)
mkdir -p config/jwt

# Génère la clé privée
openssl genrsa -out config/jwt/private.pem -aes256 4096

# Génère la clé publique à partir de la clé privée
openssl rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem
```

```bash
symfony server:start
```
