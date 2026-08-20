export type SortDirection = 'asc' | 'desc';
export type SortType = 'auto' | 'string' | 'number' | 'date';
export type PaginationMode = 'client' | 'server';
export type SelectionMode = 'single' | 'multiple';
export const TABLE_THEMES = ['inherit', 'light', 'dark', 'teal', 'warm', 'compact'] as const;
export type TableTheme = typeof TABLE_THEMES[number];
export type ResponsiveMode = 'scroll' | 'stack';

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

export type TableField<T> = NestedKeyOf<T>;

export interface TableColumn<T> {
  key: TableField<T>;
  label: string;
  sortable?: boolean;
  hidden?: boolean;
  collapsible?: boolean;
  hideOnMobile?: boolean;
  format?: (value: unknown, row: T) => unknown;
  sortType?: SortType;
  compare?: (left: unknown, right: unknown, leftRow: T, rightRow: T) => number;
}

export interface TableSort<T = Record<string, unknown>> {
  key: TableField<T>;
  direction: SortDirection;
}

export type TableSortState<T = Record<string, unknown>> = TableSort<T> | TableSort<T>[] | null;

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

export interface TableQuery<T = Record<string, unknown>> {
  page: number;
  pageSize: number | null;
  sort: TableSortState<T>;
  search: string;
}
