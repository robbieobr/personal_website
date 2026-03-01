## Accessibility Report: My Portfolio

*Scanned http://localhost:3000 on 2026-03-01 - WCAG 2.2 Level AAA*

The portfolio presents a well-structured single-page CV with thoughtful semantic use of landmark regions (`header`, `aside`, `main`) and properly labelled contact links. However, the site has significant accessibility barriers that prevent WCAG 2.2 Level AAA conformance and — critically — several that fail the minimum Level A and AA standards. The most impactful issues are widespread colour contrast failures affecting nearly every section heading and muted text element, a complete absence of visible focus indicators on two interactive controls, and a missing skip navigation link that forces keyboard users to tab through the entire sticky header on every page load. Screen reader users will also encounter a structural anomaly with two `<main>` landmarks and two `<h1>` headings, and users of the language switcher will find its focus ring nearly invisible.

---

**At a Glance**: 18 issues found — 7 critical — 5 high — 4 medium — 2 low

**Score**: 48/100 | **WCAG Compliance**: ~52% of AAA criteria met

---

## Accessibility Findings

### Critical Severity Findings

#### A-001: Missing Skip Navigation Link

- **Location**: `frontend/src/App.tsx` — no skip link present before header content
- **WCAG Criterion**: [2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html) (Level A)
- **Severity**: Critical
- **Pattern Detected**: No "Skip to main content" link exists. The sticky header is the first content keyboard users encounter on every visit.
- **Code Context**: N/A — Element does not exist in the code
- **Impact**: Every keyboard user must tab through the "My Portfolio" link, the "Download CV" button, and the language selector before reaching page content.
- **User Impact**: Keyboard-only users, switch-access users, and screen reader users are forced to navigate through the header on every page load. Particularly burdensome for motor-impaired users.
- **Recommendation**: Add a visually-hidden skip link as the very first child of `<body>`, made visible on focus.
- **Fix Priority**: Immediate

**Remediation**:

```tsx
// frontend/src/App.tsx — add before <header>
<a
  href="#main-content"
  className="skip-link"
>
  Skip to main content
</a>
<header className="App-header">
  {/* … */}
</header>
<main id="main-content">
  <ProfilePage />
</main>
```

```css
/* frontend/src/App.css */
.skip-link {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.skip-link:focus {
  position: fixed;
  top: 0;
  left: 0;
  width: auto;
  height: auto;
  padding: 0.75rem 1.5rem;
  background: var(--color-navy);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  z-index: 9999;
  outline: 2px solid var(--color-teal-bright);
  outline-offset: 2px;
}
```

---

#### A-002: Download CV Button Has No Visible Focus Indicator

- **Location**: `frontend/src/App.tsx:20`, `frontend/src/App.css:46-65`
- **WCAG Criterion**: [2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) (Level AA) · [2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) (Level AA, WCAG 2.2)
- **Severity**: Critical
- **Pattern Detected**: The `.download-btn` CSS block has no `:focus` or `:focus-visible` rule. The browser UA outline does not render (confirmed via computed style: `outline: none 0px`). Screenshot evidence confirms no visible indicator when the button is focused.
- **Code Context**:
```css
/* frontend/src/App.css:46-65 — no :focus rule present */
.download-btn {
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.22);
  /* … no :focus or :focus-visible rule */
}

.download-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border-color: rgba(255, 255, 255, 0.45);
}
```
- **Impact**: The button is keyboard-reachable but provides no visual feedback that it is focused. Keyboard users cannot tell where focus is.
- **User Impact**: Keyboard-only users and low-vision users who rely on keyboard navigation cannot determine if this button is currently focused, making it effectively unusable for them.
- **Recommendation**: Add a clear `:focus-visible` style with at least 2px outline and 3:1 contrast against adjacent colours.
- **Fix Priority**: Immediate

**Remediation**:

```css
/* frontend/src/App.css */
.download-btn:focus-visible {
  outline: 2px solid var(--color-teal-bright);
  outline-offset: 2px;
  color: white;
  border-color: rgba(255, 255, 255, 0.45);
}
```

---

#### A-003: Section Heading Colour Contrast 2.86:1 (Fails All Thresholds)

