import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-accent-500 to-accent2-500 text-white shadow-card hover:shadow-glow hover:brightness-110",
  secondary:
    "bg-neutral-800 text-neutral-50 border border-neutral-700 hover:bg-neutral-700",
  ghost: "bg-transparent text-neutral-300 hover:bg-neutral-800 hover:text-neutral-50",
  danger: "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2.5 text-sm rounded-lg",
  lg: "px-6 py-3.5 text-base rounded-xl",
};

const baseClasses =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-accent-400 focus-visible:outline-offset-2";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  href?: undefined;
}

interface LinkButtonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  href: string;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  href,
  ...rest
}: ButtonProps | LinkButtonProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
