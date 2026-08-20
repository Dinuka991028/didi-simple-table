export type SortDirection = 'asc' | 'desc';
export type PaginationMode = 'client' | 'server';
export type SelectionMode = 'single' | 'multiple';

export interface TableColumn<T> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
}

export interface TableSort<T = Record<string, unknown>> {
  key: keyof T & string;
  direction: SortDirection;
}

export interface DidiCellContext<T> {
  $implicit: T;
  row: T;
  column: TableColumn<T>;
}
