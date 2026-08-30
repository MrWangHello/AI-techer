import { setKbEntries, type KbEntry, type KbKind } from "./entries";

export function isCloudKbConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return Boolean(url.trim() && key.trim());
}

export function cloudKbStatusText(): string {
  if (!isCloudKbConfigured()) return "还没配置知识库地址，确认入库不会写进数据库。";
  return "知识库地址已配置。写入还需要家长登录（下一步）。";
}

export async function refreshCloudKb(): Promise<{ ok: boolean; message: string; count: number }> {
  if (!isCloudKbConfigured()) {
    setKbEntries([]);
    return { ok: false, message: cloudKbStatusText(), count: 0 };
  }
  setKbEntries([]);
  return { ok: false, message: "云库客户端尚未接上，先用预览看切开。", count: 0 };
}

export async function insertCloudEntries(
  _rows: Array<{ kind: KbKind; payload: KbEntry["payload"] }>
): Promise<{ ok: boolean; message: string }> {
  if (!isCloudKbConfigured()) {
    return { ok: false, message: cloudKbStatusText() };
  }
  return { ok: false, message: "云库写入还要家长登录，这一步还没接。" };
}

export async function initKnowledgeBase(): Promise<void> {
  const { getContentSource } = await import("./source");
  if (!getContentSource().kb) return;
  await refreshCloudKb();
}
