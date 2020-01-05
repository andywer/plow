<h1 align="center">Plow</h1>
<p align="center">Postgres migrations & seeding made easy</p>

**⚠️ Not yet published**

Plow is a no-non-sense tool to quickly and easily apply database migrations and seed PostgresQL databases.

The migrations are managed using [`postgres-migrations`](https://www.npmjs.com/package/postgres-migrations).

## Installation

```
$ npm install plow
```

## Usage - Command line tool

```
Usage
  $ plow migrate ./migrations/*.sql
  $ plow seed ./seeds/*.sql

General options
  --help                Print this usage help
  --verbose             Enable more detailed logging
  --version             Print the installed plow version

Connection options
  --database <name>     Name of the database
  --host <host>         Database host, defaults to "localhost"
  --port <port>         Port the database listens on, defaults to 5432
  --user <name>         User name to authenticate as
  --password <password> Password to use for authentication

Environment variables
  You can also configure the connection using these environment variables.

  PGDATABASE, PGHOST, PGPASSWORD, PGPORT, PGUSER
```

## Usage - Docker

Use the `andywer/plow` docker image. You can add it to your `docker-compose.yml` file like this:

```
version: "3.7"
services:
  postgres:
    image: postgres:12-alpine
    environment:
      POSTGRES_PASSWORD: $PGPASSWORD
    ports:
      - 5432:5432
  db_seeder:
    image: andywer/plow:0.0.0
    depends_on:
      - postgres
    env_file: ./.env
    environment:
      PGHOST: postgres
    restart: "no"
    volumes:
      - ./migrations:/migrations
      - ./seeds:/seeds
```

Now every time you run `docker-compose up` your database will automatically have all migrations and seeds applied! 🚀

Note that we assume you have a local `migrations` and a `seeds` directory that we can mount into the container and that you have a `.env` file next to your docker-compose file:

```
PGDATABASE=postgres
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=postgres
```

The output of `docker-compose up` will look something like this:

```
$ docker-compose up
twitter-daily_postgres_1 is up-to-date
Creating twitter-daily_db_seeder_1 ... done
Attaching to twitter-daily_postgres_1, twitter-daily_db_seeder_1
...
postgres_1   | 2020-01-05 04:50:04.266 UTC [1] LOG:  database system is ready to accept connections
db_seeder_1  | Database migration done.
db_seeder_1  | Migrations run:
db_seeder_1  |   - create-migrations-table
db_seeder_1  |   - v0.1.0-initial
db_seeder_1  | Database seeded.
db_seeder_1  | Applied seeds:
db_seeder_1  |   (None)
twitter-daily_db_seeder_1 exited with code 0
```

## Migration files

Migration files can either be plain SQL files or JavaScript files. There are only up migrations, no down migrations – this is a design decision. Read more about it [here](https://www.npmjs.com/package/postgres-migrations).

A good scheme to name your migration files is:

```
<serial>-<version>-<description>.sql
```

So the very first migration file would be called `01-v0.1.0-initial.sql` or similar.

## Seed files

Seed files are supposed to be plain SQL files.

```
/* example.seed.sql */

INSERT INTO users
  (name, email, email_confirmed)
VALUES
  ('Alice', 'alice@example.org', TRUE);
```

## License

MIT
