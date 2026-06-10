# NSO Coach Portal — Project Context

## What This App Is

The NSO Coach Portal is a web app used by Opening Support Coaches (OSCs) at Sandbox VR to manage new store openings. During a 5-day training program (plus 3 opening weekend days), the coach uses this portal to:

- Track which trainees have been signed off on each competency
- Log daily recaps that get sent to Slack
- Record attendance each day
- Run Day 0 readiness checks before training begins
- Submit a Post-Opening OSC Report after the store opens

There is also an **admin view** for managers to see all active openings across every store.

---

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, and JavaScript. No framework, no build step.
- **Backend/Database:** Supabase (Postgres + Auth + Row Level Security)
- **Hosting:** GitHub Pages (`prismo1020/nso-portal` → `prismo1020.github.io/nso-portal/`)
- **Deployment:** Push to `main` branch → auto-deploys in ~1-2 minutes. No Netlify, no CI pipeline.

---

## File Structure

```
index.html   — All markup. Single-page app with sections shown/hidden via JS.
style.css    — All styles. Includes mobile responsive breakpoints.
app.js       — All application logic (~3000+ lines).
db.js        — All Supabase queries. Thin data layer, no ORM.
```

No `node_modules`, no `package.json`, no bundler.

---

## Key Concepts

### Openings
Each store opening is a row in the `openings` table. A coach creates one opening per store. Everything else (trainees, sign-offs, recaps) belongs to an opening via `opening_id`.

### Trainees and Roles
Trainees have one of four roles: `GEG`, `Lead GEG`, `ASM`, `SM`.

- `GEG` and `Lead GEG` are general team members
- `ASM` and `SM` are leadership roles
- Some competencies are **smOnly** — they only apply to SM and ASM trainees. GEG trainees should see these as N/A everywhere.

### COMPETENCIES Array
Defined in `app.js`. This is the master list of sign-off competencies. Each entry looks like:
```js
{ id: 'comp-id', name: 'Display Name', day: 3, smOnly: false }
```
`smOnly: true` means the competency only applies to SM/ASM trainees.

### Sign-offs
Stored in the `signoffs` table with columns: `trainee_id`, `competency_id`, `status` (`'signed'` or `'pending'`), `opening_id`.

**Important:** Attendance is also stored in the signoffs table as `competency_id = 'attendance-d1'` through `'attendance-d8'`. These are NOT in the COMPETENCIES array. Always filter them out when calculating sign-off percentages:
```js
.filter(s => !s.competency_id.startsWith('attendance-'))
```

### state Object
All runtime data lives in `state`:
```js
state.openingId       // UUID of the current opening
state.trainees        // Array of { id, name, role, notes }
state.signoffs        // Object: { 'traineeId_compId': 'signed' | 'pending' }
state.recaps          // Object: { 1: {...}, 2: {...}, ... } — keyed by day number
state.franchiseChecks // Object: { 'check-key': true/false }
state.oscReport       // Object of OSC report fields
state.currentDay      // Number 1-8
```

### Recaps
Recaps are stored in the `recaps` table with a `recap_data` JSONB column. Each day's recap is one row (`day_num` 1–8). The JSONB stores all form fields by key, e.g.:
- `ld-progress`, `ld-delays`, `ld-problem`, `ld-actions`
- `tech-mscap`, `tech-tickets`, `tech-unusual`, `tech-problem`, `tech-actions`
- `team-progress`, `team-successes`, `team-opportunities`, `team-values`, `sm-execution`
- `building-permits`, `building-construction`, `building-problem`, `building-actions`

**Old dead column names** (do not use): `ld_topics`, `ld_team`, `tech`, `ops`, `sm_notes`, `tomorrow`, `actions`. These columns may still exist in the DB but are not used.

### Training Days
Days 1–5 are training days. Days 6, 7, 8 are opening weekend (Friday, Saturday, Sunday).
```js
const dayTitles = ['Guest Experience','Service & Tech','Role-Play & Ops','Full Roleplay','Friends & Family','Opening Weekend — Friday','Opening Weekend — Saturday','Opening Weekend — Sunday'];
```

### Navigation
Single-page app. `navigate(section)` shows/hides sections and uses `history.pushState` for browser back button support.

### Admin Access
Gated by `EDIT_EMAILS` array in `app.js`. If the logged-in user's email is in this list, they see the admin view.

---

## Database Schema (Supabase)

### `openings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| store_name | text | |
| coach_name | text | |
| start_date | date | |
| current_day | int | 1–8 |
| status | text | 'active' / 'complete' |
| user_id | uuid | FK to auth.users |

