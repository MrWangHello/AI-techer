"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f0ebe4] text-center">
      <p className="text-4xl mb-3">😿</p>
      <h1 className="text-lg font-bold text-gray-800 mb-2">页面出了点小问题</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
        可能是网络不稳定或内存不足。请点重试，或返回首页继续使用。
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-5 py-2.5 bg-pink-500 text-white text-sm rounded-xl"
        >
          重试
        </button>
        <button
          type="button"
          onClick={() => {
            window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/`;
          }}
          className="px-5 py-2.5 bg-white text-gray-600 text-sm rounded-xl border border-gray-200"
        >
          回首页
        </button>
      </div>
    </div>
  );
}
