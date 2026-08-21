import { Directive, Input, TemplateRef } from '@angular/core';

import {
  DidiCellContext,
  DidiDetailContext,
  DidiFooterContext,
  DidiHeaderContext
} from './simple-table.types';

@Directive({
  selector: 'ng-template[didiCell]',
  standalone: true
})
export class DidiCellDirective {
  @Input() didiCell = '';

  constructor(public readonly template: TemplateRef<DidiCellContext<unknown>>) {}
}

@Directive({
  selector: 'ng-template[didiHeader]',
  standalone: true
})
export class DidiHeaderDirective {
  @Input() didiHeader = '';

  constructor(public readonly template: TemplateRef<DidiHeaderContext<unknown>>) {}
}

@Directive({
  selector: 'ng-template[didiEmpty]',
  standalone: true
})
export class DidiEmptyDirective {
  constructor(public readonly template: TemplateRef<void>) {}
}

@Directive({
  selector: 'ng-template[didiLoading]',
  standalone: true
})
export class DidiLoadingDirective {
  constructor(public readonly template: TemplateRef<void>) {}
}

@Directive({
  selector: 'ng-template[didiDetail]',
  standalone: true
})
export class DidiDetailDirective {
  constructor(public readonly template: TemplateRef<DidiDetailContext<unknown>>) {}
}

@Directive({
  selector: 'ng-template[didiFooter]',
  standalone: true
})
export class DidiFooterDirective {
  @Input() didiFooter = '';

  constructor(public readonly template: TemplateRef<DidiFooterContext<unknown>>) {}
}
