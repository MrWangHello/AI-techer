/**
 * 泛化意图匹配：去噪 + 混淆字归并 + 模糊相似度
 */

/** 同一意图的常见误识别变体，第一项为标准形 */
export const INTENT_VARIANT_GROUPS: string[][] = [
  ["美句", "美剧", "每句", "没句", "美具"],
  ["汉字", "汉子", "汗字", "认字"],
  ["口算", "口算题", "算算", "算一算"],
  ["古诗", "背古诗", "诗词", "背诗"],
  ["故事", "讲故事", "讲个故事", "童话"],
  ["笑话", "讲笑话", "讲个笑话"],
  ["百科", "查百科", "维基"],
  ["美句", "名言", "一言"],
  ["句子", "读句子", "造句"],
  ["拼音", "学拼音", "读拼音"],
];

const FILLER_PATTERN = /[了啊呢吧嘛哦嗯哈个条只本块位名颗朵头匹了啦]+/g;

export function stripSpeechNoise(text: string): string {
  return text
    .replace(/[，。！？、,.!?'"\s]/g, "")
    .replace(FILLER_PATTERN, "")
    .trim();
}

/** 将误识别变体归并到标准关键词 */
export function canonicalizeVariants(text: string): string {
  let out = text;
  for (const group of INTENT_VARIANT_GROUPS) {
    const canonical = group[0];
    for (const variant of group.slice(1)) {
      if (variant.length >= 2 && out.includes(variant)) {
        out = out.replaceAll(variant, canonical);
      }
    }
  }
  return out;
}

/** 编辑距离（短中文串） */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  return 1 - editDistance(a, b) / maxLen;
}

/** 关键词是否出现在归一化文本中（含模糊匹配） */
export function fuzzyMatchKeyword(normalized: string, keyword: string, minSim = 0.72): boolean {
  const kw = keyword.toLowerCase().replace(/\s/g, "");
  if (!kw) return false;
  if (normalized.includes(kw)) return true;

  // 滑动窗口：长度 kw-1 ~ kw+1
  for (let len = Math.max(1, kw.length - 1); len <= kw.length + 1; len++) {
    for (let i = 0; i <= normalized.length - len; i++) {
      const slice = normalized.slice(i, i + len);
      if (similarity(slice, kw) >= minSim) return true;
    }
  }
  return false;
}

export function fuzzyMatchKeywords(normalized: string, keywords: string[]): boolean {
  return keywords.some((kw) => fuzzyMatchKeyword(normalized, kw));
}
