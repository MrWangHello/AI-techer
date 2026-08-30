import { getSupabase, isCloudKbConfigured } from "./client";
import { setKbEntries, type KbEntry, type KbKind } from "./entries";
import { mapCloudRow } from "./map-row";

export { isCloudKbConfigured } from "./client";

export function cloudKbStatusText(): string {
  if (!isCloudKbConfigured()) return "还没配置知识库地址，确认入库不会写进数据库。";
  return "知识库已接上。入库时填家长口令（你的邮箱）。";
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
  const { error } = await client.from("content_entries").insert(
    rows.map((row) => ({
      kind: row.kind,
      payload: row.payload,
      locale: "zh",
      enabled: true,
    }))
  );
  if (error) {
    if (/row-level security|RLS|permission denied/i.test(error.message)) {
      return {
        ok: false,
        message: "库拒绝写入。到 Supabase SQL Editor 再跑 KB_SETUP 里「允许匿名写入」那一段。",
      };
    }
    return { ok: false, message: `入库失败：${error.message}` };
  }
  await refreshCloudKb();
  return { ok: true, message: `已入库 ${rows.length} 条。去设置把「知识库」勾上就能用。` };
}

export async function initKnowledgeBase(): Promise<void> {
  const { getContentSource } = await import("./source");
  if (!getContentSource().kb) return;
  await refreshCloudKb();
}
