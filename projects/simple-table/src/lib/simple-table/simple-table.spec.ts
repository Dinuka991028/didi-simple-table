import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

import { DidiCellDirective, DidiEmptyDirective, DidiHeaderDirective, DidiLoadingDirective } from './simple-table.directives';
import { SimpleTableComponent } from './simple-table';
import { TableColumn, TableQuery } from './simple-table.types';

interface User {
  name: string;
  email: string;
}

@Component({
  template: `
    <didi-simple-table [columns]="columns" [data]="data" [loading]="loading">
      <ng-template didiCell="email" let-row>{{ row.email }}!</ng-template>
      <ng-template didiEmpty>Nothing here</ng-template>
      <ng-template didiLoading>Please wait</ng-template>
    </didi-simple-table>
  `
})
class HostComponent {
  columns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ];
  data: User[] = [{ name: 'Ada', email: 'ada@example.com' }];
  loading = false;
}

describe('SimpleTableComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [
        HostComponent,
        SimpleTableComponent,
        DidiCellDirective,
        DidiHeaderDirective,
        DidiEmptyDirective,
        DidiLoadingDirective
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders default cell values and custom cell templates', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ada');
    expect(text).toContain('ada@example.com!');
  });

  it('shows the empty template when there is no data', () => {
    host.data = [];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nothing here');
  });

  it('shows the loading template instead of rows', () => {
    host.loading = true;
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Please wait');
    expect(text).not.toContain('Ada');
  });
});

@Component({
  template: `
    <didi-simple-table [columns]="columns" [data]="[]" [loading]="loading">
      <ng-template didiEmpty></ng-template>
      <ng-template didiLoading></ng-template>
    </didi-simple-table>
  `
})
class BlankStatusTemplateHostComponent {
  columns: TableColumn<User>[] = [{ key: 'name', label: 'Name' }];
  loading = false;
}

describe('SimpleTableComponent blank status templates', () => {
  let fixture: ComponentFixture<BlankStatusTemplateHostComponent>;
  let host: BlankStatusTemplateHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [
        BlankStatusTemplateHostComponent,
        SimpleTableComponent,
        DidiEmptyDirective,
        DidiLoadingDirective
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BlankStatusTemplateHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('falls back to the default empty message', () => {
    expect(fixture.nativeElement.textContent).toContain('No data');
  });

  it('falls back to the default loading message', () => {
    host.loading = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading...');
  });
});

@Component({
  template: `<didi-simple-table [columns]="columns" [data]="data" [sortable]="true"></didi-simple-table>`
})
class SortHostComponent {
  columns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ];
  data: User[] = [
    { name: 'Grace', email: 'grace@example.com' },
    { name: 'Ada', email: 'ada@example.com' }
  ];
}

describe('SimpleTableComponent sorting', () => {
  let fixture: ComponentFixture<SortHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [SortHostComponent, SimpleTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SortHostComponent);
    fixture.detectChanges();
  });

  it('cycles ascending, descending, then original order', () => {
    const button = fixture.nativeElement.querySelector('.sort-button') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();
    expect(rowNames(fixture)).toEqual(['Ada', 'Grace']);

    button.click();
    fixture.detectChanges();
    expect(rowNames(fixture)).toEqual(['Grace', 'Ada']);

    button.click();
    fixture.detectChanges();
    expect(rowNames(fixture)).toEqual(['Grace', 'Ada']);
  });
});

interface MixRow {
  name: string;
  age: number;
  hired: Date;
  rank: string;
}

@Component({
  template: `
    <didi-simple-table
      [columns]="columns"
      [data]="data"
      [sortable]="true"
      [multiSort]="multiSort"
    ></didi-simple-table>
  `
})
class MixSortHostComponent {
  multiSort = false;
  columns: TableColumn<MixRow>[] = [
    { key: 'name', label: 'Name', sortType: 'string' },
    { key: 'age', label: 'Age', sortType: 'number' },
    { key: 'hired', label: 'Hired', sortType: 'date' },
    {
      key: 'rank',
      label: 'Rank',
      compare: (left, right) => Number(left) - Number(right)
    }
  ];
  data: MixRow[] = [
    { name: 'Grace', age: 10, hired: new Date('2020-01-02'), rank: '2' },
    { name: 'Ada', age: 2, hired: new Date('2019-05-01'), rank: '10' }
  ];
}

