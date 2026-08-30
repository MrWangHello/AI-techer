import { cn } from "@/lib/cn";

export default function IconTile({
  icon,
  label,
  pinyin,
  onClick,
  className,
  ariaLabel,
}: {
  icon: React.ReactNode;
  label: string;
  pinyin?: string;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 min-h-20 rounded-2xl bg-pink-50 p-3 text-center hover:bg-pink-100 active:scale-95 transition-all",
        className
      )}
    >
      <span className="text-3xl leading-none">{icon}</span>
      <span className="text-base font-semibold text-gray-700">{label}</span>
      {pinyin && <span className="text-sm text-gray-500">{pinyin}</span>}
    </button>
  );
}
