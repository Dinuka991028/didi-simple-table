# Changelog

## 0.2.0

- Peer dependencies: Angular 14 through 22 (`>=14.0.0 <23.0.0`).
- Standalone API (`SIMPLE_TABLE_IMPORTS`) with `SimpleTableModule` as a re-export.
- OnPush change detection, `trackBy`, memoized filter/sort, debounced search (`searchDebounce`).
- Prefixed CSS classes (`didi-table-wrap`, `didi-sort-button`, …). This is a breaking change if you targeted the old unprefixed selectors.
- `labels` for i18n, logical CSS for RTL, `color-mix` fallbacks, SSR guards.
- Virtual column keys (`_actions`), nested `identityKey`, `selectOnRowClick`, `selectAllMode`, loading overlay, distinct empty / no-results.
- Column width/align/pin/filter/footer, row/cell classes, expandable rows, grouping, CSV export, resize/reorder, virtual scroll, `persistKey`, locale `formatType`.
- Pin identifier columns with `pinned: true` / `'start'`, and action columns with `pinned: 'end'`. `[stickyFirstColumn]` still pins the first column.
- MIT license. Unit tests run with Karma/Jasmine.

## 0.1.6

- Typed table with sort, search, pagination, selection, sticky header, collapse, and stacked mobile layout.
