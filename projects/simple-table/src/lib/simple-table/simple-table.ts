import { Component, Input } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'simple-table',
  templateUrl: './simple-table.html',
  styleUrls: ['./simple-table.css']
})
export class SimpleTableComponent {

  @Input() data: any[] = [];

  @Input() columns: TableColumn[] = [];

}