describe('SimpleTableComponent typed sorting', () => {
  it('sorts numbers, dates, custom order, and stacked columns', async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [MixSortHostComponent, SimpleTableComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(MixSortHostComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.sort-button') as NodeListOf<HTMLButtonElement>;

    buttons[1].click();
    fixture.detectChanges();
    expect(rowNames(fixture)).toEqual(['Ada', 'Grace']);

    buttons[1].click();
    buttons[1].click();
    fixture.detectChanges();

    buttons[2].click();
    fixture.detectChanges();
    expect(rowNames(fixture)).toEqual(['Ada', 'Grace']);

    buttons[3].click();
    fixture.detectChanges();
    expect(rowNames(fixture)).toEqual(['Grace', 'Ada']);

    fixture.componentInstance.multiSort = true;
    fixture.detectChanges();
    buttons[0].click();
    buttons[1].click();
    fixture.detectChanges();
    expect(rowNames(fixture)).toEqual(['Ada', 'Grace']);
  });
});

function rowNames(fixture: ComponentFixture<unknown>): string[] {
  const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
  return rows.map((row) => row.querySelector('td')?.textContent?.trim() ?? '');
}

@Component({
  template: `<didi-simple-table [columns]="columns" [data]="data" [pageSize]="2"></didi-simple-table>`
})
class PageHostComponent {
  columns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ];
  data: User[] = [
    { name: 'Ada', email: 'ada@example.com' },
    { name: 'Grace', email: 'grace@example.com' },
    { name: 'Alan', email: 'alan@example.com' }
  ];
}

describe('SimpleTableComponent pagination', () => {
  let fixture: ComponentFixture<PageHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [PageHostComponent, SimpleTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PageHostComponent);
    fixture.detectChanges();
  });

  it('shows the first page, then the next page', () => {
    expect(rowNames(fixture)).toEqual(['Ada', 'Grace']);
    expect(fixture.nativeElement.textContent).toContain('1–2 of 3');

    const next = (fixture.nativeElement.querySelectorAll('.didi-pager-actions button') as NodeListOf<HTMLButtonElement>)[1];
    next.click();
    fixture.detectChanges();

    expect(rowNames(fixture)).toEqual(['Alan']);
    expect(fixture.nativeElement.textContent).toContain('3–3 of 3');
  });
});

@Component({
  template: `
    <didi-simple-table
      [columns]="columns"
      [data]="data"
      pagination="server"
      [pageSize]="2"
      [page]="page"
      [total]="total"
      (pageChange)="onPage($event)"
    ></didi-simple-table>
  `
})
class ServerPageHostComponent {
  columns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ];
  page = 1;
  total = 3;
  data: User[] = [
    { name: 'Ada', email: 'ada@example.com' },
    { name: 'Grace', email: 'grace@example.com' }
  ];

  onPage(page: number): void {
    this.page = page;
    this.data =
      page === 1
        ? [
            { name: 'Ada', email: 'ada@example.com' },
            { name: 'Grace', email: 'grace@example.com' }
          ]
        : [{ name: 'Alan', email: 'alan@example.com' }];
  }
}

describe('SimpleTableComponent server pagination', () => {
  let fixture: ComponentFixture<ServerPageHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [ServerPageHostComponent, SimpleTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ServerPageHostComponent);
    fixture.detectChanges();
  });

  it('renders the provided page and uses total for the pager', () => {
    expect(rowNames(fixture)).toEqual(['Ada', 'Grace']);
    expect(fixture.nativeElement.textContent).toContain('1–2 of 3');

    const next = (fixture.nativeElement.querySelectorAll('.didi-pager-actions button') as NodeListOf<HTMLButtonElement>)[1];
    next.click();
    fixture.detectChanges();

    expect(rowNames(fixture)).toEqual(['Alan']);
    expect(fixture.nativeElement.textContent).toContain('3–3 of 3');
  });
});

