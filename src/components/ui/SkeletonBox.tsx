import { cn } from "@/lib/utils";

interface SkeletonBoxProps {
  className?: string;
}

export function SkeletonBox({ className }: SkeletonBoxProps) {
  return (
    <div
      className={cn("rounded-lg animate-pulse", className)}
      style={{ backgroundColor: "var(--surface-high)" }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      className="rounded-lg p-4 space-y-3"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <SkeletonBox className="h-6 w-3/4" />
      <SkeletonBox className="h-4 w-full" />
      <SkeletonBox className="h-4 w-5/6" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
