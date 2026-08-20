import {
  AfterContentInit,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';

import { DidiCellDirective, DidiEmptyDirective, DidiHeaderDirective, DidiLoadingDirective } from './simple-table.directives';
import {
  DidiCellContext,
  DidiHeaderContext,
  PaginationMode,
  ResponsiveMode,
  SelectionMode,
  SortDirection,
  SortType,
  TABLE_THEMES,
  TableColumn,
  TableField,
  TableSort,
  TableSortState,
  TableTheme,
  TableQuery
} from './simple-table.types';

export {
  NestedKeyOf,
  PaginationMode,
  ResponsiveMode,
  SelectionMode,
  SortType,
  TABLE_THEMES,
  TableColumn,
  TableField,
  TableQuery,
  TableSort,
  TableSortState,
  TableTheme
} from './simple-table.types';

@Component({
  selector: 'didi-simple-table',
  templateUrl: './simple-table.html',
  styleUrls: ['./simple-table.css'],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'didi-simple-table',
    '[class.didi-theme-light]': 'resolvedTheme === "light"',
    '[class.didi-theme-dark]': 'resolvedTheme === "dark"',
    '[class.didi-theme-teal]': 'resolvedTheme === "teal"',
    '[class.didi-theme-warm]': 'resolvedTheme === "warm"',
    '[class.didi-theme-compact]': 'resolvedTheme === "compact"',
    '[class.didi-is-stacked]': 'isStacked',
    '[class.didi-sticky-start]': 'stickyFirstColumn && !isStacked'
  }
})
export class SimpleTableComponent<T extends object = Record<string, unknown>>
  implements AfterContentInit, OnChanges, OnDestroy, OnInit
{
  @Input() data: T[] = [];
  @Input() columns: TableColumn<T>[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No data';
  @Input() loadingMessage = 'Loading...';
  @Input() sortable = false;
  @Input() sort: TableSortState<T> = null;
  @Input() multiSort = false;
  @Input() pageSize: number | null = null;
  @Input() pageSizeOptions: number[] | null = null;
  @Input() page = 1;
  @Input() total: number | null = null;
  @Input() pagination: PaginationMode = 'client';
  @Input() searchable = false;
  @Input() search = '';
  @Input() searchPlaceholder = 'Search';
  @Input() searchKeys: Array<TableField<T>> | null = null;
  @Input() resetPageOnSort = true;
  @Input() resetPageOnSearch = true;
  @Input() selectable: false | SelectionMode | true = false;
  @Input() selected: T[] = [];
  @Input() identityKey?: keyof T & string;
  @Input() stickyHeader = false;
  @Input() maxHeight: string | null = null;
  @Input() caption = '';
  @Input() theme: TableTheme | string = 'inherit';
  @Input() columnCollapse = false;
  @Input() hiddenColumns: Array<TableField<T>> | null = null;
  @Input() responsive: ResponsiveMode = 'scroll';
  @Input() breakpoint = '640px';
  @Input() stickyFirstColumn = false;

  @Output() sortChange = new EventEmitter<TableSortState<T>>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() queryChange = new EventEmitter<TableQuery<T>>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() selectedChange = new EventEmitter<T[]>();
  @Output() hiddenColumnsChange = new EventEmitter<Array<TableField<T>>>();

  @ContentChildren(DidiCellDirective) private cellDefs?: QueryList<DidiCellDirective>;
  @ContentChildren(DidiHeaderDirective) private headerDefs?: QueryList<DidiHeaderDirective>;
  @ContentChild(DidiEmptyDirective) private emptyDef?: DidiEmptyDirective;
  @ContentChild(DidiLoadingDirective) private loadingDef?: DidiLoadingDirective;

  emptyTemplate: TemplateRef<void> | null = null;
  loadingTemplate: TemplateRef<void> | null = null;
  columnMenuOpen = false;
  isNarrow = false;

  private localHidden: Array<TableField<T>> | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(private host: ElementRef<HTMLElement>) {}

  get resolvedTheme(): TableTheme {
    return (TABLE_THEMES as readonly string[]).includes(this.theme)
      ? (this.theme as TableTheme)
      : 'inherit';
  }

  get isEmpty(): boolean {
    return this.filteredData.length === 0;
  }

  get searchText(): string {
    return this.search.trim().toLowerCase();
  }

  get filteredData(): T[] {
    if (this.isServerPaged || !this.searchText) {
      return this.data;
    }

    const keys = this.searchKeys ?? this.columns.map((column) => column.key);
    return this.data.filter((row) =>
      keys.some((key) => String(getByPath(row, key) ?? '').toLowerCase().includes(this.searchText))
    );
  }

  get columnCount(): number {
    const dataCols = this.visibleColumns.length || 1;
    return dataCols + (this.isMultiple ? 1 : 0);
  }

  get visibleColumns(): TableColumn<T>[] {
    const visible = this.columns.filter(
      (column) => !this.isCollapsed(column) && !this.isHiddenOnMobile(column)
    );
    return visible.length > 0 ? visible : this.columns.slice(0, 1);
  }

  get isStacked(): boolean {
    return this.responsive === 'stack' && this.isNarrow;
  }

  get hiddenColumnCount(): number {
    return Math.max(0, this.columns.length - this.visibleColumns.length);
  }

  get columnMenuLabel(): string {
    if (this.hiddenColumnCount === 0) {
      return 'Columns';
    }

    return `Columns (${this.hiddenColumnCount} hidden)`;
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
    if (this.isServerPaged || this.activeSorts.length === 0) {
      return this.filteredData;
    }

    const sorts = this.activeSorts;
    const columns = this.columns;
    return [...this.filteredData].sort((left, right) => compareRows(left, right, sorts, columns));
  }

  get activeSorts(): TableSort<T>[] {
    if (!this.sort) {
      return [];
    }

    return Array.isArray(this.sort) ? this.sort : [this.sort];
  }

  get itemCount(): number {
    if (this.isServerPaged) {
      return this.total ?? 0;
    }

    return this.filteredData.length;
  }

  get resolvedPageSizeOptions(): number[] {
    if (!this.pageSizeOptions?.length) {
      return [];
    }

    const sizes = this.pageSizeOptions.filter((size) => size > 0);
    if (this.pageSize != null && this.pageSize > 0 && !sizes.includes(this.pageSize)) {
      return [this.pageSize, ...sizes];
    }

    return sizes;
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

  ngOnInit(): void {
    this.observeWidth();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hiddenColumns'] && this.hiddenColumns != null) {
      this.localHidden = [...this.hiddenColumns];
    }

    if (changes['breakpoint'] && !changes['breakpoint'].firstChange) {
      this.updateNarrow();
    }
  }

  isHiddenOnMobile(column: TableColumn<T>): boolean {
    return !!column.hideOnMobile && this.isNarrow;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.columnMenuOpen) {
      return;
    }

    const target = event.target as Node | null;
    if (target && this.host.nativeElement.contains(target)) {
      const menu = this.host.nativeElement.querySelector('.column-menu');
      if (menu?.contains(target)) {
        return;
      }
    }

    this.columnMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.columnMenuOpen = false;
  }

  isCollapsed(column: TableColumn<T>): boolean {
    if (column.collapsible === false) {
      return false;
    }

    return this.activeHiddenKeys().includes(column.key);
  }

  canHideColumn(column: TableColumn<T>): boolean {
    return this.columnCollapse && column.collapsible !== false && this.visibleColumns.length > 1;
  }

  canToggleColumn(column: TableColumn<T>): boolean {
    if (!this.columnCollapse || column.collapsible === false) {
      return false;
    }

    return this.isCollapsed(column) || this.visibleColumns.length > 1;
  }

  toggleColumnMenu(): void {
    this.columnMenuOpen = !this.columnMenuOpen;
  }

  hideColumn(column: TableColumn<T>, event?: Event): void {
    event?.stopPropagation();
    if (!this.canHideColumn(column)) {
      return;
    }

    this.setHiddenKeys([...this.activeHiddenKeys(), column.key]);
  }

  toggleColumnHidden(column: TableColumn<T>, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.setHiddenKeys(this.activeHiddenKeys().filter((key) => key !== column.key));
      return;
    }

    this.hideColumn(column);
  }

  private activeHiddenKeys(): Array<TableField<T>> {
    if (this.localHidden != null) {
      return this.localHidden;
    }

    if (this.hiddenColumns != null) {
      return this.hiddenColumns;
    }

    return this.columns.filter((column) => column.hidden).map((column) => column.key);
  }

  private setHiddenKeys(keys: Array<TableField<T>>): void {
    const allowed = new Set(
      this.columns.filter((column) => column.collapsible !== false).map((column) => column.key)
    );
    const next = keys.filter((key, index) => allowed.has(key) && keys.indexOf(key) === index);
    this.localHidden = next;
    this.hiddenColumnsChange.emit(next);
  }

  private observeWidth(): void {
    this.updateNarrow();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => this.updateNarrow());
    this.resizeObserver.observe(this.host.nativeElement);
  }

  private updateNarrow(): void {
    const width = this.host.nativeElement.getBoundingClientRect().width;
    if (width <= 0) {
      return;
    }

    this.isNarrow = width <= parseBreakpoint(this.breakpoint);
  }

  isSortable(column: TableColumn<T>): boolean {
    return this.sortable && column.sortable !== false;
  }

  ariaSort(column: TableColumn<T>): 'ascending' | 'descending' | 'none' | null {
    if (!this.isSortable(column)) {
      return null;
    }

    const spec = this.sortSpec(column);
    if (!spec) {
      return 'none';
    }

    return spec.direction === 'asc' ? 'ascending' : 'descending';
  }

  sortIcon(column: TableColumn<T>): string {
    const spec = this.sortSpec(column);
    if (!spec) {
      return '↕';
    }

    const arrow = spec.direction === 'asc' ? '↑' : '↓';
    if (!this.multiSort || this.activeSorts.length < 2) {
      return arrow;
    }

    return `${arrow}${this.sortIndex(column) + 1}`;
  }

  sortButtonLabel(column: TableColumn<T>): string {
    const spec = this.sortSpec(column);
    if (spec?.direction === 'asc') {
      return `Sort ${column.label}, currently ascending`;
    }

    if (spec?.direction === 'desc') {
      return `Sort ${column.label}, currently descending`;
    }

    return `Sort by ${column.label}`;
  }

  sortSpec(column: TableColumn<T>): TableSort<T> | null {
    return this.activeSorts.find((item) => item.key === column.key) ?? null;
  }

  sortIndex(column: TableColumn<T>): number {
    return this.activeSorts.findIndex((item) => item.key === column.key);
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

    this.sort = this.multiSort
      ? nextMultiSort(this.activeSorts, column.key)
      : nextSort(this.activeSorts[0] ?? null, column.key);
    this.sortChange.emit(this.sort);
    this.syncPage(this.resetPageOnSort);
    this.emitQuery();
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
    this.emitQuery();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search = value;
    this.searchChange.emit(value);
    this.syncPage(this.resetPageOnSearch);
    this.emitQuery();
  }

  onPageSizeSelect(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    if (!Number.isFinite(size) || size <= 0 || size === this.pageSize) {
      return;
    }

    this.pageSize = size;
    this.pageSizeChange.emit(size);
    this.syncPage(false);
    this.emitQuery();
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

  getHeaderTemplate(column: TableColumn<T>): TemplateRef<DidiHeaderContext<T>> | null {
    const def = this.headerDefs?.find((header) => header.didiHeader === column.key);
    return (def?.template as TemplateRef<DidiHeaderContext<T>> | undefined) ?? null;
  }

  getRawValue(row: T, column: TableColumn<T>): unknown {
    return getByPath(row, column.key);
  }

  getCellValue(row: T, column: TableColumn<T>): unknown {
    const value = this.getRawValue(row, column);
    return column.format ? column.format(value, row) : value;
  }

  cellContext(row: T, column: TableColumn<T>): DidiCellContext<T> {
    return {
      $implicit: row,
      row,
      column,
      value: this.getRawValue(row, column)
    };
  }

  headerContext(column: TableColumn<T>): DidiHeaderContext<T> {
    return { $implicit: column, column };
  }

  private syncPage(reset: boolean): void {
    if (!this.isPaginated) {
      return;
    }

    if (reset) {
      if (this.page !== 1) {
        this.page = 1;
        this.pageChange.emit(1);
      }
      return;
    }

    if (this.page > this.totalPages) {
      this.page = this.totalPages;
      this.pageChange.emit(this.totalPages);
    }
  }

  private emitQuery(): void {
    this.queryChange.emit({
      page: this.page,
      pageSize: this.pageSize,
      sort: this.sort,
      search: this.search
    });
  }

  private templateIfVisible(template?: TemplateRef<void> | null): TemplateRef<void> | null {
    if (!template || !hasVisibleContent(template)) {
      return null;
    }

    return template;
  }
}

