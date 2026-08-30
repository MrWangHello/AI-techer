import { cn } from "@/lib/cn";

const ACCENT: Record<string, string> = {
  purple: "bg-purple-50 text-purple-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  pink: "bg-pink-50 text-pink-600",
};

export default function StatBlock({
  value,
  label,
  accent = "pink",
  className,
}: {
  value: React.ReactNode;
  label: string;
  accent?: keyof typeof ACCENT;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl p-3 text-center", ACCENT[accent], className)}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}
