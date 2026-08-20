import {
  AfterContentInit,
  Component,
  ContentChild,
  ContentChildren,
  Input,
  QueryList,
  TemplateRef
} from '@angular/core';

import { DidiCellDirective, DidiEmptyDirective, DidiLoadingDirective } from './simple-table.directives';
import { DidiCellContext, TableColumn } from './simple-table.types';

export { TableColumn } from './simple-table.types';

@Component({
  selector: 'didi-simple-table',
  templateUrl: './simple-table.html',
  styleUrls: ['./simple-table.css']
})
export class SimpleTableComponent<T extends object = Record<string, unknown>> implements AfterContentInit {
  @Input() data: T[] = [];
  @Input() columns: TableColumn<T>[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No data';
  @Input() loadingMessage = 'Loading...';

  @ContentChildren(DidiCellDirective) private cellDefs?: QueryList<DidiCellDirective>;
  @ContentChild(DidiEmptyDirective) private emptyDef?: DidiEmptyDirective;
  @ContentChild(DidiLoadingDirective) private loadingDef?: DidiLoadingDirective;

  emptyTemplate: TemplateRef<void> | null = null;
  loadingTemplate: TemplateRef<void> | null = null;

  get isEmpty(): boolean {
    return this.data.length === 0;
  }

  get columnCount(): number {
    return this.columns.length || 1;
  }

  ngAfterContentInit(): void {
    this.emptyTemplate = this.templateIfVisible(this.emptyDef?.template);
    this.loadingTemplate = this.templateIfVisible(this.loadingDef?.template);
  }

  getCellTemplate(column: TableColumn<T>): TemplateRef<DidiCellContext<T>> | null {
    const def = this.cellDefs?.find((cell) => cell.didiCell === column.key);
    return (def?.template as TemplateRef<DidiCellContext<T>> | undefined) ?? null;
  }

  getCellValue(row: T, column: TableColumn<T>): unknown {
    return (row as Record<string, unknown>)[column.key];
  }

  private templateIfVisible(template?: TemplateRef<void> | null): TemplateRef<void> | null {
    if (!template || !hasVisibleContent(template)) {
      return null;
    }

    return template;
  }
}

function hasVisibleContent(template: TemplateRef<void>): boolean {
  const view = template.createEmbeddedView(undefined as unknown as void);
  view.detectChanges();
  const hasContent = view.rootNodes.some((node) => isVisibleNode(node));
  view.destroy();
  return hasContent;
}

function isVisibleNode(node: Node): boolean {
  if (node.nodeType === Node.TEXT_NODE) {
    return !!node.textContent?.trim();
  }

  return node.nodeType === Node.ELEMENT_NODE;
}
