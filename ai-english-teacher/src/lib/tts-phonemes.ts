import { EnglishG2P } from "@piper-plus/g2p/en";
import { pinyin } from "pinyin-pro";

const DIGIT_ZH = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

const PUNCT: Record<string, string> = {
  "，": ",",
  "。": ".",
  "！": "!",
  "？": "?",
  "、": ",",
  "；": ";",
  "：": ":",
  "（": "(",
  "）": ")",
  "【": "(",
  "】": ")",
  "“": ",",
  "”": ",",
  "‘": "'",
  "’": "'",
  "《": ",",
  "》": ",",
  "\n": " ",
  "\t": " ",
};

const HAN_OR_LATIN = /[\u4e00-\u9fff]+|[A-Za-z]+|[^A-Za-z\u4e00-\u9fff]+/g;
const SYLLABLE = /^[a-z]+[0-5]$/;

let english: EnglishG2P | null = null;

export function replaceDigits(text: string): string {
  return text.replace(/[0-9]/g, (d) => DIGIT_ZH[Number(d)] ?? d);
}

/** 两个三声相连，前一个变二声（你好 ni3+hao3 → ni2 hao3） */
export function applyToneSandhi(syllables: string[]): string[] {
  const out = [...syllables];
  for (let i = 0; i < out.length - 1; i += 1) {
    const a = out[i].match(/^([a-z]+)([0-5])$/);
    const b = out[i + 1].match(/^([a-z]+)([0-5])$/);
    if (a && b && a[2] === "3" && b[2] === "3") {
      out[i] = `${a[1]}2`;
    }
  }
  return out;
}

function mapPunctChunk(chunk: string): string {
  return [...chunk].map((ch) => PUNCT[ch] ?? (ch === " " ? " " : ch)).join("");
}

function latinToIpa(word: string): string {
  if (!english) english = new EnglishG2P();
  const { tokens } = english.phonemize(word);
  return tokens.join("");
}

export function textToIpa(text: string, table: Record<string, string>): string {
  const normalized = replaceDigits(text.trim());
  if (!normalized) return "";

  const parts: string[] = [];
  const chunks = normalized.match(HAN_OR_LATIN) || [];
  for (const chunk of chunks) {
    if (/^[\u4e00-\u9fff]+$/.test(chunk)) {
      const raw = pinyin(chunk, { toneType: "num", type: "array", v: true, nonZh: "removed" });
      const syllables = applyToneSandhi(raw.filter((s) => SYLLABLE.test(s)));
      const ipas = syllables.map((s) => table[s]).filter(Boolean);
      if (ipas.length) parts.push(ipas.join(" "));
      continue;
    }
    if (/^[A-Za-z]+$/.test(chunk)) {
      const ipa = latinToIpa(chunk);
      if (ipa) parts.push(ipa);
      continue;
    }
    const punct = mapPunctChunk(chunk).replace(/\s+/g, " ");
    if (punct.trim() || punct.includes(" ")) parts.push(punct);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function encodeIpa(ipa: string, phonemeIdMap: Record<string, number[]>): number[] {
  const bos = phonemeIdMap["^"]?.[0];
  const eos = phonemeIdMap["$"]?.[0];
  const pad = phonemeIdMap["_"]?.[0];
  if (bos == null || eos == null || pad == null) {
    throw new Error("phoneme_id_map missing ^ $ _");
  }
  const ids = [bos];
  for (const ch of ipa) {
    const entry = phonemeIdMap[ch];
    if (!entry || entry.length === 0) continue;
    ids.push(entry[0], pad);
  }
  ids.push(eos);
  return ids;
}

export function splitSpeakChunks(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const sentences = trimmed
    .split(/(?<=[。！？.!?；;])/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= 48) {
      chunks.push(sentence);
      continue;
    }
    const pieces = sentence.split(/(?<=[，,、])/);
    let buf = "";
    for (const piece of pieces) {
      if ((buf + piece).length > 48 && buf) {
        chunks.push(buf.trim());
        buf = piece;
      } else {
        buf += piece;
      }
    }
    if (buf.trim()) chunks.push(buf.trim());
  }
  return chunks.length ? chunks : [trimmed];
}
