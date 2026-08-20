import {
  AfterContentInit,
  Component,
  ContentChild,
  ContentChildren,
  EventEmitter,
  Input,
  Output,
  QueryList,
  TemplateRef
} from '@angular/core';

import { DidiCellDirective, DidiEmptyDirective, DidiLoadingDirective } from './simple-table.directives';
import { DidiCellContext, PaginationMode, SelectionMode, SortDirection, TableColumn, TableSort } from './simple-table.types';

export { PaginationMode, SelectionMode, TableColumn, TableSort } from './simple-table.types';

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
  @Input() sortable = false;
  @Input() sort: TableSort<T> | null = null;
  @Input() pageSize: number | null = null;
  @Input() page = 1;
  @Input() total: number | null = null;
  @Input() pagination: PaginationMode = 'client';
  @Input() selectable: false | SelectionMode | true = false;
  @Input() selected: T[] = [];
  @Input() identityKey?: keyof T & string;
  @Input() stickyHeader = false;
  @Input() maxHeight: string | null = null;
  @Input() caption = '';

  @Output() sortChange = new EventEmitter<TableSort<T> | null>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() selectedChange = new EventEmitter<T[]>();

  @ContentChildren(DidiCellDirective) private cellDefs?: QueryList<DidiCellDirective>;
  @ContentChild(DidiEmptyDirective) private emptyDef?: DidiEmptyDirective;
  @ContentChild(DidiLoadingDirective) private loadingDef?: DidiLoadingDirective;

  emptyTemplate: TemplateRef<void> | null = null;
  loadingTemplate: TemplateRef<void> | null = null;

  get isEmpty(): boolean {
    return this.data.length === 0;
  }

  get columnCount(): number {
    const dataCols = this.columns.length || 1;
    return dataCols + (this.isMultiple ? 1 : 0);
  }

  get selectionMode(): 'off' | SelectionMode {
    if (this.selectable === 'multiple') {
      return 'multiple';
    }

    if (this.selectable === 'single' || this.selectable === true) {
      return 'single';
    }

    return 'off';
  }

  get isSelectable(): boolean {
    return this.selectionMode !== 'off';
  }

  get isMultiple(): boolean {
    return this.selectionMode === 'multiple';
  }

  get isClickable(): boolean {
    return this.isSelectable || this.rowClick.observers.length > 0;
  }

  get allVisibleSelected(): boolean {
    return this.displayData.length > 0 && this.displayData.every((row) => this.isSelected(row));
  }

  get someVisibleSelected(): boolean {
    return this.displayData.some((row) => this.isSelected(row)) && !this.allVisibleSelected;
  }

  get isPaginated(): boolean {
    return this.pageSize != null && this.pageSize > 0;
  }

  get isServerPaged(): boolean {
    return this.pagination === 'server';
  }

  get sortedData(): T[] {
    if (this.isServerPaged || !this.sort) {
      return this.data;
    }

    const { key, direction } = this.sort;
    return [...this.data].sort((left, right) =>
      compareValues(
        (left as Record<string, unknown>)[key],
        (right as Record<string, unknown>)[key],
        direction
      )
    );
  }

  get itemCount(): number {
    if (this.isServerPaged) {
      return this.total ?? 0;
    }

    return this.sortedData.length;
  }

  get totalPages(): number {
    if (!this.isPaginated || this.pageSize == null) {
      return 1;
    }

    return Math.max(1, Math.ceil(this.itemCount / this.pageSize));
  }

  get currentPage(): number {
    return Math.min(Math.max(1, this.page), this.totalPages);
  }

  get rangeStart(): number {
    if (!this.isPaginated || this.itemCount === 0 || this.pageSize == null) {
      return this.itemCount === 0 ? 0 : 1;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    if (!this.isPaginated || this.pageSize == null) {
      return this.itemCount;
    }

    return Math.min(this.currentPage * this.pageSize, this.itemCount);
  }

  get displayData(): T[] {
    const rows = this.sortedData;
    if (!this.isPaginated || this.isServerPaged || this.pageSize == null) {
      return rows;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    return rows.slice(start, start + this.pageSize);
  }

  ngAfterContentInit(): void {
    this.emptyTemplate = this.templateIfVisible(this.emptyDef?.template);
    this.loadingTemplate = this.templateIfVisible(this.loadingDef?.template);
  }

  isSortable(column: TableColumn<T>): boolean {
    return this.sortable && column.sortable !== false;
  }

  ariaSort(column: TableColumn<T>): 'ascending' | 'descending' | 'none' | null {
    if (!this.isSortable(column)) {
      return null;
    }

    if (this.sort?.key !== column.key) {
      return 'none';
    }

    return this.sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  sortIcon(column: TableColumn<T>): string {
    if (this.sort?.key !== column.key) {
      return '↕';
    }

    return this.sort.direction === 'asc' ? '↑' : '↓';
  }

  sortButtonLabel(column: TableColumn<T>): string {
    const state = this.ariaSort(column);
    if (state === 'ascending') {
      return `Sort ${column.label}, currently ascending`;
    }

    if (state === 'descending') {
      return `Sort ${column.label}, currently descending`;
    }

    return `Sort by ${column.label}`;
  }

  get ariaRowCount(): number {
    if (this.loading || this.isEmpty) {
      return 2;
    }

    return this.itemCount + 1;
  }

  toggleSort(column: TableColumn<T>): void {
    if (!this.isSortable(column) || this.loading) {
      return;
    }

    this.sort = nextSort(this.sort, column.key);
    this.sortChange.emit(this.sort);

    if (this.isServerPaged) {
      this.page = 1;
      return;
    }

    this.goToPage(1);
  }

  goToPage(page: number): void {
    if (!this.isPaginated || this.loading) {
      return;
    }

    const next = Math.min(Math.max(1, page), this.totalPages);
    if (next === this.page) {
      return;
    }

    this.page = next;
    this.pageChange.emit(next);
  }

  isSelected(row: T): boolean {
    return this.selected.some((item) => this.sameRow(item, row));
  }

  onRowClick(row: T, event: Event): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('a, button, input, label')) {
      return;
    }

    this.rowClick.emit(row);
    if (this.isSelectable) {
      this.toggleRow(row);
    }
  }

  onRowKeydown(row: T, event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.rowClick.emit(row);
    if (this.isSelectable) {
      this.toggleRow(row);
    }
  }

  onCheckboxChange(row: T, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.setRowSelected(row, checked);
  }

  toggleAllVisible(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const extra = this.displayData.filter((row) => !this.isSelected(row));
      this.selected = [...this.selected, ...extra];
    } else {
      this.selected = this.selected.filter(
        (item) => !this.displayData.some((row) => this.sameRow(row, item))
      );
    }

    this.selectedChange.emit(this.selected);
  }

  private toggleRow(row: T): void {
    this.setRowSelected(row, !this.isSelected(row));
  }

  private setRowSelected(row: T, selected: boolean): void {
    if (this.selectionMode === 'single') {
      this.selected = selected ? [row] : [];
      this.selectedChange.emit(this.selected);
      return;
    }

    if (selected && !this.isSelected(row)) {
      this.selected = [...this.selected, row];
    } else if (!selected) {
      this.selected = this.selected.filter((item) => !this.sameRow(item, row));
    }

    this.selectedChange.emit(this.selected);
  }

  private sameRow(left: T, right: T): boolean {
    if (this.identityKey) {
      return left[this.identityKey] === right[this.identityKey];
    }

    return left === right;
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

function nextSort<T>(current: TableSort<T> | null, key: keyof T & string): TableSort<T> | null {
  if (!current || current.key !== key) {
    return { key, direction: 'asc' };
  }

  if (current.direction === 'asc') {
    return { key, direction: 'desc' };
  }

  return null;
}

function compareValues(left: unknown, right: unknown, direction: SortDirection): number {
  const order = direction === 'asc' ? 1 : -1;

  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return (left - right) * order;
  }

  if (left instanceof Date && right instanceof Date) {
    return (left.getTime() - right.getTime()) * order;
  }

  return (
    String(left).localeCompare(String(right), undefined, {
      numeric: true,
      sensitivity: 'base'
    }) * order
  );
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
