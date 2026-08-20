export interface TableColumn<T> {
  key: keyof T & string;
  label: string;
}

export interface DidiCellContext<T> {
  $implicit: T;
  row: T;
  column: TableColumn<T>;
}
