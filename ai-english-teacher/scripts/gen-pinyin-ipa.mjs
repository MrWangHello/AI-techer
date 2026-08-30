/**
 * Build pinyin → espeak IPA table for the vendored Huayan Piper voice.
 * Requires espeak-ng (cmn-latn-pinyin). Output is committed; phones do not run this.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pinyin } from "pinyin-pro";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = resolve(root, "public/models/tts-zh-huayan-x_low/pinyin-ipa.json");

function ipaOf(text) {
  return execFileSync("espeak-ng", ["-v", "cmn-latn-pinyin", "--ipa", "-q", text], {
    encoding: "utf8",
  })
    .replace(/\n/g, " ")
    .trim();
}

const bases = new Set();
for (let cp = 0x4e00; cp <= 0x9fff; cp += 1) {
  const syl = pinyin(String.fromCodePoint(cp), { toneType: "none", v: true, nonZh: "removed" });
  if (/^[a-z]+$/.test(syl)) bases.add(syl);
}

const extras = [
  "a", "o", "e", "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "er",
  "yi", "ya", "yao", "ye", "you", "yan", "yin", "yang", "ying", "yong",
  "wu", "wa", "wo", "wai", "wei", "wan", "wen", "wang", "weng",
  "yu", "yue", "yuan", "yun", "lv", "lve", "nv", "nve",
  "zhi", "chi", "shi", "ri", "zi", "ci", "si",
];
for (const b of extras) bases.add(b);

const table = {};
for (const base of [...bases].sort()) {
  for (const tone of [0, 1, 2, 3, 4, 5]) {
    const key = `${base}${tone}`;
    try {
      const ipa = ipaOf(key);
      if (ipa && !ipa.includes("(en)")) table[key] = ipa;
    } catch {
      // skip
    }
  }
}

table[" "] = " ";
writeFileSync(outPath, `${JSON.stringify(table)}\n`);
console.log(`wrote ${Object.keys(table).length} entries to ${outPath}`);
