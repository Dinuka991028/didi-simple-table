import { Component, Input } from '@angular/core';

export interface TableColumn<T> {
  key: keyof T & string;
  label: string;
}

@Component({
  selector: 'didi-simple-table',
  templateUrl: './simple-table.html',
  styleUrls: ['./simple-table.css']
})
export class SimpleTableComponent<T extends object = Record<string, unknown>> {
  @Input() data: T[] = [];
  @Input() columns: TableColumn<T>[] = [];

  getCellValue(row: T, column: TableColumn<T>): unknown {
    return (row as Record<string, unknown>)[column.key];
  }
}