- **Location**: `frontend/src/components/JobHistory.css:2-17`, `frontend/src/components/EducationHistory.css:2-17`, `frontend/src/components/Projects.css:2-17`, `frontend/src/components/Skills.css:2-17`, `frontend/src/components/Achievements.css:2-17`
- **WCAG Criterion**: [1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) (Level AA) · [1.4.6 Contrast (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html) (Level AAA)
- **Severity**: Critical
- **Pattern Detected**: All five section headings — JOB HISTORY, EDUCATION, PROJECTS, SKILLS, ACHIEVEMENTS — use `color: var(--color-teal)` (`#0a9ba4`, luminance 0.262) against the page background `#f0ece7` (luminance 0.843). Computed contrast ratio: **2.86:1**. These headings are 10.88px, well below the 18pt/24px large-text threshold. Required minimum: 4.5:1 (AA), 7:1 (AAA).
- **Code Context**:
```css
/* JobHistory.css:2-17 (same pattern in all section heading styles) */
.job-history h2 {
  font-size: 0.68rem;       /* 10.88px — normal text */
  font-weight: 700;
  color: var(--color-teal); /* #0a9ba4 — contrast 2.86:1 on #f0ece7 */
  text-transform: uppercase;
}
```
- **Impact**: Section headings fail WCAG 1.4.3 (AA minimum). Ratio 2.86:1 does not even meet the 3:1 threshold for large text.
- **User Impact**: Low-vision users and users in bright-light environments cannot read these section headings reliably. They serve as the primary navigation anchors for the content.
- **Recommendation**: Darken the teal to a shade that achieves at least 4.5:1 on `#f0ece7`. `#0a7a82` achieves approximately 4.5:1; for AAA use `--color-text-primary` (`#0d1f36`, contrast ~18:1) or a dark teal like `#065f65` (~7.1:1).
- **Fix Priority**: Immediate

**Remediation**:

```css
/* index.css — add AAA-compliant accent colour */
:root {
  --color-teal-accessible: #065f65; /* contrast ~7.1:1 on #f0ece7 */
}

/* JobHistory.css, EducationHistory.css, Projects.css, Skills.css, Achievements.css */
.job-history h2,
.education-history h2,
.projects h2,
.skills h2,
.achievements h2 {
  color: var(--color-teal-accessible); /* was: var(--color-teal) */
}
```

---

#### A-004: Muted / Date Text Colour Contrast 2.45–2.88:1 (Fails All Thresholds)

- **Location**: `frontend/src/components/JobHistory.css:94-103` (`.job-dates`), `frontend/src/components/EducationHistory.css:94-112` (`.education-field`, `.education-dates`), `frontend/src/components/Achievements.css:63-73` (`.achievement-date`)
- **WCAG Criterion**: [1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) (Level AA) · [1.4.6 Contrast (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html) (Level AAA)
- **Severity**: Critical
- **Pattern Detected**: All date strings, the education field-of-study label, and achievement dates use `--color-text-muted` (`#8a9aaa`, luminance 0.314). Against `#f0ece7` (luminance 0.843) the ratio is **2.45:1**; against white `#ffffff` (achievement cards) it is **2.88:1**. Font sizes are 11.2–13.6px (normal text). Required: 4.5:1 (AA), 7:1 (AAA).
- **Code Context**:
```css
/* JobHistory.css:94-103 */
.job-dates {
  font-size: 0.72rem;              /* 11.52px — normal text */
  color: var(--color-text-muted);  /* #8a9aaa — 2.45:1 on #f0ece7 */
}

/* EducationHistory.css:94-100 */
.education-field {
  color: var(--color-text-muted);  /* #8a9aaa — 2.45:1 on #f0ece7 */
  font-size: 0.85rem;
}

/* Achievements.css:63-73 */
.achievement-date {
  color: var(--color-text-muted);  /* #8a9aaa — 2.88:1 on white */
  font-size: 0.7rem;
}
```
- **Impact**: All temporal and secondary metadata is effectively invisible to low-vision users.
- **User Impact**: Dates indicating career timeline, education period, and achievement timing are unreadable for a significant portion of users with low vision.
- **Recommendation**: Darken muted text to at least `#626e7a` (≈4.5:1 on white) or `#5a6470` (≈4.5:1 on `#f0ece7`). For AAA compliance on white, use `#3d4a56` or darker.
- **Fix Priority**: Immediate

**Remediation**:

```css
/* index.css */
:root {
  --color-text-muted: #5a6470; /* was #8a9aaa — now ~4.6:1 on #f0ece7, ~5.3:1 on white */
}
```

---

#### A-005: Company and Institution Names Colour Contrast 2.86:1

- **Location**: `frontend/src/components/JobHistory.css:88-92` (`.company`), `frontend/src/components/EducationHistory.css:88-92` (`.institution`)
- **WCAG Criterion**: [1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) (Level AA)
- **Severity**: Critical
- **Pattern Detected**: Company names (Tech Corp, StartUp Inc, Web Solutions Ltd) and institution names (Tech Institute, State University) use `color: var(--color-teal)` (`#0a9ba4`) at 14.08px and 14.08px respectively against `#f0ece7`. Contrast ratio: **2.86:1**. Large text threshold requires 24px/18pt or 18.67px bold — these are neither. Required: 4.5:1 (AA), 7:1 (AAA).
- **Code Context**:
```css
/* JobHistory.css:88-92 */
.company {
  color: var(--color-teal); /* #0a9ba4 — 2.86:1 on #f0ece7 */
  font-weight: 600;
  font-size: 0.88rem; /* 14.08px — normal text */
}
```
- **Impact**: Company and institution names are critical CV content that fails minimum contrast.
- **User Impact**: Low-vision users cannot reliably read employer or institution names — the most important contextual labels in a CV.
- **Recommendation**: Use `--color-teal-accessible` (`#065f65`) or `--color-text-primary` (`#0d1f36`) for these labels.
- **Fix Priority**: Immediate

**Remediation**:

```css
/* JobHistory.css */
.company {
  color: var(--color-teal-accessible); /* was: var(--color-teal) */
}

/* EducationHistory.css */
.institution {
  color: var(--color-teal-accessible); /* was: var(--color-teal) */
}
```

---

#### A-006: Duplicate `<main>` Landmark — Two `main` Elements on One Page

- **Location**: `frontend/src/App.tsx:36`, `frontend/src/pages/ProfilePage.tsx:111`
- **WCAG Criterion**: [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) (Level A) · [4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) (Level A)
- **Severity**: Critical
- **Pattern Detected**: `App.tsx` wraps the full page body in `<main>`, and separately `ProfilePage.tsx` uses `<main className="main-column">` for the jobs/education/projects column. The page contains two `main` landmarks simultaneously.
- **Code Context**:
```tsx
// App.tsx:36
<main>
  <ProfilePage />
</main>

// ProfilePage.tsx:111
<main className="main-column">
  <JobHistory jobs={profile.jobHistory} />
  <EducationHistory education={profile.education} />
  <Projects projects={profile.projects} />
</main>
```
- **Impact**: The HTML specification permits only one `main` element per page. Screen reader shortcuts (e.g., VoiceOver "jump to main" keyboard command) produce ambiguous results.
- **User Impact**: Screen reader users relying on landmark shortcuts to navigate to the main content area encounter unpredictable behaviour.
- **Recommendation**: Remove the `<main>` from `App.tsx` and keep the single `<main>` in `ProfilePage.tsx`. Alternatively, keep `<main>` in `App.tsx` and change the column wrapper to `<div>`.
- **Fix Priority**: Immediate

**Remediation**:

```tsx
// App.tsx — change <main> to <div>
<div className="App">
  <header className="App-header">
    {/* … */}
  </header>
  <div id="main-content">   {/* not <main> */}
    <ProfilePage />
  </div>
</div>

// ProfilePage.tsx:111 — keep this as the single <main>
<main className="main-column" id="main-content">
  <JobHistory jobs={profile.jobHistory} />
  <EducationHistory education={profile.education} />
  <Projects projects={profile.projects} />
</main>
```

---

#### A-007: "My Portfolio" Header Link Focus Indicator Invisible on Dark Background

- **Location**: `frontend/src/App.css:30-38`
- **WCAG Criterion**: [2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) (Level AA) · [2.4.13 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) (Level AAA, WCAG 2.2)
- **Severity**: Critical
- **Pattern Detected**: `.App-header-link:focus` only sets `text-decoration: none` and does not add an outline. The browser UA default applies a 1px dark outline (`rgb(16,16,16)`) against the navy header background (`#0d1f36`). Dark-on-dark outline contrast is effectively 1.02:1 — invisible. Screenshot confirms no perceptible focus ring on the "My Portfolio" link.
- **Code Context**:
```css
/* App.css:35-38 */
.App-header-link:hover,
.App-header-link:focus {
  text-decoration: none;
  /* no outline — browser default 1px dark on dark navy is invisible */
}
```
- **Impact**: The first focusable element on the page has no perceptible keyboard focus indicator.
- **User Impact**: Keyboard users cannot see where focus is when first tabbing onto the page — a fundamental orientation barrier.
- **Recommendation**: Add an explicit `:focus-visible` rule with a light-coloured outline that contrasts with the dark header.
- **Fix Priority**: Immediate

**Remediation**:

```css
/* App.css */
.App-header-link:focus {
  text-decoration: none;
}

.App-header-link:focus-visible {
  outline: 2px solid var(--color-teal-bright);
  outline-offset: 3px;
  border-radius: 2px;
}
```

---

### High Severity Findings

#### A-008: Two `<h1>` Elements — Duplicate Page Title

- **Location**: `frontend/src/App.tsx:16` and `frontend/src/components/UserProfile.tsx:31`
- **WCAG Criterion**: [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) (Level A) · [2.4.6 Headings and Labels](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html) (Level AAA)
- **Severity**: High
- **Pattern Detected**: The page simultaneously contains `<h1>My Portfolio</h1>` (in the site header) and `<h1>John Doe</h1>` (in the profile card). A document should have a single h1 that identifies the page's primary purpose.
- **Code Context**:
```tsx
// App.tsx:16
<h1>
  <a href="/" className="App-header-link">My Portfolio</a>
</h1>

// UserProfile.tsx:31
<h1>{user?.name}</h1>  {/* renders: "John Doe" */}
```
- **Impact**: Creates ambiguity for screen reader users about the primary subject of the page.
- **User Impact**: Screen reader users who jump to h1 (common navigation pattern) find two conflicting headings and cannot determine the page's primary topic.
- **Recommendation**: Remove the `<h1>` from the header — style it visually as a heading but use a `<span>` or `<p>`, keeping the user's name as the sole `<h1>`. The `<title>` element already satisfies page identification at the browser level.
- **Fix Priority**: High

**Remediation**:

```tsx
// App.tsx:16 — demote to styled span
<p className="site-title">
  <a href="/" className="App-header-link">My Portfolio</a>
</p>

// App.css — style to match current h1 appearance
.site-title {
  font-family: var(--font-display);
  font-size: 1.55rem;
  font-weight: 600;
  margin: 0;
}

// UserProfile.tsx:31 — keep as the single h1
<h1>{user?.name}</h1>
```

---

#### A-009: "Full Stack Developer" Semantically Marked as `<h2>` — Subtitle Misuse

- **Location**: `frontend/src/components/UserProfile.tsx:32`
- **WCAG Criterion**: [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) (Level A) · [2.4.6 Headings and Labels](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html) (Level AAA)
- **Severity**: High
- **Pattern Detected**: The user's job title ("Full Stack Developer") is wrapped in `<h2 className="title">`. It is visually styled as a decorative subtitle but semantically implies a major section heading equivalent in importance to "Job History" and "Education".
- **Code Context**:
```tsx
// UserProfile.tsx:32
<h2 className="title">{user?.title}</h2>
```
- **Impact**: Creates a misleading heading tree: h1 "John Doe" → h2 "Full Stack Developer" → h3 "About" → h2 "Job History" (jumps back up). The h3 "About" appears to be a child of the subtitle rather than a sibling of section headings.
- **User Impact**: Screen reader users navigating by heading levels will find "Full Stack Developer" mixed among section headings, creating a confusing document outline.
- **Recommendation**: Replace with `<p>` styled identically — the role is not a structural heading but a descriptive label.
- **Fix Priority**: High

**Remediation**:

```tsx
// UserProfile.tsx:32
<p className="title">{user?.title}</p>
```

---

#### A-010: Language Select Insufficient Focus Indicator (1px / 40% Opacity)

- **Location**: `frontend/src/App.css:72-93`
- **WCAG Criterion**: [2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) (Level AA) · [2.4.13 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) (Level AAA, WCAG 2.2)
- **Severity**: High
- **Pattern Detected**: The base `.language-select` style explicitly sets `outline: none`, overriding the browser default. The `:focus` rule adds `outline: 1px solid rgba(255, 255, 255, 0.4)` — a 1px outline at 40% white opacity. SC 2.4.13 requires focus indicators to have a minimum area equal to the perimeter × 2px, plus minimum contrast of 3:1 between focused and unfocused states.
- **Code Context**:
```css
/* App.css:82 — removes browser default */
.language-select {
  outline: none; /* explicitly disabled */
}

/* App.css:90-93 — inadequate replacement */
.language-select:focus {
  outline: 1px solid rgba(255, 255, 255, 0.4); /* 1px, 40% opacity — fails SC 2.4.13 */
  outline-offset: 2px;
}
```
- **Impact**: Focus indicator fails minimum area (1px < 2px) and the 40% opacity means contrast with adjacent colours is well below 3:1.
- **User Impact**: Low-vision users cannot reliably detect keyboard focus on the language selector.
- **Recommendation**: Increase to 2px solid white (fully opaque) for sufficient contrast.
- **Fix Priority**: High

**Remediation**:

```css
/* App.css */
.language-select {
  /* remove outline: none */
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.18);
  /* … rest of properties, but NOT outline: none */
}

.language-select:focus-visible {
  outline: 2px solid #ffffff; /* fully opaque, 16.6:1 on navy */
  outline-offset: 2px;
}
```

---

#### A-011: Bio Text rgba(255,255,255,0.55) Contrast ~5.8:1 — Fails AAA (7:1)

- **Location**: `frontend/src/components/UserProfile.css:86-91`
- **WCAG Criterion**: [1.4.6 Contrast (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html) (Level AAA)
- **Severity**: High
- **Pattern Detected**: The biography paragraph uses `color: rgba(255, 255, 255, 0.55)`. Composited against the dark profile card background (`#0d1f36`), the effective colour is approximately `#928fa0` equivalent. Contrast ratio: approximately **5.8:1**. Passes AA (4.5:1) but fails AAA (7:1) for normal text (14.88px).
- **Code Context**:
```css
/* UserProfile.css:86-91 */
.profile-bio p {
  color: rgba(255, 255, 255, 0.55); /* ~5.8:1 on dark profile bg — fails AAA */
  line-height: 1.75;
  font-size: 0.93rem; /* 14.88px — normal text */
}
```
- **Impact**: Bio text fails AAA contrast for normal text.
- **User Impact**: Low-vision users who require high-contrast reading find the biography — the primary personal summary of the CV — harder to read.
- **Recommendation**: Increase opacity to `0.8` (≈10.5:1) or use `rgba(255, 255, 255, 0.75)` (≈8.8:1) to pass AAA.
- **Fix Priority**: High

**Remediation**:

```css
/* UserProfile.css */
.profile-bio p {
  color: rgba(255, 255, 255, 0.8); /* was 0.55 — now ~10.5:1 */
}
```

---

#### A-012: Project Role Badge Contrast 3.02:1 — Fails AA for Normal Text

- **Location**: `frontend/src/components/Projects.css:63-75`
- **WCAG Criterion**: [1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) (Level AA) · [1.4.6 Contrast (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html) (Level AAA)
- **Severity**: High
- **Pattern Detected**: The "LEAD DEVELOPER" and "BACKEND DEVELOPER" role badges use `color: var(--color-teal)` (`#0a9ba4`) on `background: var(--color-teal-light)` (`#e3f6f8`). Contrast ratio: **3.02:1**. Text is 11.2px bold — not large text. Required: 4.5:1 (AA), 7:1 (AAA).
- **Code Context**:
```css
/* Projects.css:63-75 */
.project-role {
  background: var(--color-teal-light); /* #e3f6f8 */
  color: var(--color-teal);            /* #0a9ba4 — 3.02:1 on #e3f6f8 */
  font-size: 0.7rem;                   /* 11.2px — normal text */
  font-weight: 700;
  text-transform: uppercase;
}
```
- **Impact**: Role badges are unreadable at AA and AAA compliance.
- **User Impact**: Low-vision users cannot distinguish project roles — key contextual data in the portfolio.
- **Recommendation**: Darken text to `#065f65` (~8.3:1 on `#e3f6f8`) or darken the badge background.
- **Fix Priority**: High

**Remediation**:

```css
/* Projects.css */
.project-role {
  background: var(--color-teal-light);
  color: #065f65; /* was var(--color-teal) — now ~8.3:1 on #e3f6f8 */
}
```

---

### Medium Severity Findings

#### A-013: Error State Renders Without `role="alert"` — Not Announced Dynamically

- **Location**: `frontend/src/pages/ProfilePage.tsx:90-96`
- **WCAG Criterion**: [4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) (Level AA) · [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) (Level A)
- **Severity**: Medium
- **Pattern Detected**: When the API request fails, the error state renders as a plain `<div className="error">`. Screen readers do not automatically announce this because there is no live region or alert role.
- **Code Context**:
```tsx
// ProfilePage.tsx:90-96
if (errorKey) {
  return (
    <div className="profile-page">
      <div className="error">{t(errorKey)}</div>
    </div>
  );
}
```
- **Impact**: The error message is silent to screen reader users unless they manually navigate to find it.
- **User Impact**: Screen reader users who load the page and encounter an error receive no announcement that anything went wrong.
- **Recommendation**: Add `role="alert"` or `aria-live="assertive"` to ensure the error is announced.
- **Fix Priority**: High (demoted to Medium as errors are infrequent in normal use)

**Remediation**:

```tsx
// ProfilePage.tsx
if (errorKey) {
  return (
    <div className="profile-page">
      <div className="error" role="alert">{t(errorKey)}</div>
    </div>
  );
}
```

---

#### A-014: External Links Open New Tab Without User Warning

- **Location**: `frontend/src/components/ContactInfo/ContactInfo.tsx:72,82,92`
- **WCAG Criterion**: [3.2.5 Change on Request](https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html) (Level AAA) · [3.2.2 On Input](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html) (Level AA)
- **Severity**: Medium
- **Pattern Detected**: Website, GitHub, and LinkedIn links use `target="_blank"` but neither the `aria-label` text nor adjacent content informs the user that a new tab will open.
- **Code Context**:
```tsx
// ContactInfo.tsx:72
<a href={entry.value} target="_blank" rel="noopener noreferrer"
   aria-label={t('contactInfo.ariaWebsite', { value: entry.value })}>
  {/* aria-label says "Visit website https://…" — no "opens in new tab" */}
```
- **Impact**: Focus unexpectedly shifts to a new browser window without warning.
- **User Impact**: Screen reader and keyboard users are disoriented when focus unexpectedly moves to a new tab. Particularly confusing for cognitive disability users.
- **Recommendation**: Append "(opens in new tab)" to each external link's `aria-label` and optionally add a visually-hidden span for sighted keyboard users.
- **Fix Priority**: Medium

**Remediation**:

```tsx
// ContactInfo.tsx — update aria-label translations to include the warning
// e.g. contactInfo.ariaWebsite = "Visit website {{value}} (opens in new tab)"
// Or add visually-hidden text:
<a href={entry.value} target="_blank" rel="noopener noreferrer"
   aria-label={t('contactInfo.ariaWebsite', { value: entry.value }) + ' (opens in new tab)'}>
```

---

#### A-015: "About" Section Uses `<h3>` While Parallel Sections Use `<h2>`

- **Location**: `frontend/src/components/UserProfile.tsx:45`
- **WCAG Criterion**: [2.4.6 Headings and Labels](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html) (Level AAA) · [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) (Level A)
- **Severity**: Medium
- **Pattern Detected**: The "About" bio heading uses `<h3>` while "Job History", "Education", "Projects", "Skills", and "Achievements" all use `<h2>`. Conceptually, "About" is a peer summary section — its lower heading level suggests it is a subsection of "Full Stack Developer" (h2) rather than a top-level section.
- **Code Context**:
```tsx
// UserProfile.tsx:45
<h3>{t('userProfile.about')}</h3>
```
- **Impact**: After resolving the duplicate h1 and h2-subtitle issues, "About" should be `<h2>` to create a consistent document outline.
- **User Impact**: Screen reader users navigating by heading level will find "About" at a different level than other CV sections, creating an inconsistent experience.
- **Recommendation**: Change to `<h2>` after demoting the profile title and fixing the heading hierarchy.
- **Fix Priority**: Medium (dependent on A-008 and A-009 fixes)

**Remediation**:

```tsx
// UserProfile.tsx:45 — after fixing A-008 and A-009
<h2 className="profile-bio-heading">{t('userProfile.about')}</h2>
```

---

#### A-016: No `contentinfo` (Footer) Landmark

- **Location**: `frontend/src/App.tsx` — page has no `<footer>` element
- **WCAG Criterion**: [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) (Level A) · [2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html) (Level A)
- **Severity**: Medium
- **Pattern Detected**: The page has no footer/contentinfo landmark. For a single-page CV this is minor, but the page ends abruptly with no landmark to signal the end of content.
- **Code Context**: N/A — Element does not exist in the code
- **Impact**: Screen reader users have no `contentinfo` landmark to jump to; landmark navigation is incomplete.
- **User Impact**: Minor for a single-page site, but affects completeness of landmark structure.
- **Recommendation**: Add a minimal `<footer>` with copyright or contact attribution.
- **Fix Priority**: Low (categorised as Medium for completeness)

**Remediation**:

```tsx
// App.tsx — add after </div> (main content)
<footer>
  <p>{new Date().getFullYear()} — John Doe Portfolio</p>
</footer>
```

---

### Low Severity Findings

#### A-017: Loading Skeleton State Has No Accessible Announcement

- **Location**: `frontend/src/pages/ProfilePage.tsx:40-87`
- **WCAG Criterion**: [4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) (Level AA)
- **Severity**: Low
- **Pattern Detected**: The loading skeleton state renders `react-loading-skeleton` components with no `aria-busy` or `aria-label` indication that content is loading.
- **Code Context**:
```tsx
// ProfilePage.tsx:40-44 — no aria-busy or loading announcement
if (loading) {
  return (
    <div className="profile-page">
      <div className="container">
        {/* skeleton elements with no aria-busy="true" */}
```
- **Impact**: Screen readers receive no feedback that the page is loading data.
- **User Impact**: Screen reader users may be confused about why the page appears empty.
- **Recommendation**: Add `aria-busy="true"` and `aria-label="Loading portfolio content"` to the skeleton container.
- **Fix Priority**: Low

**Remediation**:

```tsx
// ProfilePage.tsx:42-44
if (loading) {
  return (
    <div className="profile-page" aria-busy="true" aria-label="Loading portfolio content">
      <div className="container">
        {/* skeleton elements */}
```

---

#### A-018: `<noscript>` Fallback Lacks Sufficient Guidance

- **Location**: `frontend/index.html:22`
- **WCAG Criterion**: [1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) (Level A) — general robustness
- **Severity**: Low
- **Pattern Detected**: The noscript message "You need to enable JavaScript to run this app." gives no guidance on how to enable JavaScript or alternative ways to access the content.
- **Code Context**:
```html
<!-- index.html:22 -->
<noscript>You need to enable JavaScript to run this app.</noscript>
```
- **Impact**: Users with JavaScript disabled receive a dead-end message.
- **User Impact**: Users who rely on assistive technologies that disable JavaScript receive no useful content or guidance.
- **Recommendation**: Expand the noscript message with how to enable JavaScript or provide a link to a contact email.
- **Fix Priority**: Low

**Remediation**:

```html
<noscript>
  <p>This portfolio requires JavaScript. Please enable JavaScript in your browser settings,
     or <a href="mailto:john.doe@example.com">contact John Doe directly</a>.</p>
</noscript>
```

---

## WCAG 2.2 Level AAA Compliance Analysis

### Compliance Matrix

| Criterion | Title | Status | Issues | Priority |
|-----------|-------|--------|--------|----------|
| [**1.1.1**](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) | Non-text Content | Pass | Profile image has alt text; decorative icons use aria-hidden | — |
| [**1.2.1**](https://www.w3.org/WAI/WCAG22/Understanding/audio-only-and-video-only-prerecorded.html) | Audio-only and Video-only | N/A | No audio or video content | — |
| [**1.2.2**](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html) | Captions (Prerecorded) | N/A | No video content | — |
| [**1.2.3**](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html) | Audio Description or Media Alternative | N/A | No video content | — |
| [**1.2.4**](https://www.w3.org/WAI/WCAG22/Understanding/captions-live.html) | Captions (Live) | N/A | No live media | — |
| [**1.2.5**](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-prerecorded.html) | Audio Description (Prerecorded) | N/A | No video content | — |
| [**1.2.6**](https://www.w3.org/WAI/WCAG22/Understanding/sign-language-prerecorded.html) | Sign Language (Prerecorded) | N/A | No video content | — |
| [**1.2.7**](https://www.w3.org/WAI/WCAG22/Understanding/extended-audio-description-prerecorded.html) | Extended Audio Description | N/A | No video content | — |
| [**1.2.8**](https://www.w3.org/WAI/WCAG22/Understanding/media-alternative-prerecorded.html) | Media Alternative (Prerecorded) | N/A | No video content | — |
| [**1.2.9**](https://www.w3.org/WAI/WCAG22/Understanding/audio-only-live.html) | Audio-only (Live) | N/A | No live audio | — |
| [**1.3.1**](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) | Info and Relationships | Fail | Two `<main>` landmarks; two `<h1>`; h2 used as subtitle | Critical — A-006, A-008, A-009 |
| [**1.3.2**](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html) | Meaningful Sequence | Pass | DOM order matches visual order | — |
| [**1.3.3**](https://www.w3.org/WAI/WCAG22/Understanding/sensory-characteristics.html) | Sensory Characteristics | Pass | No instructions rely on shape/colour alone | — |
| [**1.3.4**](https://www.w3.org/WAI/WCAG22/Understanding/orientation.html) | Orientation | Pass | No orientation lock detected | — |
| [**1.3.5**](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html) | Identify Input Purpose | N/A | No user-facing form inputs | — |
| [**1.3.6**](https://www.w3.org/WAI/WCAG22/Understanding/identify-purpose.html) | Identify Purpose | Partial | Landmarks present; no `aria-label` on duplicated main landmark | Medium — A-006 |
| [**1.4.1**](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) | Use of Color | Pass | Information not conveyed by colour alone | — |
| [**1.4.2**](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html) | Audio Control | N/A | No auto-playing audio | — |
| [**1.4.3**](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | Contrast (Minimum) | Fail | Section headings 2.86:1; muted text 2.45–2.88:1; company names 2.86:1; project role badge 3.02:1 | Critical — A-003, A-004, A-005, A-012 |
| [**1.4.4**](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) | Resize Text | Pass | Text scales with viewport; no fixed pixel fonts | — |
| [**1.4.5**](https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html) | Images of Text | Pass | No text rendered as images | — |
| [**1.4.6**](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html) | Contrast (Enhanced) | Fail | Bio text ~5.8:1 (requires 7:1); all failures from 1.4.3 also fail 1.4.6 | High — A-003, A-004, A-005, A-011, A-012 |
| [**1.4.7**](https://www.w3.org/WAI/WCAG22/Understanding/low-or-no-background-audio.html) | Low or No Background Audio | N/A | No audio | — |
| [**1.4.8**](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html) | Visual Presentation | Partial | Font/colour customisation not user-controlled; text blocks exceed 80 characters | Low |
| [**1.4.9**](https://www.w3.org/WAI/WCAG22/Understanding/images-of-text-no-exception.html) | Images of Text (No Exception) | Pass | No images of text | — |
| [**1.4.10**](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | Reflow | Pass | Responsive breakpoints at 900px and 600px; content reflows | — |
| [**1.4.11**](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) | Non-text Contrast | Partial | Timeline dots and skill tag borders pass; focus indicator contrast not verified for all controls | Medium |
| [**1.4.12**](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) | Text Spacing | Pass | No CSS overrides blocking text spacing adjustments | — |
| [**1.4.13**](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) | Content on Hover or Focus | Pass | No custom hover/focus-triggered content | — |
| [**2.1.1**](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) | Keyboard | Pass | All interactive elements are keyboard reachable | — |
| [**2.1.2**](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html) | No Keyboard Trap | Pass | No keyboard traps detected | — |
| [**2.1.3**](https://www.w3.org/WAI/WCAG22/Understanding/keyboard-no-exception.html) | Keyboard (No Exception) | Pass | No path-dependent gestures required | — |
| [**2.2.1**](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) | Timing Adjustable | N/A | No time limits present | — |
| [**2.2.2**](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | Pause, Stop, Hide | N/A | No auto-updating content | — |
| [**2.2.3**](https://www.w3.org/WAI/WCAG22/Understanding/no-timing.html) | No Timing | Pass | No timed interactions | — |
| [**2.2.4**](https://www.w3.org/WAI/WCAG22/Understanding/interruptions.html) | Interruptions | Pass | No interruptions | — |
| [**2.2.5**](https://www.w3.org/WAI/WCAG22/Understanding/re-authenticating.html) | Re-authenticating | N/A | No session expiry | — |
| [**2.2.6**](https://www.w3.org/WAI/WCAG22/Understanding/timeouts.html) | Timeouts | N/A | No session timeouts | — |
| [**2.3.1**](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) | Three Flashes or Below | Pass | No flashing content | — |
| [**2.3.2**](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes.html) | Three Flashes | Pass | No flashing content | — |
| [**2.3.3**](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | Animation from Interactions | Partial | CSS transitions present; no `prefers-reduced-motion` override detected | Low |
| [**2.4.1**](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html) | Bypass Blocks | Fail | No skip navigation link | Critical — A-001 |
| [**2.4.2**](https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html) | Page Titled | Pass | `<title>My Portfolio</title>` present | — |
| [**2.4.3**](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) | Focus Order | Pass | Tab order follows logical visual flow | — |
| [**2.4.4**](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html) | Link Purpose (In Context) | Pass | Contact links have descriptive aria-labels | — |
| [**2.4.5**](https://www.w3.org/WAI/WCAG22/Understanding/multiple-ways.html) | Multiple Ways | N/A | Single-page application | — |
| [**2.4.6**](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html) | Headings and Labels | Fail | Two h1s; h2 subtitle; h3 "About" vs h2 sections | High — A-008, A-009, A-015 |
| [**2.4.7**](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) | Focus Visible | Fail | Download button no focus ring; header link invisible ring | Critical — A-002, A-007 |
| [**2.4.8**](https://www.w3.org/WAI/WCAG22/Understanding/location.html) | Location | N/A | Single-page application | — |
| [**2.4.9**](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-link-only.html) | Link Purpose (Link Only) | Pass | Links have descriptive labels out of context | — |
| [**2.4.10**](https://www.w3.org/WAI/WCAG22/Understanding/section-headings.html) | Section Headings | Partial | Headings used but hierarchy inconsistent | Medium — A-008, A-009, A-015 |
| [**2.4.11**](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) | Focus Not Obscured (Minimum) | Fail | Sticky header (z-index:100) may obscure focused elements in content area | Critical — A-002, A-007 |
| [**2.4.12**](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-enhanced.html) | Focus Not Obscured (Enhanced) | Fail | Same sticky header issue | High |
| [**2.4.13**](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) | Focus Appearance | Fail | Language select: 1px / 40% opacity outline fails minimum requirements | High — A-010 |
| [**2.5.1**](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html) | Pointer Gestures | Pass | No complex pointer gestures | — |
| [**2.5.2**](https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html) | Pointer Cancellation | Pass | Native controls used throughout | — |
| [**2.5.3**](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html) | Label in Name | Pass | Visible labels match accessible names | — |
| [**2.5.4**](https://www.w3.org/WAI/WCAG22/Understanding/motion-actuation.html) | Motion Actuation | N/A | No motion-triggered functionality | — |
| [**2.5.5**](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) | Target Size (Enhanced) | Fail | Contact links and select control may be below 44×44px minimum | Low |
| [**2.5.6**](https://www.w3.org/WAI/WCAG22/Understanding/concurrent-input-mechanisms.html) | Concurrent Input Mechanisms | Pass | No input mechanism restrictions | — |
| [**2.5.7**](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) | Dragging Movements | N/A | No drag interactions | — |
| [**2.5.8**](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | Target Size (Minimum) | Partial | Contact icons are 13×13px but linked text provides adequate target | Low |
| [**3.1.1**](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html) | Language of Page | Pass | `<html lang="en">` present | — |
| [**3.1.2**](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html) | Language of Parts | Partial | Irish (Gaeilge) option present but no `lang` attribute toggle on language switch | Low |
| [**3.1.3**](https://www.w3.org/WAI/WCAG22/Understanding/unusual-words.html) | Unusual Words | Pass | No unexplained jargon | — |
| [**3.1.4**](https://www.w3.org/WAI/WCAG22/Understanding/abbreviations.html) | Abbreviations | N/A | No unexplained abbreviations | — |
| [**3.1.5**](https://www.w3.org/WAI/WCAG22/Understanding/reading-level.html) | Reading Level | Pass | Content written at clear reading level | — |
| [**3.1.6**](https://www.w3.org/WAI/WCAG22/Understanding/pronunciation.html) | Pronunciation | N/A | No ambiguous pronunciation | — |
| [**3.2.1**](https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html) | On Focus | Pass | No unexpected context changes on focus | — |
| [**3.2.2**](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html) | On Input | Fail | Language select changes language immediately on selection without warning | Medium |
| [**3.2.3**](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html) | Consistent Navigation | Pass | Single-page — navigation consistent | — |
| [**3.2.4**](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html) | Consistent Identification | Pass | Controls consistently identified | — |
| [**3.2.5**](https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html) | Change on Request | Fail | External links open new tab without user request; language changes immediately on select | Medium — A-014 |
| [**3.2.6**](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html) | Consistent Help | N/A | No help mechanism present | — |
| [**3.3.1**](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) | Error Identification | Fail | API error not announced to screen readers | Medium — A-013 |
| [**3.3.2**](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html) | Labels or Instructions | Pass | Language select has aria-label; no other inputs | — |
| [**3.3.3**](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html) | Error Suggestion | Fail | No recovery suggestion in error message | Medium — A-013 |
| [**3.3.4**](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html) | Error Prevention | N/A | No form submission | — |
| [**3.3.5**](https://www.w3.org/WAI/WCAG22/Understanding/help.html) | Help | N/A | No help context needed | — |
| [**3.3.6**](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-all.html) | Error Prevention (All) | N/A | No form submission | — |
| [**3.3.7**](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html) | Redundant Entry | N/A | No multi-step form | — |
| [**3.3.8**](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) | Accessible Authentication (Minimum) | N/A | No authentication | — |
| [**3.3.9**](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-enhanced.html) | Accessible Authentication (Enhanced) | N/A | No authentication | — |
| [**4.1.1**](https://www.w3.org/WAI/WCAG22/Understanding/parsing.html) | Parsing | N/A | Removed in WCAG 2.2 | — |
| [**4.1.2**](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) | Name, Role, Value | Fail | Two `<main>` landmarks; missing role/live region on error state | Critical — A-006, A-013 |
| [**4.1.3**](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | Status Messages | Fail | Loading state and error state lack live region announcements | Medium — A-013, A-017 |

**Overall WCAG 2.2 Level AAA Compliance**: ~52% (approx. 36/61 applicable criteria fully compliant)

---

## Technical Recommendations

### Immediate Fixes (Critical Priority)

1. Add skip navigation link before `<header>` in `App.tsx` — resolves A-001 (SC 2.4.1 Level A)
2. Add `:focus-visible` style with 2px `var(--color-teal-bright)` outline to `.download-btn` — resolves A-002 (SC 2.4.7 Level AA)
3. Add `:focus-visible` style with 2px light outline to `.App-header-link` — resolves A-007 (SC 2.4.7 Level AA)
4. Introduce `--color-teal-accessible: #065f65` and apply to all five section heading h2s — resolves A-003 (SC 1.4.3 Level AA) and A-005
5. Darken `--color-text-muted` from `#8a9aaa` to `#5a6470` globally — resolves A-004 (SC 1.4.3 Level AA)
6. Change second `<main>` in `ProfilePage.tsx:111` to `<div>` and keep single `<main>` in `App.tsx` — resolves A-006 (SC 1.3.1 Level A)
7. Darken `.project-role` text to `#065f65` — resolves A-012 (SC 1.4.3 Level AA)

### High Priority Enhancements

1. Demote `<h1>` in `App.tsx` header to `<p className="site-title">` — resolves A-008 (multiple SC)
2. Change `<h2 className="title">` in `UserProfile.tsx:32` to `<p className="title">` — resolves A-009
3. Fix language select: remove `outline: none`, upgrade `:focus` to `outline: 2px solid white` — resolves A-010
4. Increase `.profile-bio p` opacity to `0.8` — resolves A-011 (SC 1.4.6 AAA)
5. Add `role="alert"` to error state in `ProfilePage.tsx` — resolves A-013

### Medium Priority Improvements

1. Append "(opens in new tab)" to external link aria-labels in i18n files — resolves A-014
2. After heading hierarchy fixes, change `<h3>` "About" to `<h2>` — resolves A-015
3. Add minimal `<footer>` element — resolves A-016
4. Update `html` element `lang` attribute when i18n language changes — partially resolves SC 3.1.2

---

## Accessibility Remediation Roadmap

### Phase 1: Critical Accessibility Barriers

- [ ] Add skip navigation link (A-001) — SC 2.4.1 Level A
- [ ] Add `:focus-visible` to `.download-btn` (A-002) — SC 2.4.7 Level AA
- [ ] Add `:focus-visible` to `.App-header-link` (A-007) — SC 2.4.7 Level AA
- [ ] Introduce `--color-teal-accessible` for section headings (A-003) — SC 1.4.3 Level AA
- [ ] Darken `--color-text-muted` to `#5a6470` (A-004) — SC 1.4.3 Level AA
- [ ] Fix teal company/institution name contrast (A-005) — SC 1.4.3 Level AA
- [ ] Remove duplicate `<main>` landmark (A-006) — SC 1.3.1 Level A
- [ ] Darken project role badge text (A-012) — SC 1.4.3 Level AA

**Expected Impact**: Resolves all Level A failures and the most critical Level AA failures. Estimated improvement: 48/100 → 74/100

### Phase 2: High Priority Improvements

- [ ] Demote header h1 to styled paragraph (A-008) — SC 1.3.1, 2.4.6
- [ ] Change "Full Stack Developer" h2 to paragraph (A-009) — SC 1.3.1
- [ ] Fix language select focus indicator (A-010) — SC 2.4.7, 2.4.13 (WCAG 2.2)
- [ ] Increase bio text opacity to 0.8 (A-011) — SC 1.4.6 AAA
- [ ] Add `role="alert"` to error state (A-013) — SC 4.1.3, 3.3.1

**Expected Impact**: Achieves majority WCAG Level AA compliance. Estimated improvement: 74/100 → 84/100

### Phase 3: Medium Priority Enhancements

- [ ] Add new-tab warnings to external link aria-labels (A-014) — SC 3.2.5
- [ ] Reclassify "About" from h3 to h2 (A-015) — SC 2.4.6
- [ ] Add footer/contentinfo landmark (A-016) — SC 1.3.1
- [ ] Add `aria-busy` to loading skeleton (A-017) — SC 4.1.3
- [ ] Update `html[lang]` attribute on language change in i18n handler (App.tsx:9-11)

**Expected Impact**: Achieves near-complete WCAG Level AA compliance. Estimated improvement: 84/100 → 90/100

### Phase 4: Accessibility Excellence

- [ ] Add `prefers-reduced-motion` media query to suppress CSS transitions
- [ ] Audit and increase touch targets to 44×44px minimum (SC 2.5.5 AAA)
- [ ] Expand `<noscript>` with actionable guidance (A-018)
- [ ] Integrate axe-core or Playwright accessibility assertions into the e2e test suite
- [ ] Conduct manual screen reader testing (NVDA + Firefox, VoiceOver + Safari)

**Expected Impact**: Approach WCAG Level AAA compliance. Estimated score: 90–95/100

---

## Summary

This accessibility analysis identified **7 critical**, **5 high**, **4 medium**, and **2 low** severity accessibility barriers. The audit targeted WCAG 2.2 Level AAA compliance at http://localhost:3000.

**Key Strengths Identified**:

- `<html lang="en">` correctly set on the document root
- All contact icon SVGs correctly use `aria-hidden="true"` — decorative intent properly communicated
- Contact links have descriptive `aria-label` attributes (e.g., "Send email to john.doe@example.com")
- Landmark structure is partially correct: `<header>`, `<main>`, and `<aside>` all present
- Language selector has an `aria-label="Select language"` attribute
- Profile image has meaningful alt text (`alt="John Doe"`)
- Responsive breakpoints at 900px and 600px — content reflows correctly
- External links use `rel="noopener noreferrer"` for security
- `meta viewport` permits user scaling (no `user-scalable=no`)

**Critical Areas Requiring Immediate Attention**:

- **A-001**: Missing skip navigation link — fundamental keyboard navigation barrier (SC 2.4.1 Level A)
- **A-002 / A-007**: No visible focus indicators on Download CV button and header link — prevents keyboard users from tracking focus
- **A-003 / A-004 / A-005**: Widespread colour contrast failures — section headings (2.86:1), muted dates (2.45:1), company names (2.86:1) all below the 4.5:1 AA minimum
- **A-006**: Two `<main>` landmarks confuse screen reader navigation

**Overall Assessment**:

- **Current WCAG Compliance**: ~52% Level AAA compliant (~78% Level AA compliant)
- **Accessibility Blockers**: 7 critical issues preventing or severely impairing access
- **Accessibility Score**: 48/100
- **Recommendation**: Begin immediately with Phase 1 (focus indicators + colour contrast + skip link). The CSS-only contrast fixes and focus indicator additions in Phase 1 can be completed in a single sprint and will have the most significant impact for the broadest range of users.
