import { getSupabase, isCloudKbConfigured } from "./client";
import { setKbEntries, type KbEntry, type KbKind } from "./entries";
import { mapCloudRow } from "./map-row";
import { getContentSource, setContentSource } from "./source";

export { isCloudKbConfigured } from "./client";

export function cloudKbStatusText(): string {
  if (!isCloudKbConfigured()) return "还没配置知识库地址，确认入库不会写进数据库。";
  return "知识库已接上。入库时填家长口令，填邮箱就行。";
}

export async function refreshCloudKb(): Promise<{ ok: boolean; message: string; count: number }> {
  const client = getSupabase();
  if (!client) {
    setKbEntries([]);
    return { ok: false, message: cloudKbStatusText(), count: 0 };
  }
  const { data, error } = await client
    .from("content_entries")
    .select("id,kind,payload,enabled,updated_at")
    .eq("enabled", true)
    .order("updated_at", { ascending: false });
  if (error) {
    setKbEntries([]);
    return { ok: false, message: `拉库失败：${error.message}`, count: 0 };
  }
  const rows = (data ?? []).map(mapCloudRow).filter((row): row is KbEntry => row !== null);
  setKbEntries(rows);
  return { ok: true, message: `已从知识库拉取 ${rows.length} 条`, count: rows.length };
}

export async function insertCloudEntries(
  rows: Array<{ kind: KbKind; payload: KbEntry["payload"] }>
): Promise<{ ok: boolean; message: string }> {
  const client = getSupabase();
  if (!client) {
    return { ok: false, message: cloudKbStatusText() };
  }
  if (!rows.length) {
    return { ok: false, message: "没有可入库的行。" };
  }
  const toInsert = (kindOf: (kind: KbKind) => string) =>
    rows.map((row) => ({
      kind: kindOf(row.kind),
      payload: row.payload,
      locale: "zh",
      enabled: true,
    }));

  let { error } = await client.from("content_entries").insert(toInsert((kind) => kind));
  // 旧表 kind 检查没有 hanzi。语文改走已允许的 hint，读的时候仍当汉字。
  if (error && /kind|check constraint/i.test(error.message) && rows.some((row) => row.kind === "hanzi")) {
    const retry = await client.from("content_entries").insert(
      toInsert((kind) => (kind === "hanzi" ? "hint" : kind))
    );
    error = retry.error;
  }
  if (error) {
    if (/row-level security|RLS|permission denied/i.test(error.message)) {
      return {
        ok: false,
        message:
          "库拒绝写入。表已经有了，不要再建表。到 SQL Editor 再跑「允许网页写入」那 4 行（本页可复制）。",
      };
    }
    if (/kind|check constraint/i.test(error.message)) {
      return {
        ok: false,
        message: "库还不允许语文汉字。到 SQL Editor 跑「允许语文」那段（本页可复制）。",
      };
    }
    return { ok: false, message: `入库失败：${error.message}` };
  }
  await refreshCloudKb();
  setContentSource({ builtin: true, kb: true });
  const sample = rows[0];
  const hint =
    sample?.kind === "hanzi"
      ? "已勾上知识库。设置里确认「知识库」勾上后，可以说「汉字」试。"
      : "已勾上知识库，可以说「火箭用英语怎么说」试。";
  return { ok: true, message: `已入库 ${rows.length} 条。${hint}` };
}

export async function initKnowledgeBase(): Promise<void> {
  if (!getContentSource().kb) return;
  await refreshCloudKb();
}
