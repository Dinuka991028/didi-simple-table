import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  QueryList,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { Subscription } from 'rxjs';

import {
  DidiCellDirective,
  DidiDetailDirective,
  DidiEmptyDirective,
  DidiFooterDirective,
  DidiHeaderDirective,
  DidiLoadingDirective
} from './simple-table.directives';
import {
  ColumnAlign,
  ColumnFilterType,
  DEFAULT_TABLE_LABELS,
  Density,
  DidiCellContext,
  DidiDetailContext,
  DidiFooterContext,
  DidiHeaderContext,
  PaginationMode,
  PagerNav,
  ResponsiveMode,
  SelectAllMode,
  SelectionMode,
  TABLE_THEMES,
  TableCellEdit,
  TableColumn,
  TableField,
  TableFilters,
  TableLabels,
  TableQuery,
  TableSort,
  TableSortState,
  TableTheme,
  interpolateLabel
} from './simple-table.types';
import {
  classList,
  compareRows,
  filterRows,
  formatCellValue,
  getByPath,
  hasVisibleContent,
  nextMultiSort,
  nextSort,
  parseBreakpoint,
  resolveFilterType,
  rowsToCsv,
  rowsToTsv
} from './simple-table.utils';

export {
  ColumnAlign,
  ColumnFilterType,
  ColumnPin,
  DEFAULT_TABLE_LABELS,
  Density,
  NestedKeyOf,
  PaginationMode,
  PagerNav,
  ResponsiveMode,
  SelectAllMode,
  SelectionMode,
  SortType,
  TABLE_THEMES,
  TableCellEdit,
  TableColumn,
  TableField,
  TableFilters,
  TableLabels,
  TableQuery,
  TableSort,
  TableSortState,
  TableTheme,
  interpolateLabel
} from './simple-table.types';

interface PersistState {
  hidden?: string[];
  order?: string[];
  widths?: Record<string, string>;
}

export interface TableViewGroup<T> {
  kind: 'group';
  value: unknown;
  count: number;
}

export interface TableViewRow<T> {
  kind: 'row';
  row: T;
  index: number;
}

export type TableViewItem<T> = TableViewGroup<T> | TableViewRow<T>;