@Component({
  template: `
    <didi-simple-table
      [columns]="columns"
      [data]="data"
      [searchable]="true"
      [searchKeys]="searchKeys"
      [pageSize]="2"
      [page]="page"
      [resetPageOnSearch]="resetPageOnSearch"
      (searchChange)="search = $event"
      (pageChange)="page = $event"
      (queryChange)="query = $event"
    ></didi-simple-table>
  `
})
class SearchHostComponent {
  columns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ];
  data: User[] = [
    { name: 'Ada', email: 'ada@example.com' },
    { name: 'Grace', email: 'grace@example.com' },
    { name: 'Alan', email: 'alan@example.com' }
  ];
  searchKeys: Array<'name' | 'email'> | null = null;
  page = 1;
  resetPageOnSearch = true;
  search = '';
  query: TableQuery<User> | null = null;
}

describe('SimpleTableComponent search', () => {
  let fixture: ComponentFixture<SearchHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [SearchHostComponent, SimpleTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchHostComponent);
    fixture.detectChanges();
  });

  it('filters client rows and updates the total count', () => {
    typeInSearch(fixture, 'Alan');

    expect(rowNames(fixture)).toEqual(['Alan']);
    expect(fixture.nativeElement.textContent).toContain('1–1 of 1');
    expect(fixture.componentInstance.query).toEqual(
      jasmine.objectContaining({ page: 1, search: 'Alan', pageSize: 2 })
    );
  });

  it('can limit matching to searchKeys', () => {
    fixture.componentInstance.searchKeys = ['name'];
    fixture.detectChanges();
    typeInSearch(fixture, 'example');

    expect(rowNames(fixture)).toEqual(['No data']);
    expect(fixture.nativeElement.textContent).toContain('No data');
  });

  it('resets to page 1 on search by default', () => {
    const next = (fixture.nativeElement.querySelectorAll('.didi-pager-actions button') as NodeListOf<HTMLButtonElement>)[1];
    next.click();
    fixture.detectChanges();
    expect(rowNames(fixture)).toEqual(['Alan']);

    typeInSearch(fixture, 'a');
    expect(fixture.componentInstance.page).toBe(1);
    expect(rowNames(fixture)).toEqual(['Ada', 'Grace']);
  });
});

@Component({
  template: `
    <didi-simple-table
      [columns]="columns"
      [data]="data"
      [sortable]="true"
      [pageSize]="pageSize"
      [page]="page"
      [pageSizeOptions]="[2, 3]"
      [resetPageOnSort]="resetPageOnSort"
      (pageChange)="page = $event"
      (pageSizeChange)="pageSize = $event"
    ></didi-simple-table>
  `
})
class PageSizeHostComponent {
  columns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ];
  data: User[] = [
    { name: 'Ada', email: 'ada@example.com' },
    { name: 'Grace', email: 'grace@example.com' },
    { name: 'Alan', email: 'alan@example.com' }
  ];
  page = 1;
  pageSize = 2;
  resetPageOnSort = true;
}

describe('SimpleTableComponent page size and page state', () => {
  let fixture: ComponentFixture<PageSizeHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [PageSizeHostComponent, SimpleTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PageSizeHostComponent);
    fixture.detectChanges();
  });

  it('changes how many rows are shown', () => {
    expect(rowNames(fixture)).toEqual(['Ada', 'Grace']);

    const select = fixture.nativeElement.querySelector('.didi-pager-size select') as HTMLSelectElement;
    select.value = '3';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(rowNames(fixture)).toEqual(['Ada', 'Grace', 'Alan']);
    expect(fixture.componentInstance.pageSize).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('1–3 of 3');
  });

  it('can keep the current page after sorting', () => {
    fixture.componentInstance.resetPageOnSort = false;
    fixture.detectChanges();

    const next = (fixture.nativeElement.querySelectorAll('.didi-pager-actions button') as NodeListOf<HTMLButtonElement>)[1];
    next.click();
    fixture.detectChanges();
    expect(rowNames(fixture)).toEqual(['Alan']);

    const sortButton = fixture.nativeElement.querySelector('.sort-button') as HTMLButtonElement;
    sortButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.page).toBe(2);
    expect(rowNames(fixture)).toEqual(['Grace']);
  });
});

@Component({
  template: `
    <didi-simple-table
      [columns]="columns"
      [data]="data"
      pagination="server"
      [searchable]="true"
      [pageSize]="2"
      [page]="page"
      [total]="total"
      (searchChange)="search = $event"
    ></didi-simple-table>
  `
})
class ServerSearchHostComponent {
  columns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ];
  page = 1;
  total = 3;
  search = '';
  data: User[] = [
    { name: 'Ada', email: 'ada@example.com' },
    { name: 'Grace', email: 'grace@example.com' }
  ];
}

