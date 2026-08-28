# Football Field Manager

REST API for football field management, built with [NestJS](https://nestjs.com), TypeORM and PostgreSQL.

## Prerequisites

- [Node.js](https://nodejs.org) >= 20
- [pnpm](https://pnpm.io) (`npm install -g pnpm`)
- [Docker](https://www.docker.com) with Docker Compose

## 1. Start the database (Docker Compose)

The `docker-compose.yml` starts a PostgreSQL 16 container (`football-postgres`) exposed on port **5433**.

```bash
docker compose up -d
```

Verify it is running:

```bash
docker compose ps
```

Stop it when done:

```bash
docker compose down
```

> To also delete the database data volume: `docker compose down -v`

## 2. Configure environment variables

Copy `.env.example` to `.env` if it exists, or use the provided `.env`. Key variables:

| Variable      | Description       | Default       |
| ------------- | ----------------- | ------------- |
| `DB_HOST`     | Database host     | `localhost`   |
| `DB_PORT`     | Database port     | `5433`        |
| `DB_USERNAME` | Database user     | `admin`       |
| `DB_PASSWORD` | Database password | `123456`      |
| `DB_DATABASE` | Database name     | `football_db` |

## 3. Install dependencies

```bash
pnpm install
```

## 4. Run database migrations

```bash
pnpm run migration:run
```

## 5. Run the app

```bash
# development (watch mode)
pnpm run start:dev

# production
pnpm run build
pnpm run start:prod
```

The API listens on **http://localhost:3000** (override with `PORT` in `.env`). All routes are prefixed with `/api/v1`.

- Swagger docs: http://localhost:3000/api/v1/docs

# Football Field Manager

## Database migrations

Migration files use `timestamp-kebab-case.ts`. For example:

`1787900000000-add-field-capacity.ts`

Create or generate a migration by supplying a kebab-case path:

```powershell
npm run migrate:create -- src/database/migrations/add-field-capacity
npm run migrate:generate -- src/database/migrations/add-field-capacity
npm run migrate:run
```

## Module database structure

`src/database` contains only database configuration, the TypeORM registry, enums, and migrations. Entity files belong to the module that owns their domain, and all names use `kebab-case`.

```text
src/
  database/
    data-source.ts
    database.enums.ts
    orm.registry.ts
    migrations/
  modules/
    fields/
      entities/field.entity.ts
      repositories/fields-read.repository.ts
      fields.service.ts
```

Repositories own database access and QueryBuilder/SQL composition. Services own validation, transactions, and business rules; controllers only handle HTTP concerns. Add new entity and repository files to the relevant module, never to `src/database`.
