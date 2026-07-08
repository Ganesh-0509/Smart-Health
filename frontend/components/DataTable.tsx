"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  sortValue?: (row: T) => number | string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  initialSort,
  rowClassName,
  emptyContent,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  initialSort?: { key: string; dir: "asc" | "desc" };
  rowClassName?: (row: T) => string;
  emptyContent?: React.ReactNode;
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(
    initialSort ?? null,
  );

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sort, columns]);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "desc" };
      if (prev.dir === "desc") return { key, dir: "asc" };
      return null;
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                className={clsx(
                  "whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted",
                  c.align === "right" && "text-right",
                  c.align === "center" && "text-center",
                )}
              >
                {c.sortable ? (
                  <button
                    onClick={() => toggleSort(c.key)}
                    className={clsx(
                      "inline-flex items-center gap-1 hover:text-ink",
                      c.align === "right" && "flex-row-reverse",
                    )}
                  >
                    {c.header}
                    {sort?.key === c.key ? (
                      sort.dir === "asc" ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                    )}
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-ink-muted">
                {emptyContent ?? "No data"}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr
                key={getRowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter") onRowClick(row);
                      }
                    : undefined
                }
                className={clsx(
                  "border-b border-slate-100 last:border-0",
                  onRowClick && "cursor-pointer hover:bg-surface-soft focus:bg-surface-soft focus:outline-none",
                  rowClassName?.(row),
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={clsx(
                      "px-3 py-3 text-ink-soft",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.className,
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