describe('SimpleTableComponent server search', () => {
  it('emits search without filtering the provided page', async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [ServerSearchHostComponent, SimpleTableComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(ServerSearchHostComponent);
    fixture.detectChanges();
    typeInSearch(fixture, 'Alan');

    expect(fixture.componentInstance.search).toBe('Alan');
    expect(rowNames(fixture)).toEqual(['Ada', 'Grace']);
  });
});

function typeInSearch(fixture: ComponentFixture<unknown>, value: string): void {
  const input = fixture.nativeElement.querySelector('.table-search input') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

@Component({
  template: `
    <didi-simple-table
      [columns]="columns"
      [data]="data"
      [selectable]="selectable"
      identityKey="email"
      [selected]="selected"
      (selectedChange)="selected = $event"
      (rowClick)="clicked = $event"
    ></didi-simple-table>
  `
})
class SelectHostComponent {
  columns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ];
  data: User[] = [
    { name: 'Ada', email: 'ada@example.com' },
    { name: 'Grace', email: 'grace@example.com' }
  ];
  selectable: false | 'single' | 'multiple' = 'single';
  selected: User[] = [];
  clicked: User | null = null;
}

describe('SimpleTableComponent selection', () => {
  let fixture: ComponentFixture<SelectHostComponent>;
  let host: SelectHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [SelectHostComponent, SimpleTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('selects a single row on click and emits rowClick', () => {
    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
    row.click();
    fixture.detectChanges();

    expect(host.clicked?.name).toBe('Ada');
    expect(host.selected.map((user) => user.name)).toEqual(['Ada']);
  });

  it('toggles multiple rows with checkboxes', () => {
    host.selectable = 'multiple';
    fixture.detectChanges();

    const boxes = fixture.nativeElement.querySelectorAll(
      'tbody input[type="checkbox"]'
    ) as NodeListOf<HTMLInputElement>;
    boxes[0].click();
    boxes[1].click();
    fixture.detectChanges();

    expect(host.selected.map((user) => user.name)).toEqual(['Ada', 'Grace']);
  });
});

@Component({
  template: `
    <didi-simple-table
      [columns]="columns"
      [data]="data"
      [stickyHeader]="true"
      maxHeight="160px"
      caption="People"
    ></didi-simple-table>
  `
})
class StickyHostComponent {
  columns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ];
  data: User[] = [
    { name: 'Ada', email: 'ada@example.com' },
    { name: 'Grace', email: 'grace@example.com' }
  ];
}

describe('SimpleTableComponent sticky header', () => {
  it('exposes a caption and a sticky scroll area', async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [StickyHostComponent, SimpleTableComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(StickyHostComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('caption')?.textContent).toContain('People');
    expect(root.querySelector('.table-container')?.classList.contains('has-sticky')).toBe(true);
  });
});

@Component({
  template: `<didi-simple-table [columns]="columns" [data]="data" [theme]="theme"></didi-simple-table>`
})
class ThemeHostComponent {
  theme = 'dark';
  columns: TableColumn<User>[] = [{ key: 'name', label: 'Name' }];
  data: User[] = [{ name: 'Ada', email: 'ada@example.com' }];
}

describe('SimpleTableComponent theme', () => {
  it('adds a host class for a predefined theme', async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [ThemeHostComponent, SimpleTableComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(ThemeHostComponent);
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('didi-simple-table') as HTMLElement;
    expect(table.classList.contains('didi-theme-dark')).toBe(true);

    fixture.componentInstance.theme = 'unknown';
    fixture.detectChanges();
    expect(table.classList.contains('didi-theme-dark')).toBe(false);
    expect(table.classList.contains('didi-theme-light')).toBe(false);
  });

  it('inherits host styles by default', async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [ThemeHostComponent, SimpleTableComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(ThemeHostComponent);
    fixture.componentInstance.theme = 'inherit';
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('didi-simple-table') as HTMLElement;
    expect(table.classList.contains('didi-theme-light')).toBe(false);
    expect(table.classList.contains('didi-theme-dark')).toBe(false);
  });
});

