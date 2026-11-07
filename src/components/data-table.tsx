import { useMemo, useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string;
  }
}

export type DataTableColumn<TData extends RowData> = {
  id: string;
  label: string;
  accessor: (row: TData) => string | number | Date | null | undefined;
  cell: (row: TData) => ReactNode;
  sortable?: boolean;
};

export function DataTable<TData extends RowData>({
  rows,
  columns,
  rowId,
  rowClassName,
  tableClassName,
  initialSorting,
  emptyMessage,
  ariaLabel,
}: {
  rows: TData[];
  columns: DataTableColumn<TData>[];
  rowId: (row: TData, index: number) => string;
  rowClassName?: (row: TData) => string | undefined;
  tableClassName?: string;
  initialSorting?: SortingState;
  emptyMessage?: ReactNode;
  ariaLabel?: string;
}) {
  const [sorting, setSorting] = useState<SortingState>(() => initialSorting ?? []);
  const [bodyRef] = useAutoAnimate<HTMLTableSectionElement>({
    duration: 180,
    easing: "ease-in-out",
  });

  const definitions = useMemo<ColumnDef<TData, unknown>[]>(
    () =>
      columns.map((column) => ({
        id: column.id,
        accessorFn: column.accessor,
        enableSorting: column.sortable !== false,
        header: ({ column: currentColumn }) => {
          if (column.sortable === false) return column.label;
          const direction = currentColumn.getIsSorted();
          const SortIcon =
            direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;
          return (
            <button
              className="table-sort-button"
              type="button"
              onClick={currentColumn.getToggleSortingHandler()}
              aria-label={"Sort by " + column.label}
              title={"Sort by " + column.label}
            >
              <span>{column.label}</span>
              <SortIcon size={12} aria-hidden="true" />
            </button>
          );
        },
        cell: ({ row }) => column.cell(row.original),
        meta: { label: column.label },
      })),
    [columns],
  );

  const table = useReactTable({
    data: rows,
    columns: definitions,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: rowId,
  });

  return (
    <>
      <table className={"data-table " + (tableClassName ?? "")} aria-label={ariaLabel}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const direction = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      direction === "asc"
                        ? "ascending"
                        : direction === "desc"
                          ? "descending"
                          : "none"
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody ref={bodyRef}>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className={rowClassName?.(row.original)}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} data-label={cell.column.columnDef.meta?.label}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="table-empty-state" role="status">
          {emptyMessage ?? <p>No records to show.</p>}
        </div>
      )}
    </>
  );
}
