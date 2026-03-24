type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={[
        "animate-pulse rounded-xl bg-zinc-800/80",
        "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]",
        className,
      ].join(" ")}
    />
  );
}
