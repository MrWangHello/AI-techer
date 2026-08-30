/** 家长写入口令。界面只写「填邮箱」，不展示具体地址。 */
export const DEFAULT_WRITE_KEY = "563876951@qq.com";

/** 截图里实际填的邮箱（和上面差一位）。两份都认。 */
const ALSO_ACCEPT_WRITE_KEY = "563870951@qq.com";

export const KB_WRITE_KEY_STORAGE = "bella.kb.writeKey";

const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

function configuredWriteKey(): string {
  const fromEnv = process.env.NEXT_PUBLIC_KB_WRITE_KEY?.trim();
  return fromEnv || DEFAULT_WRITE_KEY;
}

/** 全角符号、空白统一掉，方便手机输入。 */
export function normalizeWriteKey(value: string): string {
  return value
    .replace(/\uFF20/g, "@")
    .replace(/\u3002/g, ".")
    .replace(/[\s\u3000]+/g, "")
    .trim()
    .toLowerCase();
}

function localPart(email: string): string {
  const at = email.indexOf("@");
  return at === -1 ? email : email.slice(0, at);
}

function keyVariants(value: string): string[] {
  const n = normalizeWriteKey(value);
  if (!n) return [];
  const out = new Set<string>([n, localPart(n)]);
  const email = n.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/);
  if (email) {
    out.add(email[0]);
    out.add(localPart(email[0]));
  }
  const digits = n.match(/\d{5,}/);
  if (digits) out.add(digits[0]);
  return [...out];
}

/**
 * 家长口令 = 填邮箱。
 * 已知邮箱、环境变量、以及格式正确的邮箱都过。空的、乱码、没有 @ 的不过。
 */
export function checkWriteKey(input: string): boolean {
  const normalized = normalizeWriteKey(input);
  if (!normalized) return false;
  const got = keyVariants(input);
  const accepted = new Set([
    ...keyVariants(DEFAULT_WRITE_KEY),
    ...keyVariants(ALSO_ACCEPT_WRITE_KEY),
    ...keyVariants(configuredWriteKey()),
  ]);
  if (got.some((item) => accepted.has(item))) return true;
  return EMAIL.test(normalized) || got.some((item) => EMAIL.test(item));
}

export function writeKeyHint(): string {
  return "家长口令";
}

export function loadStoredWriteKey(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(KB_WRITE_KEY_STORAGE) ?? "";
}

export function storeWriteKey(value: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KB_WRITE_KEY_STORAGE, value);
}
