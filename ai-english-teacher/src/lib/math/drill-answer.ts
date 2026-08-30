import { parseAnswerNumber } from "./evaluate";

const MEASURE_SUFFIX = /[个条只本块位名颗朵头匹张把双对儿]+$/;
const LEADING_PREFIX = /^(答案是|答案为|等于|是|我选)/;

/** 从口算语音/文字中提取数字答案（去掉量词、语气词） */
export function extractDrillAnswer(text: string): number | null {
  let t = text.trim().replace(/[。！？!?\s,，]/g, "");
  t = t.replace(LEADING_PREFIX, "");
  t = t.replace(MEASURE_SUFFIX, "");

  const digitLead = t.match(/^(\d{1,2})/);
  if (digitLead) return parseInt(digitLead[1], 10);

  const digitAny = t.match(/(\d{1,2})/);
  if (digitAny && t.length <= 6) return parseInt(digitAny[1], 10);

  return parseAnswerNumber(t);
}

let voiceDigits = "";

export function resetDrillVoiceBuffer(): void {
  voiceDigits = "";
}

/**
 * 口算语音分步说「1」「0」时合并为 10。
 * 返回 null = 还在等下一位；number = 可提交；pending 由调用方提示。
 */
export function mergeVoiceDrillDigit(digit: number, expectedAnswer: number): number | null {
  if (digit >= 10) {
    voiceDigits = "";
    return digit;
  }
  if (expectedAnswer < 10) {
    voiceDigits = "";
    return digit;
  }
  voiceDigits += String(digit);
  if (voiceDigits.length >= 2) {
    const n = parseInt(voiceDigits, 10);
    voiceDigits = "";
    return n;
  }
  return null;
}

export function getDrillVoiceBuffer(): string {
  return voiceDigits;
}
