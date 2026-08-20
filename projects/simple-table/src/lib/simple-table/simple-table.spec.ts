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
