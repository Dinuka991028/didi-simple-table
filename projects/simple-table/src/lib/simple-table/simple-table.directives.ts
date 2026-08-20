import { Directive, Input, TemplateRef } from '@angular/core';

import { DidiCellContext, DidiHeaderContext } from './simple-table.types';

@Directive({
  selector: 'ng-template[didiCell]'
})
export class DidiCellDirective {
  @Input() didiCell = '';

  constructor(public readonly template: TemplateRef<DidiCellContext<unknown>>) {}
}

@Directive({
  selector: 'ng-template[didiHeader]'
})
export class DidiHeaderDirective {
  @Input() didiHeader = '';

  constructor(public readonly template: TemplateRef<DidiHeaderContext<unknown>>) {}
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
