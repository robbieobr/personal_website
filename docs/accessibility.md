# Accessibility

This is a statement of how the site behaves today, not an audit report. Every claim below
is enforced by an automated test — see [Testing](#testing) — so it stays true as the code
changes rather than aging into a historical document.

## Themes

The appearance switcher in the header offers five palettes, each a full set of CSS custom
properties applied to `<html>` (`frontend/src/themes/index.ts`, applied by
`frontend/src/hooks/useTheme.ts`):

| Theme                                | Purpose                                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Light                                | Default palette                                                                                    |
| Dark                                 | Dark ground with a three-step elevation ladder (page, card, header/hero each a distinct luminance) |
| High contrast                        | Black text and chrome on white, yellow focus ring and accents                                      |
| Colour-blind friendly                | Blue/orange palette avoiding red-green and blue-yellow confusion pairs                             |
| Colour-blind friendly, high contrast | The colour-blind palette pushed to near-maximum contrast                                           |

The choice persists to `localStorage` under `portfolio-theme` and is restored on reload.
Each theme also sets the CSS `color-scheme` property, so native form controls (the theme
radios themselves included) render in a matching light or dark appearance rather than
defaulting to the browser's own scheme.

## Keyboard navigation

Every control — the skip link, the site-title link, the download button, both halves of
the language toggle, and the theme trigger and its radio panel — is reachable by keyboard
and shows a `:focus-visible` outline drawn from a `--color-focus-ring` token that changes
with the active theme (`frontend/src/App.css`). The theme panel closes on <kbd>Escape</kbd>
and returns focus to the button that opened it.

A skip link is the first focusable element on the page (`frontend/src/App.tsx`): off-screen
until focused, then fixed to the top-left corner with a visible outline. Its target,
`#main-content`, carries `tabIndex={-1}` so following it actually moves focus into the main
content rather than just scrolling to it — without that, Safari and Firefox leave
`document.activeElement` on `<body>`.

## Landmarks and headings

The page has exactly one `<header>`, one `<main>`, one `<aside>` (Skills and Achievements)
and one `<footer>` — no duplicated landmarks. Heading levels are one strict tree: the single
`<h1>` is the person's name (`frontend/src/components/UserProfile/UserProfile.tsx`); `<h2>`
marks each top-level section — About, Job History, Education, Projects, Skills,
Achievements; `<h3>` marks each entry within a section (a job title, a degree, a project
name). The site title in the header is a styled `<p>`, not a heading, so it doesn't compete
with the person's name for the page's one `<h1>`.

## Live region

A visually-hidden `role="status" aria-live="polite"` element stays mounted for the whole
lifetime of the profile page (`frontend/src/pages/ProfilePage.tsx`), and its text changes
as the page moves from loading to loaded — so a screen reader announces "Profile loaded"
rather than silently swapping skeleton placeholders for content. The element is present
from the first render; a region that only gets inserted at the same moment its text
arrives is unreliable in most screen readers, which is why this one stays in the tree
throughout. If the API call fails, the error message itself carries `role="alert"` so it
interrupts and is announced immediately.

## Reflow

The layout is built on CSS grid and flexbox with no fixed-width tracks: `minmax(0, 1fr)`
rather than a bare `1fr` on the two-column grid, and `min(…, 100%)` on the project card
track, specifically to avoid the horizontal scrollbar a bare `1fr` or a percentage-only
width would otherwise introduce at a 320px viewport (`frontend/src/pages/ProfilePage.css`,
`frontend/src/components/Projects/Projects.css`). The header's control cluster wraps at
600px rather than overflowing past the edge of a narrow viewport
(`frontend/src/App.css`).

## Motion

Interactive elements use short (0.2s) colour and background transitions on hover and
focus — there is no scroll-triggered, auto-playing or decorative animation on the page.
The codebase does not currently define a `prefers-reduced-motion` media query; because the
only motion is these brief state transitions rather than anything with the potential to
disorient, none is suppressed under that preference today.

## Contrast

Every theme is checked by axe-core's `color-contrast` rule (WCAG 2.1 AA — 4.5:1 for normal
text, 3:1 for large text) with zero violations required to pass. That's the bar the site
is built and tested against, not WCAG AAA's stricter 7:1: several tokens comfortably clear
AA without reaching it — the accessible teal used for headings and company names sits at
roughly 6.3:1 against the light background, muted text at roughly 5.1:1. Readers who need
AAA-level contrast have the high-contrast and colour-blind-high-contrast themes, both of
which use pure black or near-black text.

## Testing

`e2e/tests/a11y.spec.ts` is the enforcement mechanism behind every claim above. It runs
Playwright against a live instance of the app and:

- Runs an `AxeBuilder` scan with the `region` and `color-contrast` rules across all five
  themes and both locales (`en`, `ga`) — ten combinations in total — asserting no
  violations in any of them.
- Runs a separate scan tagged `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa` against the
  default theme and locale.
- Asserts the landmark and heading structure described above by element count, not by
  visual inspection.
- Drives focus with real keyboard events (`page.keyboard.press('Tab')`) and checks
  `:focus-visible` is actually active and an outline is actually rendered, rather than
  only checking that CSS rules exist.
- Aborts every `/api/*` request to force the error state and asserts the resulting element
  carries `role="alert"`.

Because these are assertions against rendered output rather than a document someone wrote
by hand, they fail the moment the behaviour they describe regresses.
