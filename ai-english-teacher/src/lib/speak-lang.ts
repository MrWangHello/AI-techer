export type SpeakLang = "zh" | "en";
export type SpeakIconLang = SpeakLang | "auto";

/** 含汉字按中文读；纯拉丁字母按英文读。 */
export function detectSpeakLang(text: string): SpeakLang {
  if (/[\u4e00-\u9fff]/.test(text)) return "zh";
  if (/[A-Za-z]/.test(text)) return "en";
  return "zh";
}
