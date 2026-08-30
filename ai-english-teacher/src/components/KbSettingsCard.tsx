"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cloudKbStatusText, isCloudKbConfigured } from "@/lib/kb/cloud";
import { getKbEntries } from "@/lib/kb/entries";
import { getContentSource, setContentSource, type ContentSource } from "@/lib/kb/source";

export default function KbSettingsCard() {
  const [source, setSource] = useState<ContentSource>({ builtin: true, kb: false });
  const [warn, setWarn] = useState("");
  const [kbCount, setKbCount] = useState(0);

  useEffect(() => {
    setSource(getContentSource());
    setKbCount(getKbEntries().length);
  }, []);

  const apply = (next: ContentSource) => {
    if (!next.builtin && !next.kb) {
      setWarn("至少勾一个数据来源。已帮你留着内置。");
      const kept = setContentSource({ builtin: true, kb: false });
      setSource(kept);
      return;
    }
    if (next.kb && !next.builtin && kbCount === 0) {
      setWarn("知识库还是空的。只勾知识库时，孩子会听到「没有」。建议两个都勾。");
    } else {
      setWarn("");
    }
    setSource(setContentSource(next));
  };

  return (
    <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-pink-50 space-y-4">
      <h3 className="text-lg font-bold text-gray-700">📚 知识库</h3>
      <p className="text-base text-gray-600 leading-relaxed">
        把单词、故事、题加进数据库。添加时在那一页填你的邮箱当口令，不用去 GitHub 再填。
      </p>

      <fieldset className="space-y-3">
        <legend className="text-base font-semibold text-gray-700">数据来源（至少勾一个）</legend>
        <label className="flex items-start gap-3 min-h-12 text-base text-gray-700">
          <input
            type="checkbox"
            className="mt-1.5 h-5 w-5 accent-pink-500"
            checked={source.builtin}
            onChange={(e) => apply({ ...source, builtin: e.target.checked })}
          />
          <span>
            <strong>内置</strong>
            <span className="block text-gray-500">现在系统里的词、故事、题</span>
          </span>
        </label>
        <label className="flex items-start gap-3 min-h-12 text-base text-gray-700">
          <input
            type="checkbox"
            className="mt-1.5 h-5 w-5 accent-pink-500"
            checked={source.kb}
            onChange={(e) => apply({ ...source, kb: e.target.checked })}
          />
          <span>
            <strong>知识库</strong>
            <span className="block text-gray-500">
              数据库里已上架 {kbCount} 条{isCloudKbConfigured() ? "" : " · 地址未配置"}
            </span>
          </span>
        </label>
      </fieldset>
      <p className="text-sm text-gray-500">两个都勾：先用知识库，没有的再用内置。</p>
      {warn && <p className="text-base text-amber-800 bg-amber-50 rounded-xl px-3 py-2">{warn}</p>}

      <Link
        href="/kb/new"
        className="flex items-center justify-center min-h-14 w-full rounded-2xl bg-pink-500 text-white text-lg font-semibold active:scale-[0.98]"
      >
        去添加内容
      </Link>
      <Link href="/kb" className="block text-center text-base text-pink-600 min-h-11 leading-[2.75rem]">
        查看已添加的内容
      </Link>
      <p className="text-sm text-gray-400 leading-relaxed">{cloudKbStatusText()}</p>
    </div>
  );
}
