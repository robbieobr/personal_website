---
name: add-translation
description: Add a translation key to both en.json and ga.json locale files simultaneously, preventing key drift between locales
disable-model-invocation: true
---

Add a new i18n translation key to both locale files for this project. Follow these steps:

1. Read `frontend/src/i18n/locales/en.json` and `frontend/src/i18n/locales/ga.json`.
2. If not already provided, ask the user for:
   - The dot-notation key path (e.g. `profile.location` or `errors.notFound`)
   - The English value
   - The Irish (Gaeilge) value — if the user doesn't have a translation, insert the English value prefixed with `[GA] ` as a placeholder
3. Insert the key at the correct nested location in **both** files, preserving the existing structure and sort order of sibling keys.
4. Validate that the resulting JSON in both files is structurally identical (same keys, same nesting).
5. Report which key was added and flag any `[GA]` placeholders that still need a real translation.

Important: Always edit both files in the same response — never update one without the other.
