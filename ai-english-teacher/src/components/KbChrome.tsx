import Link from "next/link";

export default function KbChrome({
  title,
  backHref,
  backLabel,
  children,
}: {
  title: string;
  backHref: string;
  backLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-gradient-to-b from-pink-50 to-white px-4 py-4 max-w-lg mx-auto">
      <header className="flex items-center gap-3 mb-4">
        <Link
          href={backHref}
          className="min-h-11 px-3 inline-flex items-center text-base text-pink-600 bg-white rounded-xl border border-pink-100"
        >
          ← {backLabel}
        </Link>
        <h1 className="text-xl font-bold text-pink-600">{title}</h1>
      </header>
      {children}
    </div>
  );
}
