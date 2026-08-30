import { cn } from "@/lib/cn";

export default function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-white/80 rounded-2xl p-5 shadow-sm border border-pink-50", className)}>
      {children}
    </div>
  );
}
