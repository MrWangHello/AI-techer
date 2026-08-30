/** 家长写入口令。按你的要求用邮箱，不再做 Supabase 登录。 */
export const DEFAULT_WRITE_KEY = "563876951@qq.com";

export function expectedWriteKey(): string {
  return (process.env.NEXT_PUBLIC_KB_WRITE_KEY || DEFAULT_WRITE_KEY).trim().toLowerCase();
}

export function checkWriteKey(input: string): boolean {
  return input.trim().toLowerCase() === expectedWriteKey();
}

export function writeKeyHint(): string {
  return "家长口令是你的邮箱（防孩子乱点入库）";
}
