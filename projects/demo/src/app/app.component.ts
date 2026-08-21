import { Component, OnDestroy, OnInit } from '@angular/core';
import { PaginationMode, PagerNav, ResponsiveMode, TableColumn, TableQuery, TableSortState, TableTheme } from 'didi-simple-table';

import { SHOWCASE_COUNT, SHOWCASE_EMPTY, SHOWCASE_ROWS, ShowcaseRow } from './showcase-data';

interface User {
  name: string;
  email: string;
  role: string;
}

interface Employee {
  name: string;
  email: string;
  role: string;
  salary: number;
  status: 'Active' | 'Leave';
  address: { city: string; country: string };
}

interface Staff {
  name: string;
  email: string;
  role: string;
  team: string;
  city: string;
  status: string;
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

const EMPLOYEES: Employee[] = [
  {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role: 'Engineer',
    salary: 140000,
    status: 'Active',
    address: { city: 'London', country: 'UK' }
  },
  {
    name: 'Alan Turing',
    email: 'alan@example.com',
    role: 'Researcher',
    salary: 125000,
    status: 'Leave',
    address: { city: 'Manchester', country: 'UK' }
  },
  {
    name: 'Grace Hopper',
    email: 'grace@example.com',
    role: 'Admiral',
    salary: 160000,
    status: 'Active',
    address: { city: 'New York', country: 'USA' }
  }
];

const STAFF: Staff[] = [
  { name: 'Ada Lovelace', email: 'ada@example.com', role: 'Engineer', team: 'Core', city: 'London', status: 'Active' },
  { name: 'Alan Turing', email: 'alan@example.com', role: 'Researcher', team: 'Labs', city: 'Manchester', status: 'Active' },
  { name: 'Grace Hopper', email: 'grace@example.com', role: 'Admiral', team: 'Navy', city: 'New York', status: 'Leave' },
  { name: 'Katherine Johnson', email: 'katherine@example.com', role: 'Mathematician', team: 'Flight', city: 'White Sulphur Springs', status: 'Active' },
  { name: 'Margaret Hamilton', email: 'margaret@example.com', role: 'Engineer', team: 'Apollo', city: 'Cambridge', status: 'Active' },
  { name: 'Dorothy Vaughan', email: 'dorothy@example.com', role: 'Mathematician', team: 'NACA', city: 'Hampton', status: 'Leave' },
  { name: 'Mary Jackson', email: 'mary@example.com', role: 'Engineer', team: 'NACA', city: 'Hampton', status: 'Active' },
  { name: 'Tim Berners-Lee', email: 'tim@example.com', role: 'Inventor', team: 'Web', city: 'London', status: 'Active' }
];

type Rank = 'junior' | 'mid' | 'senior';

interface SortPerson {
  name: string;
  age: number;
  hired: Date;
  rank: Rank;
}

const RANK_ORDER: Record<Rank, number> = {
  junior: 0,
  mid: 1,
  senior: 2
};

type StatusView = 'data' | 'empty' | 'loading';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  readonly showcaseCount = SHOWCASE_COUNT;
  showcaseView: StatusView = 'data';
  showcaseTheme: TableTheme = 'light';
  showcaseSelected: ShowcaseRow[] = [];
  showcaseColumns: TableColumn<ShowcaseRow>[] = [
    { key: 'name', label: 'Name', minWidth: '10rem' },
    { key: 'email', label: 'Email', minWidth: '16rem' },
    { key: 'role', label: 'Role' },
    { key: 'team', label: 'Team' },
    { key: 'city', label: 'City' },
    {
      key: 'salary',
      label: 'Salary',
      align: 'end',
      format: (value) => '$' + Number(value).toLocaleString()
    },
    { key: 'status', label: 'Status' }
  ];

