import { Directive, Input, TemplateRef } from '@angular/core';

import { DidiCellContext } from './simple-table.types';

@Directive({
  selector: 'ng-template[didiCell]'
})
export class DidiCellDirective {
  @Input() didiCell = '';

  constructor(public readonly template: TemplateRef<DidiCellContext<unknown>>) {}
}

@Directive({
  selector: 'ng-template[didiEmpty]'
})
export class DidiEmptyDirective {
  constructor(public readonly template: TemplateRef<void>) {}
}

@Directive({
  selector: 'ng-template[didiLoading]'
})
export class DidiLoadingDirective {
  constructor(public readonly template: TemplateRef<void>) {}
}
