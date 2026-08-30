/** 语音识别常见误听 → 归一化修正（尤其「每日英语」） */
const STT_CORRECTIONS: [RegExp, string][] = [
  [/每人英语|没日英语|美语英语|每日英文|每日英语句子/g, "每日英语"],
  [/被古诗|背是|备古诗/g, "背古诗"],
  [/讲个消化|讲个笑话/g, "讲笑话"],
  [/换一偏|换一片/g, "换一篇"],
  [/天气怎么样|今天天气怎么样/g, "天气"],
];

export function normalizeInput(raw: string): string {
  let text = raw.toLowerCase().replace(/[，。！？、,.!?'\s]/g, "").trim();
  for (const [pattern, replacement] of STT_CORRECTIONS) {
    text = text.replace(pattern, replacement.replace(/\s/g, ""));
  }
  return text;
}

export function includesKeyword(normalized: string, keyword: string): boolean {
  return normalized.includes(keyword.toLowerCase().replace(/\s/g, ""));
}

export function matchKeywords(normalized: string, keywords: string[]): boolean {
  return keywords.some((kw) => includesKeyword(normalized, kw));
}

/** 保留原始文本供 API；仅规则匹配用 corrected normalized */
export function applySttCorrections(raw: string): string {
  let text = raw;
  for (const [pattern, replacement] of STT_CORRECTIONS) {
    text = text.replace(pattern, replacement);
  }
  return text.trim();
}
