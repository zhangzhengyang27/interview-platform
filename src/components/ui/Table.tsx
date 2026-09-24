"use client";

import { type ReactNode, type TableHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  key: string;
  title: ReactNode;
  dataIndex?: keyof T | string;
  render?: (record: T, index: number) => ReactNode;
  width?: number | string;
  align?: "left" | "center" | "right";
  /** 允许点击表头排序 */
  sortable?: boolean;
  sortOrder?: "ascend" | "descend" | null;
  onSort?: (order: "ascend" | "descend" | null) => void;
  className?: string;
}

interface TableProps<T>
  extends Omit<TableHTMLAttributes<HTMLTableElement>, "onChange" | "summary"> {
  columns: ColumnDef<T>[];
  dataSource: T[];
  rowKey?: (record: T, index: number) => string | number;
  loading?: boolean;
  rowClassName?: (record: T, index: number) => string;
  emptyText?: ReactNode;
  /** 底部合计行内容（tfoot） */
  summary?: ReactNode;
}

function cellValue<T>(record: T, dataIndex?: keyof T | string): ReactNode {
  if (dataIndex === undefined) return null;
  const v = (record as Record<string, unknown>)[String(dataIndex)];
  if (v === null || v === undefined)
    return <span className="text-on-surface-variant">—</span>;
  return String(v);
}

export function Table<T>({
  columns,
  dataSource,
  rowKey,
  loading,
  rowClassName,
  emptyText = "暂无数据",
  summary,
  className,
  ...rest
}: TableProps<T>) {
  const minWidth = columns.reduce(
    (s, c) => s + (typeof c.width === "number" ? c.width : 120),
    0
  );

  return (
    <div className="relative w-full overflow-x-auto rounded-xl border border-outline-variant bg-surface-bright">
      <table
        className={cn("w-full border-collapse text-sm", className)}
        style={{ minWidth }}
        {...rest}
      >
        <thead>
          <tr className="border-b border-outline-variant">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left font-medium whitespace-nowrap",
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right"
                )}
                style={{
                  width: col.width,
                  color: "var(--on-surface)",
                  background: "var(--surface-high)",
                }}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => {
                      const next =
                        col.sortOrder === "ascend"
                          ? "descend"
                          : col.sortOrder === "descend"
                          ? null
                          : "ascend";
                      col.onSort?.(next);
                    }}
                    className="inline-flex items-center gap-1 hover:text-primary"
                    title={
                      col.sortOrder === "ascend"
                        ? "升序"
                        : col.sortOrder === "descend"
                        ? "降序"
                        : "点击排序"
                    }
                  >
                    {col.title}
                    <span className="text-[10px] leading-none">
                      {col.sortOrder === "ascend"
                        ? "↑"
                        : col.sortOrder === "descend"
                        ? "↓"
                        : "↕"}
                    </span>
                  </button>
                ) : (
                  col.title
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <div className="flex items-center justify-center gap-2 text-on-surface-variant">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  加载中…
                </div>
              </td>
            </tr>
          ) : dataSource.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-on-surface-variant"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            dataSource.map((record, index) => (
              <tr
                key={rowKey ? rowKey(record, index) : index}
                className={cn(
                  "border-b border-outline-variant last:border-0 hover:bg-surface-high/60 transition-colors",
                  rowClassName?.(record, index)
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 align-middle",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      col.className
                    )}
                    style={{ color: "var(--on-surface)" }}
                  >
                    {col.render
                      ? col.render(record, index)
                      : cellValue(record, col.dataIndex)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {summary && <tfoot>{summary}</tfoot>}
      </table>
    </div>
  );
}
