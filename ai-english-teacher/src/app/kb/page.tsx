"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import KbChrome from "@/components/KbChrome";
import SpeakableText from "@/components/ui/SpeakableText";
import { cloudKbStatusText, refreshCloudKb } from "@/lib/kb/cloud";
import { getKbEntries, type KbEntry } from "@/lib/kb/entries";

function label(row: KbEntry): string {
  if (row.kind === "word") return `${row.payload.zh} → ${row.payload.en}`;
  if (row.kind === "story") return row.payload.title;
  if (row.kind === "word_problem") return row.payload.question;
  return row.payload.text.slice(0, 24);
}

const KIND_LABEL: Record<KbEntry["kind"], string> = {
  word: "单词",
  story: "故事",
  word_problem: "应用题",
  joke: "笑话",
};

export default function KbListPage() {
  const [rows, setRows] = useState<KbEntry[]>([]);
  const [status, setStatus] = useState(cloudKbStatusText());

  useEffect(() => {
    void refreshCloudKb().then((res) => {
      setRows(getKbEntries());
      setStatus(res.message);
    });
  }, []);

  return (
    <KbChrome title="知识库" backHref="/?tab=settings" backLabel="返回设置">
      <p className="text-base text-gray-600 mb-3">
        已上架 {rows.length} 条。{status}
      </p>
      <Link
        href="/kb/new"
        className="flex items-center justify-center min-h-14 mb-4 rounded-2xl bg-pink-500 text-white text-lg font-semibold"
      >
        添加
      </Link>
      {rows.length === 0 ? (
        <div className="text-base text-gray-500 bg-white/80 rounded-2xl p-5 border border-pink-50">
          <SpeakableText
            text="还没有内容。先添加一批单词或故事。没配知识库地址时，也可以进去看怎么切开，但不能入库。"
            lang="zh"
            className="items-start"
            textClassName="text-base text-gray-600"
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="bg-white/80 rounded-2xl px-4 py-3 border border-pink-50">
              <SpeakableText
                text={`${KIND_LABEL[row.kind]} ${label(row)}`}
                lang="auto"
                textClassName="text-base text-gray-800"
              >
                <span className="text-sm text-pink-500 mr-2">{KIND_LABEL[row.kind]}</span>
                <span className="text-base text-gray-800">{label(row)}</span>
              </SpeakableText>
            </li>
          ))}
        </ul>
      )}
    </KbChrome>
  );
}
