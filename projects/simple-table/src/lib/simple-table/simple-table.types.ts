export type SortDirection = 'asc' | 'desc';
export type SortType = 'auto' | 'string' | 'number' | 'date';
export type PaginationMode = 'client' | 'server';
export type PagerNav = 'label' | 'icon';
export type SelectionMode = 'single' | 'multiple';
export type SelectAllMode = 'page' | 'filtered';
export type ResponsiveMode = 'scroll' | 'stack';
export type Density = 'comfortable' | 'compact';
export type ColumnAlign = 'start' | 'center' | 'end';
export type ColumnPin = boolean | 'start' | 'end';
export type ColumnFilterType = 'text' | 'select' | 'number' | 'date';
export type FormatType = 'number' | 'date' | 'currency';

export const TABLE_THEMES = ['inherit', 'light', 'dark', 'teal', 'warm', 'compact'] as const;
export type TableTheme = typeof TABLE_THEMES[number];

type PrevDepth = [never, 0, 1, 2, 3];

type IsPlainObject<T> = T extends Date | ReadonlyArray<unknown> | ((...args: never[]) => unknown)
  ? false
  : T extends object
    ? true
    : false;

export type NestedKeyOf<T, Depth extends number = 3> = [Depth] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T & string]: IsPlainObject<NonNullable<T[K]>> extends true
          ? K | `${K}.${NestedKeyOf<NonNullable<T[K]>, PrevDepth[Depth]>}`
          : K;
      }[keyof T & string]
    : never;

/** Template-only columns such as `_actions` do not need a matching field on the row. */
export type VirtualField = `_${string}`;

export type TableField<T> = NestedKeyOf<T> | VirtualField;

export interface TableFilterOption {
  label: string;
  value: string;
}

export interface TableColumn<T> {
  key: TableField<T>;
  label: string;
  sortable?: boolean;
  hidden?: boolean;
  collapsible?: boolean;
  hideOnMobile?: boolean;
  width?: string;
  minWidth?: string;
  align?: ColumnAlign;
  pinned?: ColumnPin;
  editable?: boolean;
  filter?: boolean | ColumnFilterType;
  filterOptions?: TableFilterOption[];
  format?: (value: unknown, row: T) => unknown;
  formatType?: FormatType;
  formatOptions?: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions;
  sortType?: SortType;
  compare?: (left: unknown, right: unknown, leftRow: T, rightRow: T) => number;
  footer?: (rows: T[]) => unknown;
}

export interface TableSort<T = Record<string, unknown>> {
  key: TableField<T>;
  direction: SortDirection;
}

export type TableSortState<T = Record<string, unknown>> = TableSort<T> | TableSort<T>[] | null;

export type TableFilters<T = Record<string, unknown>> = Partial<Record<TableField<T>, string>>;

export interface DidiCellContext<T> {
  $implicit: T;
  row: T;
  column: TableColumn<T>;
  value: unknown;
}

export interface DidiHeaderContext<T> {
  $implicit: TableColumn<T>;
  column: TableColumn<T>;
}

export interface DidiDetailContext<T> {
  $implicit: T;
  row: T;
}

export interface DidiFooterContext<T> {
  $implicit: TableColumn<T>;
  column: TableColumn<T>;
  rows: T[];
  value: unknown;
}

export interface TableQuery<T = Record<string, unknown>> {
  page: number;
  pageSize: number | null;
  sort: TableSortState<T>;
  search: string;
  filters: TableFilters<T>;
}

export interface TableCellEdit<T = Record<string, unknown>> {
  row: T;
  key: TableField<T>;
  value: string;
}

export interface TableLabels {
  search: string;
  columns: string;
  columnsHidden: string;
  previous: string;
  next: string;
  firstPage: string;
  lastPage: string;
  rows: string;
  pageOf: string;
  rangeOf: string;
  selectAllPage: string;
  selectAllFiltered: string;
  selectRow: string;
  hideColumn: string;
  showAllColumns: string;
  sortBy: string;
  sortAsc: string;
  sortDesc: string;
  visibleColumns: string;
  exportCsv: string;
  expandRow: string;
  collapseRow: string;
  noData: string;
  noResults: string;
  loading: string;
  rowsPerPage: string;
  pagination: string;
  theme: string;
}

export const DEFAULT_TABLE_LABELS: TableLabels = {
  search: 'Search',
  columns: 'Columns',
  columnsHidden: 'Columns ({count} hidden)',
  previous: 'Previous',
  next: 'Next',
  firstPage: 'First',
  lastPage: 'Last',
  rows: 'Rows',
  pageOf: 'Page {page} of {total}',
  rangeOf: '{start}–{end} of {total}',
  selectAllPage: 'Select all rows on this page',
  selectAllFiltered: 'Select all matching rows',
  selectRow: 'Select row',
  hideColumn: 'Hide {label} column',
  showAllColumns: 'Show all',
  sortBy: 'Sort by {label}',
  sortAsc: 'Sort {label}, currently ascending',
  sortDesc: 'Sort {label}, currently descending',
  visibleColumns: 'Visible columns',
  exportCsv: 'Export CSV',
  expandRow: 'Expand row',
  collapseRow: 'Collapse row',
  noData: 'No data',
  noResults: 'No matching rows',
  loading: 'Loading...',
  rowsPerPage: 'Rows per page',
  pagination: 'Table pagination',
  theme: 'Theme'
};

export function interpolateLabel(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}
