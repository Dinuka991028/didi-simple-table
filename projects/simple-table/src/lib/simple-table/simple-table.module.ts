import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DidiCellDirective, DidiEmptyDirective, DidiLoadingDirective } from './simple-table.directives';
import { SimpleTableComponent } from './simple-table';

const TABLE_DIRECTIVES = [
  SimpleTableComponent,
  DidiCellDirective,
  DidiEmptyDirective,
  DidiLoadingDirective
];

@NgModule({
  declarations: [...TABLE_DIRECTIVES],
  imports: [CommonModule],
  exports: [...TABLE_DIRECTIVES]
})
export class SimpleTableModule {}
