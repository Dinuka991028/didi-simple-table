import { Component, OnDestroy, OnInit } from '@angular/core';
import { PaginationMode, TableColumn, TableSort } from 'didi-simple-table';

interface User {
  name: string;
  email: string;
  role: string;
}

const USERS: User[] = [
  { name: 'Ada Lovelace', email: 'ada@example.com', role: 'Engineer' },
  { name: 'Alan Turing', email: 'alan@example.com', role: 'Researcher' },
  { name: 'Grace Hopper', email: 'grace@example.com', role: 'Admiral' },
  { name: 'Katherine Johnson', email: 'katherine@example.com', role: 'Mathematician' },
  { name: 'Margaret Hamilton', email: 'margaret@example.com', role: 'Engineer' },
  { name: 'Dorothy Vaughan', email: 'dorothy@example.com', role: 'Mathematician' },
  { name: 'Mary Jackson', email: 'mary@example.com', role: 'Engineer' },
  { name: 'Tim Berners-Lee', email: 'tim@example.com', role: 'Inventor' }
];

const SAMPLE: User[] = USERS.slice(0, 3);

type StatusView = 'data' | 'empty' | 'loading';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  basicColumns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' }
  ];
  basicUsers = SAMPLE;

  cellColumns: TableColumn<User>[] = this.basicColumns;
  cellUsers = SAMPLE;

  statusView: StatusView = 'data';
  statusColumns: TableColumn<User>[] = this.basicColumns;

  sortColumns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', sortable: false },
    { key: 'role', label: 'Role' }
  ];
  sortUsers = SAMPLE;
  headerSort: TableSort<User> | null = null;
  stickyUsers = USERS;

  selectionMode: false | 'single' | 'multiple' = 'single';
  selected: User[] = [];
  clicked: User | null = null;

  pagination: PaginationMode = 'client';
  empty = false;
  loading = false;
  page = 1;
  pageSize = 3;
  total = 0;
  sort: TableSort<User> | null = null;
  users: User[] = [];
  pageColumns: TableColumn<User>[] = this.sortColumns;

  private loadHandle: ReturnType<typeof setTimeout> | null = null;

  get statusData(): User[] {
    return this.statusView === 'empty' ? [] : SAMPLE;
  }

  get statusLoading(): boolean {
    return this.statusView === 'loading';
  }

  get tableData(): User[] {
    if (this.pagination === 'server') {
      return this.users;
    }

    return this.empty ? [] : USERS;
  }

  get isServer(): boolean {
    return this.pagination === 'server';
  }

  ngOnInit(): void {
    this.applyMode();
  }

  ngOnDestroy(): void {
    this.clearLoad();
  }

  get selectedNames(): string {
    return this.selected.map((user) => user.name).join(', ');
  }

  setStatus(view: StatusView): void {
    this.statusView = view;
  }

  onHeaderSort(sort: TableSort<User> | null): void {
    this.headerSort = sort;
  }

  setSelectionMode(mode: false | 'single' | 'multiple'): void {
    this.selectionMode = mode;
    this.selected = [];
    this.clicked = null;
  }

  onRowClick(user: User): void {
    this.clicked = user;
  }

  setPagination(pagination: PaginationMode): void {
    if (this.pagination === pagination) {
      return;
    }

    this.pagination = pagination;
    this.page = 1;
    this.sort = null;
    this.applyMode();
  }

  showData(): void {
    this.empty = false;
    this.page = 1;
    this.applyMode();
  }

  showEmpty(): void {
    this.empty = true;
    this.page = 1;
    this.applyMode();
  }

  onPageChange(page: number): void {
    this.page = page;
    if (this.isServer) {
      this.load();
    }
  }

  onSortChange(sort: TableSort<User> | null): void {
    this.sort = sort;
    this.page = 1;
    if (this.isServer) {
      this.load();
    }
  }

  private applyMode(): void {
    if (this.isServer) {
      this.load();
      return;
    }

    this.clearLoad();
    this.loading = false;
    this.total = 0;
    this.users = [];
  }

  private load(): void {
    this.clearLoad();
    this.loading = true;

    this.loadHandle = setTimeout(() => {
      const source = this.empty ? [] : sortUsers([...USERS], this.sort);
      this.total = source.length;
      const start = (this.page - 1) * this.pageSize;
      this.users = source.slice(start, start + this.pageSize);
      this.loading = false;
      this.loadHandle = null;
    }, 350);
  }

  private clearLoad(): void {
    if (this.loadHandle != null) {
      clearTimeout(this.loadHandle);
      this.loadHandle = null;
    }
  }
}

function sortUsers(rows: User[], sort: TableSort<User> | null): User[] {
  if (!sort) {
    return rows;
  }

  return [...rows].sort((left, right) => {
    const result = String(left[sort.key]).localeCompare(String(right[sort.key]), undefined, {
      numeric: true,
      sensitivity: 'base'
    });
    return sort.direction === 'asc' ? result : -result;
  });
}
