# Testing

Four independent test suites cover this project: frontend unit/component tests, backend unit tests, a Python tool's own tests, and Playwright end-to-end tests. This page covers what each checks, how to run it, and what CI requires before a PR can merge.

## Suites

| Suite                | Count                   | Command                         | Coverage gate                           |
| -------------------- | ----------------------- | ------------------------------- | --------------------------------------- |
| Frontend (Vitest)    | 126 tests               | `cd frontend && npm run test`   | 90% lines/branches/functions/statements |
| Backend (Vitest)     | 87 tests                | `cd backend && npm run test`    | 90% (currently at 100%)                 |
| `tools/seo` (pytest) | 17 tests                | `python -m pytest tools/seo`    | none enforced                           |
| Playwright e2e       | 110 tests, 6 spec files | `cd e2e && npx playwright test` | none — pass/fail only                   |

Counts above were verified by running each suite against this branch.

### Frontend

`frontend/test/` mirrors `frontend/src/`: component tests, `services/api.test.ts` (the fetch client), `utils/date.test.ts` (UTC date formatting), and a full-page test for `pages/ProfilePage.tsx`. Uses jsdom, Testing Library and Vitest.

```bash
cd frontend
npm run test            # run once
npm run test:watch      # watch mode
npm run test:coverage   # with coverage; fails if any metric drops below 90%
```

Run a single file or test by path or name pattern:

```bash
npx vitest run test/services/api.test.ts
npx vitest run -t "renders the user profile"
```

### Backend

`backend/test/` covers controllers, models, config (including the database pool), and utility parsers, all against `node` environment (no real MySQL — the pool is mocked).

```bash
cd backend
npm run test
npm run test:coverage   # fails below 90%; currently reports 100% on all four metrics
```

Single file:

```bash
npx vitest run test/models/index.test.ts
```

### `tools/seo`

`tools/seo/generate_seo.py` and `tools/seo/og_image.py` generate the production SEO artefacts (document head, `robots.txt`, `sitemap.xml`, `og-image.png`) at build time, from a `SITE_URL` and a MySQL seed file — see `docs/seo.md` for what they produce. `tools/seo/test_seo.py` tests that generator directly, without Docker: it covers omitting artefacts when no real domain or seed is present, the generated head and JSON-LD, apostrophe-escaping in names, idempotent reruns, and the social card's safe-margin layout. 10 test functions, 3 of them parametrized, run as 17 test cases.

```bash
python -m pip install --requirement tools/seo/requirements.txt pytest
python -m pytest tools/seo
```

Single test:

```bash
python -m pytest tools/seo/test_seo.py::TestGeneratedArtefacts::test_describes_the_person_in_json_ld
```

### Playwright e2e

`e2e/tests/` holds six spec files, run against `http://localhost:3000` (`E2E_BASE_URL` to override):

| File                              | What it covers                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `smoke.spec.ts`                   | App shell, landmarks, skip link, profile data loads — the broadest safety net                                                                                                                                                                                                                                                                      |
| `profile.spec.ts`                 | Each profile section (contact info, job history, education, projects, skills, achievements) renders its content                                                                                                                                                                                                                                    |
| `language.spec.ts`                | English/Irish (`ga`) locale switching                                                                                                                                                                                                                                                                                                              |
| `print.spec.ts`                   | `@media print` layout rules across every section's stylesheet                                                                                                                                                                                                                                                                                      |
| `a11y.spec.ts`                    | WCAG fixes from the accessibility audit (`docs/accessibility/`), plus an automated axe-core scan, across all five themes                                                                                                                                                                                                                           |
| `docker-production-build.spec.ts` | Builds the real production Docker image (`frontend/Dockerfile`, `production` target) from an exported copy of the tracked tree and asserts the generated SEO artefacts land in the image; also asserts nothing is written when no deployment seed is present, and that the generator, its Python inputs, and the Caddyfile never ship in the image |

Most specs need the Docker stack running first:

```bash
docker compose up   # in another terminal
cd e2e
npx playwright install --with-deps chromium   # first time only
npx playwright test tests/smoke.spec.ts
```

`docker-production-build.spec.ts` is the exception — it drives the Docker daemon directly and needs no running stack and no browser. It builds and removes its own tagged images; each test.describe run gets up to 15 minutes to allow for a cold image build.

```bash
cd e2e
npx playwright test tests/docker-production-build.spec.ts
```

Playwright UI/debug modes, from the repo root:

```bash
npm run test:e2e:ui       # interactive UI mode
npm run test:e2e:headed   # headed browser
```

## What CI runs

`.github/workflows/pr-tests.yml` runs on pull requests targeting `main`, `feat/**`, `chore/**`, or `fix/**`. Six jobs, all required to merge:

| Job                | Runs                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------- |
| `static-checks`    | `npm run lint`, `npm run format:check`, `npm run typecheck` for frontend and backend    |
| `backend-tests`    | `npm run test:coverage --workspace=backend`, then `npm run build --workspace=backend`   |
| `frontend-tests`   | `npm run test:coverage --workspace=frontend`, then `npm run build --workspace=frontend` |
| `seo-tests`        | `python -m pytest tools/seo` (Python 3.13)                                              |
| `production-image` | `docker-production-build.spec.ts` only                                                  |
| `e2e-smoke`        | Starts `docker compose up`, waits for the frontend, then `smoke.spec.ts` only           |

`profile.spec.ts`, `language.spec.ts`, `print.spec.ts` and `a11y.spec.ts` exist and run locally against the Docker stack, but are not part of the required CI jobs.

CI installs once from the root lockfile (`npm ci`, no per-workspace installs) — the same lockfile the two Dockerfiles' own `npm ci` resolves against.

## Before merging

Locally, the closest equivalent to the full required CI set:

```bash
npm run lint
npm run format:check
npm run typecheck --workspace=frontend
npm run typecheck --workspace=backend
npm run test:coverage --workspace=frontend
npm run test:coverage --workspace=backend
python -m pytest tools/seo
cd e2e && npx playwright test tests/docker-production-build.spec.ts
```

Plus `smoke.spec.ts` against a running `docker compose up` stack.
