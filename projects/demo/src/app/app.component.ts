import { Component } from '@angular/core';
import { TableColumn } from 'didi-simple-table';

interface User {
  name: string;
  email: string;
  role: string;
}

const USERS: User[] = [
  { name: 'Ada Lovelace', email: 'ada@example.com', role: 'Engineer' },
  { name: 'Alan Turing', email: 'alan@example.com', role: 'Researcher' },
  { name: 'Grace Hopper', email: 'grace@example.com', role: 'Admiral' }
];

type DemoView = 'data' | 'empty' | 'loading';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  view: DemoView = 'data';

  columns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' }
  ];

  get users(): User[] {
    return this.view === 'empty' ? [] : USERS;
  }

  get loading(): boolean {
    return this.view === 'loading';
  }

  show(view: DemoView): void {
    this.view = view;
  }
}
