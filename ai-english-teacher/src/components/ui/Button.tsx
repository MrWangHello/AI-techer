import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT: Record<Variant, string> = {
  primary: "bg-pink-500 text-white hover:bg-pink-600",
  secondary: "bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100",
  ghost: "bg-transparent text-pink-600 hover:bg-pink-50",
  danger: "bg-red-500 text-white hover:bg-red-600",
};

export default function Button({
  children,
  className,
  variant = "primary",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 min-h-12 px-4 rounded-2xl text-base font-semibold active:scale-[0.98] transition-all disabled:opacity-40",
        VARIANT[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
