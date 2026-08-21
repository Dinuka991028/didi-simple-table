# didi-simple-table — improvement backlog

Audit of the library: what to **fix**, **optimize**, and **add** so it is usable for developers worldwide (Angular 14–19 apps, i18n, SSR, large/server tables).

The core is already strong: typed columns, nested keys, client/server paging, search, sort, selection, sticky header, column collapse, and stacked mobile. The risk is not “too few features”. It is that Angular 15+ users cannot install it cleanly, large/server tables will feel laggy, and non-English apps cannot ship it.

Suggested order of work is at the end.

---

## 1. Fix first (these will bite users)

### 1.1 Peer dependencies only allow Angular 14

`projects/simple-table/package.json` currently has:

```json
"peerDependencies": {
  "@angular/common": "^14.0.0",
  "@angular/core": "^14.0.0"
}
```

`^14.0.0` means **14.x only**. Most apps today are 16–22, so npm will warn or refuse to install.

**Done.** Peer range is `>=14.0.0 <23.0.0` (Angular 14 through 22). Widen the upper bound when Angular 23 ships and the library is verified against it.

### 1.2 Standalone API

**Done.** The component and template directives are `standalone: true`. `SIMPLE_TABLE_IMPORTS` is the one-line standalone import; `SimpleTableModule` re-exports the same pieces for NgModule apps.

### 1.3 Search is not debounced

Every keystroke updates `search` and emits `queryChange`. In `pagination="server"` that hits the API on every letter. This is the most common datatable complaint worldwide.

- Debounce input (~250–400ms)
- Emit immediately on Enter and on clear
- Make delay configurable (for example `searchDebounce`)

### 1.4 No `trackBy` on rows

```html
*ngFor="let row of displayData"
```

Without `trackBy` (and usually `identityKey`), paging, sorting, and API refreshes rebuild every row. Selection highlight and focus jump.

Add `trackBy` using `identityKey` when present, with a stable fallback.

### 1.5 Getters recompute filter + sort on every change detection

`filteredData`, `sortedData`, `displayData`, `visibleColumns`, `getCellTemplate()`, and `getHeaderTemplate()` all run again on every CD cycle.

- Switch to **OnPush**
- Cache derived data in `ngOnChanges`
- Look up cell/header templates once into a `Map`

### 1.6 Generic CSS class names + `ViewEncapsulation.None`

Host styles are unencapsulated. Names like `.table-wrap`, `.table-container`, `.sort-button`, and `.column-menu` can collide with the consuming app.

Prefix everything `didi-` (already done for the pager: `.didi-pager`).

Also clean up duplicate CSS custom properties in the inherit theme (for example `--didi--muted` declared twice).

### 1.7 Hardcoded English UI

Pager, search, “Columns”, “Previous/Next”, “Select all…”, and sort aria labels are English-only. `emptyMessage` / `searchPlaceholder` are not enough.

Worldwide teams need one of:

- Inputs for every visible string
- Angular i18n / `$localize`
- An `intl` / `labels` object the parent can override

RTL is also missing (`text-align: left` is hardcoded). Arabic/Hebrew apps will look wrong. Use logical properties (`text-align: start`, `margin-inline`, sticky `inset-inline-start`).

### 1.8 SSR / Angular Universal will break

`ResizeObserver`, `document:click`, and `hasVisibleContent()` (creates a real DOM view) assume a browser.

Guard those with `isPlatformBrowser`, or the table cannot be used with Angular Universal.

### 1.9 Library tests look unrunnable as configured

- `tsconfig.spec.json` types `vitest/globals`
- Specs use Jasmine (`jasmine.objectContaining`)
- The library project in `angular.json` has no Karma config (the demo does)

CI cannot trust this suite until that is aligned (one runner, one config, specs matching that runner).

### 1.10 Template-only columns fight the type system

`actions` columns force hacks like `actions?: unknown` on the row type. Developers hit this immediately.

Allow a virtual key, for example:

- `key: TableField<T> | \`_${string}\``
- or a separate `id` that is not a row field

### 1.11 `identityKey` does not support nested paths

Column keys support `address.city`. `identityKey` is only `keyof T & string`. After API refresh, nested identities cannot be used the same way.

### 1.12 Click also toggles selection

A row click both emits `rowClick` and toggles selection. Apps often want click = navigate, checkbox = select. Separate those behaviors (input or documented opt-out).

### 1.13 Select-all is only the current page

The header checkbox selects “this page”. That surprises users who expect “all matching rows”. Offer **this page** vs **all filtered**.

### 1.14 Loading replaces the whole body

`[loading]="true"` removes rows and shows a status cell. Every page/sort in server mode flashes the UI. Overlay or skeleton on top of the last page is the expected pattern.

### 1.15 Empty vs no-search-results

“No data” vs “No matching rows” should be distinct without the parent hacking `emptyMessage`.

### 1.16 `color-mix()` in the inherit theme

Unsupported on older Safari. If Angular 14 is still claimed, provide fallback colors.

### 1.17 Content templates are read once