@Component({
  selector: 'didi-simple-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './simple-table.html',
  styleUrls: ['./simple-table.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'didi-simple-table',
    '[class.didi-theme-light]': 'resolvedTheme === "light"',
    '[class.didi-theme-dark]': 'resolvedTheme === "dark"',
    '[class.didi-theme-teal]': 'resolvedTheme === "teal"',
    '[class.didi-theme-warm]': 'resolvedTheme === "warm"',
    '[class.didi-theme-compact]': 'resolvedTheme === "compact" || density === "compact"',
    '[class.didi-is-stacked]': 'isStacked',
    '[class.didi-is-narrow]': 'isNarrow',
    '[class.didi-has-pins]': 'hasPinnedColumns && !isStacked',
    '[class.didi-sticky-start]': 'hasPinnedStart && !isStacked',
    '[class.didi-sticky-end]': 'hasPinnedEnd && !isStacked',
    '[class.didi-pager-icons]': 'pagerNav === "icon"',
    '[class.didi-is-striped]': 'striped',
    '[class.didi-is-loading]': 'loading'
  }
})
export class SimpleTableComponent<T extends object = Record<string, unknown>>
  implements AfterContentInit, AfterViewInit, OnChanges, OnDestroy, OnInit
{
  @Input() data: T[] = [];
  @Input() columns: TableColumn<T>[] = [];
  @Input() loading = false;
  @Input() emptyMessage = '';
  @Input() noResultsMessage = '';
  @Input() loadingMessage = '';
  @Input() sortable = false;
  @Input() sort: TableSortState<T> = null;
  @Input() multiSort = false;
  @Input() pageSize: number | null = null;
  @Input() pageSizeOptions: number[] | null = null;
  @Input() page = 1;
  @Input() total: number | null = null;
  @Input() pagination: PaginationMode = 'client';
  @Input() pagerNav: PagerNav = 'label';
  @Input() searchable = false;
  @Input() search = '';
  @Input() searchPlaceholder = '';
  @Input() searchKeys: Array<TableField<T>> | null = null;
  @Input() searchDebounce = 300;
  @Input() resetPageOnSort = true;
  @Input() resetPageOnSearch = true;
  @Input() selectable: false | SelectionMode | true = false;
  @Input() selected: T[] = [];
  @Input() identityKey?: TableField<T>;
  @Input() selectOnRowClick = true;
  @Input() selectAllMode: SelectAllMode = 'page';
  @Input() stickyHeader = false;
  @Input() maxHeight: string | null = null;
  @Input() caption = '';
  @Input() theme: TableTheme | string = 'inherit';
  @Input() themePicker = false;
  @Input() themeOptions: TableTheme[] | null = null;
  @Input() themeOptionLabels: Partial<Record<TableTheme, string>> = {};
  @Input() columnCollapse = false;
  @Input() hiddenColumns: Array<TableField<T>> | null = null;
  @Input() responsive: ResponsiveMode = 'scroll';
  @Input() breakpoint = '640px';
  @Input() stickyFirstColumn = false;
  @Input() labels: Partial<TableLabels> = {};
  @Input() filters: TableFilters<T> = {};
  @Input() rowClass?: (row: T) => string | string[] | Record<string, boolean>;
  @Input() cellClass?: (
    value: unknown,
    row: T,
    column: TableColumn<T>
  ) => string | string[] | Record<string, boolean>;
  @Input() striped = false;
  @Input() density: Density | null = null;
  @Input() nullPlaceholder = '';
  @Input() locale?: string;
  @Input() expandable = false;
  @Input() expanded: T[] = [];
  @Input() groupBy: TableField<T> | null = null;
  @Input() exportable = false;
  @Input() columnResize = false;
  @Input() columnReorder = false;
  @Input() virtualScroll = false;
  @Input() rowHeight = 44;
  @Input() persistKey: string | null = null;
  @Input() copyable = true;

  @Output() sortChange = new EventEmitter<TableSortState<T>>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() queryChange = new EventEmitter<TableQuery<T>>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() selectedChange = new EventEmitter<T[]>();
  @Output() hiddenColumnsChange = new EventEmitter<Array<TableField<T>>>();
  @Output() filtersChange = new EventEmitter<TableFilters<T>>();
  @Output() cellEdit = new EventEmitter<TableCellEdit<T>>();
  @Output() expandedChange = new EventEmitter<T[]>();
  @Output() columnOrderChange = new EventEmitter<Array<TableField<T>>>();
  @Output() themeChange = new EventEmitter<TableTheme>();

  @ContentChildren(DidiCellDirective) private cellDefs?: QueryList<DidiCellDirective>;
  @ContentChildren(DidiHeaderDirective) private headerDefs?: QueryList<DidiHeaderDirective>;
  @ContentChildren(DidiFooterDirective) private footerDefs?: QueryList<DidiFooterDirective>;
  @ContentChild(DidiEmptyDirective) private emptyDef?: DidiEmptyDirective;
  @ContentChild(DidiLoadingDirective) private loadingDef?: DidiLoadingDirective;
  @ContentChild(DidiDetailDirective) private detailDef?: DidiDetailDirective;

  @ViewChild('scrollArea') private scrollArea?: ElementRef<HTMLElement>;

  emptyTemplate: TemplateRef<void> | null = null;
  loadingTemplate: TemplateRef<void> | null = null;
  detailTemplate: TemplateRef<DidiDetailContext<T>> | null = null;
  columnMenuOpen = false;
  isNarrow = false;
  searchBox = '';
  filteredData: T[] = [];
  sortedData: T[] = [];
  displayData: T[] = [];
  visibleColumns: TableColumn<T>[] = [];
  viewItems: Array<TableViewItem<T>> = [];
  activeRowIndex = 0;
  editing: { row: T; key: TableField<T>; value: string } | null = null;
  virtualPadTop = 0;
  virtualPadBottom = 0;

  private localHidden: Array<TableField<T>> | null = null;
  private localOrder: Array<TableField<T>> | null = null;
  private columnWidths: Record<string, string> = {};
  private resizeObserver: ResizeObserver | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private contentSub = new Subscription();
  private menuUnlisten: Array<() => void> = [];
  private resizeUnlisten: Array<() => void> = [];
  private cellTemplates = new Map<string, TemplateRef<DidiCellContext<T>>>();
  private headerTemplates = new Map<string, TemplateRef<DidiHeaderContext<T>>>();
  private footerTemplates = new Map<string, TemplateRef<DidiFooterContext<T>>>();
  private dragKey: TableField<T> | null = null;
  private measuredWidths: Record<string, number> = {};
  private isBrowser: boolean;

  constructor(
    private host: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  get resolvedTheme(): TableTheme {
    return (TABLE_THEMES as readonly string[]).includes(this.theme)
      ? (this.theme as TableTheme)
      : 'inherit';
  }

  get resolvedThemeOptions(): TableTheme[] {
    const options = this.themeOptions?.length ? this.themeOptions : [...TABLE_THEMES];
    return options.filter((option) => (TABLE_THEMES as readonly string[]).includes(option));
  }

  get resolvedLabels(): TableLabels {
    return { ...DEFAULT_TABLE_LABELS, ...this.labels };
  }

  themeOptionLabel(option: TableTheme): string {
    const override = this.themeOptionLabels[option];
    if (override) {
      return override;
    }

    return option.charAt(0).toUpperCase() + option.slice(1);
  }

  onThemeSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const next = (TABLE_THEMES as readonly string[]).includes(value)
      ? (value as TableTheme)
      : 'inherit';
    this.theme = next;
    this.themeChange.emit(next);
    this.cdr.markForCheck();
  }

  get isEmpty(): boolean {
    return this.filteredData.length === 0;
  }

  get hasActiveQuery(): boolean {
    if (this.search.trim()) {
      return true;
    }

    return Object.values(this.filters).some((value) => String(value ?? '').trim() !== '');
  }

  get emptyText(): string {
    if (this.hasActiveQuery) {
      return this.noResultsMessage || this.resolvedLabels.noResults;
    }

    return this.emptyMessage || this.resolvedLabels.noData;
  }

  get loadingText(): string {
    return this.loadingMessage || this.resolvedLabels.loading;
  }

  get searchPlaceholderText(): string {
    return this.searchPlaceholder || this.resolvedLabels.search;
  }

  get showLoadingRow(): boolean {
    return this.loading && this.isEmpty;
  }

  get showLoadingOverlay(): boolean {
    return this.loading && !this.isEmpty;
  }

  get showEmptyRow(): boolean {
    return !this.loading && this.isEmpty;
  }

  get showRows(): boolean {
    return !this.isEmpty;
  }

  get columnCount(): number {
    let count = this.visibleColumns.length || 1;
    if (this.isMultiple) {
      count += 1;
    }
    if (this.expandable) {
      count += 1;
    }
    return count;
  }

  get isStacked(): boolean {
    return this.responsive === 'stack' && this.isNarrow;
  }

  get hiddenColumnCount(): number {
    return Math.max(0, this.columns.length - this.visibleColumns.length);
  }

  get columnMenuLabel(): string {
    if (this.hiddenColumnCount === 0) {
      return this.resolvedLabels.columns;
    }

    return interpolateLabel(this.resolvedLabels.columnsHidden, { count: this.hiddenColumnCount });
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
    return this.rowClick.observers.length > 0 || (this.isSelectable && this.selectOnRowClick);
  }

  get selectScopeRows(): T[] {
    return this.selectAllMode === 'filtered' ? this.sortedData : this.displayData;
  }

  get allVisibleSelected(): boolean {
    const rows = this.selectScopeRows;
    return rows.length > 0 && rows.every((row) => this.isSelected(row));
  }

  get someVisibleSelected(): boolean {
    const rows = this.selectScopeRows;
    return rows.some((row) => this.isSelected(row)) && !this.allVisibleSelected;
  }

  get isPaginated(): boolean {
    return this.pageSize != null && this.pageSize > 0;
  }

  get isServerPaged(): boolean {
    return this.pagination === 'server';
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

  get rangeLabel(): string {
    return interpolateLabel(this.resolvedLabels.rangeOf, {
      start: this.rangeStart,
      end: this.rangeEnd,
      total: this.itemCount
    });
  }

  get pageLabel(): string {
    return interpolateLabel(this.resolvedLabels.pageOf, {
      page: this.currentPage,
      total: this.totalPages
    });
  }

  get hasFilterRow(): boolean {
    return this.visibleColumns.some((column) => !!column.filter);
  }

  get hasFooter(): boolean {
    return this.visibleColumns.some(
      (column) => !!column.footer || this.footerTemplates.has(column.key)
    );
  }

  get hasPinnedStart(): boolean {
    if (this.isStacked) {
      return false;
    }

    return (
      this.stickyFirstColumn ||
      this.visibleColumns.some((column) => column.pinned === true || column.pinned === 'start')
    );
  }

  get hasPinnedEnd(): boolean {
    return !this.isStacked && this.visibleColumns.some((column) => column.pinned === 'end');
  }

  get hasPinnedColumns(): boolean {
    return this.hasPinnedStart || this.hasPinnedEnd;
  }

  get isChromePinned(): boolean {
    return this.hasPinnedStart;
  }

  get selectAllLabel(): string {
    return this.selectAllMode === 'filtered'
      ? this.resolvedLabels.selectAllFiltered
      : this.resolvedLabels.selectAllPage;
  }

  get ariaRowCount(): number {
    if (this.showLoadingRow || this.showEmptyRow) {
      return 2;
    }

    return this.itemCount + 1;
  }

  get virtualEnabled(): boolean {
    return this.virtualScroll && !this.isStacked && !this.groupBy && !!this.maxHeight;
  }

  ngOnInit(): void {
    this.searchBox = this.search;
    this.restorePersist();
    this.rebuildDerived();
    this.observeWidth();
  }

  ngAfterViewInit(): void {
    this.measurePinnedColumns();
  }

  ngAfterContentInit(): void {
    this.rebuildTemplates();
    if (this.cellDefs) {
      this.contentSub.add(this.cellDefs.changes.subscribe(() => this.rebuildTemplates()));
    }
    if (this.headerDefs) {
      this.contentSub.add(this.headerDefs.changes.subscribe(() => this.rebuildTemplates()));
    }
    if (this.footerDefs) {
      this.contentSub.add(this.footerDefs.changes.subscribe(() => this.rebuildTemplates()));
    }
  }

  ngOnDestroy(): void {
    this.contentSub.unsubscribe();
    this.clearSearchTimer();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.clearMenuListeners();
    this.clearResizeListeners();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hiddenColumns'] && this.hiddenColumns != null) {
      this.localHidden = [...this.hiddenColumns];
    }

    if (changes['search'] && !changes['search'].firstChange) {
      this.searchBox = this.search;
    }

    if (changes['breakpoint'] && !changes['breakpoint'].firstChange) {
      this.updateNarrow();
    }

    const rebuild =
      changes['data'] ||
      changes['columns'] ||
      changes['search'] ||
      changes['searchKeys'] ||
      changes['sort'] ||
      changes['page'] ||
      changes['pageSize'] ||
      changes['pagination'] ||
      changes['total'] ||
      changes['filters'] ||
      changes['groupBy'] ||
      changes['hiddenColumns'] ||
      changes['virtualScroll'] ||
      changes['maxHeight'] ||
      changes['stickyFirstColumn'];

    if (rebuild) {
      this.rebuildDerived();
    }
  }

  trackByRow = (_index: number, item: TableViewItem<T> | T): unknown => {
    const row = this.asRow(item);
    if (!row) {
      const group = item as TableViewGroup<T>;
      return `group:${String(group.value)}`;
    }

    if (this.identityKey) {
      return getByPath(row, this.identityKey) ?? _index;
    }

    return row;
  };

  trackByColumn = (_index: number, column: TableColumn<T>): string => column.key;

  asRow(item: TableViewItem<T> | T): T | null {
    if (item && typeof item === 'object' && 'kind' in item) {
      return item.kind === 'row' ? item.row : null;
    }

    return item as T;
  }

  asGroup(item: TableViewItem<T>): TableViewGroup<T> | null {
    return item.kind === 'group' ? item : null;
  }

  asData(item: TableViewItem<T>): TableViewRow<T> | null {
    return item.kind === 'row' ? item : null;
  }

  isHiddenOnMobile(column: TableColumn<T>): boolean {
    return !!column.hideOnMobile && this.isNarrow;
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
    this.bindMenuListeners();
    this.cdr.markForCheck();
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
    const vars = { label: column.label };
    if (spec?.direction === 'asc') {
      return interpolateLabel(this.resolvedLabels.sortAsc, vars);
    }

    if (spec?.direction === 'desc') {
      return interpolateLabel(this.resolvedLabels.sortDesc, vars);
    }

    return interpolateLabel(this.resolvedLabels.sortBy, vars);
  }

  hideColumnLabel(column: TableColumn<T>): string {
    return interpolateLabel(this.resolvedLabels.hideColumn, { label: column.label });
  }

  get canShowAllColumns(): boolean {
    return this.columns.some((column) => this.isCollapsed(column));
  }

  showAllColumns(): void {
    if (!this.canShowAllColumns) {
      return;
    }

    this.setHiddenKeys([]);
  }

  sortSpec(column: TableColumn<T>): TableSort<T> | null {
    return this.activeSorts.find((item) => item.key === column.key) ?? null;
  }

  sortIndex(column: TableColumn<T>): number {
    return this.activeSorts.findIndex((item) => item.key === column.key);
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
    this.rebuildDerived();
    this.emitQuery();
  }

  pagerButtonText(kind: 'first' | 'prev' | 'next' | 'last'): string {
    if (this.pagerNav === 'icon') {
      if (kind === 'first') {
        return '«';
      }
      if (kind === 'prev') {
        return '‹';
      }
      if (kind === 'next') {
        return '›';
      }
      return '»';
    }

    if (kind === 'first') {
      return this.resolvedLabels.firstPage;
    }
    if (kind === 'prev') {
      return this.resolvedLabels.previous;
    }
    if (kind === 'next') {
      return this.resolvedLabels.next;
    }
    return this.resolvedLabels.lastPage;
  }

  goToPage(page: number): void {
    if (!this.isPaginated) {
      return;
    }

    const next = Math.min(Math.max(1, page), this.totalPages);
    if (next === this.page) {
      return;
    }

    this.page = next;
    this.activeRowIndex = 0;
    this.pageChange.emit(next);
    this.rebuildDerived();
    this.emitQuery();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchBox = value;
    if (!value || this.searchDebounce <= 0) {
      this.commitSearch(value);
      return;
    }

    this.clearSearchTimer();
    this.searchTimer = setTimeout(() => this.commitSearch(this.searchBox), this.searchDebounce);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.commitSearch(this.searchBox);
    }
  }

  onPageSizeSelect(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    if (!Number.isFinite(size) || size <= 0 || size === this.pageSize) {
      return;
    }

    this.pageSize = size;
    this.pageSizeChange.emit(size);
    this.syncPage(false);
    this.rebuildDerived();
    this.emitQuery();
  }

  onFilterInput(column: TableColumn<T>, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.filters = { ...this.filters, [column.key]: value };
    this.filtersChange.emit(this.filters);
    this.syncPage(this.resetPageOnSearch);
    this.rebuildDerived();
    this.emitQuery();
  }

  filterValue(column: TableColumn<T>): string {
    return this.filters[column.key] ?? '';
  }

  filterKind(column: TableColumn<T>): ColumnFilterType {
    return resolveFilterType(column);
  }

  isSelected(row: T): boolean {
    return this.selected.some((item) => this.sameRow(item, row));
  }

  isExpanded(row: T): boolean {
    return this.expanded.some((item) => this.sameRow(item, row));
  }

  rowTabIndex(index: number): number | null {
    if (!this.isClickable && !this.expandable) {
      return null;
    }

    return index === this.activeRowIndex ? 0 : -1;
  }

  rowClasses(row: T): string {
    return classList(this.rowClass?.(row));
  }

  cellClasses(row: T, column: TableColumn<T>): string {
    return classList(this.cellClass?.(this.getRawValue(row, column), row, column));
  }

  columnAlign(column: TableColumn<T>): ColumnAlign {
    return column.align ?? 'start';
  }

  columnStyle(column: TableColumn<T>, isHeader = false): Record<string, string> {
    const style: Record<string, string> = {
      'text-align': this.columnAlign(column)
    };
    const width = this.columnWidths[column.key] || column.width;
    if (width) {
      style['width'] = width;
    }
    if (column.minWidth) {
      style['min-width'] = column.minWidth;
    }
    const side = this.pinSide(column);
    if (side === 'start') {
      style['inset-inline-start'] = `${this.pinOffset(column)}px`;
    }
    if (side === 'end') {
      style['inset-inline-end'] = `${this.pinEndOffset(column)}px`;
    }
    if (isHeader && side) {
      style['z-index'] = '3';
    }
    return style;
  }

  pinSide(column: TableColumn<T>): 'start' | 'end' | null {
    if (this.isStacked) {
      return null;
    }

    if (column.pinned === 'end') {
      return 'end';
    }

    if (column.pinned === true || column.pinned === 'start') {
      return 'start';
    }

    if (this.stickyFirstColumn && this.visibleColumns[0]?.key === column.key) {
      return 'start';
    }

    return null;
  }

  isPinned(column: TableColumn<T>): boolean {
    return this.pinSide(column) != null;
  }

  isPinnedEnd(column: TableColumn<T>): boolean {
    return this.pinSide(column) === 'end';
  }

  isPinEdge(column: TableColumn<T>): boolean {
    if (this.pinSide(column) !== 'start') {
      return false;
    }

    for (let index = this.visibleColumns.length - 1; index >= 0; index -= 1) {
      const item = this.visibleColumns[index];
      if (this.pinSide(item) === 'start') {
        return item.key === column.key;
      }
    }

    return false;
  }

  isPinEndEdge(column: TableColumn<T>): boolean {
    if (this.pinSide(column) !== 'end') {
      return false;
    }

    for (const item of this.visibleColumns) {
      if (this.pinSide(item) === 'end') {
        return item.key === column.key;
      }
    }

    return false;
  }

  chromePinOffset(kind: 'expand' | 'select'): number {
    if (kind === 'expand') {
      return 0;
    }

    return this.expandable ? 40 : 0;
  }

  pinOffset(column: TableColumn<T>): number {
    let offset = 0;
    for (const item of this.visibleColumns) {
      if (item.key === column.key) {
        break;
      }
      if (this.pinSide(item) === 'start') {
        offset += this.columnPixelWidth(item);
      }
    }
    if (this.isMultiple && this.pinSide(column) === 'start') {
      offset += 44;
    }
    if (this.expandable && this.pinSide(column) === 'start') {
      offset += 40;
    }
    return offset;
  }

  pinEndOffset(column: TableColumn<T>): number {
    let offset = 0;
    for (let index = this.visibleColumns.length - 1; index >= 0; index -= 1) {
      const item = this.visibleColumns[index];
      if (item.key === column.key) {
        break;
      }
      if (this.pinSide(item) === 'end') {
        offset += this.columnPixelWidth(item);
      }
    }
    return offset;
  }

  onRowClick(row: T, index: number, event: Event): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('a, button, input, label, textarea, select')) {
      return;
    }

    this.activeRowIndex = index;
    this.rowClick.emit(row);
    if (this.isSelectable && this.selectOnRowClick) {
      this.toggleRow(row);
    }
  }

  onRowKeydown(row: T, index: number, event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveActiveRow(index + 1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveActiveRow(index - 1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      this.moveActiveRow(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      this.moveActiveRow(this.displayData.length - 1);
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.rowClick.emit(row);
    if (this.isSelectable && this.selectOnRowClick) {
      this.toggleRow(row);
    }
  }

  onCheckboxChange(row: T, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.setRowSelected(row, checked);
  }

  toggleAllVisible(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const scope = this.selectScopeRows;
    if (checked) {
      const extra = scope.filter((row) => !this.isSelected(row));
      this.selected = [...this.selected, ...extra];
    } else {
      this.selected = this.selected.filter(
        (item) => !scope.some((row) => this.sameRow(row, item))
      );
    }

    this.selectedChange.emit(this.selected);
    this.cdr.markForCheck();
  }

  toggleExpanded(row: T, event?: Event): void {
    event?.stopPropagation();
    if (this.isExpanded(row)) {
      this.expanded = this.expanded.filter((item) => !this.sameRow(item, row));
    } else {
      this.expanded = [...this.expanded, row];
    }
    this.expandedChange.emit(this.expanded);
    this.cdr.markForCheck();
  }

  startEdit(row: T, column: TableColumn<T>, event: Event): void {
    if (!column.editable) {
      return;
    }

    event.stopPropagation();
    this.editing = {
      row,
      key: column.key,
      value: String(this.getRawValue(row, column) ?? '')
    };
    this.cdr.markForCheck();
  }

  commitEdit(): void {
    if (!this.editing) {
      return;
    }

    this.cellEdit.emit({
      row: this.editing.row,
      key: this.editing.key,
      value: this.editing.value
    });
    this.editing = null;
    this.cdr.markForCheck();
  }

  cancelEdit(): void {
    this.editing = null;
    this.cdr.markForCheck();
  }

  isEditing(row: T, column: TableColumn<T>): boolean {
    return !!this.editing && this.sameRow(this.editing.row, row) && this.editing.key === column.key;
  }

  onEditInput(event: Event): void {
    if (!this.editing) {
      return;
    }

    this.editing = { ...this.editing, value: (event.target as HTMLInputElement).value };
  }

  getCellTemplate(column: TableColumn<T>): TemplateRef<DidiCellContext<T>> | null {
    return this.cellTemplates.get(column.key) ?? null;
  }

  getHeaderTemplate(column: TableColumn<T>): TemplateRef<DidiHeaderContext<T>> | null {
    return this.headerTemplates.get(column.key) ?? null;
  }

  getFooterTemplate(column: TableColumn<T>): TemplateRef<DidiFooterContext<T>> | null {
    return this.footerTemplates.get(column.key) ?? null;
  }

  getRawValue(row: T, column: TableColumn<T>): unknown {
    return getByPath(row, column.key);
  }

  getCellValue(row: T, column: TableColumn<T>): unknown {
    const value = this.getRawValue(row, column);
    if (column.format) {
      return column.format(value, row);
    }

    if (column.formatType) {
      return formatCellValue(value, column.formatType, column.formatOptions, this.locale);
    }

    if (value == null || value === '') {
      return this.nullPlaceholder;
    }

    return value;
  }

  getFooterValue(column: TableColumn<T>): unknown {
    return column.footer ? column.footer(this.sortedData) : '';
  }

  footerContext(column: TableColumn<T>): DidiFooterContext<T> {
    return {
      $implicit: column,
      column,
      rows: this.sortedData,
      value: this.getFooterValue(column)
    };
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

  detailContext(row: T): DidiDetailContext<T> {
    return { $implicit: row, row };
  }

  refresh(): void {
    this.rebuildDerived();
  }

  exportCsv(filename = 'table.csv'): void {
    if (!this.isBrowser) {
      return;
    }

    const csv = rowsToCsv(this.sortedData, this.visibleColumns, (row, column) =>
      this.getCellValue(row, column)
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  onCopy(event: ClipboardEvent): void {
    if (!this.copyable || !this.isBrowser) {
      return;
    }

    const selection = this.host.nativeElement.ownerDocument?.getSelection();
    if (selection && selection.toString()) {
      return;
    }

    const rows = this.selected.length ? this.selected : this.displayData;
    const tsv = rowsToTsv(rows, this.visibleColumns, (row, column) => this.getCellValue(row, column));
    event.clipboardData?.setData('text/plain', tsv);
    event.preventDefault();
  }

  onHeaderDragStart(column: TableColumn<T>, event: DragEvent): void {
    if (!this.columnReorder) {
      return;
    }

    this.dragKey = column.key;
    event.dataTransfer?.setData('text/plain', column.key);
  }

  onHeaderDrop(column: TableColumn<T>, event: DragEvent): void {
    event.preventDefault();
    if (!this.columnReorder || !this.dragKey || this.dragKey === column.key) {
      this.dragKey = null;
      return;
    }

    const order = this.orderedColumns().map((item) => item.key);
    const from = order.indexOf(this.dragKey);
    const to = order.indexOf(column.key);
    if (from < 0 || to < 0) {
      this.dragKey = null;
      return;
    }

    order.splice(from, 1);
    order.splice(to, 0, this.dragKey);
    this.localOrder = order;
    this.dragKey = null;
    this.columnOrderChange.emit(order);
    this.savePersist();
    this.rebuildDerived();
  }

  onHeaderDragOver(event: DragEvent): void {
    if (this.columnReorder) {
      event.preventDefault();
    }
  }

  onResizeStart(column: TableColumn<T>, event: MouseEvent): void {
    if (!this.columnResize || !this.isBrowser) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = this.columnPixelWidth(column);
    const onMove = (move: MouseEvent) => {
      const next = Math.max(48, startWidth + (move.clientX - startX));
      this.columnWidths[column.key] = `${next}px`;
      this.cdr.markForCheck();
    };
    const onUp = () => {
      this.clearResizeListeners();
      this.savePersist();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    this.resizeUnlisten = [
      () => document.removeEventListener('mousemove', onMove),
      () => document.removeEventListener('mouseup', onUp)
    ];
  }

  onScroll(): void {
    if (!this.virtualEnabled) {
      return;
    }

    this.updateVirtualWindow();
  }

  private columnPixelWidth(column: TableColumn<T>): number {
    const measured = this.measuredWidths[column.key];
    if (measured) {
      return measured;
    }

    const raw = this.columnWidths[column.key] || column.width || '140px';
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 140;
  }

  private schedulePinnedMeasure(): void {
    if (!this.isBrowser || !this.hasPinnedColumns || this.isStacked) {
      return;
    }

    queueMicrotask(() => this.measurePinnedColumns());
  }

  private measurePinnedColumns(): void {
    if (!this.isBrowser || !this.hasPinnedColumns || this.isStacked) {
      return;
    }

    const headers = this.host.nativeElement.querySelectorAll<HTMLElement>(
      'thead tr:first-child th[data-column-key]'
    );
    let changed = false;
    headers.forEach((header) => {
      const key = header.getAttribute('data-column-key');
      if (!key) {
        return;
      }

      const width = Math.round(header.getBoundingClientRect().width);
      if (width > 0 && this.measuredWidths[key] !== width) {
        this.measuredWidths[key] = width;
        changed = true;
      }
    });

    if (changed) {
      this.cdr.markForCheck();
    }
  }

  private orderedColumns(): TableColumn<T>[] {
    if (!this.localOrder?.length) {
      return this.columns;
    }

    const byKey = new Map(this.columns.map((column) => [column.key, column]));
    const ordered: TableColumn<T>[] = [];
    for (const key of this.localOrder) {
      const column = byKey.get(key);
      if (column) {
        ordered.push(column);
        byKey.delete(key);
      }
    }
    byKey.forEach((column) => ordered.push(column));
    return ordered;
  }

  private commitSearch(value: string): void {
    this.clearSearchTimer();
    if (this.search === value) {
      return;
    }

    this.search = value;
    this.searchBox = value;
    this.searchChange.emit(value);
    this.syncPage(this.resetPageOnSearch);
    this.rebuildDerived();
    this.emitQuery();
  }

  private rebuildDerived(): void {
    const searchText = this.search.trim().toLowerCase();
    const keys = this.searchKeys ?? this.columns.map((column) => column.key);

    if (this.isServerPaged) {
      this.filteredData = this.data;
      this.sortedData = this.data;
    } else {
      this.filteredData = filterRows(this.data, searchText, keys, this.filters, this.columns);
      this.sortedData =
        this.activeSorts.length === 0
          ? this.filteredData
          : [...this.filteredData].sort((left, right) =>
              compareRows(left, right, this.activeSorts, this.columns)
            );
    }

    this.clampExternalPage();

    if (!this.isPaginated || this.isServerPaged || this.pageSize == null) {
      this.displayData = this.sortedData;
    } else {
      const start = (this.currentPage - 1) * this.pageSize;
      this.displayData = this.sortedData.slice(start, start + this.pageSize);
    }

    const ordered = this.orderedColumns();
    const visible = ordered.filter(
      (column) => !this.isCollapsed(column) && !this.isHiddenOnMobile(column)
    );
    this.visibleColumns = visible.length > 0 ? visible : ordered.slice(0, 1);
    this.buildViewItems();
    this.updateVirtualWindow();
    this.schedulePinnedMeasure();
    this.cdr.markForCheck();
  }

  private buildViewItems(): void {
    const rows = this.virtualEnabled ? this.virtualRows() : this.displayData;
    if (!this.groupBy || this.isServerPaged) {
      this.viewItems = rows.map((row, index) => ({ kind: 'row', row, index }));
      return;
    }

    const groupBy = this.groupBy;
    const items: Array<TableViewItem<T>> = [];
    let last: unknown = Symbol('unset');
    let index = 0;
    for (const row of rows) {
      const value = getByPath(row, groupBy);
      if (value !== last) {
        const count = rows.filter((item) => getByPath(item, groupBy) === value).length;
        items.push({ kind: 'group', value, count });
        last = value;
      }
      items.push({ kind: 'row', row, index });
      index += 1;
    }
    this.viewItems = items;
  }

  private virtualRows(): T[] {
    return this.displayData.slice(this.virtualStart(), this.virtualEnd());
  }

  private virtualStart(): number {
    if (!this.virtualEnabled) {
      return 0;
    }

    const top = this.scrollArea?.nativeElement.scrollTop ?? 0;
    return Math.max(0, Math.floor(top / this.rowHeight) - 5);
  }

  private virtualEnd(): number {
    if (!this.virtualEnabled) {
      return this.displayData.length;
    }

    const height = this.scrollArea?.nativeElement.clientHeight ?? 400;
    return Math.min(this.displayData.length, this.virtualStart() + Math.ceil(height / this.rowHeight) + 10);
  }

  private updateVirtualWindow(): void {
    if (!this.virtualEnabled) {
      this.virtualPadTop = 0;
      this.virtualPadBottom = 0;
      return;
    }

    const start = this.virtualStart();
    const end = this.virtualEnd();
    this.virtualPadTop = start * this.rowHeight;
    this.virtualPadBottom = Math.max(0, (this.displayData.length - end) * this.rowHeight);
    this.viewItems = this.displayData.slice(start, end).map((row, index) => ({
      kind: 'row',
      row,
      index: start + index
    }));
    this.cdr.markForCheck();
  }

  private clampExternalPage(): void {
    if (!this.isPaginated) {
      return;
    }

    if (this.page > this.totalPages) {
      this.page = this.totalPages;
      this.pageChange.emit(this.totalPages);
    }
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
      search: this.search,
      filters: this.filters
    });
  }

  private rebuildTemplates(): void {
    this.cellTemplates.clear();
    this.headerTemplates.clear();
    this.footerTemplates.clear();
    this.cellDefs?.forEach((def) => {
      this.cellTemplates.set(def.didiCell, def.template as TemplateRef<DidiCellContext<T>>);
    });
    this.headerDefs?.forEach((def) => {
      this.headerTemplates.set(def.didiHeader, def.template as TemplateRef<DidiHeaderContext<T>>);
    });
    this.footerDefs?.forEach((def) => {
      this.footerTemplates.set(def.didiFooter, def.template as TemplateRef<DidiFooterContext<T>>);
    });
    this.emptyTemplate = this.templateIfVisible(this.emptyDef?.template);
    this.loadingTemplate = this.templateIfVisible(this.loadingDef?.template);
    this.detailTemplate = (this.detailDef?.template as TemplateRef<DidiDetailContext<T>> | undefined) ?? null;
    this.cdr.markForCheck();
  }

  private templateIfVisible(template?: TemplateRef<void> | null): TemplateRef<void> | null {
    if (!template) {
      return null;
    }

    if (!this.isBrowser) {
      return template;
    }

    return hasVisibleContent(template) ? template : null;
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
    this.savePersist();
    this.rebuildDerived();
  }

  private sameRow(left: T, right: T): boolean {
    if (this.identityKey) {
      return getByPath(left, this.identityKey) === getByPath(right, this.identityKey);
    }

    return left === right;
  }

  private toggleRow(row: T): void {
    this.setRowSelected(row, !this.isSelected(row));
  }

  private setRowSelected(row: T, selected: boolean): void {
    if (this.selectionMode === 'single') {
      this.selected = selected ? [row] : [];
      this.selectedChange.emit(this.selected);
      this.cdr.markForCheck();
      return;
    }

    if (selected && !this.isSelected(row)) {
      this.selected = [...this.selected, row];
    } else if (!selected) {
      this.selected = this.selected.filter((item) => !this.sameRow(item, row));
    }

    this.selectedChange.emit(this.selected);
    this.cdr.markForCheck();
  }

  private moveActiveRow(index: number): void {
    const next = Math.min(Math.max(0, index), Math.max(0, this.displayData.length - 1));
    this.activeRowIndex = next;
    this.cdr.markForCheck();
    if (!this.isBrowser) {
      return;
    }

    const rows = this.host.nativeElement.querySelectorAll<HTMLElement>('tbody tr.didi-data-row');
    rows[next]?.focus();
  }

  private observeWidth(): void {
    this.updateNarrow();
    if (!this.isBrowser || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.updateNarrow();
      this.measurePinnedColumns();
    });
    this.resizeObserver.observe(this.host.nativeElement);
  }

  private updateNarrow(): void {
    if (!this.isBrowser) {
      return;
    }

    const width = this.host.nativeElement.getBoundingClientRect().width;
    if (width <= 0) {
      return;
    }

    const next = width <= parseBreakpoint(this.breakpoint);
    if (next !== this.isNarrow) {
      this.isNarrow = next;
      this.rebuildDerived();
    }
  }

  private bindMenuListeners(): void {
    this.clearMenuListeners();
    if (!this.columnMenuOpen || !this.isBrowser) {
      return;
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      const menu = this.host.nativeElement.querySelector('.didi-column-menu');
      if (target && menu?.contains(target)) {
        return;
      }
      this.columnMenuOpen = false;
      this.clearMenuListeners();
      this.cdr.markForCheck();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      this.columnMenuOpen = false;
      this.clearMenuListeners();
      this.cdr.markForCheck();
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    this.menuUnlisten = [
      () => document.removeEventListener('click', onClick),
      () => document.removeEventListener('keydown', onKey)
    ];
  }

  private clearMenuListeners(): void {
    this.menuUnlisten.forEach((stop) => stop());
    this.menuUnlisten = [];
  }

  private clearResizeListeners(): void {
    this.resizeUnlisten.forEach((stop) => stop());
    this.resizeUnlisten = [];
  }

  private clearSearchTimer(): void {
    if (this.searchTimer != null) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  }

  private restorePersist(): void {
    if (!this.isBrowser || !this.persistKey) {
      return;
    }

    try {
      const raw = localStorage.getItem(this.persistKey);
      if (!raw) {
        return;
      }

      const state = JSON.parse(raw) as PersistState;
      if (state.hidden) {
        this.localHidden = state.hidden as Array<TableField<T>>;
      }
      if (state.order) {
        this.localOrder = state.order as Array<TableField<T>>;
      }
      if (state.widths) {
        this.columnWidths = state.widths;
      }
    } catch {
      /* ignore */
    }
  }

  private savePersist(): void {
    if (!this.isBrowser || !this.persistKey) {
      return;
    }

    const state: PersistState = {
      hidden: this.activeHiddenKeys() as string[],
      order: this.orderedColumns().map((column) => column.key),
      widths: this.columnWidths
    };
    try {
      localStorage.setItem(this.persistKey, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
}
