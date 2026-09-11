# MBTI Tracker

A single-page, no-build web app for tracking the MBTI types of people in your
life — friends, family, coworkers, romantic interests — with both a
spreadsheet-style list and a visual 16-type grid. All data is kept locally in
the browser (nothing is shared between accounts or devices); a Google sign-in
just gates who can open the page.

## Running it

There's nothing to build, but you do need a Firebase project for sign-in:

1. Create a project at the [Firebase Console](https://console.firebase.google.com/).
2. **Authentication → Sign-in method** → enable **Google** as a provider.
3. **Authentication → Settings → Authorized domains** → add whatever domain
   you'll serve this from (`localhost` is included by default).
4. **Project settings → General → Your apps** → add a Web app and copy its
   config into [`firebase-config.js`](firebase-config.js) (it ships with
   placeholder values).

Because Google sign-in uses a popup, the page needs to be served over
`http(s)`, not opened directly via `file://`. Any static file server works,
e.g. `npx serve` or `python -m http.server` from this folder, then visit
`http://localhost:<port>/login.html`. An internet connection is needed the
first time it loads, since Firebase and the emoji picker library are both
pulled from a CDN — everything else works offline.

Visiting [`index.html`](index.html) while signed out redirects to
[`login.html`](login.html); signing in with Google redirects back. A
**Sign Out** button sits next to the ⚙️ Settings button in the header.

## Features

### List view

- A spreadsheet-style table with a column for every field: Emoji, Name,
  MBTI, Status, Gender, Relationship, and Sub Category.
- **Click any column header** to sort by it; click again to reverse
  direction. MBTI and Relationship sort by their natural order (e.g.
  ISTJ → ENTJ) rather than alphabetically — Sub Category follows the same
  pattern. Status and Gender sort alphabetically.
- **Search box** filters by name as you type.
- **+ Add Entry** opens a popup form (Emoji picker, Name, MBTI, Status,
  Gender, Relationship, Sub Category) for adding a new person.
- **⇅ Import/Export** opens a popup with three actions (emojis aren't
  supported in CSV, so the Emoji column is left out of all of them —
  imported entries default to ❓ until you assign one by hand):
  - **Import** — loads entries from a CSV file, then shows an **Import
    Preview** screen before anything is saved: every row is listed with a
    ✓ Ready / ⚠️ warning / Skipped status (missing Name, or an MBTI/Status/
    Relationship/Sub Category value that doesn't match a known option get
    flagged, matched case-insensitively where possible). From there you pick
    **Add to existing data** or **Replace existing data** and confirm.
  - **Export** — saves all current entries as a CSV file.
  - **Download Template** — a blank CSV with the correct columns
    (Name, MBTI, Status, Gender, Relationship, Sub Category) and one example
    row, ready to fill in.
- A checkbox column lets you **select multiple rows** (or Select All in the
  header) and **bulk-delete** them at once via the button that appears next
  to Import/Export.
- Each row also has its own ✏️ (edit — opens the same popup, pre-filled) and
  🗑️ (delete, with a confirmation prompt) actions.

### Grid view

- All 16 MBTI types laid out in a 4×4 grid, each split into a Male (left)
  and Female (right) column, with every recorded person shown as their
  emoji icon in that type/gender's slot.
- Hovering an icon shows the person's name and Sub Category (or Relationship,
  if no Sub Category is set).
- Clicking an icon opens the same Add/Edit popup as the List view, so you
  can edit an entry without leaving the grid.
- **Clicking a type's header** (e.g. "INTJ — Architect") opens a detail
  popup for that type:
  - Male/female avatar images (see [Avatars](#avatars) below).
  - A list of every recorded member of that type.
  - A short, fixed **Stereotypes** list (three descriptors per type).
  - An **Observations** list — starts empty and is meant to be built up
    over time as you research each type; add a bullet with the input box,
    remove one with its ✕. This is stored separately from your entries and
    persists across visits.

## Data & storage

Everything is saved in the browser's `localStorage` — nothing leaves your
machine, and nothing is shared between browsers/devices. Relevant keys:

| Key | What it holds |
|---|---|
| `mbtiViewer.entries` | Your list of people. |
| `mbtiViewer.dataVersion` | A marker used to (re)seed `mbtiViewer.entries` with the built-in starter dataset in [`script.js`](script.js) the first time the app runs, or after a deliberate reset (see below). |
| `mbtiViewer.observations` | Your per-type Observations bullets from the Grid detail popup. |

**Clearing your data:** clearing the site's storage (e.g. via browser dev
tools → Application → Local Storage, or a private/incognito window) resets
entries back to the seed dataset and clears all Observations.

**Resetting to a fresh seed:** the `DATA_VERSION` constant near the top of
[`script.js`](script.js) controls this. Bumping its value wipes whatever's
currently in `mbtiViewer.entries` and replaces it with the `DEFAULT_ENTRIES`
array in that same file, the next time the page loads. This was used once to
load an initial dataset — normal use (adding/editing/deleting through the
UI) never touches it.

## Avatars

The Grid detail popup looks for avatar images in [`imgs/`](imgs) named:

```
<N>) <CODE> <M|F>.png
```

e.g. `4) INTJ M.png`, `4) INTJ F.png` — where `<N>` is the type's 1-based
position in the fixed order ISTJ, ISFJ, INFJ, INTJ, ISTP, ISFP, INFP, INTP,
ESTP, ESFP, ENFP, ENTP, ESTJ, ESFJ, ENFJ, ENTJ (this is the `MBTI_TYPES`
array in [`script.js`](script.js)). Keep this naming pattern if you replace
or add avatar images.

## Project structure

```
index.html         Markup: List view, Grid view, Add/Edit modal, MBTI detail modal
login.html          The Google sign-in screen
style.css           All styling (dark purple/black theme, layout, modal styles)
script.js           All app behavior: data model, rendering, sorting, modals, storage
firebase-config.js  Firebase project config + init — fill in your own values here
auth-guard.js       Redirects index.html to login.html when signed out; wires Sign Out
login.js            Wires the "Continue with Google" button on login.html
imgs/               Avatar images (per MBTI type/gender), the header logo, and favicon
```

There's no framework, bundler, or package manager involved — just plain
files plus two CDN-loaded libraries: Firebase
([Authentication](https://firebase.google.com/docs/auth/web/google-signin))
for Google sign-in, and
[`emoji-picker-element`](https://github.com/nolanlawson/emoji-picker-element)
for the emoji picker in the Add/Edit form.
