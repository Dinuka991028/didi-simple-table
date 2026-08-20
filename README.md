# didi-simple-table

A small, typed table component for Angular 14+.

Pass in columns and row data. The table renders headers, cells, empty and loading states, custom cell templates, optional column sorting, pagination, row click, selection, and a sticky header. A horizontal scroll container appears when the content is wider than its parent.

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
      [loading]="loading"
      [sortable]="true"
      [pageSize]="3"
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

Columns without a `didiCell` template still print the field value. If `loading` is true, the loading state replaces the rows. If `loading` is false and `data` is empty, the empty state is shown instead. With `[sortable]="true"`, click a header to cycle ascending, descending, and the original order. Set `sortable: false` on a column to keep that header static.

Set `[pageSize]` to paginate. Switch with `[pagination]="'client'"` or `[pagination]="'server'"`.

- **Client:** pass the full list. The table sorts and slices it.
- **Server:** pass one page, `[total]` from the API, and reload `data` on `(pageChange)` / `(sortChange)`.

`(rowClick)` emits the row you clicked. `[selectable]="'single'"` or `"'multiple'"` highlights rows; bind `[(selected)]` to keep them. Use `identityKey` so selection still matches after the API returns new objects.

`[stickyHeader]="true"` with `maxHeight` keeps headers visible while rows scroll. `caption` names the table for assistive tech.

```html
<didi-simple-table
  [columns]="columns"
  [data]="users"
  [loading]="loading"
  [sortable]="true"
  [sort]="sort"
  [pageSize]="10"
  [page]="page"
  [pagination]="pagination"
  [total]="total"
  (pageChange)="onPageChange($event)"
  (sortChange)="onSortChange($event)"
></didi-simple-table>
```

## API

### Selector

`didi-simple-table`

### Inputs

| Input            | Type               | Default        | Description                                      |
| ---------------- | ------------------ | -------------- | ------------------------------------------------ |
| `columns`        | `TableColumn<T>[]` | `[]`           | Header labels and which field each column reads. |
| `data`           | `T[]`              | `[]`           | Rows to render. Full list for client paging, or one page for server paging. |
| `loading`        | `boolean`          | `false`        | When true, shows the loading state instead of rows. |
| `emptyMessage`   | `string`           | `'No data'`    | Empty text when there is no custom `didiEmpty` content. |
| `loadingMessage` | `string`           | `'Loading...'` | Loading text when there is no custom `didiLoading` content. |
| `sortable`       | `boolean`          | `false`        | When true, clickable headers sort by that column. |
| `sort`           | `TableSort<T> \| null` | `null`     | Current sort. Use with `(sortChange)` or `[(sort)]`. |
| `pageSize`       | `number \| null`   | `null`         | Rows per page. Omit or `null` to show every row. |
| `page`           | `number`           | `1`            | Current page (1-based). Use with `(pageChange)` or `[(page)]`. |
| `pagination`     | `'client' \| 'server'` | `'client'` | `client` sorts and slices `data`. `server` leaves `data` as-is. |
| `total`          | `number \| null`   | `null`         | Total row count. Required for the pager in `server` mode. |
| `selectable`     | `false \| 'single' \| 'multiple'` | `false` | Row selection. `true` is the same as `'single'`. |
| `selected`       | `T[]`              | `[]`           | Currently selected rows. Use with `(selectedChange)` or `[(selected)]`. |
| `identityKey`    | `keyof T & string` | —              | Field used to compare rows after they are recreated (for example from an API). |
| `stickyHeader`   | `boolean`          | `false`        | When true, header cells stay visible while the table body scrolls. |
| `maxHeight`      | `string \| null`   | `null`         | Max height of the scroll area, for example `'240px'`. Use with `stickyHeader`. |
| `caption`        | `string`           | `''`           | Accessible table name (visually hidden). |

### Outputs

| Output        | Type                            | Description                                      |
| ------------- | ------------------------------- | ------------------------------------------------ |
| `sortChange`  | `TableSort<T> \| null`          | Emits on header click. `null` means unsorted.    |
| `pageChange`  | `number`                        | Emits when the page changes.                     |
| `rowClick`    | `T`                             | Emits the row when the row is clicked.           |
| `selectedChange` | `T[]`                        | Emits the selected rows.                         |

### Templates

| Template                 | Context                         | Description |
| ------------------------ | ------------------------------- | ----------- |
| `ng-template didiCell="key"` | `let-row` (also `row`, `column`) | Custom cell for the column whose `key` matches. |
| `ng-template didiEmpty`  | none                            | Custom empty content. Omit it, or leave it empty, to use `emptyMessage`. |
| `ng-template didiLoading`| none                            | Custom loading content. Omit it, or leave it empty, to use `loadingMessage`. |

### `TableColumn<T>`

| Field   | Type                | Description                                      |
| ------- | ------------------- | ------------------------------------------------ |
| `key`      | `keyof T & string` | Property on each row to show in this column. |
| `label`    | `string`           | Header text.                                 |
| `sortable` | `boolean`          | Set to `false` to disable sorting for this column when the table is sortable. |

`T` defaults to `Record<string, unknown>` if you do not pass a row type.

### `TableSort<T>`

| Field       | Type               | Description                          |
| ----------- | ------------------ | ------------------------------------ |
| `key`       | `keyof T & string` | Column currently being sorted.       |
| `direction` | `'asc' \| 'desc'`  | Sort direction.                      |

`null` means the table is showing rows in the original `data` order.

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
