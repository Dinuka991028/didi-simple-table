# Changelog

## Unreleased

- GitHub Pages homepage is the live Angular demo instead of the README.
- README and npm listing now position the library as a lightweight Angular data table, with discovery keywords and a 1,200-row GitHub Pages demo.

## 0.2.0

- Peer dependencies: Angular 14 through 22 (`>=14.0.0 <23.0.0`).
- Standalone API (`SIMPLE_TABLE_IMPORTS`) with `SimpleTableModule` as a re-export.
- OnPush change detection, `trackBy`, memoized filter/sort, debounced search (`searchDebounce`).
- Prefixed CSS classes (`didi-table-wrap`, `didi-sort-button`, …). This is a breaking change if you targeted the old unprefixed selectors.
- `labels` for i18n, logical CSS for RTL, `color-mix` fallbacks, SSR guards.
- Virtual column keys (`_actions`), nested `identityKey`, `selectOnRowClick`, `selectAllMode`, loading overlay, distinct empty / no-results.
- Column width/align/pin/filter/footer, row/cell classes, expandable rows, grouping, CSV export, resize/reorder, virtual scroll, `persistKey`, locale `formatType`.
- Pin identifier columns with `pinned: true` / `'start'`, and action columns with `pinned: 'end'`. `[stickyFirstColumn]` still pins the first column.
- Column menu **Show all** restores every hidden column in one click.
- Pager First / Last jumps to the start or end of the pages.
- `[pagerNav]="'icon'"` switches pager buttons from words to « ‹ › ».
- Optional toolbar **theme picker** (`themePicker`), off unless the app developer enables it.
- MIT license. Unit tests run with Karma/Jasmine.

## 0.1.6

- Typed table with sort, search, pagination, selection, sticky header, collapse, and stacked mobile layout.
