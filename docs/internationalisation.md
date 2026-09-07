# Internationalisation

The interface has two locales, English (`en`) and Irish Gaeilge (`ga`), switched at
runtime with no page reload. This page covers how that switch works and the two places
its implementation is easy to get wrong.

## How it works

`frontend/src/i18n/config.ts` initialises `i18next` with `react-i18next`, loading both
locale files directly as bundled JSON — `frontend/src/i18n/locales/en.json` and
`frontend/src/i18n/locales/ga.json` — rather than fetching them at runtime. Every UI
string in `App.tsx` and its child components is looked up with `t('key')` against
whichever locale is active.

The language toggle in the header (`frontend/src/App.tsx`) is a two-button segmented
control rather than a `<select>`: with exactly two options it's one click instead of two,
and it avoids the platform's own grey dropdown chrome appearing inside the site's navy
header bar. Choosing a language calls `i18n.changeLanguage(code)`, which re-renders every
`t()` call in the tree.

`<html lang>` tracks the active language through an effect that sets
`document.documentElement.lang = i18n.language` whenever it changes. Without this, the
document stays `lang="en"` regardless of the selected UI language, and a screen reader
reads Irish text through an English speech synthesiser.

## CV content stays English

Only the interface chrome — labels, buttons, the loading and error text, the theme and
language names — is translated. The CV content itself (name, job title, bio, job history,
education, project and skill text) comes from the database and is not translated; it
renders in English regardless of which locale is active. `UserProfile.tsx` marks this
explicitly by setting `lang="en"` on the name, title and bio elements, and each list
component (`JobHistory.tsx`, `EducationHistory.tsx`, `Projects.tsx`, `Achievements.tsx`)
does the same on its entry titles — so a screen reader announces that content in an
English voice even while the surrounding chrome is in Irish. Switching to `ga` changes the
labels around the CV, not the CV.

## Formatting Irish dates

Job, education and achievement dates are formatted by `frontend/src/utils/date.ts`, which
looks up month names from a bundled table for locales the runtime's own ICU data doesn't
cover:

```ts
const MONTH_NAMES: Readonly<Record<string, readonly string[]>> = {
  ga: ['Eanáir', 'Feabhra', 'Márta' /* … */],
};
```

Browsers ship no `ga` (Irish) ICU locale data. Calling `toLocaleDateString('ga', { month:
'long' })` in a browser doesn't throw or fall back visibly — it silently renders English
month names, because `Intl.DateTimeFormat.supportedLocalesOf(['ga'])` returns an empty
array and the formatter falls back to its default locale. `date.ts` checks that same
`supportedLocalesOf` call itself (`isUnsupportedLocale`) and, when it comes back empty,
formats from the bundled table instead of trusting `Intl`.

This is why the table has to stay. Node's full-ICU build — the one this project's test
runner uses — _does_ resolve `ga`, so `toLocaleDateString('ga', ...)` under Node returns
correct Irish month names without any help. A test that exercises the code path naively
would pass under Node and still ship a browser bug, because the two runtimes disagree
about `ga` support. `frontend/test/utils/date.test.ts` accounts for this by stubbing
`Intl.DateTimeFormat.supportedLocalesOf` to return `[]`, reproducing browser conditions
under Node so the table path is actually exercised:

```ts
vi.spyOn(Intl.DateTimeFormat, 'supportedLocalesOf').mockReturnValue([]);
expect(formatDate('2021-08-01', 'ga')).toBe('Lúnasa 2021');
```

Removing `MONTH_NAMES` on the reasoning that "`Intl` handles it" will pass locally and in
CI under Node, and silently show English month names to Irish-locale visitors in every
browser.

## Dates are formatted in UTC

The backend API serialises MySQL `DATE` columns as midnight UTC. Formatting that value in
the visitor's local time zone shifts the date backwards by a day for anyone west of UTC —
a `2014-07-01` job start date reads as June 2014 rather than July for a visitor in, say,
New York. `formatDate` reads the month, year and (where relevant) locale month name from
the UTC fields of the `Date` object, and passes `timeZone: 'UTC'` to `Intl.DateTimeFormat`
on the code path that does use it, so every visitor sees the same month regardless of
their own time zone offset.
