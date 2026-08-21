import {
  FormatType,
  SortType,
  TableColumn,
  TableField,
  TableFilters,
  TableSort
} from './simple-table.types';

export function getByPath(row: unknown, path: string): unknown {
  if (!path || path.startsWith('_')) {
    return undefined;
  }

  return path.split('.').reduce<unknown>((current, part) => {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[part];
  }, row);
}

export function parseBreakpoint(value: string): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 640;
}

export function nextSort<T>(current: TableSort<T> | null, key: TableField<T>): TableSort<T> | null {
  if (!current || current.key !== key) {
    return { key, direction: 'asc' };
  }

  if (current.direction === 'asc') {
    return { key, direction: 'desc' };
  }

  return null;
}

export function nextMultiSort<T>(current: TableSort<T>[], key: TableField<T>): TableSort<T>[] | null {
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

export function compareRows<T>(
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

export function compareValues(left: unknown, right: unknown, sortType: SortType = 'auto'): number {
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

export function filterRows<T>(
  rows: T[],
  searchText: string,
  searchKeys: Array<TableField<T>>,
  filters: TableFilters<T>,
  columns: TableColumn<T>[]
): T[] {
  return rows.filter((row) => {
    if (searchText) {
      const matchesSearch = searchKeys.some((key) =>
        String(getByPath(row, key) ?? '')
          .toLowerCase()
          .includes(searchText)
      );
      if (!matchesSearch) {
        return false;
      }
    }

    return matchesFilters(row, filters, columns);
  });
}

function matchesFilters<T>(row: T, filters: TableFilters<T>, columns: TableColumn<T>[]): boolean {
  for (const [key, raw] of Object.entries(filters) as Array<[TableField<T>, string | undefined]>) {
    const query = raw?.trim();
    if (!query) {
      continue;
    }

    const column = columns.find((item) => item.key === key);
    const value = getByPath(row, key);
    const kind = resolveFilterType(column);

    if (kind === 'select') {
      if (String(value ?? '') !== query) {
        return false;
      }
      continue;
    }

    if (kind === 'number') {
      const numeric = toNumber(value);
      if (query.includes('..')) {
        const [from, to] = query.split('..');
        if (from && numeric < Number(from)) {
          return false;
        }
        if (to && numeric > Number(to)) {
          return false;
        }
      } else if (numeric !== Number(query) && !String(value ?? '').includes(query)) {
        return false;
      }
      continue;
    }

    if (kind === 'date') {
      const time = toTime(value);
      if (query.includes('..')) {
        const [from, to] = query.split('..');
        if (from && time < new Date(from).getTime()) {
          return false;
        }
        if (to && time > new Date(to).getTime()) {
          return false;
        }
      } else if (!String(value ?? '').toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      continue;
    }

    if (!String(value ?? '').toLowerCase().includes(query.toLowerCase())) {
      return false;
    }
  }

  return true;
}

export function resolveFilterType<T>(column?: TableColumn<T>): ColumnFilterKind {
  if (!column?.filter) {
    return 'text';
  }

  if (column.filter === true) {
    return 'text';
  }

  return column.filter;
}

type ColumnFilterKind = 'text' | 'select' | 'number' | 'date';

export function formatCellValue(
  value: unknown,
  formatType: FormatType | undefined,
  formatOptions: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions | undefined,
  locale: string | undefined
): unknown {
  if (value == null || !formatType) {
    return value;
  }

  const loc = locale || undefined;

  if (formatType === 'number') {
    return new Intl.NumberFormat(loc, formatOptions as Intl.NumberFormatOptions | undefined).format(
      toNumber(value)
    );
  }

  if (formatType === 'currency') {
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: 'USD',
      ...(formatOptions as Intl.NumberFormatOptions | undefined)
    };
    return new Intl.NumberFormat(loc, options).format(toNumber(value));
  }

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(loc, formatOptions as Intl.DateTimeFormatOptions | undefined).format(
    date
  );
}

export function toCsvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function rowsToCsv<T>(rows: T[], columns: TableColumn<T>[], getValue: (row: T, column: TableColumn<T>) => unknown): string {
  const header = columns.map((column) => toCsvCell(column.label)).join(',');
  const body = rows
    .map((row) => columns.map((column) => toCsvCell(getValue(row, column))).join(','))
    .join('\n');
  return `${header}\n${body}`;
}

export function rowsToTsv<T>(rows: T[], columns: TableColumn<T>[], getValue: (row: T, column: TableColumn<T>) => unknown): string {
  const header = columns.map((column) => String(column.label ?? '')).join('\t');
  const body = rows
    .map((row) =>
      columns
        .map((column) => String(getValue(row, column) ?? '').replace(/\t/g, ' '))
        .join('\t')
    )
    .join('\n');
  return `${header}\n${body}`;
}

export function hasVisibleContent(template: { createEmbeddedView: (context: void) => EmbeddedLike }): boolean {
  const view = template.createEmbeddedView(undefined as unknown as void);
  view.detectChanges();
  const hasContent = view.rootNodes.some((node) => isVisibleNode(node));
  view.destroy();
  return hasContent;
}

interface EmbeddedLike {
  detectChanges(): void;
  rootNodes: Node[];
  destroy(): void;
}

function isVisibleNode(node: Node): boolean {
  if (node.nodeType === Node.TEXT_NODE) {
    return !!node.textContent?.trim();
  }

  return node.nodeType === Node.ELEMENT_NODE;
}

export function classList(
  value: string | string[] | Record<string, boolean> | null | undefined
): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(' ');
  }

  return Object.entries(value)
    .filter(([, on]) => on)
    .map(([name]) => name)
    .join(' ');
}
