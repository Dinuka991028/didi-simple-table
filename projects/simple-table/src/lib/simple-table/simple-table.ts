import { Component, Input } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'simple-table',
  standalone: true,
  templateUrl: './simple-table.html',
  styleUrl: './simple-table.css'
})
export class SimpleTableComponent {

  @Input() data: any[] = [];

  @Input() columns: TableColumn[] = [];

}
