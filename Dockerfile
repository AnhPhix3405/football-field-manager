FROM node:20-alpine AS base

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Development

FROM base AS dev

RUN pnpm install --frozen-lockfile

COPY . .

CMD ["pnpm", "run", "start:dev"]

# Build

FROM base AS build

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# Production

FROM node:20-alpine AS prod

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist

CMD ["node", "dist/main.js"]
