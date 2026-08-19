# didi-simple-table

A small, typed table component for Angular 14+.

Pass in columns and row data. The table renders headers, cells, and a horizontal scroll container when the content is wider than its parent.

![didi-simple-table preview](docs/preview.png)

## Install

```bash
npm install didi-simple-table
```

Peer dependencies: `@angular/core` and `@angular/common` `^14.0.0`.

## Usage

Import `SimpleTableModule` in the module that will use the table.

```ts
import { NgModule } from '@angular/core';
import { SimpleTableModule } from 'didi-simple-table';

import { UsersComponent } from './users.component';

@NgModule({
  declarations: [UsersComponent],
  imports: [SimpleTableModule]
})
export class UsersModule {}
```

Define a row type, then bind `columns` and `data`. `key` is checked against the row type, so typos fail at compile time.

```ts
import { Component } from '@angular/core';
import { TableColumn } from 'didi-simple-table';

interface User {
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-users',
  template: `
    <didi-simple-table
      [columns]="columns"
      [data]="users"
    ></didi-simple-table>
  `
})
export class UsersComponent {
  columns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' }
  ];

  users: User[] = [
    { name: 'Ada Lovelace', email: 'ada@example.com', role: 'Engineer' },
    { name: 'Alan Turing', email: 'alan@example.com', role: 'Researcher' },
    { name: 'Grace Hopper', email: 'grace@example.com', role: 'Admiral' }
  ];
}
```

## API

### Selector

`didi-simple-table`

### Inputs

| Input     | Type               | Default | Description                                      |
| --------- | ------------------ | ------- | ------------------------------------------------ |
| `columns` | `TableColumn<T>[]` | `[]`    | Header labels and which field each column reads. |
| `data`    | `T[]`              | `[]`    | Rows to render.                                  |

### `TableColumn<T>`

| Field   | Type                | Description                                      |
| ------- | ------------------- | ------------------------------------------------ |
| `key`   | `keyof T & string`  | Property on each row to show in this column.     |
| `label` | `string`            | Header text.                                     |

`T` defaults to `Record<string, unknown>` if you do not pass a row type.

## Local development

This repo is an Angular workspace. The publishable library lives in `projects/simple-table`. The demo app in `projects/demo` imports it from source so you can try changes without publishing.

```bash
npm install
npm start
```

Open `http://localhost:4200/`.

```bash
npm run build
```

The library build output is written to `dist/simple-table`.
