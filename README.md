# Sambahamphe Community Platform

Digital heritage platform for **Sambahamphe Utthan Sangh**: genealogy of the Sambahamphe line, the organization's boards and committees, heritage articles, events and media archives.

- **Design and decisions:** [`docs/`](docs/), starting with [requirements](docs/product/requirements.md) and the [system design](docs/architecture/system-design.md).
- **Coding rules:** [`CLAUDE.md`](CLAUDE.md). They apply to humans and AI assistants alike.

## Prerequisites

- Node.js 24 (`nvm use` reads `.nvmrc`)
- pnpm 10 (`corepack enable`)
- Docker Desktop

## Getting started

```bash
pnpm install        # installs dependencies and git hooks
pnpm infra:up       # starts Postgres, Redis, S3 storage and Mailpit; waits until healthy
```

| Service | Address | Notes |
|---|---|---|
| Postgres 17 | `localhost:5432` | user / password / database: `sambahamphe` |
| Redis 7.4 | `localhost:6379` | |
| S3 storage (SeaweedFS) | `http://localhost:8333` | stands in for Cloudflare R2 |
| Mailpit | SMTP `localhost:1025`, inbox UI http://localhost:8025 | catches every email sent in development |

If a port is already taken on your machine (e.g. a local Redis on 6379), copy `.env.example` to `.env` and change that port; Docker Compose reads it automatically and git ignores it.

`pnpm infra:down` stops the services; data persists in Docker volumes.

Then:

```bash
cp apps/api/.env.example apps/api/.env   # set IP_HASH_SECRET (openssl rand -hex 32)
pnpm db:migrate
pnpm dev
```

| App | Address |
|---|---|
| Public site | http://localhost:3000 |
| Admin CMS | http://localhost:3002 (needs an account with a role; the first one via `pnpm --filter api admin:bootstrap --email …`) |
| API + docs | http://localhost:3001, http://localhost:3001/api/docs |
| Emails sent in development | http://localhost:8025 (Mailpit) |

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm dev` | Run everything in watch mode: API (:3001), worker, public site (:3000), admin (:3002) |
| `pnpm lint` | ESLint across workspaces |
| `pnpm format` / `pnpm format:write` | Check / fix formatting (Prettier) |
| `pnpm check` | Auto-fix formatting and lint issues |
| `pnpm typecheck` | TypeScript across workspaces |
| `pnpm test` | Tests across workspaces |

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat(genealogy): add branch access requests`); a git hook checks this. Pushing runs lint and format checks first.