function getByPath(row: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, part) => {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[part];
  }, row);
}

function parseBreakpoint(value: string): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 640;
}

function nextSort<T>(current: TableSort<T> | null, key: TableField<T>): TableSort<T> | null {
  if (!current || current.key !== key) {
    return { key, direction: 'asc' };
  }

  if (current.direction === 'asc') {
    return { key, direction: 'desc' };
  }

  return null;
}

function nextMultiSort<T>(current: TableSort<T>[], key: TableField<T>): TableSort<T>[] | null {
  const index = current.findIndex((item) => item.key === key);
  if (index === -1) {
    return [...current, { key, direction: 'asc' }];
  }

  if (current[index].direction === 'asc') {
    return current.map((item, itemIndex) =>
      itemIndex === index ? { key, direction: 'desc' } : item
    );
  }

  const next = current.filter((_, itemIndex) => itemIndex !== index);
  return next.length > 0 ? next : null;
}

function compareRows<T>(
  left: T,
  right: T,
  sorts: TableSort<T>[],
  columns: TableColumn<T>[]
): number {
  for (const spec of sorts) {
    const column = columns.find((item) => item.key === spec.key);
    const leftValue = getByPath(left, spec.key);
    const rightValue = getByPath(right, spec.key);
    const result = column?.compare
      ? column.compare(leftValue, rightValue, left, right)
      : compareValues(leftValue, rightValue, column?.sortType ?? 'auto');

    if (result !== 0) {
      return spec.direction === 'desc' ? -result : result;
    }
  }

  return 0;
}

function compareValues(left: unknown, right: unknown, sortType: SortType = 'auto'): number {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  const type = sortType === 'auto' ? detectSortType(left, right) : sortType;

  if (type === 'number') {
    return toNumber(left) - toNumber(right);
  }

  if (type === 'date') {
    return toTime(left) - toTime(right);
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base'
  });
}

function detectSortType(left: unknown, right: unknown): SortType {
  if (typeof left === 'number' && typeof right === 'number') {
    return 'number';
  }

  if (left instanceof Date && right instanceof Date) {
    return 'date';
  }

  if (isNumeric(left) && isNumeric(right)) {
    return 'number';
  }

  if (isDateValue(left) && isDateValue(right)) {
    return 'date';
  }

  return 'string';
}

function isNumeric(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  return Number.isFinite(Number(value));
}

function isDateValue(value: unknown): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value);
}

function toNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toTime(value: unknown): number {
  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(String(value)).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
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
