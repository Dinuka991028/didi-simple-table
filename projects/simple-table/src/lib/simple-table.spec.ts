import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleTable } from './simple-table';

describe('SimpleTable', () => {
  let component: SimpleTable;
  let fixture: ComponentFixture<SimpleTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleTable],
    }).compileComponents();

    fixture = TestBed.createComponent(SimpleTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
