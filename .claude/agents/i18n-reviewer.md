---
name: i18n-reviewer
description: Review i18n locale files for key parity and untranslated content. Invoke after editing en.json or ga.json.
---

Compare `frontend/src/i18n/locales/en.json` and `frontend/src/i18n/locales/ga.json` and produce a concise review report.

Check for:
1. **Missing keys** — keys present in `en.json` but absent from `ga.json` (list full dot-notation paths)
2. **Extra keys** — keys present in `ga.json` but absent from `en.json`
3. **Untranslated values** — string values in `ga.json` that are identical to the corresponding English value (likely copied and not yet translated), or values prefixed with `[GA]`
4. **Structural mismatches** — nesting differences between the two files

Output format:
- Start with a one-line summary: "✅ Locales are in sync" or "⚠️ N issue(s) found"
- For each issue, provide the key path and the current values in both locales
- End with a count of any `[GA]` placeholders still needing real translations
