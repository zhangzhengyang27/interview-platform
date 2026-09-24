"use client";

import {
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const triggerBase =
  "w-full flex items-center justify-between gap-2 bg-surface-highest border text-on-surface text-sm rounded pl-4 pr-10 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left";

const borderBase = "border-outline-variant hover:border-primary/60 focus:outline-none focus:border-primary";
const borderError = "border-error hover:border-error focus:border-error";

export interface SelectProps {
  /** 受控值（option 的 value） */
  value: string;
  /** 与原生 onChange 签名兼容：e.target.value 取出选中值 */
  onChange: (e: { target: { value: string } }) => void;
  /** <option value="...">标签</option> 列表，会被解析为自定义列表项 */
  children: ReactNode;
  /** 错误态 */
  error?: boolean;
  /** 占位文案（无选中项时显示） */
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

interface OptionItem {
  value: string;
  label: string;
}

function parseOptions(children: ReactNode): OptionItem[] {
  const items: OptionItem[] = [];
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (!isValidElement(child)) continue;
    const props = child.props as { value?: string; children?: ReactNode; disabled?: boolean };
    if (child.type !== "option" || props.disabled) continue;
    const value = props.value ?? "";
    const label = typeof props.children === "string" ? props.children : String(props.children ?? value);
    items.push({ value, label });
  }
  return items;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { value, onChange, children, error, placeholder = "请选择", className, style, id, disabled, ...aria },
  ref
) {
  const options = parseOptions(children);
  const selected = options.find((o) => o.value === value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const commit = useCallback(
    (next: string) => {
      onChange({ target: { value: next } });
      close();
    },
    [onChange, close]
  );

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // 打开时聚焦当前项
  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setActiveIndex(idx < 0 ? 0 : idx);
    }
  }, [open, options, value]);

  // 键盘导航
  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt) commit(opt.value);
    }
  };

  // 滚动到激活项
  useEffect(() => {
    if (!open || activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={ref}
        type="button"
        id={id}
        disabled={disabled}
        data-skip-touch-min-height
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={aria["aria-label"]}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          triggerBase,
          error ? borderError : borderBase,
          className
        )}
        style={style}
      >
        <span className={cn("truncate", !selected && "text-on-surface-variant")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-activedescendant={`${listboxId}-${activeIndex}`}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-outline-variant bg-surface-bright p-1 shadow-lg shadow-black/10"
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isActive = idx === activeIndex;
            return (
              <li
                key={opt.value}
                id={`${listboxId}-${idx}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => commit(opt.value)}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                  isActive ? "bg-primary/12 text-on-surface" : "text-on-surface",
                  isSelected && "font-medium"
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

Select.displayName = "Select";
