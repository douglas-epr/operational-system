"use client";

/**
 * DataTable — generic table primitive used by `/users`, `/leads`,
 * `/feedback`, `/prompts`, etc.
 *
 *   <DataTable
 *     rows={users}
 *     getRowKey={(u) => u.id}
 *     columns={[
 *       { key: "name", header: "Name", cell: (u) => u.name },
 *       { key: "type", header: "Role", cell: (u) => <Badge>{u.type}</Badge> },
 *     ]}
 *   />
 */

import { clsx } from "clsx";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Tailwind class for cell width (e.g. "w-[140px]"). */
  width?: string;
  align?: "left" | "right" | "center";
  className?: string;
}

interface DataTableProps<T> {
  rows: readonly T[];
  columns: ReadonlyArray<DataTableColumn<T>>;
  getRowKey: (row: T, idx: number) => string;
  onRowClick?: (row: T) => void;
  /** Replaces tbody when rows is empty. */
  emptyState?: React.ReactNode;
  /** Compact row height. */
  dense?: boolean;
  className?: string;
}

const ALIGN: Record<NonNullable<DataTableColumn<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export default function DataTable<T>({
  rows,
  columns,
  getRowKey,
  onRowClick,
  emptyState,
  dense,
  className,
}: DataTableProps<T>) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-border bg-elevated overflow-hidden",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-base/40">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={clsx(
                    "px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted",
                    ALIGN[c.align ?? "left"],
                    c.width,
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {emptyState ?? (
                    <div className="px-4 py-10 text-center text-sm text-text-muted">
                      No results.
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr
                  key={getRowKey(r, i)}
                  onClick={() => onRowClick?.(r)}
                  className={clsx(
                    "border-b border-border-subtle last:border-0",
                    onRowClick && "cursor-pointer hover:bg-muted transition-colors"
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={clsx(
                        dense ? "px-4 py-2" : "px-4 py-3",
                        ALIGN[c.align ?? "left"],
                        c.className
                      )}
                    >
                      {c.cell(r)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
