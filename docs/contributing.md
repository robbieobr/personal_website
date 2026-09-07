# Contributing

The conventions a change has to follow here, and how to satisfy them before you open a pull
request.

## Before anything

Install once, from the repository root:

```bash
nvm use          # reads .nvmrc — Node 24
npm ci
```

This is an npm workspaces monorepo: one root `package-lock.json` covers `frontend`, `backend` and
`e2e`. Install from the root, not from inside a workspace — that is what both Dockerfiles and every
CI job do, and it is what keeps your tree identical to the one they test.

## Branches

Cut every branch from the branch you intend to merge into, and give it a Conventional Commits type
as its prefix:

| Prefix   | For                                                    | Example                   |
| -------- | ------------------------------------------------------ | ------------------------- |
| `feat/`  | New behaviour a user or operator can see               | `feat/theme-picker`       |
| `fix/`   | Correcting behaviour that is wrong                     | `fix/utc-job-dates`       |
| `chore/` | Dependencies, tooling, config, docs, repository upkeep | `chore/dependabot-docker` |

The prefix is load-bearing, not decorative. `.github/workflows/pr-tests.yml` triggers on pull
requests into `main`, `feat/**`, `chore/**` and `fix/**`. A pull request that targets a branch
outside that set runs **no checks at all** — which matters here, because work is stacked: a branch
usually targets the integration branch below it rather than `main`, and an unmatched base leaves
every pull request in the stack unvalidated until the one under it merges.

Keep a branch to one subject. If a stack is long, each pull request targets the one below it, and
the base branch itself is named `feat/…`, `chore/…` or `fix/…` so the stack stays covered.

## Commits

Conventional Commits, with an optional scope, and a subject written in the imperative:

```
type(scope): do the thing

fix(dates): read and format job dates in UTC
feat(seo): add a standalone SEO generator under tools/seo
build(docker): run the SEO generator in its own image stage
refactor(seo): keep tracking between glyphs, not after the last one
```

Types in use: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `revert`.
Scopes are free-form and name the area touched — `frontend`, `backend`, `db`, `seo`, `docker`,
`dates`, `print`, `deps`. Lower case, no trailing full stop, and the subject says what the commit
does, not what you did to produce it.

Use the body for the reasoning that will not be obvious from the diff. Reasoning about _the code_
belongs in the code; reasoning about _the change_ belongs here.

## Comments describe the code, not its history

This is the one convention worth stating on its own, because it is easy to violate without noticing.

A comment explains how the code in front of you works and why it has to work that way. It never
records the change that produced it, the review that prompted it, or what the code used to be.
Someone reading this file in a year has no access to that context and no use for it.

```ts
// Wrong — records a review, not the code
// Changed after review: we were using $proxy_add_x_forwarded_for here.

// Right — explains the code that is there
// real_ip_header above already resolved $remote_addr to the client, so
// $proxy_add_x_forwarded_for would append it to the header it came from.
```

Banned in comments: "originally", "we changed", "after review", "used to", "TODO", and any
reference to a pull request or a reviewer. If a constraint only makes sense with history, state the
constraint, not the history.

## Code style

Formatting is Prettier's job and linting is ESLint's; neither is a matter of taste.

| Command                | Does                                                     |
| ---------------------- | -------------------------------------------------------- |
| `npm run format`       | Rewrites the tree with Prettier                          |
| `npm run format:check` | Fails if anything is unformatted — this is the CI check  |
| `npm run lint`         | ESLint across every workspace, from the root flat config |

Prettier is configured in `.prettierrc`: single quotes, semicolons, two-space indent, ES5 trailing
commas, 100-column lines. ESLint's flat config in `eslint.config.js` applies
`typescript-eslint` recommended rules everywhere, adds the React and React Hooks plugins to
`frontend/src`, and ends with `eslint-config-prettier` so no lint rule argues with the formatter.
`@typescript-eslint/no-explicit-any` is a warning; unused variables are an error unless prefixed
with `_`.

Prettier formats Markdown too, so documentation changes are subject to `format:check` like anything
else.

## The checks a pull request must pass

`.github/workflows/pr-tests.yml` runs six jobs. All of them must be green.

| Job                          | Runs                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Lint, Format & Typecheck** | `npm run lint`, `npm run format:check`, then `npm run typecheck` in the frontend and backend workspaces                              |
| **Backend Tests**            | `npm run test:coverage --workspace=backend`, then `npm run build --workspace=backend`                                                |
| **Frontend Tests**           | `npm run test:coverage --workspace=frontend`, then `npm run build --workspace=frontend`                                              |
| **SEO Tool Tests**           | `python -m pytest tools/seo` on Python 3.13                                                                                          |
| **Production Image Build**   | `npx playwright test tests/docker-production-build.spec.ts` from `e2e/` — builds the real production image and inspects its web root |
| **E2E Smoke Tests**          | `docker compose up -d`, then `npm test -- tests/smoke.spec.ts` from `e2e/`                                                           |

Both coverage jobs enforce a **90% threshold on lines, functions, branches and statements**
(`frontend/vite.config.ts` and `backend/vitest.config.ts`). Coverage below it fails the job, so new
code arrives with its tests.

A seventh workflow, `e2e-full.yml`, runs the whole Playwright suite on every push to `main` and on
manual dispatch. It does not gate pull requests, but it will catch you afterwards.

## Running it all locally

The static checks and unit tests need nothing but the install above:

```bash
npm run lint
npm run format:check
npm run typecheck --workspace=frontend
npm run typecheck --workspace=backend
npm run test --workspace=frontend      # 126 tests
npm run test --workspace=backend       # 87 tests
```

Add `--coverage` — or use `test:coverage` — when you want the thresholds applied as CI applies them.

The end-to-end suite drives a running stack, so start one first:

```bash
docker compose up -d
npx playwright install --with-deps chromium   # once, from e2e/
npm run test:e2e                               # 110 tests, from the root
```

`npm run test:e2e:headed` and `npm run test:e2e:ui` are the same suite with a visible browser and
with Playwright's UI mode. The Playwright config expects the stack on <http://localhost:3000>;
override with `E2E_BASE_URL`.

The SEO tests need Python 3.13 and the tool's own dependencies:

```bash
python -m pip install --requirement tools/seo/requirements.txt pytest
python -m pytest tools/seo                     # 17 cases
```

[Testing](testing.md) describes what each suite covers; [Development](development.md) covers the
day-to-day loop.

## Opening the pull request

`.github/pull_request_template.md` asks for three things: what the change does, how to test it, and
screenshots where the change is visual. Fill in the first two; delete the third when it does not
apply.

Two habits that save a round trip:

- Run `npm run format` before you push. Unformatted Markdown fails the same job as unformatted
  TypeScript.
- Check the base branch. If it is not `main`, `feat/**`, `chore/**` or `fix/**`, no check will run
  and the green tick you are looking at means nothing.

## Changing the database

Schema changes are not applied by a runner — the MySQL image executes its init directory once, when
the volume is created. A new migration therefore has to be copied into every init path, or it will
exist in some environments and not others:

1. `database/migrations/NNN_<description>.sql` — the source of truth.
2. `database/init/minimal/` and `database/init/full/` — the pre-combined directories the compose
   overrides mount.
3. `database/prod-initdb.d/` — production.
4. Seed data for the profiles that need it, under `database/seeds/`.

Then `docker compose down -v && docker compose up -d` to apply it to a fresh database.
[Database](database.md) has the numbering rules and the full procedure.