`ngAfterContentInit` does not subscribe to `QueryList` changes. Dynamic templates will not appear. Subscribe to `changes` (and rebuild the template `Map`).

### 1.18 External data shrink does not emit `pageChange`

`currentPage` clamps for display, but if the parent replaces `data` with fewer rows, `page` can stay stale and `pageChange` is not emitted. Clamp and emit when `data` / `total` shrink.

---

## 2. Optimize (performance)

| Area | Why it matters |
| --- | --- |
| OnPush + memoized `displayData` | Client lists of a few thousand rows will feel slow otherwise |
| Debounced search | Server mode |
| `trackBy` | Stops DOM thrash |
| Template maps | `getCellTemplate()` currently scans `QueryList` per cell |
| Optional virtual scroll | Anyone past ~500–1000 visible rows (Angular CDK virtual scroll is the usual answer) |
| Document click listener | You already early-return when the column menu is closed; a document listener still exists for every table instance |

Avoid sorting/filtering work when `pagination === 'server'` (already skipped in getters — keep that invariant after caching).

---

## 3. Add (what developers actually look for)

Compared with PrimeNG Table, Angular Material table, AG Grid, and ngx-datatable.

### High — almost every product table needs these

1. **Column width / minWidth / align**  
   Numbers and money must right-align. Without `align: 'right' | 'center'` and width, financial/admin tables look amateur.

2. **Column filters** (not only global search)  
   Per-column text, select, date range, number range. Server mode should add `filters` to `TableQuery`.

3. **Loading overlay that keeps previous rows**  
   See 1.14.

4. **Row/cell class callbacks**  
   `rowClass`, `cellClass` for status colors, disabled rows, errors.

5. **Separate row click from selection**  
   See 1.12.

6. **Select all matching rows, not only this page**  
   See 1.13.

7. **Empty vs no-search-results**  
   See 1.15.

8. **Footer / summary row**  
   Totals, counts, averages. Extremely common in dashboards.

### Medium — expected in a “real” datatable

9. Resizable + reorderable columns  
10. Pin more than the first column  
11. Expandable / master-detail rows  
12. CSV export of visible (or all) rows  
13. Density (`comfortable` / `compact`) independent of color theme  
14. Striped rows  
15. Null placeholder (`—` or custom)  
16. `identityKey` as a nested path (same as column keys)  
17. Keyboard grid navigation (arrow keys, **one tab stop**). `tabindex="0"` on every row is an a11y problem: too many tab stops.

### Lower — nice, not required for v1

18. Tree / grouping / aggregation  
19. Inline cell editing  
20. Excel-like copy  
21. Column chooser persistence helper (`localStorage`)  
22. Built-in date/number pipes with locale  

---

## 4. Accessibility

- Roving tabindex instead of `tabindex="0"` on every row  
- WAI-ARIA grid pattern (arrow keys between cells)  
- Focus management after page change  
- Stacked cards: `thead { display: none }` plus `data-label` is weak for screen readers; keep a proper accessible name  
- Translate all `aria-label` strings via the same `labels` API  
- Do not announce loading and empty as competing live regions if both can flash  

---

## 5. Packaging / trust

- Add a **LICENSE** (MIT is typical). Many companies cannot use a package without one.  
- Align versions: workspace root `package.json` is `0.1.2`, the library is `0.1.6`.  
- Add **CHANGELOG**.  
- Document **Angular version matrix** (14–19).  
- Keep NgModule, but lead README with standalone import.  
- Confirm Ivy **partial compilation** stays on for the published build (`compilationMode: "partial"` is already set in `tsconfig.lib.prod.json`).  

---

## 6. Suggested implementation order

Do this sequence so install, speed, and i18n land before extra table chrome.

1. Widen peer deps + standalone API  
2. OnPush, `trackBy`, cached sort/filter, debounced search  
3. Prefix CSS + SSR guards  
4. `labels` / i18n + RTL  
5. Column `width` / `align`, loading overlay, row/cell class, click vs select  
6. Per-column filters + `filters` on `TableQuery`  
7. Footer/summary, export, resize/reorder, virtual scroll as later milestones  

---

## 7. Checklist (quick reference)

**Must fix**

- [x] Peer deps `>=14 <23`  
- [x] Standalone exports  
- [x] Debounced search  
- [x] `trackBy` + OnPush + memoized derived data  
- [x] `didi-` CSS prefixes  
- [x] i18n labels + RTL  
- [x] SSR guards  
- [x] Runnable unit tests  
- [x] Virtual / actions column typing  
- [x] LICENSE + version alignment  

**Should add soon**

- [x] Column width / align  
- [x] Loading overlay  
- [x] `rowClass` / `cellClass`  
- [x] Click vs select  
- [x] Select-all scope  
- [x] Distinct empty / no-results  
- [x] Footer / summary  
- [x] Column filters on `TableQuery`  

**Later**

- [x] Resize / reorder / extra pinned columns  
- [x] Expandable rows  
- [x] CSV export  
- [x] Virtual scroll  
- [x] Grouping, inline edit, locale pipes  
