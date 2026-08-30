"use client";

import { useMemo, useState } from "react";
import KbChrome from "@/components/KbChrome";
import { insertCloudEntries } from "@/lib/kb/cloud";
import type { KbKind } from "@/lib/kb/entries";
import { aiPromptFor, splitPaste, type PreviewRow } from "@/lib/kb/parse-paste";

const KINDS: { id: KbKind; label: string }[] = [
  { id: "word", label: "单词" },
  { id: "story", label: "故事" },
  { id: "word_problem", label: "应用题" },
  { id: "joke", label: "笑话" },
];

function rowTitle(row: PreviewRow): string {
  if (!row.ok) return row.error;
  if (row.kind === "word") return `${row.payload.zh} → ${row.payload.en}`;
  if (row.kind === "story") return row.payload.title;
  if (row.kind === "word_problem") return `${row.payload.question} → ${row.payload.answer}`;
  return row.payload.text.slice(0, 32);
}

export default function KbNewPage() {
  const [kind, setKind] = useState<KbKind>("word");
  const [text, setText] = useState("");
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [message, setMessage] = useState("");
  const [single, setSingle] = useState(false);
  const [zh, setZh] = useState("");
  const [en, setEn] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);

  const placeholder =
    kind === "word"
      ? "火箭 rocket\n书本, book\n飞船 spaceship A spaceship is fast."
      : kind === "story"
        ? "小熊猫找妈妈\n\n有一只小熊猫……\n---\n另一篇标题\n\n正文"
        : kind === "word_problem"
          ? "小明有 2 个苹果，又拿到 1 个，一共几个？ 3"
          : "为什么书会走路？\n因为它有页（脚）。";

  const okCount = useMemo(() => rows?.filter((r) => r.ok).length ?? 0, [rows]);
  const badCount = useMemo(() => rows?.filter((r) => !r.ok).length ?? 0, [rows]);

  const onPreview = () => {
    const source = single && kind === "word" ? `${zh} ${en}` : text;
    setRows(splitPaste(kind, source));
    setMessage("");
  };

  const onCopyPrompt = async () => {
    const blob = `${aiPromptFor(kind)}\n${text}`.trim();
    try {
      await navigator.clipboard.writeText(blob);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      setMessage("复制失败，请长按自己选中提示词。");
    }
  };

  const dropRow = (index: number) => {
    setRows((prev) => prev?.filter((_, i) => i !== index) ?? null);
  };

  const onConfirm = async () => {
    const ready = (rows ?? []).filter((r): r is Extract<PreviewRow, { ok: true }> => r.ok);
    if (!ready.length) {
      setMessage("没有可入库的行。先拆开预览，改掉红行。");
      return;
    }
    const result = await insertCloudEntries(ready.map((r) => ({ kind: r.kind, payload: r.payload })));
    setMessage(result.message);
  };

  return (
    <KbChrome title="添加内容" backHref="/kb" backLabel="返回列表">
      <p className="text-base text-gray-600 mb-3">先选这一批是什么，再粘进去。切开在手机里做，不调用网上模型。</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {KINDS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setKind(item.id);
              setRows(null);
            }}
            className={`min-h-11 px-4 rounded-xl text-base ${
              kind === item.id ? "bg-pink-500 text-white" : "bg-white text-gray-700 border border-pink-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-base text-gray-600 mb-3 min-h-11">
        <input type="checkbox" className="h-5 w-5 accent-pink-500" checked={single} onChange={(e) => setSingle(e.target.checked)} />
        只加一条
      </label>

      {single && kind === "word" ? (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <input
            value={zh}
            onChange={(e) => setZh(e.target.value)}
            placeholder="中文"
            className="min-h-12 px-3 text-base border border-pink-200 rounded-xl"
          />
          <input
            value={en}
            onChange={(e) => setEn(e.target.value)}
            placeholder="英文"
            className="min-h-12 px-3 text-base border border-pink-200 rounded-xl"
          />
        </div>
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-40 text-base border border-pink-200 rounded-2xl px-3 py-3 mb-3"
        />
      )}

      <div className="flex flex-col gap-2 mb-4">
        <button
          type="button"
          onClick={onCopyPrompt}
          className="min-h-12 rounded-xl bg-white border border-pink-200 text-pink-600 text-base"
        >
          {promptCopied ? "已复制给 AI" : "复制给 AI 的提示词"}
        </button>
        <button
          type="button"
          onClick={onPreview}
          className="min-h-12 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 text-base font-semibold"
        >
          拆开预览
        </button>
      </div>

      {rows && (
        <div className="mb-4 space-y-2">
          <p className="text-base text-gray-600">
            预览 {okCount} 条可入库 · {badCount} 条标红
          </p>
          <ul className="space-y-2">
            {rows.map((row, index) => (
              <li
                key={`${row.raw}-${index}`}
                className={`rounded-xl px-3 py-2 text-base ${
                  row.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
                }`}
              >
                <div className="flex justify-between gap-2">
                  <span>{row.ok ? "✓ " : "✕ "}{rowTitle(row)}</span>
                  <button type="button" className="text-sm text-gray-500" onClick={() => dropRow(index)}>
                    丢掉
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onConfirm}
        className="w-full min-h-14 rounded-2xl bg-pink-500 text-white text-lg font-semibold mb-3"
      >
        确认入库
      </button>
      {message && <p className="text-base text-amber-800 bg-amber-50 rounded-xl px-3 py-2">{message}</p>}
    </KbChrome>
  );
}
