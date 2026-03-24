import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        "relative overflow-hidden rounded-xl border border-emerald-300/40 bg-emerald-400/15 text-emerald-100",
        "shadow-[0_20px_30px_-22px_rgba(16,185,129,0.95)]",
        "transform-gpu transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-emerald-400/25 hover:shadow-[0_22px_36px_-20px_rgba(16,185,129,0.95)]",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.3),transparent_36%)] before:opacity-0 before:transition before:duration-300 hover:before:opacity-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40",
        "font-medium",
        className,
      ].join(" ")}
    />
  );
}
