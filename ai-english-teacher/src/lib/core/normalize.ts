/** 语音识别常见误听 → 归一化修正 */
const STT_CORRECTIONS: [RegExp, string][] = [
  [/每人英语|没日英语|美语英语|每日英文|每日英语句子/g, "每日英语"],
  [/被古诗|背是|备古诗/g, "背古诗"],
  [/讲个消化|讲个笑话/g, "讲笑话"],
  [/换一偏|换一片/g, "换一篇"],
  [/天气怎么样|今天天气怎么样/g, "天气"],
  // 美句常被识别成美剧/每句
  [/美剧|每句|美剧的|美国剧/g, "美句"],
  [/美丽的句子|来说一句|来一句美句|说一句美句/g, "美句"],
  [/汉子|汉自|汗字|认字儿/g, "汉字"],
  [/口算题|口算练习|算算/g, "口算"],
  [/百科查询|查百科|百度百科/g, "百科"],
  [/讲个故事|来个故事/g, "讲故事"],
  [/什么是什么/g, "是什么"],
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

/** 保留原始文本供 API；规则匹配用 corrected normalized */
export function applySttCorrections(raw: string): string {
  let text = raw;
  for (const [pattern, replacement] of STT_CORRECTIONS) {
    text = text.replace(pattern, replacement);
  }
  return text.trim();
}
