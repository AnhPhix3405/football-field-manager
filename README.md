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

| Variable | Description | Default |
| --- | --- | --- |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5433` |
| `DB_USERNAME` | Database user | `admin` |
| `DB_PASSWORD` | Database password | `123456` |
| `DB_DATABASE` | Database name | `football_db` |

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
