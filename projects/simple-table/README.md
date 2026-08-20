# didi-simple-table

A small, typed table component for Angular 14+.

Pass in columns and row data. The table renders headers, cells, empty and loading states, and custom cell templates. A horizontal scroll container appears when the content is wider than its parent.

![didi-simple-table preview](../../docs/preview.png)

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
      [loading]="loading"
    >
      <ng-template didiCell="email" let-row>
        <a [href]="'mailto:' + row.email">{{ row.email }}</a>
      </ng-template>

      <ng-template didiCell="role" let-row>
        <span class="badge">{{ row.role }}</span>
      </ng-template>

      <ng-template didiEmpty>No users to show.</ng-template>
      <ng-template didiLoading>Loading users…</ng-template>
    </didi-simple-table>
  `
})
export class UsersComponent {
  loading = false;

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

Columns without a `didiCell` template still print the field value. If `loading` is true, the loading state replaces the rows. If `loading` is false and `data` is empty, the empty state is shown instead.

## API

### Selector

`didi-simple-table`

### Inputs

| Input            | Type               | Default        | Description                                      |
| ---------------- | ------------------ | -------------- | ------------------------------------------------ |
| `columns`        | `TableColumn<T>[]` | `[]`           | Header labels and which field each column reads. |
| `data`           | `T[]`              | `[]`           | Rows to render.                                  |
| `loading`        | `boolean`          | `false`        | When true, shows the loading state instead of rows. |
| `emptyMessage`   | `string`           | `'No data'`    | Empty text when there is no custom `didiEmpty` content. |
| `loadingMessage` | `string`           | `'Loading...'` | Loading text when there is no custom `didiLoading` content. |

### Templates

| Template                 | Context                         | Description |
| ------------------------ | ------------------------------- | ----------- |
| `ng-template didiCell="key"` | `let-row` (also `row`, `column`) | Custom cell for the column whose `key` matches. |
| `ng-template didiEmpty`  | none                            | Custom empty content. Omit it, or leave it empty, to use `emptyMessage`. |
| `ng-template didiLoading`| none                            | Custom loading content. Omit it, or leave it empty, to use `loadingMessage`. |

### `TableColumn<T>`

| Field   | Type               | Description                                  |
| ------- | ------------------ | -------------------------------------------- |
| `key`   | `keyof T & string` | Property on each row to show in this column. |
| `label` | `string`           | Header text.                                 |

`T` defaults to `Record<string, unknown>` if you do not pass a row type.

## Local development

From the workspace root, start the demo app. It imports this library from source.

```bash
npm start
```

Open `http://localhost:4200/`.

## Build

```bash
npm run build
```

Publish from `dist/simple-table`.
