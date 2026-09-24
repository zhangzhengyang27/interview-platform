import { cn } from "@/lib/utils";

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 88,
} as const;

export interface AvatarProps {
  src?: string | null;
  name?: string;
  /** 可选预设尺寸 sm/md/lg/xl,或传 number 自定义像素 */
  size?: keyof typeof sizeMap | number;
  className?: string;
}

export function Avatar({ src, name = "", size = "md", className }: AvatarProps) {
  const px = typeof size === "number" ? size : sizeMap[size];
  const fontSize = Math.round(px * 0.42);
  const initial = (name.trim()[0] ?? "U").toUpperCase();
  // className 里包含 ring-* 时,移除默认 border 避免双层
  const hasRing = /ring-/.test(className ?? "");

  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-full", className)}
      style={{
        width: px,
        height: px,
        backgroundColor: "var(--surface-high)",
        ...(hasRing ? {} : { border: "1px solid var(--outline-variant)" }),
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-semibold select-none"
          style={{
            background:
              "linear-gradient(135deg, var(--primary-container), var(--tertiary-container))",
            color: "var(--on-primary-container)",
            fontSize,
          }}
        >
          {initial}
        </div>
      )}
    </div>
  );
}
