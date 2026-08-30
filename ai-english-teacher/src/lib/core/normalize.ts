import {
  stripSpeechNoise,
  canonicalizeVariants,
  fuzzyMatchKeyword,
  fuzzyMatchKeywords,
} from "./fuzzy-match";

/** 语音识别常见误听 → 归一化修正（保留少量高频规则，其余走 fuzzy-match） */
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
  text = stripSpeechNoise(text);
  text = canonicalizeVariants(text);
  return text;
}

export function includesKeyword(normalized: string, keyword: string): boolean {
  return fuzzyMatchKeyword(normalized, keyword);
}

export function matchKeywords(normalized: string, keywords: string[]): boolean {
  return fuzzyMatchKeywords(normalized, keywords);
}

/** 保留原始文本供 API；规则匹配用 corrected normalized */
export function applySttCorrections(raw: string): string {
  let text = raw;
  for (const [pattern, replacement] of STT_CORRECTIONS) {
    text = text.replace(pattern, replacement);
  }
  return canonicalizeVariants(text.trim());
}
