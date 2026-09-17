# MBTI Tracker

A single-page, no-build web app for tracking the MBTI types of people in your
life — friends, family, coworkers, romantic interests — with both a
spreadsheet-style list and a visual 16-type grid. All data is kept locally in
the browser (nothing is shared between accounts or devices); a Google sign-in
just gates who can open the page.

## Running it

Go here to sign in with Google and start tracking your MBTIs:
> https://udongear.github.io/MBTI-Tracker/

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
for Google sign-in, and
[`emoji-picker-element`](https://github.com/nolanlawson/emoji-picker-element)
for the emoji picker in the Add/Edit form.
