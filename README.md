# Personal Website

Robbie O'Brien's CV, served as a full-stack application. A React single-page frontend renders one
person's profile — job history, education, projects, skills, achievements and contact links — from
a read-only JSON API backed by MySQL. It ships as a Docker Compose stack: MySQL, an Express API, and
an nginx image built from the compiled frontend, with Caddy terminating TLS in front of it in
production. The site has five colour themes, English and Irish interfaces, a print stylesheet that
turns the page into a CV, and SEO artefacts generated at image-build time from the deployment's own
domain and data.

## Stack

| Layer         | Technology                                                      |
| ------------- | --------------------------------------------------------------- |
| Runtime       | Node 24, npm workspaces (`frontend`, `backend`, `e2e`)          |
| Frontend      | React 18.3, TypeScript 5.9, Vite 7.3, i18next 26                |
| Backend       | Express 5.2, TypeScript 5.9, mysql2 3.24, helmet 8              |
| Database      | MySQL 8.0                                                       |
| Edge          | nginx (static + API proxy), Caddy 2 (TLS, headers, compression) |
| Build tooling | Docker Compose, Python 3.13 for the SEO stage                   |
| Tests         | Vitest 4 (unit), Playwright 1.62 (end-to-end), pytest           |

## Quickstart

You need Docker with Compose v2.24 or newer. Nothing else.

```bash
git clone https://github.com/robbieobr/personal_website.git
cd personal_website
cp .env.example .env
docker compose up -d
```

Open <http://localhost:3000>. The API is on <http://localhost:5000/api> and answers
<http://localhost:5000/api/health> once MySQL has finished initialising.

`docker compose down` stops the stack; `docker compose down -v` also drops the database volume so
the seed data is loaded again from scratch.

For the two other seed profiles and what to do when the first run does not come up, see
[Getting started](docs/getting-started.md). To run the pieces outside Docker, see
[Development](docs/development.md).

## Documentation

| Page                                                 | Answers                                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| [Getting started](docs/getting-started.md)           | How do I run it for the first time, and what if it does not start?         |
| [Architecture](docs/architecture.md)                 | How do the pieces fit together, and where does a request go?               |
| [Configuration](docs/configuration.md)               | Which environment variable does what, and which file sets it?              |
| [Development](docs/development.md)                   | How do I work on the frontend or the backend day to day?                   |
| [Testing](docs/testing.md)                           | What test suites exist and how do I run them?                              |
| [Database](docs/database.md)                         | How are migrations, seeds and the schema organised?                        |
| [Deployment](docs/deployment.md)                     | How do I put this on a public domain with HTTPS?                           |
| [Operations](docs/operations.md)                     | How do I run, watch and recover the live site?                             |
| [Security](docs/security.md)                         | What protects the site, and where is each control configured?              |
| [SEO](docs/seo.md)                                   | How are the head tags, robots.txt, sitemap and social card produced?       |
| [Accessibility](docs/accessibility.md)               | What accessibility guarantees does the site make, and how are they tested? |
| [Internationalisation](docs/internationalisation.md) | How do the English and Irish interfaces work, and how do I add a language? |
| [Contributing](docs/contributing.md)                 | What conventions and checks apply to a change?                             |

Start at [docs/README.md](docs/README.md) for the full index. Reference material lives with the
code it describes: [`database/SCHEMA.md`](database/SCHEMA.md) for table definitions,
[`backend/README.md`](backend/README.md) for the API endpoints, and
[`frontend/README.md`](frontend/README.md) for the component layout.

## Licence

Apache License 2.0. See [LICENSE](LICENSE).
