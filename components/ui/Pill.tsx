import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-accent-dark",
  secondary: "bg-white text-ink border border-hairline hover:border-ink",
  ghost: "text-ink hover:text-accent-dark",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-[15px]",
};

interface PillProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}

export function PillLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: PillProps & { href: string }) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}

export function PillButton({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: PillProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
