# Frontend

React 18 + TypeScript + Vite application that renders the CV/profile page.

## Layout

| Path                  | Contents                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/pages/`          | Top-level page components (`ProfilePage.tsx`)                                                                       |
| `src/components/`     | Reusable UI (UserProfile, ContactInfo, JobHistory, EducationHistory, Projects, Skills, Achievements, ErrorBoundary) |
| `src/services/api.ts` | API client — native `fetch` with a 10s `AbortSignal.timeout`                                                        |
| `src/types/`          | Shared TypeScript interfaces                                                                                        |
| `src/i18n/`           | react-i18next config; English (`en`) and Irish Gaeilge (`ga`) locales                                               |
| `public/fonts/`       | Self-hosted fonts (no external font requests)                                                                       |
| `mock/`               | Standalone mock API server for backend-free development                                                             |
| `test/`               | Vitest + Testing Library tests, mirroring `src/`                                                                    |

## Commands

| Command                                         | Does                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                                   | Vite dev server on port 5173, proxying `/api` to `http://localhost:5000` |
| `npm run dev:mock`                              | Same, proxying `/api` to the mock server on port 5001 instead            |
| `npm run mock`                                  | Mock API server on port 5001 (run alongside `dev:mock`)                  |
| `npm run build`                                 | Production build to `build/`                                             |
| `npm run test` / `test:watch` / `test:coverage` | Vitest — see `docs/testing.md`                                           |
| `npm run typecheck`                             | `tsc --noEmit`                                                           |

All ways to run this alongside the rest of the stack — Docker, mock server, standalone — are in `docs/development.md`.

## More

- Running and choosing between dev setups: `docs/development.md`
- Tests, coverage gate, CI: `docs/testing.md`
- Architecture and API contract: `docs/architecture.md`
- Accessibility and i18n: `docs/accessibility.md`, `docs/internationalisation.md`
