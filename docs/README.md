# Documentation

Every documentation page for this project, and the question each one answers. Each fact lives on
exactly one page; the rest link to it.

## Start here

| Page                                  | Answers                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| [Getting started](getting-started.md) | What do I install, how do I run it the first time, and what do I do when it does not come up? |
| [Architecture](architecture.md)       | What are the moving parts, and what happens to a request between the browser and MySQL?       |
| [Contributing](contributing.md)       | How do I name a branch, write a commit, and get the checks to pass?                           |

## Working on the code

| Page                                            | Answers                                                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [Development](development.md)                   | How do I run the frontend and backend outside Docker, with hot reload or the mock API?                      |
| [Testing](testing.md)                           | What suites exist — unit, end-to-end, SEO — and how do I run each of them?                                  |
| [Database](database.md)                         | How do migrations, the three seed profiles and the init directories fit together, and how do I add a table? |
| [Internationalisation](internationalisation.md) | How do the English and Irish interfaces work, and how do I add a key or a language?                         |
| [Accessibility](accessibility.md)               | What does the site guarantee for keyboard, screen-reader and low-vision users, and how is that enforced?    |

## Running it in production

| Page                              | Answers                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| [Configuration](configuration.md) | Which environment variable does what, which file sets it, and what happens if it is missing?                   |
| [Deployment](deployment.md)       | How do I get this onto a public domain with automatic HTTPS?                                                   |
| [Operations](operations.md)       | How do I watch the live site, read its logs, back it up and recover it?                                        |
| [Security](security.md)           | What are the controls — headers, CSP, rate limits, the read-only database user — and where is each configured? |
| [SEO](seo.md)                     | How are the document head, `robots.txt`, `sitemap.xml` and the social card generated?                          |

## Reference, next to the code

| Page                                          | Answers                                                         |
| --------------------------------------------- | --------------------------------------------------------------- |
| [`database/SCHEMA.md`](../database/SCHEMA.md) | What columns, types, keys and constraints does each table have? |
| [`database/README.md`](../database/README.md) | What is in the `database/` directory and what is each file for? |
| [`backend/README.md`](../backend/README.md)   | What API endpoints exist and what does each return?             |
| [`frontend/README.md`](../frontend/README.md) | How is the React application laid out?                          |

The repository [README](../README.md) is the landing page: what the project is, the stack, and a
quickstart. It deliberately holds nothing that is written here.