  basicColumns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' }
  ];
  basicUsers = SAMPLE;

  cellColumns: TableColumn<Employee>[] = [
    { key: 'name', label: 'Name' },
    { key: 'address.city', label: 'City' },
    {
      key: 'salary',
      label: 'Salary',
      format: (value) => '$' + Number(value).toLocaleString()
    },
    { key: 'status', label: 'Status' },
    { key: '_actions', label: 'Actions', sortable: false }
  ];
  cellUsers = EMPLOYEES;
  edited: string | null = null;

  statusView: StatusView = 'data';
  statusColumns: TableColumn<User>[] = this.basicColumns;

  sortUsers: SortPerson[] = [
    { name: 'Ada Lovelace', age: 36, hired: new Date('2019-07-12'), rank: 'senior' },
    { name: 'Alan Turing', age: 41, hired: new Date('2021-01-04'), rank: 'mid' },
    { name: 'Grace Hopper', age: 29, hired: new Date('2018-03-22'), rank: 'junior' }
  ];
  sortColumns: TableColumn<SortPerson>[] = [
    { key: 'name', label: 'Name', sortType: 'string' },
    { key: 'age', label: 'Age', sortType: 'number' },
    {
      key: 'hired',
      label: 'Hired',
      sortType: 'date',
      format: (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value)
    },
    {
      key: 'rank',
      label: 'Rank',
      compare: (left, right) => RANK_ORDER[left as Rank] - RANK_ORDER[right as Rank]
    }
  ];
  headerSort: TableSortState<SortPerson> = null;
  multiSort = false;
  stickyUsers = USERS;
  pinnedColumns: TableColumn<Staff>[] = [
    { key: 'name', label: 'Name', pinned: true, minWidth: '10rem' },
    { key: 'email', label: 'Email', minWidth: '16rem' },
    { key: 'role', label: 'Role', minWidth: '10rem' },
    { key: 'team', label: 'Team', minWidth: '10rem' },
    { key: 'city', label: 'City', minWidth: '14rem' },
    { key: 'status', label: 'Status', pinned: 'end', minWidth: '7rem' },
    { key: '_actions', label: 'Actions', pinned: 'end', minWidth: '6rem' }
  ];

  selectionMode: false | 'single' | 'multiple' = 'single';
  selected: User[] = [];
  clicked: User | null = null;

  pagination: PaginationMode = 'client';
  pagerNav: PagerNav = 'label';
  pagingLayout: 'table' | 'cards' = 'table';
  empty = false;
  loading = false;
  page = 1;
  pageSize = 3;
  pageSizeOptions = [3, 5, 10];
  total = 0;
  search = '';
  keepPage = false;
  sort: TableSortState<User> = null;
  lastQuery: TableQuery<User> | null = null;
  users: User[] = [];
  pageColumns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', sortable: false },
    { key: 'role', label: 'Role' }
  ];
  tableTheme: TableTheme = 'inherit';
  staffColumns: TableColumn<Staff>[] = [
    { key: 'name', label: 'Name', collapsible: false },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'team', label: 'Team' },
    { key: 'city', label: 'City', hidden: true },
    { key: 'status', label: 'Status' }
  ];
  staffRows = STAFF;
  mobileMode: ResponsiveMode = 'stack';
  mobileColumns: TableColumn<Staff>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'team', label: 'Team', hideOnMobile: true },
    { key: 'city', label: 'City', hideOnMobile: true },
    { key: 'status', label: 'Status' }
  ];

  private loadHandle: ReturnType<typeof setTimeout> | null = null;

  get showcaseData(): ShowcaseRow[] {
    return this.showcaseView === 'empty' ? SHOWCASE_EMPTY : SHOWCASE_ROWS;
  }

  get showcaseLoading(): boolean {
    return this.showcaseView === 'loading';
  }

  get showcaseSelectedLabel(): string {
    return this.showcaseSelected.map((row) => row.name).join(', ');
  }

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

  setShowcaseView(view: StatusView): void {
    this.showcaseView = view;
  }

  setShowcaseTheme(theme: TableTheme): void {
    this.showcaseTheme = theme;
  }

  get sortLabel(): string {
    if (!this.headerSort) {
      return 'null';
    }

    const sorts = Array.isArray(this.headerSort) ? this.headerSort : [this.headerSort];
    return sorts.map((item) => item.key + ' / ' + item.direction).join(', ');
  }

  onHeaderSort(sort: TableSortState<SortPerson>): void {
    this.headerSort = sort;
  }

  setMultiSort(multiSort: boolean): void {
    this.multiSort = multiSort;
    this.headerSort = null;
  }

  setSelectionMode(mode: false | 'single' | 'multiple'): void {
    this.selectionMode = mode;
    this.selected = [];
    this.clicked = null;
  }

  onRowClick(user: User): void {
    this.clicked = user;
  }

  editEmployee(row: Employee): void {
    this.edited = row.name;
  }

  get queryLabel(): string {
    if (!this.lastQuery) {
      return 'Interact with the table to emit a query.';
    }

    const sort = this.lastQuery.sort
      ? (Array.isArray(this.lastQuery.sort) ? this.lastQuery.sort : [this.lastQuery.sort])
          .map((item) => item.key + ':' + item.direction)
          .join(', ')
      : 'null';

    return (
      'page ' +
      this.lastQuery.page +
      ', pageSize ' +
      this.lastQuery.pageSize +
      ', search "' +
      this.lastQuery.search +
      '", sort ' +
      sort
    );
  }

  get pagingEmptyMessage(): string {
    return this.search.trim() ? 'No matching rows' : 'No data';
  }

  setPagination(pagination: PaginationMode): void {
    if (this.pagination === pagination) {
      return;
    }

    this.pagination = pagination;
    this.page = 1;
    this.sort = null;
    this.search = '';
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

  onQueryChange(query: TableQuery<User>): void {
    this.page = query.page;
    this.pageSize = query.pageSize ?? this.pageSize;
    this.sort = query.sort;
    this.search = query.search;
    this.lastQuery = query;
    if (this.isServer) {
      this.load();
    }
  }

  setKeepPage(keepPage: boolean): void {
    this.keepPage = keepPage;
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
      let source = this.empty ? [] : [...USERS];
      const query = this.search.trim().toLowerCase();
      if (query) {
        source = source.filter((user) =>
          [user.name, user.email, user.role].some((value) => value.toLowerCase().includes(query))
        );
      }
      source = sortUsers(source, this.sort);
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

function sortUsers(rows: User[], sort: TableSortState<User>): User[] {
  if (!sort) {
    return rows;
  }

  const sorts = Array.isArray(sort) ? sort : [sort];
  return [...rows].sort((left, right) => {
    for (const spec of sorts) {
      const key = spec.key as keyof User;
      const result = String(left[key]).localeCompare(String(right[key]), undefined, {
        numeric: true,
        sensitivity: 'base'
      });
      const ordered = spec.direction === 'asc' ? result : -result;
      if (ordered !== 0) {
        return ordered;
      }
    }

    return 0;
  });
}
