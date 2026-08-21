import { NgModule } from '@angular/core';

import {
  DidiCellDirective,
  DidiDetailDirective,
  DidiEmptyDirective,
  DidiFooterDirective,
  DidiHeaderDirective,
  DidiLoadingDirective
} from './simple-table.directives';
import { SimpleTableComponent } from './simple-table';

/** Import this array on a standalone component to use the table and its templates. */
export const SIMPLE_TABLE_IMPORTS = [
  SimpleTableComponent,
  DidiCellDirective,
  DidiHeaderDirective,
  DidiEmptyDirective,
  DidiLoadingDirective,
  DidiDetailDirective,
  DidiFooterDirective
];

@NgModule({
  imports: [...SIMPLE_TABLE_IMPORTS],
  exports: [...SIMPLE_TABLE_IMPORTS]
})
export class SimpleTableModule {}
