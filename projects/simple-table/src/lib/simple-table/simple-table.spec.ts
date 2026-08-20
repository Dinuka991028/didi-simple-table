import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

import { DidiCellDirective, DidiEmptyDirective, DidiLoadingDirective } from './simple-table.directives';
import { SimpleTableComponent } from './simple-table';
import { TableColumn } from './simple-table.types';

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

    const next = (fixture.nativeElement.querySelectorAll('.pager-actions button') as NodeListOf<HTMLButtonElement>)[1];
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

    const next = (fixture.nativeElement.querySelectorAll('.pager-actions button') as NodeListOf<HTMLButtonElement>)[1];
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