### `trainees`
| Column | Type |
|--------|------|
| id | uuid PK |
| opening_id | uuid FK |
| name | text |
| role | text |
| notes | text |

### `signoffs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK |
| opening_id | uuid FK | |
| trainee_id | uuid FK | |
| competency_id | text | comp id OR 'attendance-d1' through 'attendance-d8' |
| status | text | 'signed' or 'pending' |

### `recaps`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| opening_id | uuid FK | |
| day_num | int | 1–8 (CHECK constraint: 1–8) |
| recap_data | jsonb | All recap fields stored here |
| updated_at | timestamptz | |

Unique constraint on `(opening_id, day_num)` — upserted on save.

### `franchise_checks`
| Column | Type |
|--------|------|
| opening_id | uuid FK |
| check_key | text |
| checked | boolean |

### `osc_reports`
One row per opening. Key fields: `ff_headcount`, `weekend_bookings`, `t1_ticket_count`, `team_resolvable`, `biz_impact_notes`, `deployed_by`, `deployment_rating`, `deployment_notes`, `tech_specialist` (bool), `tech_specialist_name`, `tech_specialist_notes`, `team_rating`, `team_notes`, `sm_rating`, `sm_notes`, `asm_rating`, `asm_notes`, `fo_rating`, `fo_notes`.

Row Level Security is enabled on all tables. Authenticated users can read/write their own data.

---

## Common Patterns to Follow

### Calculating sign-off percentages — always filter smOnly for GEGs
```js
const isLeader = trainee.role === 'SM' || trainee.role === 'ASM';
const applicableComps = COMPETENCIES.filter(c => !c.smOnly || isLeader);
const signed = applicableComps.filter(c => state.signoffs[trainee.id + '_' + c.id] === 'signed').length;
const pct = Math.round((signed / applicableComps.length) * 100);
```

### Calculating total sign-offs across all trainees — always exclude attendance
```js
const allSigned = Object.entries(state.signoffs)
  .filter(([k, v]) => v === 'signed' && !k.includes('_attendance-')).length;

let allTotal = 0;
state.trainees.forEach(t => {
  const isLeader = t.role === 'SM' || t.role === 'ASM';
  COMPETENCIES.forEach(c => { if (!c.smOnly || isLeader) allTotal++; });
});
```

### Saving a recap
```js
state.recaps[day][fieldKey] = value;
await dbSaveRecap(day); // upserts into recaps table
```

### Rendering Slack-style bold text
```js
function renderSlackHTML(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}
```

### Copying recap to clipboard (bold works in Slack)
Use `ClipboardItem` with both `text/html` and `text/plain` — Slack desktop reads the HTML for bold. Must be `async/await`, not `.then()`.

---

## Known Quirks

- **CRLF line endings** in `index.html` — if using the Edit tool and getting "string not found" errors, re-read the file first to get the exact bytes.
- **Attendance sign-offs inflate counts** if you forget to filter `attendance-d*` keys — this has bitten us multiple times.
- **smOnly competencies** must be excluded in every percentage calculation, every totals display, every pending list, and every export. Check all four places if you change this logic.
- **recap_data field names use hyphens** (`ld-progress`) not underscores. The old DB column names used underscores (`ld_topics`) — those are dead, do not reference them.

---

## Features Overview

| Feature | Where in UI | Key function(s) |
|---------|------------|----------------|
| Sign-off table | Sign-Offs section | `renderSignoffTable()` |
| Daily recap form | Daily Recap section | `loadRecapFields()`, `updateRecapPreview()`, `saveRecap()` |
| Slack copy | Daily Recap section | `copyRecap()` |
| Team Roster modal | Dashboard | `openRosterModal()` |
| Day 0 checks | Franchise Checks section | `renderFranchiseChecks()` |
| OSC Report | Post-Opening OSC Report section | `loadOSCPage()`, `saveOSCReport()` |
| Admin view | Admin section (EDIT_EMAILS only) | `renderAdminView()` |
| CSV Export | Admin view per-opening | `exportOpeningCSV()` |
| Dashboard stats | Dashboard | `updateDashboardStats()`, `updateRecapStatusCard()` |
| Mobile nav | All pages | `toggleSidebar()`, `closeSidebar()` |

---

## Deployment

```bash
git add .
git commit -m "your message"
git push
```

That's it. GitHub Pages auto-deploys from the `main` branch. Live at: `https://prismo1020.github.io/nso-portal/`
