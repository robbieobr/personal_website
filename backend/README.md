# Backend

Express + TypeScript API server, following Routes → Controllers → Models → Database.

## Layout

| Path                     | Contents                                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/`            | Endpoint definitions (`/api/users`, `/api/contact-info`, `/api/jobs`, `/api/education`, `/api/projects`, `/api/skills`, `/api/achievements`) |
| `src/controllers/`       | Request handling and input validation                                                                                                        |
| `src/models/`            | Parameterized SQL queries via the MySQL connection pool                                                                                      |
| `src/config/database.ts` | MySQL connection pool (limit: 10)                                                                                                            |
| `test/`                  | Vitest tests, mirroring `src/`                                                                                                               |

Error responses are generic; details are logged server-side only.

## Commands

| Command                                         | Does                                          |
| ----------------------------------------------- | --------------------------------------------- |
| `npm run dev`                                   | `tsx watch` on port 5000, auto-reload on save |
| `npm run build`                                 | Compile TypeScript to `dist/`                 |
| `npm run start`                                 | Run the compiled `dist/index.js`              |
| `npm run test` / `test:watch` / `test:coverage` | Vitest — see `docs/testing.md`                |
| `npm run typecheck`                             | `tsc --noEmit`                                |

Needs a reachable MySQL and a `.env` (copy `backend/.env.example`) to run standalone. Every way to run this alongside the rest of the stack is in `docs/development.md`.

## More

- Running and choosing between dev setups: `docs/development.md`
- Tests, coverage gate, CI: `docs/testing.md`
- Schema, migrations, seed profiles: `docs/database.md`
- API contract and architecture: `docs/architecture.md`
- Environment variables: [Configuration](../docs/configuration.md)
