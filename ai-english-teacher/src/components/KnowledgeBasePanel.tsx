"use client";

import { useRef, useState } from "react";
import {
  clearLocalPack,
  countPack,
  fetchSitePack,
  getKb,
  getLocalPack,
  importKbJson,
} from "@/lib/kb/store";

export default function KnowledgeBasePanel() {
  const [pack, setPack] = useState(() => getKb());
  const [local, setLocal] = useState(() => getLocalPack());
  const [message, setMessage] = useState("");
  const [paste, setPaste] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setPack(getKb());
    setLocal(getLocalPack());
  };

  const counts = countPack(pack);
  const localCounts = countPack(local);

  const onImportText = (text: string) => {
    const res = importKbJson(text);
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    setPaste("");
    refresh();
    setMessage("已加入本地知识库，马上可以语音查词、听故事。");
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    onImportText(await file.text());
  };

  const onSyncSite = async () => {
    const remote = await fetchSitePack();
    refresh();
    setMessage(remote ? "已从网站知识包刷新（GitHub Pages 上的 pack.json）" : "没有读到网站知识包");
  };

  const onExport = () => {
    const blob = new Blob([JSON.stringify(getLocalPack(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bella-kb.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onClear = () => {
    clearLocalPack();
    refresh();
    setMessage("已清空本机导入的内容（网站知识包还在）");
  };

  return (
    <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-pink-50 space-y-3">
      <h3 className="text-base font-bold text-gray-700">📚 知识库</h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        不用改代码。把单词、故事、应用题做成 JSON，在这里导入；或把文件放到仓库
        <code className="mx-1 text-pink-600">public/kb/pack.json</code>
        后推送到 GitHub，网站会自动带上。
      </p>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-pink-50 rounded-xl py-2">
          <div className="text-lg font-bold text-pink-600">{counts.dict + counts.words}</div>
          <div className="text-xs text-gray-500">词语</div>
        </div>
        <div className="bg-amber-50 rounded-xl py-2">
          <div className="text-lg font-bold text-amber-700">{counts.stories}</div>
          <div className="text-xs text-gray-500">故事</div>
        </div>
        <div className="bg-green-50 rounded-xl py-2">
          <div className="text-lg font-bold text-green-700">{counts.wordProblems}</div>
          <div className="text-xs text-gray-500">应用题</div>
        </div>
      </div>
      <p className="text-xs text-gray-400">
        本机导入 {localCounts.dict + localCounts.words} 词 · {localCounts.stories} 篇故事
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-1 min-h-11 px-3 py-2 bg-pink-500 text-white text-sm rounded-xl active:scale-[0.98]"
        >
          导入 JSON 文件
        </button>
        <button
          type="button"
          onClick={onSyncSite}
          className="flex-1 min-h-11 px-3 py-2 bg-white border border-pink-200 text-pink-600 text-sm rounded-xl active:scale-[0.98]"
        >
          刷新网站知识包
        </button>
      </div>

      <textarea
        value={paste}
        onChange={(e) => setPaste(e.target.value)}
        placeholder='粘贴 JSON，例如 {"version":1,"dict":[{"zh":"火箭","en":"rocket"}]}'
        className="w-full min-h-24 text-sm border border-pink-200 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-400"
      />
      <button
        type="button"
        disabled={!paste.trim()}
        onClick={() => onImportText(paste)}
        className="w-full min-h-11 py-2 text-sm bg-pink-50 text-pink-700 border border-pink-100 rounded-xl disabled:opacity-40"
      >
        粘贴导入
      </button>

      <div className="flex gap-2">
        <a
          href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/kb/template.json`}
          download
          className="flex-1 text-center min-h-11 inline-flex items-center justify-center text-sm text-gray-600 bg-gray-50 rounded-xl"
        >
          下载模板
        </a>
        <button
          type="button"
          onClick={onExport}
          disabled={localCounts.dict + localCounts.words + localCounts.stories === 0}
          className="flex-1 min-h-11 py-2 text-sm text-gray-600 bg-gray-50 rounded-xl disabled:opacity-40"
        >
          导出本机
        </button>
        <button type="button" onClick={onClear} className="flex-1 min-h-11 py-2 text-sm text-red-400 bg-red-50 rounded-xl">
          清空本机
        </button>
      </div>

      {message && <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-2">{message}</p>}
    </div>
  );
}