@Component({
  template: `
    <didi-simple-table
      [columns]="columns"
      [data]="data"
      [columnCollapse]="true"
      (hiddenColumnsChange)="hidden = $event"
    ></didi-simple-table>
  `
})
class CollapseHostComponent {
  hidden: string[] = [];
  columns: TableColumn<User>[] = [
    { key: 'name', label: 'Name', collapsible: false },
    { key: 'email', label: 'Email', hidden: true }
  ];
  data: User[] = [{ name: 'Ada', email: 'ada@example.com' }];
}

describe('SimpleTableComponent column collapse', () => {
  it('hides columns marked hidden and lets the user restore them', async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [CollapseHostComponent, SimpleTableComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(CollapseHostComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Name');
    expect(root.textContent).not.toContain('ada@example.com');

    const toggle = root.querySelector('.column-menu-toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();

    const boxes = root.querySelectorAll('.column-menu-item input') as NodeListOf<HTMLInputElement>;
    expect(boxes[0].disabled).toBe(true);
    expect(boxes[1].checked).toBe(false);
    boxes[1].click();
    fixture.detectChanges();

    expect(root.textContent).toContain('ada@example.com');
    expect(fixture.componentInstance.hidden).toEqual([]);
  });
});

@Component({
  template: `
    <didi-simple-table
      [columns]="columns"
      [data]="data"
      responsive="stack"
      breakpoint="4000px"
      [pageSize]="1"
      [stickyHeader]="true"
      maxHeight="520px"
    ></didi-simple-table>
  `
})
class StackHostComponent {
  columns: TableColumn<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', hideOnMobile: true }
  ];
  data: User[] = [
    { name: 'Ada', email: 'ada@example.com' },
    { name: 'Grace', email: 'grace@example.com' }
  ];
}

describe('SimpleTableComponent responsive', () => {
  it('stacks rows and hides hideOnMobile columns when narrow', async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [StackHostComponent, SimpleTableComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(StackHostComponent);
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('didi-simple-table') as HTMLElement;
    const component = fixture.debugElement.children[0].componentInstance as SimpleTableComponent<User>;
    component.isNarrow = true;
    fixture.detectChanges();

    expect(table.classList.contains('didi-is-stacked')).toBe(true);
    expect(table.classList.contains('didi-is-narrow')).toBe(true);
    expect(table.textContent).toContain('Ada');
    expect(table.textContent).not.toContain('ada@example.com');
    expect(table.querySelector('td')?.getAttribute('data-label')).toBe('Name');
  });

  it('keeps pager prev/next usable in the stacked card layout', async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [StackHostComponent, SimpleTableComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(StackHostComponent);
    fixture.detectChanges();

    const component = fixture.debugElement.children[0].componentInstance as SimpleTableComponent<User>;
    component.isNarrow = true;
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const prev = root.querySelector('.didi-pager-prev') as HTMLButtonElement;
    const next = root.querySelector('.didi-pager-next') as HTMLButtonElement;

    expect(root.textContent).toContain('Ada');
    expect(root.textContent).toContain('1–1 of 2');
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);

    next.click();
    fixture.detectChanges();

    expect(root.textContent).toContain('Grace');
    expect(root.textContent).toContain('2–2 of 2');
    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(true);

    const container = root.querySelector('.table-container') as HTMLElement;
    expect(container.style.maxHeight).toBe('');
    expect(container.classList.contains('has-sticky')).toBe(false);
  });
});

interface CityUser {
  name: string;
  address: { city: string };
  salary: number;
}

@Component({
  template: `
    <didi-simple-table [columns]="columns" [data]="data">
      <ng-template didiHeader="address.city">City ✈</ng-template>
      <ng-template didiCell="name" let-row let-value="value">{{ value }}*</ng-template>
    </didi-simple-table>
  `
})
class NestedHostComponent {
  columns: TableColumn<CityUser>[] = [
    { key: 'name', label: 'Name' },
    { key: 'address.city', label: 'City' },
    { key: 'salary', label: 'Pay', format: (value) => '$' + value }
  ];
  data: CityUser[] = [{ name: 'Ada', address: { city: 'London' }, salary: 120000 }];
}

describe('SimpleTableComponent customization', () => {
  it('supports nested keys, formatters, and custom headers', async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [
        NestedHostComponent,
        SimpleTableComponent,
        DidiCellDirective,
        DidiHeaderDirective
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(NestedHostComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ada*');
    expect(text).toContain('London');
    expect(text).toContain('$120000');
    expect(text).toContain('City ✈');
  });
});
